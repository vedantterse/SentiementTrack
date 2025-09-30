import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // If user is authenticated and tries to access signin page, redirect to dashboard
    if (req.nextUrl.pathname === "/auth/signin" && req.nextauth.token) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
    
    // If user is not authenticated and tries to access dashboard, redirect to signin
    if (req.nextUrl.pathname === "/dashboard" && !req.nextauth.token) {
      return NextResponse.redirect(new URL("/auth/signin?callbackUrl=/dashboard", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Always allow access to public pages
        if (req.nextUrl.pathname === "/" || 
            req.nextUrl.pathname === "/try" || 
            req.nextUrl.pathname.startsWith("/api/demo") ||
            req.nextUrl.pathname.startsWith("/auth/")) {
          return true
        }
        
        // For protected pages, require authentication
        if (req.nextUrl.pathname === "/dashboard") {
          return !!token
        }
        
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/auth/signin",
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)",
  ]
}