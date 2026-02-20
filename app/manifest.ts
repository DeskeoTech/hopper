import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hopper by Deskeo",
    short_name: "Hopper",
    description: "Espaces de coworking Hopper by Deskeo",
    start_url: "/compte",
    display: "standalone",
    background_color: "#F2E7DC",
    theme_color: "#1B1918",
    icons: [
      {
        src: "/favicon/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/favicon/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/favicon/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  }
}
