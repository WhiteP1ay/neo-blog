import type { MetadataRoute } from 'next';

const SHORTCUT_ICONS: MetadataRoute.Manifest['icons'] = [
  {
    src: '/icon-192.png',
    sizes: '192x192',
    type: 'image/png',
  },
];

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'White Meta',
    short_name: 'White Meta',
    description: 'White Meta is a blog for whitePlay',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#ffffff',
    theme_color: '#353535',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: '首页',
        short_name: '首页',
        url: '/',
        icons: SHORTCUT_ICONS,
      },
      {
        name: '管理',
        short_name: '管理',
        url: '/admin',
        icons: SHORTCUT_ICONS,
      },
    ],
  };
}
