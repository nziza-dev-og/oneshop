'use server';
/**
 * @fileOverview A simple chatbot flow using Genkit.
 *
 * - chatWithBot - A function that handles the chatbot conversation.
 * - ChatbotInput - The input type for the chatWithBot function.
 * - ChatbotOutput - The return type for the chatWithBot function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

// Define the input schema for the chatbot flow
const ChatbotInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    text: z.string(),
  })).describe("The conversation history between the user and the bot."),
  message: z.string().describe('The latest message from the user.'),
});
export type ChatbotInput = z.infer<typeof ChatbotInputSchema>;

// Define the output schema for the chatbot flow
const ChatbotOutputSchema = z.object({
  response: z.string().describe('The chatbot\'s response to the user message.'),
});
export type ChatbotOutput = z.infer<typeof ChatbotOutputSchema>;


// Define the prompt for the chatbot
const chatbotPrompt = ai.definePrompt({
  name: 'chatbotPrompt',
  input: { schema: ChatbotInputSchema },
  output: { schema: ChatbotOutputSchema },
  prompt: `You are a helpful assistant for the ShopEasy e-commerce website. Keep your responses concise and focused on helping users with shopping, product questions, orders, and general site navigation.

Here is the conversation history:
{{#each history}}
{{role}}: {{text}}
{{/each}}

User: {{{message}}}
Model:`,
});


// Define the Genkit flow for the chatbot
const chatbotFlow = ai.defineFlow<typeof ChatbotInputSchema, typeof ChatbotOutputSchema>(
  {
    name: 'chatbotFlow',
    inputSchema: ChatbotInputSchema,
    outputSchema: ChatbotOutputSchema,
  },
  async (input) => {

     const { output } = await chatbotPrompt({
        ...input,
        // Combine the new message with the history for the prompt
        history: [...input.history, { role: 'user', text: input.message }],
     });

    if (!output?.response) {
        // Handle cases where the model might not return a response
        return { response: "Sorry, I couldn't generate a response. Please try again." };
    }

     // Return the model's response text
     return { response: output.response };
  }
);

// Exported wrapper function to call the flow
export async function chatWithBot(input: ChatbotInput): Promise<ChatbotOutput> {
    return chatbotFlow(input);
}
