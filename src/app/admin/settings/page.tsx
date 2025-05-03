"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

// Placeholder component - Replace with actual settings management later
export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Settings</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Store Settings</CardTitle>
          <CardDescription>Configure basic store information and settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           {/* Example settings - Implement later */}
           <div className="space-y-2">
                <Label htmlFor="store-name">Store Name</Label>
                <Input id="store-name" placeholder="ShopEasy" disabled/>
           </div>
            <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
                <Label htmlFor="maintenance-switch" className="flex flex-col space-y-1">
                    <span>Maintenance Mode</span>
                    <span className="font-normal leading-snug text-muted-foreground">
                    Temporarily disable customer access to the storefront.
                    </span>
                </Label>
                <Switch id="maintenance-switch" disabled />
            </div>
          <Button disabled>Save Changes</Button>
        </CardContent>
      </Card>

       <Card className="mb-6">
        <CardHeader>
          <CardTitle>Admin Management</CardTitle>
          <CardDescription>Manage admin user accounts and roles.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Admin user management can be done via the <a href="/admin/users" className="text-primary underline">Manage Users</a> page.</p>
           {/* Potentially add specific admin settings here later */}
        </CardContent>
      </Card>


      {/* Add more settings sections like Shipping, Payments, etc. */}

    </div>
  );
}
