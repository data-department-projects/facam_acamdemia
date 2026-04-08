import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
});

/**
 * Favicon : `icon.tsx` / `apple-icon.tsx` composent le logo officiel (`public/Facam Academia-02-02 2.png`) en tuile carrée.
 */
export const metadata: Metadata = {
  title: 'FACAM ACADEMIA',
  description:
    'Plateforme e-learning dédiée aux jeunes diplômés - formations industrielles (maintenance, production, QHSE).',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={montserrat.variable}>
      <body className="font-montserrat antialiased">{children}</body>
    </html>
  );
}
