import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/student-app",
    name: "レポートApp 生徒",
    short_name: "レポートApp",
    start_url: "/student/login",
    scope: "/student",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
  };
}
