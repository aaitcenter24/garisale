import React from 'react';
import './globals.css';

export const metadata = {
  title: 'Garisale Dealer OS',
  description: 'Dealer Operations Dashboard and Control Hub.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
