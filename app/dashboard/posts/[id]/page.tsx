'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

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
};

export default function PostDetailPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const postId = params.id as string;

    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
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

            if (error || !data) {
                console.error('Post fetch error:', error?.message);
                router.push('/dashboard');
                return;
            }

            setPost(data as Post);
            setLoading(false);

            // 이미 generating 상태면 폴링 시작
            if (data.status === 'generating') {
                setGenerating(true);
            }
        };

        fetchPost();
    }, [user, postId]);

    // generating 상태일 때 폴링으로 완료 확인
    useEffect(() => {
        if (!generating || !postId) return;

        const interval = setInterval(async () => {
            const { data } = await supabase
                .from('posts')
                .select('*')
                .eq('id', postId)
                .single();

            if (data && data.status !== 'generating') {
                setPost(data as Post);
                setGenerating(false);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [generating, postId]);

    const handleGenerate = async () => {
        if (!post) return;
        setGenerating(true);
        setError(null);
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

            // 생성 완료 후 데이터 다시 불러오기
            const { data } = await supabase
                .from('posts')
                .select('*')
                .eq('id', post.id)
                .single();

            if (data) {
                setPost(data as Post);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Generation failed';
            setError(message);
            setPost({ ...post, status: 'draft' });
        } finally {
            setGenerating(false);
        }
    };

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
                        <h2 className="text-xs font-medium text-white/30 uppercase tracking-wider">생성된 콘텐츠</h2>

                        {/* Error Message */}
                        {error && (
                            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {post.status === 'draft' && (
                            <div className="rounded-2xl bg-[#252525] border border-white/[0.06] p-8 text-center">
                                <div className="w-12 h-12 rounded-xl bg-[#22d3ee]/10 border border-[#22d3ee]/20 flex items-center justify-center mx-auto mb-4">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                    </svg>
                                </div>
                                <p className="text-white/60 text-sm mb-4">
                                    아직 AI가 글을 생성하지 않았습니다.
                                </p>
                                <button
                                    onClick={handleGenerate}
                                    disabled={generating}
                                    className="px-6 py-2.5 rounded-xl bg-[#22d3ee] text-black text-sm font-semibold hover:bg-[#06b6d4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    AI 글 생성하기
                                </button>
                            </div>
                        )}

                        {post.status === 'generating' && (
                            <div className="rounded-2xl bg-[#252525] border border-[#22d3ee]/20 p-8 text-center">
                                <div className="w-8 h-8 border-2 border-[#22d3ee]/30 border-t-[#22d3ee] rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-white/60 text-sm">AI가 블로그 글을 생성하고 있습니다...</p>
                            </div>
                        )}

                        {(post.status === 'generated' || post.status === 'published') && post.content && (
                            <div className="flex flex-col gap-4">
                                {post.title && (
                                    <h1 className="text-2xl font-bold text-white">{post.title}</h1>
                                )}
                                {post.summary && (
                                    <p className="text-white/50 text-sm italic">{post.summary}</p>
                                )}
                                <div className="rounded-2xl bg-[#252525] border border-white/[0.06] p-6">
                                    <div className="text-white/80 text-sm leading-[1.8] whitespace-pre-wrap">
                                        {post.content}
                                    </div>
                                </div>
                            </div>
                        )}
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
