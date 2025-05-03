import type {Metadata} from 'next';
import { Inter } from 'next/font/google'; // Use Inter font for clean sans-serif style
import './globals.css';
import { Header } from '@/components/header';
import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/lib/utils";
import { AuthProvider } from '@/providers/auth-provider'; // Import AuthProvider

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans', // Use CSS variable for font
});

export const metadata: Metadata = {
  title: 'ShopEasy - Your Easy Shopping Destination',
  description: 'Browse and shop a variety of products easily.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        <AuthProvider> {/* Wrap content with AuthProvider */}
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            {/* Add a simple footer if desired */}
            {/* <footer className="py-6 md:px-8 md:py-0 border-t">
              <div className="container flex flex-col items-center justify-center gap-4 md:h-24 md:flex-row">
                <p className="text-center text-sm leading-loose text-muted-foreground">
                  © {new Date().getFullYear()} ShopEasy. All rights reserved.
                </p>
              </div>
            </footer> */}
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
