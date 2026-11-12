import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'OmniReel AI Studio — Multi-Language Generative Video & SVG/FFmpeg Pipeline',
  description:
    'AI Suggests -> User Decides Video Studio powered by Claude, GPT, Gemini, Kling, Seedance, Hailuo, ElevenLabs, Server-Side SVG Typesetting (VI/KO/EN), and FFmpeg.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <body className="min-h-screen bg-[#060911] text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

