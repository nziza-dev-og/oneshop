
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/firebase'; // db might be null
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/providers/auth-provider';
import Link from 'next/link'; // Import Link


interface StoreSettings {
  storeName: string;
  maintenanceMode: boolean;
}

const defaultSettings: StoreSettings = {
  storeName: 'ShopEasy',
  maintenanceMode: false
};

export default function AdminSettingsPage() {
    const { isAdmin, loading: authLoading } = useAuth();
    const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    // Fetch settings on mount
    useEffect(() => {
        // Wait for auth check and ensure user is admin and db is available
        if (authLoading) {
            return; // Still waiting for auth status
        }
        if (!isAdmin) {
            setLoading(false); // Not admin, stop loading
            return;
        }
        if (!db) {
             setLoading(false);
             toast({ title: "Error", description: "Database service unavailable.", variant: "destructive" });
             return;
        }

        const fetchSettings = async () => {
            setLoading(true);
            const settingsRef = doc(db, 'storeConfig', 'settings'); // Use a specific doc for store settings
            try {
                const docSnap = await getDoc(settingsRef);
                if (docSnap.exists()) {
                    // If settings exist, use them, merging with defaults just in case
                    const fetchedData = docSnap.data() as Partial<StoreSettings>;
                    setSettings({ ...defaultSettings, ...fetchedData });
                } else {
                    // If settings don't exist, use defaults and save them
                    console.log("No settings found, initializing with defaults.");
                    setSettings(defaultSettings); // Use default state
                    await setDoc(settingsRef, defaultSettings); // Save default settings to Firestore
                }
            } catch (error) {
                console.error("Error fetching store settings:", error);
                toast({ title: "Error", description: "Could not load store settings.", variant: "destructive" });
                 setSettings(defaultSettings); // Revert to defaults on error
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
        // Removed `settings` from dependencies to avoid infinite loop
        // Added authLoading, isAdmin to ensure effect runs correctly based on auth state
    }, [isAdmin, authLoading, toast]);

    const handleSaveSettings = async () => {
        if (!isAdmin || !db) return;
        setSaving(true);
        const settingsRef = doc(db, 'storeConfig', 'settings');
        try {
            await setDoc(settingsRef, settings, { merge: true }); // Use merge to only update provided fields
            toast({ title: "Settings Saved", description: "Store settings updated successfully." });
        } catch (error) {
            console.error("Error saving store settings:", error);
            toast({ title: "Save Failed", description: "Could not save store settings.", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSwitchChange = (checked: boolean) => {
        setSettings(prev => ({ ...prev, maintenanceMode: checked }));
    };

    // Show skeleton while either auth or settings data is loading
    if (authLoading || loading) {
        return (
             <div className="space-y-6">
                 <Skeleton className="h-8 w-1/3 mb-6" />
                 <Skeleton className="h-64 w-full" />
                 <Skeleton className="h-32 w-full" />
            </div>
        );
    }

    // If auth loaded but user is not admin
    if (!isAdmin) {
        return <div className="text-center text-muted-foreground p-6">Access Denied. You must be an admin to view this page.</div>;
    }

    // If db is unavailable after loading checks
    if (!db) {
         return <div className="text-center text-destructive p-6">Database service is unavailable. Cannot load settings.</div>;
    }


  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Admin Settings</h1>

      <Card className="mb-6 shadow-md">
        <CardHeader>
          <CardTitle>Store Settings</CardTitle>
          <CardDescription>Configure basic store information and settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="space-y-2">
                <Label htmlFor="storeName">Store Name</Label>
                <Input
                    id="storeName"
                    name="storeName" // Add name attribute for handler
                    placeholder="ShopEasy"
                    value={settings.storeName}
                    onChange={handleInputChange}
                    disabled={saving}
                 />
           </div>
            <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg shadow-inner bg-muted/30">
                <Label htmlFor="maintenanceMode" className="flex flex-col space-y-1 cursor-pointer">
                    <span>Maintenance Mode</span>
                    <span className="font-normal leading-snug text-muted-foreground">
                    Temporarily disable customer access to the storefront.
                    </span>
                </Label>
                <Switch
                    id="maintenanceMode"
                    checked={settings.maintenanceMode}
                    onCheckedChange={handleSwitchChange}
                    disabled={saving}
                    aria-label="Toggle Maintenance Mode"
                />
            </div>
          <Button onClick={handleSaveSettings} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

       <Card className="mb-6 shadow-md">
        <CardHeader>
          <CardTitle>Admin Management</CardTitle>
          <CardDescription>Manage admin user accounts and roles.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Admin user management, including assigning roles, can be done via the <Link href="/admin/users" className="text-primary underline hover:text-primary/80">Manage Users</Link> page.</p>
           {/* Potentially add specific admin settings here later, like API keys */}
        </CardContent>
      </Card>


      {/* Add more settings sections like Shipping, Payments, etc. */}

    </div>
  );
}
