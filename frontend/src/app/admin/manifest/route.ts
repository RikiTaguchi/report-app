import { NextResponse } from "next/server";

export async function GET() {
 return NextResponse.json(
   {
     id: "/admin-app",
     name: "レポートApp 管理者",
     short_name: "レポートApp",
     start_url: "/admin/login",
     scope: "/admin/",
     display: "standalone",
     background_color: "#ffffff",
     theme_color: "#ffffff",
     icons: [
       { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
       { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
       {
         src: "/icons/icon-512-maskable.png",
         sizes: "512x512",
         type: "image/png",
         purpose: "maskable",
       },
     ],
   },
   {
     headers: {
       "Content-Type": "application/manifest+json; charset=utf-8",
       "Cache-Control": "public, max-age=3600",
     },
   }
 );
}
