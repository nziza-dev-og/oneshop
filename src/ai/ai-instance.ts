'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  promptDir: './prompts', // Keep promptDir if you plan to use external .prompt files
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
      // Optional: Specify API version if needed, e.g., apiVersion: 'v1beta'
    }),
  ],
  logLevel: 'debug', // Set log level for development
  // Use a model suitable for chat, gemini-2.0-flash is a good starting point
  // You could also specify it per-flow/prompt if needed.
  // model: 'googleai/gemini-1.5-flash-latest', // Example alternative
});
