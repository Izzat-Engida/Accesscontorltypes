export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/profile/:path*", "/documents/:path*", "/admin/:path*", "/leave/:path*"],
};

