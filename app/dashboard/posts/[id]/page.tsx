'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ReactNode } from 'react';

type Post = {
    id: string;
    prompt: string;
    keywords: string | null;
    critique: string | null;
    reference_materials: string | null;
    sources: string | null;
    title: string | null;
    content: string | null;
    summary: string | null;
    status: string;
    created_at: string;
    updated_at: string;
    thumbnail_url: string | null;
    thumbnail_prompt: string | null;
    thumbnail_style: string | null;
};

function renderInlineMarkdown(text: string): ReactNode[] {
    const tokens = text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);

    return tokens.map((token, index) => {
        if (!token) return null;

        const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
            return (
                <a
                    key={`inline-link-${index}`}
                    href={linkMatch[2]}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#22d3ee] hover:text-[#67e8f9] underline underline-offset-2 break-all"
                >
                    {linkMatch[1]}
                </a>
            );
        }

        if (token.startsWith('**') && token.endsWith('**')) {
            return <strong key={`inline-strong-${index}`} className="font-semibold text-white">{token.slice(2, -2)}</strong>;
        }
        if (token.startsWith('`') && token.endsWith('`')) {
            return (
                <code key={`inline-code-${index}`} className="px-1.5 py-0.5 rounded-md bg-black/30 border border-white/10 text-white/90 text-[0.95em]">
                    {token.slice(1, -1)}
                </code>
            );
        }
        if (token.startsWith('*') && token.endsWith('*')) {
            return <em key={`inline-em-${index}`} className="italic text-white/90">{token.slice(1, -1)}</em>;
        }

        return <span key={`inline-text-${index}`}>{token}</span>;
    });
}

function renderMarkdown(content: string): ReactNode[] {
    const blocks = content
        .replace(/\r\n/g, '\n')
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter(Boolean);

    return blocks.map((block, index) => {
        const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
        const numberedItems = lines
            .map((line) => line.match(/^\d+\.\s+(.*)$/)?.[1] || null)
            .filter((item): item is string => Boolean(item));
        const bulletItems = lines
            .map((line) => line.match(/^[-*]\s+(.*)$/)?.[1] || null)
            .filter((item): item is string => Boolean(item));

        if (block.startsWith('### ')) {
            return (
                <h3 key={`h3-${index}`} className="text-xl font-semibold text-white mt-2 mb-1">
                    {renderInlineMarkdown(block.replace(/^###\s+/, ''))}
                </h3>
            );
        }
        if (block.startsWith('## ')) {
            return (
                <h2 key={`h2-${index}`} className="text-2xl font-bold text-white mt-3 mb-1">
                    {renderInlineMarkdown(block.replace(/^##\s+/, ''))}
                </h2>
            );
        }
        if (block.startsWith('# ')) {
            return (
                <h1 key={`h1-${index}`} className="text-3xl font-bold text-white mt-4 mb-2">
                    {renderInlineMarkdown(block.replace(/^#\s+/, ''))}
                </h1>
            );
        }
        if (numberedItems.length === lines.length && numberedItems.length > 0) {
            return (
                <ol key={`ol-${index}`} className="list-decimal pl-6 space-y-2 text-white/85">
                    {numberedItems.map((item, itemIndex) => (
                        <li key={`ol-item-${index}-${itemIndex}`}>{renderInlineMarkdown(item)}</li>
                    ))}
                </ol>
            );
        }
        if (bulletItems.length === lines.length && bulletItems.length > 0) {
            return (
                <ul key={`ul-${index}`} className="list-disc pl-6 space-y-2 text-white/85">
                    {bulletItems.map((item, itemIndex) => (
                        <li key={`ul-item-${index}-${itemIndex}`}>{renderInlineMarkdown(item)}</li>
                    ))}
                </ul>
            );
        }

        return (
            <p key={`p-${index}`} className="text-white/85 leading-[1.9]">
                {renderInlineMarkdown(lines.join(' '))}
            </p>
        );
    });
}

export default function PostDetailPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const postId = params.id as string;

    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [generatingText, setGeneratingText] = useState(false);
    const [generatingThumbnail, setGeneratingThumbnail] = useState(false);
    const [textError, setTextError] = useState<string | null>(null);
    const [thumbnailError, setThumbnailError] = useState<string | null>(null);
    const autoThumbnailAttemptedRef = useRef<Record<string, boolean>>({});
    const supabase = createClient();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user || !postId) return;

        const fetchPost = async () => {
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .eq('id', postId)
                .single();


            if (error) {
                console.error('Post fetch error:', error.message, error.details, error.hint);
                setTextError(`Post load failed: ${error.message}`);
                setLoading(false);
                return;
            }

            if (!data) {
                console.error('Post not found');
                setTextError('Post not found');
                setLoading(false);
                return;
            }

            setPost(data as Post);
            setLoading(false);

            // 이미 generating 상태면 폴링 시작
            if (data.status === 'generating') {
                setGeneratingText(true);
            }
        };

        fetchPost();
    }, [user, postId]);

    // generating 상태일 때 폴링으로 완료 확인
    useEffect(() => {
        if (!generatingText || !postId) return;

        const interval = setInterval(async () => {
            const { data } = await supabase
                .from('posts')
                .select('*')
                .eq('id', postId)
                .single();

            if (data && data.status !== 'generating') {
                setPost(data as Post);
                setGeneratingText(false);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [generatingText, postId]);

    const refreshPost = useCallback(async (id: string) => {
        const { data } = await supabase
            .from('posts')
            .select('*')
            .eq('id', id)
            .single();

        if (data) {
            setPost(data as Post);
        }
    }, [supabase]);

    const handleGenerateText = async () => {
        if (!post) return;
        setGeneratingText(true);
        setTextError(null);
        setPost({ ...post, status: 'generating' });

        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId: post.id }),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || 'Generation failed');
            }

            await refreshPost(post.id);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Generation failed';
            setTextError(message);
            setPost({ ...post, status: 'draft' });
        } finally {
            setGeneratingText(false);
        }
    };

    const handleGenerateThumbnail = useCallback(async () => {
        if (!post) return;
        setGeneratingThumbnail(true);
        setThumbnailError(null);

        try {
            const res = await fetch('/api/generate-thumbnail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId: post.id }),
            });
            const result = await res.json();

            if (!res.ok) {
                const detail = Array.isArray(result.attempts) && result.attempts.length > 0
                    ? ` (${result.attempts.join(' | ')})`
                    : '';
                throw new Error((result.error || 'Thumbnail generation failed') + detail);
            }

            await refreshPost(post.id);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Thumbnail generation failed';
            setThumbnailError(message);
        } finally {
            setGeneratingThumbnail(false);
        }
    }, [post, refreshPost]);

    useEffect(() => {
        if (!post) return;
        const textReady = post.status === 'generated' || post.status === 'published';
        if (!textReady || post.thumbnail_url || generatingThumbnail) return;
        if (autoThumbnailAttemptedRef.current[post.id]) return;

        autoThumbnailAttemptedRef.current[post.id] = true;
        void handleGenerateThumbnail();
    }, [post, generatingThumbnail, handleGenerateThumbnail]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-[#181818] flex items-center justify-center">
                <div className="text-white/60 text-sm">Loading...</div>
            </div>
        );
    }

    if (!user || !post) return null;

    const statusLabels: Record<string, { text: string; color: string }> = {
        draft: { text: '초안', color: 'text-white/50 bg-white/[0.06]' },
        generating: { text: 'AI 생성 중...', color: 'text-[#22d3ee] bg-[#22d3ee]/10' },
        generated: { text: '생성 완료', color: 'text-emerald-400 bg-emerald-400/10' },
        published: { text: '발행됨', color: 'text-blue-400 bg-blue-400/10' },
    };

    const statusInfo = statusLabels[post.status] || statusLabels.draft;

    const inputFields = [
        { label: '키워드', value: post.keywords },
        { label: '나의 비평', value: post.critique },
        { label: '참고 자료', value: post.reference_materials },
        { label: '출처', value: post.sources },
        { label: '썸네일 프롬프트', value: post.thumbnail_prompt },
        { label: '썸네일 스타일', value: post.thumbnail_style },
    ].filter((f) => f.value);

    return (
        <div
            className="min-h-screen bg-[#181818] flex flex-col"
            style={{ fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, -apple-system" }}
        >
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap');
            `}</style>

            {/* Header */}
            <header className="sticky top-0 z-50 px-6 py-4 border-b border-white/[0.06] bg-[#181818]/80 backdrop-blur-xl">
                <div className="max-w-[900px] mx-auto flex items-center justify-between">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors duration-200"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Dashboard
                    </button>
                    <span className={`text-xs px-3 py-1 rounded-full ${statusInfo.color}`}>
                        {statusInfo.text}
                    </span>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 px-6 py-10">
                <div className="max-w-[900px] mx-auto flex flex-col gap-8">

                    {/* Input Section */}
                    <section className="flex flex-col gap-4">
                        <h2 className="text-xs font-medium text-white/30 uppercase tracking-wider">입력 정보</h2>

                        {/* Main Prompt */}
                        <div className="rounded-2xl bg-[#252525] border border-white/[0.06] p-5">
                            <p className="text-xs text-white/30 mb-2">프롬프트</p>
                            <p className="text-white text-base leading-relaxed">{post.prompt}</p>
                        </div>

                        {/* Option Fields */}
                        {inputFields.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {inputFields.map((field) => (
                                    <div
                                        key={field.label}
                                        className="rounded-xl bg-[#252525] border border-white/[0.06] p-4"
                                    >
                                        <p className="text-xs text-[#22d3ee]/60 mb-1.5">{field.label}</p>
                                        <p className="text-white/80 text-sm leading-relaxed">{field.value}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Divider */}
                    <div className="border-t border-white/[0.06]" />

                    {/* Output Section */}
                    <section className="flex flex-col gap-4">
                        <h2 className="text-xs font-medium text-white/30 uppercase tracking-wider">생성 작업</h2>

                        {textError && (
                            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm">
                                텍스트 생성 오류: {textError}
                            </div>
                        )}

                        {thumbnailError && (
                            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-amber-300 text-sm">
                                이미지 생성 오류: {thumbnailError}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="rounded-2xl bg-[#252525] border border-white/[0.06] p-5 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-white/80 font-semibold">텍스트 AI</div>
                                    <span className={`text-xs px-2.5 py-1 rounded-full ${post.status === 'generating'
                                        ? 'text-[#22d3ee] bg-[#22d3ee]/10'
                                        : post.status === 'generated' || post.status === 'published'
                                            ? 'text-emerald-400 bg-emerald-400/10'
                                            : 'text-white/40 bg-white/[0.08]'
                                        }`}>
                                        {post.status === 'generating' ? '생성 중' : (post.status === 'generated' || post.status === 'published') ? '완료' : '대기'}
                                    </span>
                                </div>
                                <p className="text-white/50 text-sm">블로그 제목, 요약, 본문을 생성합니다.</p>
                                <button
                                    onClick={handleGenerateText}
                                    disabled={generatingText}
                                    className="w-full px-4 py-2.5 rounded-xl bg-[#22d3ee] text-black text-sm font-semibold hover:bg-[#06b6d4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {generatingText ? '텍스트 생성 중...' : (post.status === 'generated' || post.status === 'published') ? '텍스트 다시 생성' : '텍스트 생성하기'}
                                </button>
                            </div>

                            <div className="rounded-2xl bg-[#252525] border border-white/[0.06] p-5 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-white/80 font-semibold">이미지 AI (Nanobanana)</div>
                                    <span className={`text-xs px-2.5 py-1 rounded-full ${generatingThumbnail
                                        ? 'text-[#22d3ee] bg-[#22d3ee]/10'
                                        : post.thumbnail_url
                                            ? 'text-emerald-400 bg-emerald-400/10'
                                            : 'text-white/40 bg-white/[0.08]'
                                        }`}>
                                        {generatingThumbnail ? '생성 중' : post.thumbnail_url ? '완료' : '대기'}
                                    </span>
                                </div>
                                <p className="text-white/50 text-sm">썸네일 이미지를 생성하고 저장합니다.</p>
                                <button
                                    onClick={handleGenerateThumbnail}
                                    disabled={generatingThumbnail}
                                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.08] text-white text-sm font-semibold hover:bg-white/[0.14] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {generatingThumbnail ? '썸네일 생성 중...' : post.thumbnail_url ? '썸네일 다시 생성' : '썸네일 생성하기'}
                                </button>
                            </div>
                        </div>

                        <h2 className="text-xs font-medium text-white/30 uppercase tracking-wider mt-2">생성된 콘텐츠</h2>
                        <div className="flex flex-col gap-6">
                            {post.thumbnail_url ? (
                                <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-[#222222] aspect-square w-full max-w-[520px] mx-auto">
                                    <img
                                        src={post.thumbnail_url}
                                        alt="AI Generated Thumbnail"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-white/[0.06] bg-[#252525] aspect-square w-full max-w-[520px] mx-auto flex flex-col items-center justify-center gap-3 text-white/30">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                        <circle cx="9" cy="9" r="2" />
                                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                                    </svg>
                                    <span className="text-sm">썸네일 이미지가 아직 생성되지 않았습니다</span>
                                </div>
                            )}

                            {post.content ? (
                                <div className="flex flex-col gap-4">
                                    {post.title && (
                                        <h1 className="text-2xl font-bold text-white">{post.title}</h1>
                                    )}
                                    {post.summary && (
                                        <p className="text-white/50 text-sm italic">{post.summary}</p>
                                    )}
                                    <div className="rounded-2xl bg-[#252525] border border-white/[0.06] p-6">
                                        <div className="flex flex-col gap-4 text-sm">
                                            {renderMarkdown(post.content)}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-white/[0.06] bg-[#252525] p-6 text-sm text-white/40">
                                    텍스트 콘텐츠가 아직 생성되지 않았습니다.
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Meta */}
                    <div className="text-xs text-white/20 text-right">
                        생성일: {new Date(post.created_at).toLocaleDateString('ko-KR', {
                            year: 'numeric', month: 'long', day: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}
