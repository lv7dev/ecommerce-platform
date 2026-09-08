import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SiteNavigation } from '@/features/navigation/components/site-navigation';
import './globals.css';
import { AppProviders } from './providers';

export const metadata: Metadata = {
  title: 'E-commerce Platform',
  description: 'Composable storefront for the e-commerce platform.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        <AppProviders>
          <SiteNavigation />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
