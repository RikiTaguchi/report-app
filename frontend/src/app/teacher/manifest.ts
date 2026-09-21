import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/teacher-app",
    name: "レポートApp 講師",
    short_name: "レポートApp",
    start_url: "/teacher/login",
    scope: "/teacher/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
  };
}
