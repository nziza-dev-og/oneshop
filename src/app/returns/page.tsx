"use client";

import { motion } from 'framer-motion';
import { Undo2, PackageCheck, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ReturnsPolicyPage() {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number = 1) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
    }),
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-6 lg:py-16">
       <motion.div
          className="text-center mb-12 md:mb-16"
          initial="hidden" animate="visible" variants={fadeIn}
        >
          <Undo2 className="mx-auto h-12 w-12 text-primary mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Returns & Refunds Policy</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Information about returning items purchased from ShopEasy.
          </p>
        </motion.div>

      <motion.div
        className="max-w-3xl mx-auto space-y-8"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        custom={1}
      >
        {/* Eligibility */}
        <div className="p-6 border rounded-lg bg-card shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><PackageCheck className="h-6 w-6 text-primary" /> Eligibility for Returns</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Most new, unopened items sold and shipped by ShopEasy can be returned within <strong>30 days</strong> of delivery for a full refund.</li>
            <li>Items must be in their original condition, with tags and packaging intact.</li>
            <li>Items that are damaged, used, or not in a resalable condition may not be eligible for a refund or may be subject to a restocking fee.</li>
          </ul>
        </div>

        {/* Non-Returnable Items */}
        <div className="p-6 border rounded-lg bg-card shadow-sm">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><XCircle className="h-6 w-6 text-destructive" /> Non-Returnable Items</h2>
            <p className="text-muted-foreground mb-2">Certain items cannot be returned, including:</p>
             <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                <li>Gift cards</li>
                <li>Downloadable software products</li>
                <li>Some health and personal care items</li>
                <li>Items marked as 'Final Sale' or 'Non-Returnable'</li>
             </ul>
        </div>

         {/* How to Return */}
        <div className="p-6 border rounded-lg bg-card shadow-sm">
           <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><Undo2 className="h-6 w-6 text-primary" /> How to Initiate a Return</h2>
           <p className="text-muted-foreground mb-3">
               To start a return, please log in to your account and go to the 'My Orders' section. Select the order containing the item(s) you wish to return and follow the instructions.
           </p>
            <p className="text-muted-foreground">
               If you checked out as a guest or need assistance, please <Link href="/contact" className="text-primary hover:underline">contact our support team</Link> with your order number and details about the product you would like to return.
           </p>
        </div>

         {/* Refunds */}
         <div className="p-6 border rounded-lg bg-muted/50">
           <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><Clock className="h-6 w-6 text-primary" /> Refunds Process</h2>
           <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
              <li>Once we receive and inspect your return (usually within 3-5 business days of receipt), we will process your refund.</li>
              <li>Refunds will be issued to the original payment method.</li>
              <li>Please allow an additional 5-10 business days for the refund to reflect in your account, depending on your bank or card issuer.</li>
              <li>We will cover return shipping costs if the return is due to our error (e.g., incorrect or defective item). Otherwise, the customer is responsible for return shipping costs.</li>
           </ul>
        </div>
      </motion.div>

       <motion.div
        className="mt-12 text-center text-muted-foreground"
        initial="hidden" animate="visible" variants={fadeIn} custom={2}
       >
        <p>If you have any questions about our returns policy,</p>
        <Button variant="link" asChild className="text-primary mt-1">
          <Link href="/contact">please contact us.</Link>
        </Button>
      </motion.div>
    </div>
  );
}
