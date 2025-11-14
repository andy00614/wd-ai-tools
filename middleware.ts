import { type NextRequest, NextResponse } from "next/server";
import { getAuthInstance as getAuth } from "@/modules/auth/utils/auth-utils";

export async function middleware(request: NextRequest) {
    try {
        console.log("=== Middleware triggered ===");
        console.log("Request URL:", request.url);
        console.log("Request path:", request.nextUrl.pathname);

        // Log all cookies
        const cookies = request.cookies.getAll();
        console.log("Cookies:", cookies);

        const auth = await getAuth();
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        console.log("Session result:", JSON.stringify(session, null, 2));

        const isLoginPage = request.nextUrl.pathname.startsWith("/login");
        const isSignupPage = request.nextUrl.pathname.startsWith("/signup");
        const isDashboardPage =
            request.nextUrl.pathname.startsWith("/dashboard");

        // If user is logged in and trying to access login/signup, redirect to dashboard
        if (session && (isLoginPage || isSignupPage)) {
            console.log(
                "✅ User already logged in, redirecting to /dashboard/knowledge",
            );
            return NextResponse.redirect(
                new URL("/dashboard/knowledge", request.url),
            );
        }

        // If user is not logged in and trying to access dashboard, redirect to login
        if (!session && isDashboardPage) {
            console.log("❌ No session found, redirecting to /login");
            return NextResponse.redirect(new URL("/login", request.url));
        }

        console.log("✅ Allowing access");
        return NextResponse.next();
    } catch (error) {
        console.error("❌ Middleware error:", error);
        return NextResponse.redirect(new URL("/login", request.url));
    }
}

export const config = {
    matcher: [
        "/dashboard/:path*", // Protects /dashboard and all sub-routes
        "/login", // Redirect logged-in users away from login
        "/signup", // Redirect logged-in users away from signup
    ],
};
