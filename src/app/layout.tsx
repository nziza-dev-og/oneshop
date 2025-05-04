import type {Metadata} from 'next';
import { Inter } from 'next/font/google'; // Use Inter font for clean sans-serif style
import './globals.css';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer'; // Import Footer
import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/lib/utils";
import { AuthProvider } from '@/providers/auth-provider'; // Import AuthProvider
// Removed chatbot import

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
          "min-h-screen bg-background font-sans antialiased flex flex-col", // Ensure body is flex-col
          inter.variable
        )}
      >
        <AuthProvider> {/* Wrap content with AuthProvider */}
          <Header />
          <main className="flex-1">{children}</main>
          <Footer /> {/* Add Footer here */}
          {/* Removed Chatbot component */}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
