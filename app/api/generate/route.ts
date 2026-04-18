import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

type GeneratedContent = {
    title: string;
    summary: string;
    content: string;
};

function parseGeneratedContent(rawText: string, fallbackPrompt: string): GeneratedContent {
    const cleaned = rawText
        .replace(/```json/gi, '```')
        .replace(/```/g, '')
        .trim();

    const fallback: GeneratedContent = {
        title: fallbackPrompt.slice(0, 50),
        summary: '',
        content: cleaned || fallbackPrompt,
    };

    try {
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start === -1 || end === -1 || end <= start) {
            return fallback;
        }

        const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Partial<GeneratedContent>;
        return {
            title: String(parsed.title || fallback.title).trim(),
            summary: String(parsed.summary || '').trim(),
            content: String(parsed.content || fallback.content).trim(),
        };
    } catch (error) {
        console.error('JSON parsing failed:', error);
        return fallback;
    }
}

export async function POST(request: Request) {
    const supabase = await createClient();

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await request.json();
    if (!postId) {
        return NextResponse.json({ error: 'postId is required' }, { status: 400 });
    }

    // 포스트 조회
    const { data: post, error: fetchError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .eq('user_id', user.id)
        .single();

    if (fetchError || !post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // status를 generating으로 변경
    await supabase
        .from('posts')
        .update({ status: 'generating' })
        .eq('id', postId);

    // 프롬프트 구성
    const systemInstruction = `당신은 전문 블로그 작성 AI입니다. 사용자의 아이디어를 바탕으로 고품질 블로그 글을 작성합니다.

응답은 반드시 아래 JSON 형식으로만 작성하세요. 다른 텍스트는 포함하지 마세요:
{
  "title": "블로그 제목",
  "summary": "2-3문장의 요약",
  "content": "블로그 본문 (마크다운 형식, 최소 800자 이상)"
}

작성 규칙:
- 한국어로 작성
- 자연스럽고 읽기 쉬운 문체
- 적절한 소제목(##)과 단락 구분
- 도입부, 본문, 결론 구조`;

    let userPrompt = `블로그 주제: ${post.prompt}`;
    if (post.keywords) userPrompt += `\n키워드: ${post.keywords}`;
    if (post.critique) userPrompt += `\n작성자 관점/비평: ${post.critique}`;
    if (post.reference_materials) userPrompt += `\n참고 자료: ${post.reference_materials}`;
    if (post.sources) userPrompt += `\n출처: ${post.sources}`;

    try {
        // 텍스트 생성
        const textModel = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction,
        });

        const textResult = await textModel.generateContent(userPrompt);
        const rawText = textResult.response.text();
        const generated = parseGeneratedContent(rawText, post.prompt);

        // 결과 저장
        const { error: updateError } = await supabase
            .from('posts')
            .update({
                title: generated.title,
                summary: generated.summary,
                content: generated.content,
                status: 'generated',
            })
            .eq('id', postId);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, title: generated.title });
    } catch (err) {
        console.error('Generation Process Error:', err);
        // 실패 시 draft로 롤백
        await supabase
            .from('posts')
            .update({ status: 'draft' })
            .eq('id', postId);

        const message = err instanceof Error ? err.message : 'Generation failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
