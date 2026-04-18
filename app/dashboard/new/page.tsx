'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type FormData = {
    prompt: string;
    keywords: string;
    critique: string;
    reference_materials: string;
    sources: string;
    thumbnail_prompt: string;
    thumbnail_style: string;
};

const THUMBNAIL_STYLES = [
    { value: 'minimal', label: '미니멀', desc: '깔끔하고 간결한' },
    { value: 'illustration', label: '일러스트', desc: '손그림/벡터 스타일' },
    { value: 'photo', label: '사진풍', desc: '사실적인 사진' },
    { value: 'abstract', label: '추상', desc: '기하학적 아트' },
    { value: 'flat', label: '플랫', desc: '단순한 색면 디자인' },
] as const;

const SUGGESTIONS = [
    '최신 AI 트렌드 정리',
    '초보자를 위한 투자 가이드',
    '건강한 아침 루틴 소개',
    '스타트업 창업 경험담',
];

export default function NewPostPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const supabase = createClient();

    const [form, setForm] = useState<FormData>({
        prompt: '',
        keywords: '',
        critique: '',
        reference_materials: '',
        sources: '',
        thumbnail_prompt: '',
        thumbnail_style: '',
    });

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

    const updateField = (field: keyof FormData, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!form.prompt.trim() || submitting) return;
        setSubmitting(true);

        const { data, error } = await supabase
            .from('posts')
            .insert({
                user_id: user.id,
                prompt: form.prompt.trim(),
                keywords: form.keywords.trim() || null,
                critique: form.critique.trim() || null,
                reference_materials: form.reference_materials.trim() || null,
                sources: form.sources.trim() || null,
                thumbnail_prompt: form.thumbnail_prompt.trim() || null,
                thumbnail_style: form.thumbnail_style || null,
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

    const hasPrompt = form.prompt.trim().length > 0;

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
                <div className="max-w-[720px] mx-auto flex items-center justify-between">
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

            {/* Main Content */}
            <main className="flex-1 px-6 py-10">
                <div className="max-w-[720px] mx-auto flex flex-col gap-6">

                    {/* Page Title */}
                    <div className="mb-2">
                        <h1 className="text-2xl font-bold text-white mb-2">
                            새 글 작성
                        </h1>
                        <p className="text-white/40 text-sm">
                            정보를 입력하면 AI가 블로그 글과 썸네일을 생성합니다.
                        </p>
                    </div>

                    {/* Section 1: 공통 정보 */}
                    <section className="rounded-2xl bg-[#252525] border border-white/[0.06] p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            <h2 className="text-sm font-semibold text-white">공통 정보</h2>
                            <span className="text-xs text-white/30 ml-auto">아티클 + 썸네일 공용</span>
                        </div>
                        <div className="flex flex-col gap-4">
                            {/* Prompt */}
                            <div>
                                <label className="block text-xs text-white/50 mb-2">
                                    블로그 주제 <span className="text-[#22d3ee]">*</span>
                                </label>
                                <textarea
                                    rows={3}
                                    value={form.prompt}
                                    onChange={(e) => updateField('prompt', e.target.value)}
                                    placeholder="어떤 블로그 글을 작성할까요? 아이디어를 알려주세요..."
                                    className="w-full resize-none rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-sm text-white placeholder:text-white/20 focus:border-white/[0.12] focus:outline-none transition-colors"
                                />
                            </div>

                            {/* Suggestion chips */}
                            <div className="flex flex-wrap gap-2">
                                {SUGGESTIONS.map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() => updateField('prompt', suggestion)}
                                        className="px-3 py-1.5 rounded-full text-xs text-white/50 border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:text-white/70 transition-all duration-200"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>

                            {/* Keywords */}
                            <div>
                                <label className="block text-xs text-white/50 mb-2">키워드</label>
                                <input
                                    type="text"
                                    value={form.keywords}
                                    onChange={(e) => updateField('keywords', e.target.value)}
                                    placeholder="SEO 키워드를 쉼표로 구분하여 입력하세요..."
                                    className="w-full rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-white/[0.12] focus:outline-none transition-colors"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Section 2: 아티클 옵션 */}
                    <section className="rounded-2xl bg-[#252525] border border-white/[0.06] p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                            <h2 className="text-sm font-semibold text-white">아티클 옵션</h2>
                            <span className="text-xs text-white/30 ml-auto">텍스트 생성에 반영</span>
                        </div>
                        <div className="flex flex-col gap-4">
                            {/* Critique */}
                            <div>
                                <label className="block text-xs text-white/50 mb-2">나의 비평</label>
                                <textarea
                                    rows={2}
                                    value={form.critique}
                                    onChange={(e) => updateField('critique', e.target.value)}
                                    placeholder="이 주제에 대한 나의 의견이나 관점을 입력하세요..."
                                    className="w-full resize-none rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-sm text-white placeholder:text-white/20 focus:border-white/[0.12] focus:outline-none transition-colors"
                                />
                            </div>

                            {/* Reference Materials */}
                            <div>
                                <label className="block text-xs text-white/50 mb-2">참고 자료</label>
                                <textarea
                                    rows={2}
                                    value={form.reference_materials}
                                    onChange={(e) => updateField('reference_materials', e.target.value)}
                                    placeholder="참고할 기사, 논문, 블로그 등의 내용을 입력하세요..."
                                    className="w-full resize-none rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-sm text-white placeholder:text-white/20 focus:border-white/[0.12] focus:outline-none transition-colors"
                                />
                            </div>

                            {/* Sources */}
                            <div>
                                <label className="block text-xs text-white/50 mb-2">출처</label>
                                <input
                                    type="text"
                                    value={form.sources}
                                    onChange={(e) => updateField('sources', e.target.value)}
                                    placeholder="출처 URL이나 자료명을 입력하세요..."
                                    className="w-full rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-white/[0.12] focus:outline-none transition-colors"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Section 3: 썸네일 옵션 */}
                    <section className="rounded-2xl bg-[#252525] border border-white/[0.06] p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                <circle cx="9" cy="9" r="2" />
                                <path d="m21 15-3.086-3.086a2 2 0 00-2.828 0L6 21" />
                            </svg>
                            <h2 className="text-sm font-semibold text-white">썸네일 옵션</h2>
                            <span className="text-xs text-white/30 ml-auto">이미지 생성에 반영</span>
                        </div>
                        <div className="flex flex-col gap-4">
                            {/* Thumbnail Prompt */}
                            <div>
                                <label className="block text-xs text-white/50 mb-2">썸네일 프롬프트</label>
                                <textarea
                                    rows={2}
                                    value={form.thumbnail_prompt}
                                    onChange={(e) => updateField('thumbnail_prompt', e.target.value)}
                                    placeholder="비워두면 블로그 주제를 기반으로 자동 생성됩니다..."
                                    className="w-full resize-none rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-sm text-white placeholder:text-white/20 focus:border-white/[0.12] focus:outline-none transition-colors"
                                />
                            </div>

                            {/* Thumbnail Style */}
                            <div>
                                <label className="block text-xs text-white/50 mb-2">썸네일 스타일</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {THUMBNAIL_STYLES.map((style) => (
                                        <button
                                            key={style.value}
                                            type="button"
                                            onClick={() =>
                                                updateField(
                                                    'thumbnail_style',
                                                    form.thumbnail_style === style.value ? '' : style.value
                                                )
                                            }
                                            className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all duration-200 ${
                                                form.thumbnail_style === style.value
                                                    ? 'border-[#22d3ee] bg-[#22d3ee]/10 text-white'
                                                    : 'border-white/[0.06] bg-white/[0.02] text-white/50 hover:border-white/[0.12] hover:text-white/70'
                                            }`}
                                        >
                                            <span className="text-xs font-medium">{style.label}</span>
                                            <span className="text-[10px] text-white/30">{style.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={!hasPrompt || submitting}
                        className="w-full py-4 rounded-2xl bg-[#22d3ee] text-black text-sm font-bold hover:bg-[#06b6d4] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {submitting ? '저장 중...' : '글 작성 시작'}
                    </button>

                </div>
            </main>
        </div>
    );
}
