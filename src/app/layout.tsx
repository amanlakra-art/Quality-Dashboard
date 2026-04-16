import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NPD Quality Dashboard — Mosaic Wellness',
  description: 'Quality Metrics for Food & Nutraceuticals · FY 2024–25',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
