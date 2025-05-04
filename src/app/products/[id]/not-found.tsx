
import { Button } from '@/components/ui/button';
import { PackageX } from 'lucide-react';
import Link from 'next/link';

export default function ProductNotFound() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-15rem)] flex-col items-center justify-center space-y-6 px-4 py-12 text-center md:px-6">
      <PackageX className="h-20 w-20 text-muted-foreground" />
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Product Not Found
      </h1>
      <p className="max-w-md text-muted-foreground">
        Oops! The product you are looking for doesn't exist or may have been removed.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/products">Browse Products</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </div>
  );
}
