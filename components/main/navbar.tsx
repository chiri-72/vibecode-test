'use client';

export default function Navbar() {
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

                {/* Get Started Button */}
                <a
                    href="#get-started"
                    className="inline-block px-6 py-2.5 rounded-[10px] bg-gradient-to-b from-white/[0.16] to-white/[0.08] text-white no-underline font-semibold text-[0.95rem] font-['Space_Grotesk',ui-sans-serif,system-ui,-apple-system] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25),0_8px_24px_rgba(0,0,0,0.15)] backdrop-blur-md backdrop-saturate-[120%] transition-all duration-200 ease-in-out hover:bg-gradient-to-b hover:from-white/[0.22] hover:to-white/[0.12] hover:-translate-y-[1px] hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3),0_12px_32px_rgba(0,0,0,0.2)]"
                >
                    Get Started
                </a>
            </div>
        </nav>
    );
}

export { Navbar };
