"use client";

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Users, Target, Eye, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AboutPage() {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number = 1) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
    }),
  };

  const teamMembers = [
    { name: "Alice Johnson", role: "Founder & CEO", image: "https://picsum.photos/seed/alice/300/300", dataAiHint: "woman portrait professional" },
    { name: "Bob Smith", role: "Head of Product", image: "https://picsum.photos/seed/bob/300/300", dataAiHint: "man portrait smiling" },
    { name: "Charlie Brown", role: "Lead Designer", image: "https://picsum.photos/seed/charlie/300/300", dataAiHint: "person portrait creative" },
     { name: "Diana Prince", role: "Marketing Lead", image: "https://picsum.photos/seed/diana/300/300", dataAiHint: "woman portrait confident" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <motion.section
        className="relative bg-gradient-to-b from-primary/10 to-background py-20 md:py-32 text-center overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <motion.h1 variants={fadeIn} custom={1} className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground">
            About ShopEasy
          </motion.h1>
          <motion.p variants={fadeIn} custom={2} className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Making online shopping simple, enjoyable, and reliable for everyone. Discover our story, mission, and the values that drive us.
          </motion.p>
        </div>
          <motion.div
            className="absolute -bottom-1/2 left-0 right-0 h-1/2 bg-gradient-to-t from-background to-transparent z-0"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1 }}
           />
      </motion.section>

      {/* Our Story Section */}
      <section className="container mx-auto px-4 md:px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeIn} custom={0}
          >
            <h2 className="text-3xl font-bold mb-4 text-foreground">Our Story</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              ShopEasy started with a simple idea: shopping online should be effortless and trustworthy. Frustrated by complex websites and uncertain quality, we set out to build a platform where customers could easily find great products from reliable sources.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              From humble beginnings, we've grown into a curated marketplace focused on quality, customer satisfaction, and a seamless user experience. We believe in the power of simplicity and strive to bring you the best products without the hassle.
            </p>
          </motion.div>
          <motion.div
            className="relative h-64 md:h-80 rounded-lg overflow-hidden shadow-lg"
            initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.6 }}
          >
            <Image
              src="https://picsum.photos/seed/teamwork/600/400"
              alt="Team working together"
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 90vw, 45vw"
              data-ai-hint="team working collaboration office"
              priority
            />
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="bg-muted/40 py-16">
        <div className="container mx-auto px-4 md:px-6 grid md:grid-cols-2 gap-12">
           <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeIn} custom={0}>
            <Target className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-2xl font-semibold mb-3 text-foreground">Our Mission</h3>
            <p className="text-muted-foreground leading-relaxed">
              To provide a curated selection of high-quality products with an easy-to-use shopping experience, backed by excellent customer service.
            </p>
          </motion.div>
           <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeIn} custom={1}>
            <Eye className="h-10 w-10 text-accent mb-4" />
            <h3 className="text-2xl font-semibold mb-3 text-foreground">Our Vision</h3>
            <p className="text-muted-foreground leading-relaxed">
              To be the most trusted and user-friendly online marketplace, simplifying the way people shop for everyday needs and unique finds.
            </p>
          </motion.div>
        </div>
      </section>

       {/* Our Values Section */}
      <section className="container mx-auto px-4 md:px-6 py-16">
         <motion.h2
            className="text-3xl font-bold mb-10 text-center text-foreground"
             initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeIn}
        >
            Our Core Values
         </motion.h2>
         <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
             initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} transition={{ staggerChildren: 0.1 }}
        >
            {[
                { icon: Users, title: "Customer First", description: "We prioritize our customers' needs and satisfaction." },
                { icon: ShieldCheck, title: "Integrity", description: "We operate with honesty and transparency." },
                { icon: Sparkles, title: "Quality", description: "We offer products that meet high standards." },
                { icon: Target, title: "Simplicity", description: "We strive for an effortless user experience." },
            ].map((value, index) => (
                 <motion.div key={value.title} variants={fadeIn} custom={index + 1}>
                    <Card className="text-center h-full hover:shadow-md transition-shadow">
                        <CardHeader>
                            <value.icon className="mx-auto h-10 w-10 text-primary mb-3" />
                            <CardTitle className="text-lg">{value.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{value.description}</p>
                        </CardContent>
                    </Card>
                 </motion.div>
            ))}
         </motion.div>
      </section>

      {/* Meet The Team Section (Optional) */}
       <section className="bg-gradient-to-b from-muted/30 to-background py-16">
        <div className="container mx-auto px-4 md:px-6">
          <motion.h2
            className="text-3xl font-bold mb-10 text-center text-foreground"
             initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeIn}
          >
            Meet Our Team
          </motion.h2>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
             initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} transition={{ staggerChildren: 0.1 }}
          >
            {teamMembers.map((member, index) => (
              <motion.div key={member.name} variants={fadeIn} custom={index + 1} className="text-center group">
                <div className="relative h-40 w-40 md:h-48 md:w-48 mx-auto rounded-full overflow-hidden mb-4 border-4 border-transparent group-hover:border-primary transition-all duration-300 shadow-lg">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="15vw"
                     data-ai-hint={member.dataAiHint}
                  />
                </div>
                <h4 className="font-semibold text-lg text-foreground">{member.name}</h4>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
