'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PromptArea } from '@/components/prompt/PromptArea';

export default function NewPostPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#181818] flex items-center justify-center">
                <div className="text-white/60 text-sm">Loading...</div>
            </div>
        );
    }

    if (!user) return null;

    const handleSubmit = async (prompt: string, options: Record<string, string>) => {
        if (submitting) return;
        setSubmitting(true);

        const { data, error } = await supabase
            .from('posts')
            .insert({
                user_id: user.id,
                prompt,
                keywords: options.keywords || null,
                critique: options.critique || null,
                reference_materials: options.reference_materials || null,
                sources: options.sources || null,
                status: 'draft',
            })
            .select('id')
            .single();

        if (error) {
            console.error('Post creation error:', error.message);
            setSubmitting(false);
            return;
        }

        router.push(`/dashboard/posts/${data.id}`);
    };

    return (
        <div
            className="min-h-screen bg-[#181818] flex flex-col"
            style={{ fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, -apple-system" }}
        >
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap');
            `}</style>

            {/* Top Nav */}
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
                    <span className="text-white/40 text-sm">새 글 작성</span>
                </div>
            </header>

            {/* Main Content - Centered Prompt */}
            <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
                <div className="w-full max-w-[700px] flex flex-col gap-8">
                    {/* Title */}
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-white mb-3">
                            어떤 글을 작성할까요?
                        </h1>
                        <p className="text-white/40 text-sm">
                            아이디어를 입력하고 옵션을 설정하면 AI가 블로그 글을 작성합니다.
                        </p>
                    </div>

                    {/* Prompt Area */}
                    <PromptArea onSubmit={handleSubmit} disabled={submitting} />

                    {/* Suggestion chips */}
                    <div className="flex flex-wrap justify-center gap-2">
                        {[
                            '최신 AI 트렌드 정리',
                            '초보자를 위한 투자 가이드',
                            '건강한 아침 루틴 소개',
                            '스타트업 창업 경험담',
                        ].map((suggestion) => (
                            <button
                                key={suggestion}
                                onClick={() => {
                                    const textarea = document.querySelector('textarea');
                                    if (textarea) {
                                        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                                            window.HTMLTextAreaElement.prototype, 'value'
                                        )?.set;
                                        nativeInputValueSetter?.call(textarea, suggestion);
                                        textarea.dispatchEvent(new Event('input', { bubbles: true }));
                                        textarea.focus();
                                    }
                                }}
                                className="px-4 py-2 rounded-full text-xs text-white/50 border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:text-white/70 transition-all duration-200"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
