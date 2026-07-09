import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Xitique Fácil',
    short_name: 'Xitique',
    description: 'App de gestão de poupança rotativa (Xitique)',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0f0f1a',
    theme_color: '#22c55e',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
