"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

// Placeholder component - Replace with actual wishlist management later
export default function WishlistPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Wishlist</h1>

      <Card>
        <CardHeader>
          <CardTitle>Your Saved Items</CardTitle>
          <CardDescription>Items you've added to your wishlist.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
             <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p>Your wishlist is currently empty.</p>
            <p className="text-sm">Start adding items you love!</p>
            {/* Add wishlist item listing here later */}
             <Button variant="link" className="mt-4" asChild>
                <a href="/">Continue Shopping</a>
             </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
