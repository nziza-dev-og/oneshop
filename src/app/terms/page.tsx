"use client";

import { motion } from 'framer-motion';
import { ScrollText, Gavel, UserCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function TermsOfServicePage() {
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
          <ScrollText className="mx-auto h-12 w-12 text-primary mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Terms of Service</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Please read these terms carefully before using ShopEasy.
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
          <h2 className="text-2xl font-semibold mb-3 text-foreground flex items-center gap-2"><Gavel className="h-6 w-6 text-primary" /> 1. Acceptance of Terms</h2>
          <p>
            By accessing or using the ShopEasy website and services (collectively, the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all of these Terms, do not use the Service.
          </p>
        </section>

         <section>
          <h2 className="text-2xl font-semibold mb-3 text-foreground flex items-center gap-2"><UserCircle className="h-6 w-6 text-primary" /> 2. User Accounts</h2>
           <p className="mb-2">
             To access certain features, you may need to register for an account. You agree to:
           </p>
           <ul className="list-disc list-inside space-y-1 ml-4 mb-2 text-sm">
             <li>Provide accurate, current, and complete information during registration.</li>
             <li>Maintain the security of your password and accept all risks of unauthorized access to your account.</li>
             <li>Promptly notify us if you discover or suspect any security breaches related to the Service.</li>
           </ul>
            <p>You are responsible for all activities that occur under your account.</p>
        </section>

         <section>
           <h2 className="text-2xl font-semibold mb-3 text-foreground">3. Use of the Service</h2>
           <p className="mb-2">You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                <li>Use the Service in any way that violates any applicable federal, state, local, or international law or regulation.</li>
                <li>Engage in any conduct that restricts or inhibits anyone's use or enjoyment of the Service, or which, as determined by us, may harm ShopEasy or users of the Service.</li>
                <li>Attempt to gain unauthorized access to, interfere with, damage, or disrupt any parts of the Service, the server on which the Service is stored, or any server, computer, or database connected to the Service.</li>
            </ul>
        </section>

         <section>
           <h2 className="text-2xl font-semibold mb-3 text-foreground">4. Purchases and Payments</h2>
           <p>
             All purchases made through the Service are subject to our pricing and payment terms. Prices are subject to change without notice. We use Stripe for payment processing; by making a purchase, you agree to Stripe's terms and conditions. Please review our <Link href="/returns" className="text-primary hover:underline">Return Policy</Link> for information on returns and refunds.
           </p>
        </section>

        <section>
            <h2 className="text-2xl font-semibold mb-3 text-foreground">5. Intellectual Property</h2>
            <p>
                The Service and its entire contents, features, and functionality (including but not limited to all information, software, text, displays, images, video, and audio, and the design, selection, and arrangement thereof) are owned by ShopEasy, its licensors, or other providers of such material and are protected by copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
            </p>
        </section>

        <section>
            <h2 className="text-2xl font-semibold mb-3 text-foreground flex items-center gap-2"><XCircle className="h-6 w-6 text-destructive" /> 6. Disclaimer of Warranties & Limitation of Liability</h2>
            <p className="mb-2">
                The Service is provided on an "AS IS" and "AS AVAILABLE" basis. ShopEasy makes no warranties, express or implied, regarding the Service.
            </p>
             <p>
                To the fullest extent permitted by law, ShopEasy shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
            </p>
        </section>

         <section>
           <h2 className="text-2xl font-semibold mb-3 text-foreground">7. Governing Law</h2>
           <p>
             These Terms shall be governed by and construed in accordance with the laws of the State of [Your State/Jurisdiction, e.g., California], without regard to its conflict of law principles.
           </p>
        </section>

         <section>
           <h2 className="text-2xl font-semibold mb-3 text-foreground">8. Changes to Terms</h2>
           <p>
             We reserve the right to modify these Terms at any time. We will notify you of changes by posting the new Terms on this page and updating the "Last Updated" date. Your continued use of the Service after any modification constitutes your acceptance of the new Terms.
           </p>
        </section>

         <section>
           <h2 className="text-2xl font-semibold mb-3 text-foreground">9. Contact Us</h2>
           <p>
             If you have any questions about these Terms, please <Link href="/contact" className="text-primary hover:underline">contact us</Link>.
           </p>
        </section>

      </motion.div>
    </div>
  );
}
