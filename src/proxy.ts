import { NextResponse, type NextRequest } from 'next/server';

// Trang công khai cho khách (không cần đăng nhập):
//  - '/'        : landing page
//  - '/dat-don' : đặt giặt
//  - '/login'   : đăng nhập
//  - '/q'       : theo dõi đơn qua QR
const PUBLIC_PREFIXES = ['/login', '/q', '/dat-don'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic =
    pathname === '/' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    // file tĩnh (ảnh OG, favicon svg, …) — cho qua để share link & favicon hoạt động
    /\.(jpg|jpeg|png|gif|svg|ico|webp|txt|xml|woff2?)$/i.test(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isPublic) {
    return NextResponse.next();
  }

  const token = req.cookies.get('laundry_token')?.value;
  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
