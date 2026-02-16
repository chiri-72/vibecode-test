'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
    const { user, loading } = useAuth();

    return (
        <nav className="fixed top-0 left-0 right-0 z-[1000] px-8 py-4 backdrop-blur-xl backdrop-saturate-[120%] bg-[rgba(10,10,10,0.7)] border-b border-white/10">
            <div className="max-w-[1400px] mx-auto flex items-center justify-between">
                {/* Logo */}
                <a href="/" className="flex items-center no-underline">
                    <img
                        src="/logo.png"
                        alt="contentyAI"
                        className="h-10 w-auto"
                    />
                </a>

                {/* Navigation Buttons */}
                <div className="flex items-center gap-3">
                    {!loading && user ? (
                        /* Logged in */
                        <a
                            href="/dashboard"
                            className="inline-block px-6 py-2.5 rounded-[10px] bg-gradient-to-b from-[#22d3ee] to-[#0ea5e9] text-white no-underline font-semibold text-[0.95rem] font-['Space_Grotesk',ui-sans-serif,system-ui,-apple-system] shadow-[0_8px_24px_rgba(34,211,238,0.3),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-200 ease-in-out hover:from-[#06b6d4] hover:to-[#0284c7] hover:-translate-y-[1px] hover:shadow-[0_12px_32px_rgba(34,211,238,0.4),0_6px_16px_rgba(0,0,0,0.25)]"
                        >
                            Dashboard
                        </a>
                    ) : (
                        /* Not logged in */
                        <>
                            <a
                                href="/auth"
                                className="inline-block px-6 py-2.5 rounded-[10px] bg-gradient-to-b from-white/[0.12] to-white/[0.06] text-white no-underline font-semibold text-[0.95rem] font-['Space_Grotesk',ui-sans-serif,system-ui,-apple-system] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2),0_4px_16px_rgba(0,0,0,0.1)] backdrop-blur-md backdrop-saturate-[120%] transition-all duration-200 ease-in-out hover:bg-gradient-to-b hover:from-white/[0.18] hover:to-white/[0.1] hover:-translate-y-[1px] hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25),0_8px_24px_rgba(0,0,0,0.15)]"
                            >
                                Sign In
                            </a>
                            <a
                                href="#get-started"
                                className="inline-block px-6 py-2.5 rounded-[10px] bg-gradient-to-b from-[#22d3ee] to-[#0ea5e9] text-white no-underline font-semibold text-[0.95rem] font-['Space_Grotesk',ui-sans-serif,system-ui,-apple-system] shadow-[0_8px_24px_rgba(34,211,238,0.3),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-200 ease-in-out hover:from-[#06b6d4] hover:to-[#0284c7] hover:-translate-y-[1px] hover:shadow-[0_12px_32px_rgba(34,211,238,0.4),0_6px_16px_rgba(0,0,0,0.25)]"
                            >
                                Get Started
                            </a>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

export { Navbar };
