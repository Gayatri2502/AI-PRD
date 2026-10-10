import {NextResponse} from 'next/server';
// Firebase session cookies are verified (including revocation) in Node API handlers.
export function middleware(){return NextResponse.next();}
export const config={matcher:['/dashboard/:path*']};
