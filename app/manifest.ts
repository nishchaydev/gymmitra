import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "GymMitra",
        short_name: "GymMitra",
        description: "Gym management for Indian gym owners",
        start_url: "/",
        display: "standalone",
        background_color: "#F8FAFC",
        theme_color: "#0066FF",
        icons: [
            { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
            { src: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
            { src: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
        ],
    }
}
