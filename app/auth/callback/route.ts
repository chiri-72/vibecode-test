import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Redirect to home page after successful login
            return NextResponse.redirect(origin);
        }
    }

    // Redirect to auth page with error
    return NextResponse.redirect(`${origin}/auth?error=auth_failed`);
}
