import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    "/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)",
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // Get hostname (e.g. platanitos.com, tu-tienda.vestido.shop, localhost:3000)
  const hostname = req.headers.get("host") || "localhost:3000";

  // Do NOT rewrite to _sites (user uses direct domain detection)
  const response = NextResponse.next();
  
  // Passing hostname as a header for backends/logic to use if needed
  response.headers.set("x-ms-domain", hostname);
  
  return response;
}
