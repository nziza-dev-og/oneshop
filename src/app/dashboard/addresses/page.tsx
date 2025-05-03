"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

// Placeholder component - Replace with actual address management later
export default function AddressesPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Address Book</h1>
        <Button disabled> {/* Feature not implemented yet */}
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Address
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saved Addresses</CardTitle>
          <CardDescription>Manage your shipping and billing addresses.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <p>You have no saved addresses yet.</p>
            <Button variant="link" className="mt-2" disabled> {/* Feature not implemented yet */}
               Add your first address
            </Button>
            {/* Add address listing and forms here later */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
