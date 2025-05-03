"use client";

import { motion } from 'framer-motion';
import { Truck, Clock, MapPin, Package } from 'lucide-react';
import { Button } from '@/components/ui/button'; 
import Link from 'next/link'; // ✅ Use this instead

export default function ShippingInfoPage() {
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
          <Truck className="mx-auto h-12 w-12 text-primary mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Shipping Information</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Details about our shipping process, options, and costs.
          </p>
        </motion.div>

      <motion.div
        className="max-w-3xl mx-auto space-y-8"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        custom={1}
      >
        {/* Shipping Options */}
        <div className="p-6 border rounded-lg bg-card shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><Package className="h-6 w-6 text-primary" /> Shipping Options</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong>Standard Shipping:</strong> Typically arrives in 3-5 business days. Cost calculated at checkout based on weight and destination.</li>
            <li><strong>Expedited Shipping:</strong> Typically arrives in 1-2 business days. Available for an additional fee.</li>
            <li>Orders are processed within 1-2 business days (excluding weekends and holidays).</li>
          </ul>
        </div>

        {/* Shipping Area */}
        <div className="p-6 border rounded-lg bg-card shadow-sm">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><MapPin className="h-6 w-6 text-primary" /> Shipping Area</h2>
            <p className="text-muted-foreground">
                Currently, ShopEasy ships only to addresses within the <strong>United States</strong>. We do not offer international shipping at this time, but we hope to expand in the future.
            </p>
        </div>

         {/* Tracking */}
        <div className="p-6 border rounded-lg bg-card shadow-sm">
           <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><Clock className="h-6 w-6 text-primary" /> Order Tracking</h2>
           <p className="text-muted-foreground">
               Once your order has shipped, you will receive an email notification containing your tracking number. You can use this number to track your package via the carrier's website. You can also find tracking information in your account dashboard under 'My Orders'.
           </p>
        </div>

         {/* Notes */}
        <div className="p-6 border rounded-lg bg-muted/50">
           <h3 className="text-xl font-semibold mb-3">Important Notes</h3>
           <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
              <li>Shipping times are estimates and may vary due to carrier delays or unforeseen circumstances.</li>
              <li>We are not responsible for delays caused by incorrect shipping addresses provided by the customer.</li>
              <li>Shipping costs are non-refundable unless the return is due to our error.</li>
           </ul>
        </div>
      </motion.div>

      <motion.div
        className="mt-12 text-center text-muted-foreground"
        initial="hidden" animate="visible" variants={fadeIn} custom={2}
       >
        <p>Have more questions about shipping?</p>
        <Button variant="link" asChild className="text-primary mt-1">
          <Link href="/contact">Contact Us</Link>
        </Button>
      </motion.div>
    </div>
  );
}
