import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite que MediaPipe cargue WASM desde CDN externo (jsdelivr, googleapis)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Necesario para SharedArrayBuffer / WASM threads en algunos navegadores
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
};

export default nextConfig;
