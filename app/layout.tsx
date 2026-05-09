import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const inter = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'JobPilot — Automate Your Job Search',
  description:
    'JobPilot automatically searches for jobs daily, tracks your applications, and sends email digests. Focus on preparing, not searching.',
  keywords: ['job tracker', 'job search', 'automated', 'career', 'applications'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#08080f] text-[#e0e0f0]">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
