"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft } from 'lucide-react';

export default function CheckoutCancelPage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12 md:px-6">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold">Checkout Cancelled</CardTitle>
          <CardDescription>Your checkout process was cancelled.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your order was not completed. Your cart items are still saved if you'd like to try again.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button variant="outline" asChild>
               {/* Ideally, open the cart sheet or go to cart page */}
              <Link href="/">
                 <ArrowLeft className="mr-2 h-4 w-4" /> Back to Shopping
              </Link>
            </Button>
             {/* Add a button to retry checkout if needed */}
            {/* <Button>Retry Checkout</Button> */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
