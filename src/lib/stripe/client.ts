import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const publicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publicKey) {
      console.error("Stripe public key is missing. Ensure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set.");
      // Return a promise resolving to null or handle appropriately
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(publicKey);
  }
  return stripePromise;
};

export default getStripe;
