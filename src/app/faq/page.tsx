"use client";

import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Import Button component
import Link from 'next/link'; // Import Link component

const faqs = [
  {
    question: "What are your shipping options?",
    answer: "We offer standard (3-5 business days) and expedited (1-2 business days) shipping within the US. Shipping costs vary based on location and order weight."
  },
  {
    question: "What is your return policy?",
    answer: "You can return most new, unopened items within 30 days of delivery for a full refund. We'll also pay the return shipping costs if the return is a result of our error (you received an incorrect or defective item, etc.). Please visit our Returns page for more details."
  },
  {
    question: "How can I track my order?",
    answer: "Once your order ships, you will receive an email confirmation with a tracking number. You can use this number on the carrier's website or log into your ShopEasy account under 'My Orders' to track your package."
  },
  {
    question: "Do you ship internationally?",
    answer: "Currently, we only ship within the United States. We are working on expanding our shipping capabilities in the future."
  },
  {
    question: "How do I contact customer support?",
    answer: "You can reach our customer support team via the contact form on our Contact Us page, by emailing support@shopeasy.com, or by calling us during business hours. We aim to respond within 24 hours."
  },
   {
    question: "What payment methods do you accept?",
    answer: "We accept major credit cards (Visa, MasterCard, American Express, Discover) and payments through Stripe."
  },
];

export default function FAQPage() {
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
          <HelpCircle className="mx-auto h-12 w-12 text-primary mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about shopping with ShopEasy.
          </p>
        </motion.div>

      <motion.div
        className="max-w-3xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        custom={1}
      >
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border-b border-border/50">
              <AccordionTrigger className="text-left font-semibold text-lg py-4 hover:text-primary transition-colors">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>

      <motion.div
        className="mt-12 text-center text-muted-foreground"
        initial="hidden" animate="visible" variants={fadeIn} custom={2}
       >
        <p>Can't find the answer you're looking for?</p>
        <Button variant="link" asChild className="text-primary mt-1">
          <Link href="/contact">Contact Support</Link>
        </Button>
      </motion.div>
    </div>
  );
}
