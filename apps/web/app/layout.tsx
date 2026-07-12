import React from 'react';
import { Inter, Outfit, Noto_Sans_Bengali } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const notoBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  weight: ['400', '700'],
  variable: '--font-noto-bengali',
  display: 'swap',
});

export const metadata = {
  title: 'GariSale - Premium Auto Marketplace in Bangladesh',
  description: 'Welcome to the future of automotive sales in Bangladesh. Buy and sell premium vehicles.',
};

import Providers from '../components/providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="bn" 
      className={`${inter.variable} ${outfit.variable} ${notoBengali.variable}`}
    >
      <head>
        {/* Material Symbols Outlined */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block" 
          rel="stylesheet" 
        />
      </head>
      <body className="bg-background text-textPrimary font-sans">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
