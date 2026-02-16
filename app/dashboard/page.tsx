'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
    const { user, loading, signOut } = useAuth();
    const router = useRouter();

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

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    return (
        <div
            className="min-h-screen bg-[#181818]"
            style={{ fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, -apple-system" }}
        >
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap');
            `}</style>

            {/* Top Nav */}
            <header className="sticky top-0 z-50 px-6 py-4 border-b border-white/[0.06] bg-[#181818]/80 backdrop-blur-xl">
                <div className="max-w-[1400px] mx-auto flex items-center justify-between">
                    <a href="/" className="flex items-center">
                        <img src="/logo.png" alt="contentyAI" className="h-8 w-auto" />
                    </a>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            {user.user_metadata?.avatar_url && (
                                <img
                                    src={user.user_metadata.avatar_url}
                                    alt="avatar"
                                    className="w-8 h-8 rounded-full border border-white/10"
                                />
                            )}
                            <span className="text-white/80 text-sm font-medium hidden sm:block">
                                {user.user_metadata?.full_name || user.email}
                            </span>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-[1400px] mx-auto px-6 py-8">
                {/* Welcome */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-1">
                        안녕하세요, {user.user_metadata?.full_name || '사용자'}님
                    </h1>
                    <p className="text-white/50 text-sm">
                        컨텐리AI와 함께 블로그를 작성해보세요.
                    </p>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-4 gap-4 auto-rows-[160px]">
                    {/* New Post - Large */}
                    <div onClick={() => router.push('/dashboard/new')} className="col-span-2 row-span-2 rounded-2xl bg-gradient-to-br from-[#22d3ee]/20 to-[#0ea5e9]/10 border border-[#22d3ee]/20 p-6 flex flex-col justify-between cursor-pointer hover:border-[#22d3ee]/40 transition-all duration-300 group">
                        <div>
                            <div className="w-12 h-12 rounded-xl bg-[#22d3ee]/10 border border-[#22d3ee]/20 flex items-center justify-center mb-4">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">새 글 작성</h2>
                            <p className="text-white/50 text-sm">
                                AI가 아이디어를 블로그 글로 변환해드립니다.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-[#22d3ee] text-sm font-semibold group-hover:gap-3 transition-all duration-200">
                            시작하기
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 8h10M9 4l4 4-4 4" />
                            </svg>
                        </div>
                    </div>

                    {/* My Posts */}
                    <div className="col-span-1 row-span-1 rounded-2xl bg-[#222222] border border-white/[0.06] p-5 flex flex-col justify-between cursor-pointer hover:border-white/[0.12] transition-all duration-300">
                        <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">0</p>
                            <p className="text-white/40 text-xs mt-1">내 글</p>
                        </div>
                    </div>

                    {/* Published */}
                    <div className="col-span-1 row-span-1 rounded-2xl bg-[#222222] border border-white/[0.06] p-5 flex flex-col justify-between cursor-pointer hover:border-white/[0.12] transition-all duration-300">
                        <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">0</p>
                            <p className="text-white/40 text-xs mt-1">발행됨</p>
                        </div>
                    </div>

                    {/* AI Credits */}
                    <div className="col-span-1 row-span-1 rounded-2xl bg-[#222222] border border-white/[0.06] p-5 flex flex-col justify-between cursor-pointer hover:border-white/[0.12] transition-all duration-300">
                        <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">10</p>
                            <p className="text-white/40 text-xs mt-1">AI 크레딧</p>
                        </div>
                    </div>

                    {/* Quick Templates */}
                    <div className="col-span-1 row-span-1 rounded-2xl bg-[#222222] border border-white/[0.06] p-5 flex flex-col justify-between cursor-pointer hover:border-white/[0.12] transition-all duration-300">
                        <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
                                <rect x="3" y="3" width="7" height="7" />
                                <rect x="14" y="3" width="7" height="7" />
                                <rect x="3" y="14" width="7" height="7" />
                                <rect x="14" y="14" width="7" height="7" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">템플릿</p>
                            <p className="text-white/40 text-xs mt-1">빠른 시작</p>
                        </div>
                    </div>

                    {/* Recent Activity - Wide */}
                    <div className="col-span-2 row-span-1 rounded-2xl bg-[#222222] border border-white/[0.06] p-6 flex flex-col justify-between cursor-pointer hover:border-white/[0.12] transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-white">최근 활동</h3>
                            <span className="text-xs text-white/30">전체 보기</span>
                        </div>
                        <div className="flex items-center justify-center flex-1">
                            <p className="text-white/30 text-sm">아직 활동이 없습니다</p>
                        </div>
                    </div>

                    {/* Blog Analytics - Wide */}
                    <div className="col-span-2 row-span-1 rounded-2xl bg-[#222222] border border-white/[0.06] p-6 flex flex-col justify-between cursor-pointer hover:border-white/[0.12] transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-white">블로그 분석</h3>
                            <span className="text-xs text-white/30">이번 주</span>
                        </div>
                        <div className="flex items-center justify-center flex-1">
                            <p className="text-white/30 text-sm">데이터가 충분하지 않습니다</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
