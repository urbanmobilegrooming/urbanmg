import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Urban Groomer',
  manifest: '/groomer-manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Urban Groomer',
  },
};

export const viewport: Viewport = {
  themeColor: '#1a0a3e',
};

export default function GroomerAppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
