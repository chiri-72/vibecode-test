'use client';

import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Post = {
    id: string;
    title: string | null;
    summary: string | null;
    status: string;
    created_at: string;
};

export default function PostsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user) return;

        const fetchPosts = async () => {
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .eq('user_id', user.id)
                .in('status', ['generated', 'published'])
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching posts:', error);
            } else {
                setPosts(data as Post[]);
            }
            setLoading(false);
        };

        fetchPosts();
    }, [user]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-[#181818] flex items-center justify-center">
                <div className="text-white/60 text-sm">Loading...</div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div
            className="min-h-screen bg-[#181818]"
            style={{ fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, -apple-system" }}
        >
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap');
            `}</style>

            {/* Header */}
            <header className="sticky top-0 z-50 px-6 py-4 border-b border-white/[0.06] bg-[#181818]/80 backdrop-blur-xl">
                <div className="max-w-[1400px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="p-2 -ml-2 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h1 className="text-lg font-bold text-white">내 글 목록</h1>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-[1400px] mx-auto px-6 py-8">
                {posts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 rounded-2xl bg-[#222222] border border-white/[0.06] flex items-center justify-center mb-6">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.2">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                        </div>
                        <h3 className="text-white text-lg font-semibold mb-2">아직 작성된 글이 없습니다</h3>
                        <p className="text-white/40 text-sm mb-6">AI와 함께 첫 번째 블로그 글을 작성해보세요.</p>
                        <button
                            onClick={() => router.push('/dashboard/new')}
                            className="px-6 py-3 rounded-xl bg-[#22d3ee] text-black text-sm font-bold hover:bg-[#06b6d4] transition-all duration-200"
                        >
                            새 글 작성하기
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map((post) => (
                            <div
                                key={post.id}
                                onClick={() => router.push(`/dashboard/posts/${post.id}`)}
                                className="group rounded-2xl bg-[#222222] border border-white/[0.06] p-6 cursor-pointer hover:border-[#22d3ee]/50 transition-all duration-300"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:bg-[#22d3ee]/10 group-hover:border-[#22d3ee]/20 transition-all duration-300">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={post.status === 'published' ? '#22d3ee' : 'white'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 group-hover:opacity-100 group-hover:stroke-[#22d3ee] transition-all duration-300">
                                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                        </svg>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${post.status === 'published'
                                            ? 'text-blue-400 bg-blue-400/10'
                                            : 'text-emerald-400 bg-emerald-400/10'
                                        }`}>
                                        {post.status === 'published' ? '발행됨' : '생성 완료'}
                                    </span>
                                </div>
                                <h3 className="text-white font-bold text-lg mb-2 line-clamp-1">
                                    {post.title || '제목 없음'}
                                </h3>
                                <p className="text-white/40 text-sm mb-6 line-clamp-2 h-10">
                                    {post.summary || '내용 요약이 없습니다.'}
                                </p>
                                <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                                    <span className="text-white/20 text-xs">
                                        {new Date(post.created_at).toLocaleDateString()}
                                    </span>
                                    <span className="text-[#22d3ee] text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                                        자세히 보기 →
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
