// import { NextRequest, NextResponse } from 'next/server';

// // Paths that don't require authentication
// const publicPaths = [
//     '/',
//     '/login',
//     '/register',
// ];

// // Static assets and API routes to ignore
// const ignoredPaths = [
//     '/_next/',
//     '/api/',
//     '/images/',
//     '/favicon.ico',
// ];

// export async function middleware(request: NextRequest) {
//     const path = request.nextUrl.pathname;

//     // Skip middleware for ignored paths (API routes and static assets)
//     if (ignoredPaths.some(ignoredPath => path.startsWith(ignoredPath))) {
//         return NextResponse.next();
//     }

//     // Allow public paths
//     if (publicPaths.some(publicPath => path === publicPath) ||
//         publicPaths.some(publicPath => path.startsWith(publicPath + '/'))) {
//         return NextResponse.next();
//     }

//     // Check auth token from cookies for page routes
//     const authToken = request.cookies.get('auth-token')?.value;

//     if (authToken) {
//         // If token exists, allow the request
//         return NextResponse.next();
//     }

//     // If no token, redirect to login
//     const url = new URL('/login', request.url);
//     url.searchParams.set('redirect', encodeURIComponent(path));
//     return NextResponse.redirect(url);
// }

// export const config = {
//     // Matcher that explicitly excludes API routes and static assets
//     matcher: [
//         /*
//          * Match all request paths except:
//          * - API routes (/api/*)
//          * - Static files (_next/static, images, favicon, etc)
//          */
//         '/((?!api|_next/static|_next/image|favicon.ico).*)',
//     ],
// };


import { NextRequest, NextResponse } from 'next/server';

// Paths that don't require authentication
const publicPaths = [
    // Don't include '/' here as we want it protected
    '/login',
    '/register',
];

// Static assets and API routes to ignore
const ignoredPaths = [
    '/_next/',
    '/api/',
    '/images/',
    '/favicon.ico',
];

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Skip middleware for ignored paths (API routes and static assets)
    if (ignoredPaths.some(ignoredPath => path.startsWith(ignoredPath))) {
        return NextResponse.next();
    }

    // Allow public paths
    if (publicPaths.some(publicPath => path === publicPath) ||
        publicPaths.some(publicPath => path.startsWith(publicPath + '/'))) {
        return NextResponse.next();
    }

    // Check auth token from cookies for page routes
    const authToken = request.cookies.get('auth-token')?.value;

    if (authToken) {
        // If token exists, allow the request
        return NextResponse.next();
    }

    // Special case: If we're trying to access '/' but also have a redirect query param
    // to '/', this could cause a redirect loop - prevent that
    if (path === '/' && request.nextUrl.searchParams.get('redirect') === '/') {
        // Just allow access to break the loop
        console.log('Breaking potential redirect loop at /');
        return NextResponse.next();
    }

    // If no token, redirect to login
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', encodeURIComponent(path));
    return NextResponse.redirect(url);
}

export const config = {
    // Matcher that explicitly excludes API routes and static assets
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
