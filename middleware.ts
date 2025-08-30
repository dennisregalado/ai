import { updateSession } from '@/lib/supabase/middleware';
import { type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, opengraph-image (favicon and og image)
     * - manifest files (.json, .webmanifest)
     * - Images and other static assets (.svg, .png, .jpg, .jpeg, .gif, .webp, .ico)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|opengraph-image|manifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|webmanifest)$).*)',
  ],
};
