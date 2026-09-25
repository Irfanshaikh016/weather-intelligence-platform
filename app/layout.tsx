import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'Weather Intelligence & Analytics Platform',
  description: 'Enterprise meteorological analytics, high-frequency historical observation tracking, and automated forecasting system powered by Vercel and Supabase.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark bg-neutral-950 text-neutral-100 antialiased">
      <body className={`${inter.className} min-h-screen bg-neutral-950 text-neutral-100 selection:bg-cyan-500 selection:text-neutral-950`}>
        {children}
      </body>
    </html>
  );
}
