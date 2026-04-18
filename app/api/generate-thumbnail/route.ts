import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.error('GOOGLE_API_KEY is missing');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type GenerateThumbnailResult = {
    thumbnailUrl: string | null;
    error: string | null;
    attempts: string[];
};

function getAdminSupabaseClient(): SupabaseClient | null {
    if (!supabaseUrl || !serviceRoleKey) {
        return null;
    }

    return createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
}

const stylePrompts: Record<string, string> = {
    minimal: 'minimalist, clean lines, simple composition, white space',
    illustration: 'digital illustration, hand-drawn style, vibrant colors, artistic',
    photo: 'photorealistic, high-resolution photography, natural lighting, cinematic',
    abstract: 'abstract art, geometric shapes, bold colors, artistic composition',
    flat: 'flat design, solid colors, simple shapes, modern graphic design',
};

async function generateAndUploadThumbnail({
    postId,
    userId,
    prompt,
    thumbnailPrompt,
    thumbnailStyle,
    storageSupabase,
}: {
    postId: string;
    userId: string;
    prompt: string;
    thumbnailPrompt: string | null;
    thumbnailStyle: string | null;
    storageSupabase: SupabaseClient;
}): Promise<GenerateThumbnailResult> {
    const candidateModels = [
        'gemini-2.5-flash-image',
        'gemini-3-pro-image-preview',
    ];
    const attempts: string[] = [];
    const basePrompt = thumbnailPrompt?.trim() || prompt;
    const styleHint = thumbnailStyle && stylePrompts[thumbnailStyle]
        ? stylePrompts[thumbnailStyle]
        : 'modern, clean, and engaging';
    const imagePrompt = `Create a high-quality, professional thumbnail image for a blog post about: ${basePrompt}. Style: ${styleHint}. Do not include any text in the image.`;

    if (!genAI) {
        return {
            thumbnailUrl: null,
            error: 'GOOGLE_API_KEY is missing',
            attempts: [],
        };
    }

    for (const modelName of candidateModels) {
        try {
            const imageModel = genAI.getGenerativeModel({ model: modelName });
            const imageResult = await imageModel.generateContent({
                contents: [{ role: 'user', parts: [{ text: imagePrompt }] }],
            });

            const candidates = imageResult.response.candidates ?? [];
            const imagePart = candidates
                .flatMap((candidate) => candidate.content?.parts ?? [])
                .find((part) => {
                    const mimeType = part.inlineData?.mimeType || '';
                    return Boolean(part.inlineData?.data) && mimeType.startsWith('image/');
                });

            if (!imagePart?.inlineData?.data) {
                attempts.push(`${modelName}: no image data returned`);
                continue;
            }

            const mimeType = imagePart.inlineData.mimeType || 'image/png';
            const extension = mimeType.includes('jpeg') ? 'jpg' : 'png';
            const fileName = `${userId}/${postId}_${Date.now()}.${extension}`;
            const buffer = Buffer.from(imagePart.inlineData.data, 'base64');

            const { error: uploadError } = await storageSupabase
                .storage
                .from('thumbnails')
                .upload(fileName, buffer, {
                    contentType: mimeType,
                    upsert: true,
                });

            if (uploadError) {
                attempts.push(`${modelName}: upload failed (${uploadError.message})`);
                continue;
            }

            const { data: { publicUrl } } = storageSupabase
                .storage
                .from('thumbnails')
                .getPublicUrl(fileName);

            return {
                thumbnailUrl: publicUrl,
                error: null,
                attempts,
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            attempts.push(`${modelName}: ${message}`);
        }
    }

    return {
        thumbnailUrl: null,
        error: 'Thumbnail generation failed on all candidate models',
        attempts,
    };
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const adminSupabase = getAdminSupabaseClient();
    const storageSupabase = adminSupabase ?? supabase;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await request.json();
    if (!postId) {
        return NextResponse.json({ error: 'postId is required' }, { status: 400 });
    }

    const { data: post, error: postError } = await supabase
        .from('posts')
        .select('id, prompt, thumbnail_prompt, thumbnail_style')
        .eq('id', postId)
        .eq('user_id', user.id)
        .single();

    if (postError || !post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const result = await generateAndUploadThumbnail({
        postId,
        userId: user.id,
        prompt: post.prompt,
        thumbnailPrompt: post.thumbnail_prompt,
        thumbnailStyle: post.thumbnail_style,
        storageSupabase,
    });

    if (!result.thumbnailUrl) {
        const bucketNotFound = result.attempts.some((attempt) =>
            attempt.toLowerCase().includes('bucket not found')
        );

        if (bucketNotFound && adminSupabase) {
            const { error: createBucketError } = await adminSupabase
                .storage
                .createBucket('thumbnails', { public: true });

            if (!createBucketError || createBucketError.message.toLowerCase().includes('already exists')) {
                const retried = await generateAndUploadThumbnail({
                    postId,
                    userId: user.id,
                    prompt: post.prompt,
                    thumbnailPrompt: post.thumbnail_prompt,
                    thumbnailStyle: post.thumbnail_style,
                    storageSupabase: adminSupabase,
                });

                if (retried.thumbnailUrl) {
                    const { error: retryUpdateError } = await supabase
                        .from('posts')
                        .update({ thumbnail_url: retried.thumbnailUrl })
                        .eq('id', postId)
                        .eq('user_id', user.id);

                    if (retryUpdateError) {
                        return NextResponse.json({ error: retryUpdateError.message }, { status: 500 });
                    }

                    return NextResponse.json({
                        success: true,
                        thumbnailUrl: retried.thumbnailUrl,
                        attempts: [...result.attempts, ...retried.attempts],
                    });
                }
            }
        }

        if (bucketNotFound) {
            return NextResponse.json({
                error: "Supabase storage bucket 'thumbnails' not found",
                attempts: adminSupabase
                    ? [...result.attempts, 'Auto-create bucket attempted but failed']
                    : [
                        ...result.attempts,
                        "Set SUPABASE_SERVICE_ROLE_KEY for auto-creation, or run migration: supabase/migrations/004_create_thumbnails_storage.sql",
                    ],
            }, { status: 500 });
        }

        return NextResponse.json({
            error: result.error || 'Thumbnail generation failed',
            attempts: result.attempts,
        }, { status: 500 });
    }

    const { error: updateError } = await supabase
        .from('posts')
        .update({ thumbnail_url: result.thumbnailUrl })
        .eq('id', postId)
        .eq('user_id', user.id);

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        thumbnailUrl: result.thumbnailUrl,
        attempts: result.attempts,
    });
}
