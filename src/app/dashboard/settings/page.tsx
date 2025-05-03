"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

// Placeholder component - Replace with actual settings management later
export default function AccountSettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your account password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           {/* Password change form - Implement later */}
           <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" disabled/>
           </div>
            <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" disabled/>
           </div>
           <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" disabled/>
           </div>
          <Button disabled>Update Password</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage your email notification preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           {/* Notification settings - Implement later */}
          <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
            <Label htmlFor="newsletter-switch" className="flex flex-col space-y-1">
                <span>Marketing Emails</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Receive updates about new products and promotions.
                </span>
            </Label>
             <Switch id="newsletter-switch" disabled />
          </div>
           <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
            <Label htmlFor="order-updates-switch" className="flex flex-col space-y-1">
                <span>Order Updates</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Get notified about the status of your orders.
                </span>
            </Label>
             <Switch id="order-updates-switch" disabled defaultChecked/>
          </div>
        </CardContent>
      </Card>

      {/* Add more settings sections like Payment Methods, etc. */}

    </div>
  );
}
