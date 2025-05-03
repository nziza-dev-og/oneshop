"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, Mail, Info, ShieldCheck, Twitter, Facebook, Instagram } from 'lucide-react'; // Added social icons

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const linkHover = {
    scale: 1.05,
    color: "hsl(var(--primary))",
    transition: { type: "spring", stiffness: 300 }
  };

  const socialHover = {
    scale: 1.1,
    rotate: 5,
    transition: { type: "spring", stiffness: 400 }
  };

  return (
    <motion.footer
      className="bg-muted/40 border-t mt-auto py-8 md:py-12"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={footerVariants}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo & Description */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <ShoppingBag className="h-7 w-7 text-primary" />
              <span className="text-xl font-bold text-primary">ShopEasy</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Your destination for quality products and easy shopping.
            </p>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h4 className="font-semibold mb-3 text-foreground">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><motion.div whileHover={linkHover}><Link href="/products" className="text-muted-foreground hover:text-primary transition-colors">Products</Link></motion.div></li>
              <li><motion.div whileHover={linkHover}><Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link></motion.div></li>
              <li><motion.div whileHover={linkHover}><Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link></motion.div></li>
              <li><motion.div whileHover={linkHover}><Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">My Account</Link></motion.div></li>
            </ul>
          </div>

          {/* Support */}
          <div className="col-span-1">
            <h4 className="font-semibold mb-3 text-foreground">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><motion.div whileHover={linkHover}><Link href="/faq" className="text-muted-foreground hover:text-primary transition-colors">FAQ</Link></motion.div></li>
              <li><motion.div whileHover={linkHover}><Link href="/shipping" className="text-muted-foreground hover:text-primary transition-colors">Shipping Info</Link></motion.div></li>
              <li><motion.div whileHover={linkHover}><Link href="/returns" className="text-muted-foreground hover:text-primary transition-colors">Returns Policy</Link></motion.div></li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div className="col-span-1">
            <h4 className="font-semibold mb-3 text-foreground">Connect</h4>
            <p className="text-sm text-muted-foreground mb-4">Follow us on social media for updates.</p>
            <div className="flex space-x-4">
                <motion.a whileHover={socialHover} href="#" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><Twitter size={20} /></motion.a>
                <motion.a whileHover={socialHover} href="#" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><Facebook size={20} /></motion.a>
                <motion.a whileHover={socialHover} href="#" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><Instagram size={20} /></motion.a>
            </div>
             <p className="text-sm text-muted-foreground mt-4 flex items-center gap-1">
                <Mail size={14} /> contact@shopeasy.com
            </p>
          </div>
        </div>

        <div className="border-t pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-center text-sm text-muted-foreground">
            © {currentYear} ShopEasy. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0 text-sm">
             <motion.div whileHover={linkHover}><Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></motion.div>
             <motion.div whileHover={linkHover}><Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></motion.div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
