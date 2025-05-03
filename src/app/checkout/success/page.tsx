"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ShoppingBag } from 'lucide-react';
import { useCart } from '@/hooks/useCart'; // Import useCart to clear it

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { clearCart } = useCart();

  // Clear the cart when the success page loads
  // Note: This assumes the payment was successful. For robustness,
  // confirm payment status via webhook or session retrieval before clearing.
  useEffect(() => {
    if (sessionId) {
        // Consider verifying the session server-side before clearing cart in production
        console.log("Checkout successful, clearing cart for session:", sessionId);
        clearCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]); // Run only when sessionId changes (typically once on load)


  return (
    <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12 md:px-6">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold">Payment Successful!</CardTitle>
          <CardDescription>Your order has been placed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Thank you for your purchase! You can view your order details in your dashboard.
          </p>
          {sessionId && (
            <p className="text-xs text-muted-foreground">
              Session ID: {sessionId.substring(0, 10)}...
            </p>
          )}
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button asChild>
              <Link href="/dashboard/orders">
                <ShoppingBag className="mr-2 h-4 w-4" /> View Orders
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Continue Shopping</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
