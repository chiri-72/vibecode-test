'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AuthPage() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const handleGoogleLogin = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) {
            console.error('Login error:', error.message);
            setLoading(false);
        }
    };

    // Same WebGL shader setup as hero section
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext('webgl2', { alpha: true, antialias: true });
        if (!gl) return;

        const VERT_SRC = `#version 300 es
precision highp float;
in vec2 position;
void main(){ gl_Position = vec4(position, 0.0, 1.0); }
`;

        const FRAG_SRC = `#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;
#define FC gl_FragCoord.xy
#define R resolution
#define T time
#define S smoothstep
#define MN min(R.x,R.y)
float pattern(vec2 uv) {
  float d=.0;
  for (float i=.0; i<3.; i++) {
    uv.x+=sin(T*(1.+i)+uv.y*1.5)*.2;
    d+=.005/abs(uv.x);
  }
  return d;
}
vec3 scene(vec2 uv) {
  vec3 col=vec3(0);
  uv=vec2(atan(uv.x,uv.y)*2./6.28318,-log(length(uv))+T);
  for (float i=.0; i<3.; i++) {
    int k=int(mod(i,3.));
    col[k]+=pattern(uv+i*6./MN);
  }
  return col;
}
void main() {
  vec2 uv=(FC-.5*R)/MN;
  vec3 col=vec3(0);
  float s=12., e=9e-4;
  col+=e/(sin(uv.x*s)*cos(uv.y*s));
  uv.y+=R.x>R.y?.5:.5*(R.y/R.x);
  col+=scene(uv);
  O=vec4(col,1.);
}`;

        const compileShader = (src: string, type: number) => {
            const sh = gl.createShader(type)!;
            gl.shaderSource(sh, src);
            gl.compileShader(sh);
            if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
                console.error(gl.getShaderInfoLog(sh));
                gl.deleteShader(sh);
                return null;
            }
            return sh;
        };

        const vs = compileShader(VERT_SRC, gl.VERTEX_SHADER);
        const fs = compileShader(FRAG_SRC, gl.FRAGMENT_SHADER);
        if (!vs || !fs) return;

        const prog = gl.createProgram()!;
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        gl.deleteShader(vs);
        gl.deleteShader(fs);

        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(prog));
            return;
        }

        const verts = new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

        gl.useProgram(prog);
        const posLoc = gl.getAttribLocation(prog, 'position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        const uniTime = gl.getUniformLocation(prog, 'time');
        const uniRes = gl.getUniformLocation(prog, 'resolution');

        gl.clearColor(0, 0, 0, 1);

        const fit = () => {
            const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
            const rect = canvas.getBoundingClientRect();
            const W = Math.floor(rect.width * dpr);
            const H = Math.floor(rect.height * dpr);
            if (canvas.width !== W || canvas.height !== H) {
                canvas.width = W;
                canvas.height = H;
            }
            gl.viewport(0, 0, canvas.width, canvas.height);
        };
        fit();

        const ro = new ResizeObserver(fit);
        ro.observe(canvas);
        window.addEventListener('resize', fit);

        let rafId: number;
        const loop = (now: number) => {
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.useProgram(prog);
            if (uniRes) gl.uniform2f(uniRes, canvas.width, canvas.height);
            if (uniTime) gl.uniform1f(uniTime, now * 1e-3);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            rafId = requestAnimationFrame(loop);
        };
        rafId = requestAnimationFrame(loop);

        return () => {
            ro.disconnect();
            window.removeEventListener('resize', fit);
            cancelAnimationFrame(rafId);
            gl.deleteBuffer(buf);
            gl.deleteProgram(prog);
        };
    }, []);

    return (
        <div className="relative min-h-screen overflow-hidden">
            {/* Font import */}
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap');
            `}</style>

            {/* Shader canvas background */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ display: 'block' }}
            />

            {/* Gradient overlay */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'linear-gradient(180deg, #00000099, #00000040 40%, transparent)',
                }}
            />

            {/* Back Button */}
            <div className="absolute top-8 left-8 z-50">
                <a
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors duration-200 cursor-pointer"
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        className="transition-transform duration-200 hover:-translate-x-1"
                    >
                        <path
                            d="M10 12L6 8L10 4"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    Back
                </a>
            </div>

            {/* Auth card */}
            <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
                <div
                    className="w-full max-w-md p-8 rounded-2xl backdrop-blur-xl backdrop-saturate-[120%] bg-[rgba(10,10,10,0.6)] border border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.4)]"
                    style={{ fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, -apple-system" }}
                >
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Welcome to ContentlyAI
                        </h1>
                        <p className="text-white/70 text-sm">
                            Sign in with Google
                        </p>
                    </div>

                    {/* Google login button */}
                    <button
                        className="w-full px-6 py-4 rounded-xl bg-white text-gray-900 font-semibold text-base flex items-center justify-center gap-3 shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-all duration-200 hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                    >
                        {/* Google Icon SVG */}
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path
                                d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z"
                                fill="#4285F4"
                            />
                            <path
                                d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z"
                                fill="#34A853"
                            />
                            <path
                                d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.191 5.736 7.396 3.977 10 3.977z"
                                fill="#EA4335"
                            />
                        </svg>
                        {loading ? '로그인 중...' : 'Google로 계속하기'}
                    </button>

                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-transparent text-white/50">또는</span>
                        </div>
                    </div>

                    {/* Additional info */}
                    <div className="text-center">
                        <p className="text-white/60 text-xs leading-relaxed">
                            계속 진행하면 컨텐리AI의{' '}
                            <a href="#" className="text-white/80 hover:text-white underline">
                                서비스 약관
                            </a>
                            과{' '}
                            <a href="#" className="text-white/80 hover:text-white underline">
                                개인정보 처리방침
                            </a>
                            에 동의하는 것으로 간주됩니다.
                        </p>
                    </div>

                    {/* Back to home */}
                    <div className="mt-6 text-center">
                        <a
                            href="/"
                            className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors duration-200"
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                className="transition-transform duration-200 group-hover:-translate-x-1"
                            >
                                <path
                                    d="M10 12L6 8L10 4"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            홈으로 돌아가기
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
