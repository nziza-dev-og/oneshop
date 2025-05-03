"use client";

import { motion } from 'framer-motion';
import { Shield, UserCheck, Database, Mail } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
          <Shield className="mx-auto h-12 w-12 text-primary mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
          </p>
           <p className="text-xs text-muted-foreground mt-2">Last Updated: {new Date().toLocaleDateString()}</p>
        </motion.div>

      <motion.div
        className="max-w-3xl mx-auto space-y-8 text-muted-foreground leading-relaxed"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        custom={1}
      >
        <section>
          <h2 className="text-2xl font-semibold mb-3 text-foreground flex items-center gap-2"><UserCheck className="h-6 w-6 text-primary" /> Information We Collect</h2>
          <p className="mb-2">We collect information you provide directly to us, such as when you create an account, place an order, or contact customer support. This may include:</p>
          <ul className="list-disc list-inside space-y-1 ml-4 mb-2 text-sm">
            <li>Name and contact details (email, address, phone number)</li>
            <li>Payment information (processed securely by Stripe, not stored by us)</li>
            <li>Order history and preferences</li>
            <li>Communications with us</li>
          </ul>
           <p>We also automatically collect certain information when you visit our site, such as your IP address, browser type, device information, and browsing activity (using cookies and similar technologies).</p>
        </section>

         <section>
          <h2 className="text-2xl font-semibold mb-3 text-foreground flex items-center gap-2"><Database className="h-6 w-6 text-primary" /> How We Use Your Information</h2>
          <p className="mb-2">We use the information we collect to:</p>
           <ul className="list-disc list-inside space-y-1 ml-4 mb-2 text-sm">
             <li>Process and fulfill your orders</li>
             <li>Communicate with you about your orders and account</li>
             <li>Provide customer support</li>
             <li>Improve and personalize our website and services</li>
             <li>Send marketing communications (if you opt-in)</li>
             <li>Prevent fraud and ensure security</li>
             <li>Comply with legal obligations</li>
           </ul>
        </section>

         <section>
           <h2 className="text-2xl font-semibold mb-3 text-foreground flex items-center gap-2"><Shield className="h-6 w-6 text-primary" /> Data Security</h2>
           <p>
             We implement reasonable security measures to protect your personal information from unauthorized access, use, or disclosure. However, no internet transmission is completely secure, and we cannot guarantee absolute security. Payment information is handled by our secure payment processor (Stripe).
           </p>
        </section>

         <section>
           <h2 className="text-2xl font-semibold mb-3 text-foreground">Third-Party Services</h2>
           <p>
             We use third-party services like Firebase for authentication and database management, and Stripe for payment processing. These services have their own privacy policies governing how they handle your data. We do not sell your personal information to third parties.
           </p>
        </section>

         <section>
           <h2 className="text-2xl font-semibold mb-3 text-foreground">Your Choices</h2>
            <p className="mb-2">You have choices regarding your personal information:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-2 text-sm">
                <li>You can access and update your account information through your dashboard.</li>
                <li>You can opt-out of marketing emails by clicking the 'unsubscribe' link.</li>
                <li>You can manage cookie preferences through your browser settings.</li>
                <li>You may request deletion of your account by contacting us (subject to legal retention requirements).</li>
            </ul>
        </section>

         <section>
           <h2 className="text-2xl font-semibold mb-3 text-foreground flex items-center gap-2"><Mail className="h-6 w-6 text-primary" /> Contact Us</h2>
           <p>
             If you have any questions about this Privacy Policy, please <Link href="/contact" className="text-primary hover:underline">contact us</Link>.
           </p>
        </section>

      </motion.div>
    </div>
  );
}
