"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ShoppingBag, Loader2, XCircle } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { fulfillOrder } from '@/actions/orders';

type FulfillmentStatus = 'idle' | 'processing' | 'success' | 'error';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { clearCart } = useCart();

  const [status, setStatus] = useState<FulfillmentStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId || status !== 'idle') {
      if (!sessionId && status === 'idle') {
        setStatus('error');
        setError('No session ID found. Your order cannot be confirmed.');
      }
      return;
    }

    const processOrder = async () => {
      setStatus('processing');
      try {
        const result = await fulfillOrder(sessionId);
        if (result.success) {
          setStatus('success');
          clearCart(); // Clear the cart only on successful order creation
        } else {
          setStatus('error');
          setError(result.error || 'An unknown error occurred while processing your order.');
        }
      } catch (err: any) {
        setStatus('error');
        setError(err.message || 'A critical error occurred.');
        console.error('Order fulfillment failed:', err);
      }
    };

    processOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, status]); // Depend on sessionId and status to run once

  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
            <CardTitle className="mt-4 text-2xl font-bold">Processing Your Order</CardTitle>
            <CardDescription>Please wait while we confirm your payment...</CardDescription>
            <CardContent className="space-y-4 pt-4">
              <p className="text-muted-foreground">
                This should only take a moment. Do not close this page.
              </p>
            </CardContent>
          </>
        );
      case 'success':
        return (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="mt-4 text-2xl font-bold">Payment Successful!</CardTitle>
            <CardDescription>Your order has been confirmed.</CardDescription>
            <CardContent className="space-y-4 pt-4">
              <p className="text-muted-foreground">
                Thank you for your purchase! You can view your order details in your dashboard.
              </p>
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
          </>
        );
      case 'error':
        return (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="mt-4 text-2xl font-bold">Order Confirmation Failed</CardTitle>
            <CardDescription>There was a problem confirming your order.</CardDescription>
            <CardContent className="space-y-4 pt-4">
              <p className="text-destructive text-sm">
                {error}
              </p>
              <p className="text-muted-foreground text-xs">
                Please contact support with your session ID if payment was taken: {sessionId}
              </p>
              <Button variant="outline" asChild>
                <Link href="/">Go to Homepage</Link>
              </Button>
            </CardContent>
          </>
        );
      case 'idle':
      default:
        return null; // Should transition to 'processing' immediately
    }
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12 md:px-6">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          {renderContent()}
        </CardHeader>
      </Card>
    </div>
  );
}
