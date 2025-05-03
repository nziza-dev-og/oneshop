import Link from 'next/link';
import { ShoppingBag } from 'lucide-react'; // Using ShoppingBag for logo
import { CartSheet } from '@/components/cart-sheet';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <ShoppingBag className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-primary">ShopEasy</span>
        </Link>
        <CartSheet />
      </div>
    </header>
  );
}
