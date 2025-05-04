'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { MessageSquare, Send, Loader2, Bot, User, X } from 'lucide-react';
import { chatWithBot, ChatbotInput, ChatbotOutput } from '@/ai/flows/chatbot-flow'; // Adjust path if necessary
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
        const scrollElement = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (scrollElement) {
            scrollElement.scrollTop = scrollElement.scrollHeight;
        }
    }
  }, [messages]);

   // Focus input when sheet opens
   useEffect(() => {
        if (isOpen) {
            // Timeout needed to allow sheet animation to complete
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const flowInput: ChatbotInput = {
        // Provide appropriate history - limit length if necessary
        history: messages.slice(-10), // Send last 10 messages as history
        message: userMessage.text,
      };
      const result: ChatbotOutput = await chatWithBot(flowInput);
      const botMessage: ChatMessage = { role: 'model', text: result.response };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
       setMessages((prev) => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
      toast({
        title: "Chatbot Error",
        description: "Could not get a response from the bot.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
       // Refocus input after response or error
        requestAnimationFrame(() => {
            inputRef.current?.focus();
        });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <>
        {/* Chat Button */}
        <Button
            variant="outline"
            size="icon"
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 z-50"
            onClick={() => setIsOpen(true)}
            aria-label="Open Chat"
        >
            <MessageSquare className="h-7 w-7" />
        </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        {/* <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg"
            aria-label="Open Chat"
           >
            <MessageSquare />
          </Button>
        </SheetTrigger> */}
        <SheetContent className="w-[400px] sm:w-[440px] flex flex-col p-0">
            <SheetHeader className="px-6 py-4 border-b">
                <SheetTitle className="flex items-center gap-2 text-lg">
                    <Bot className="h-5 w-5 text-primary"/> ShopEasy Assistant
                </SheetTitle>
                 {/* Close button is handled by SheetContent */}
            </SheetHeader>

          <ScrollArea className="flex-grow p-6" ref={scrollAreaRef}>
            <div className="space-y-4">
               {/* Initial message from bot */}
               {messages.length === 0 && (
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 border">
                        {/* <AvatarImage src="/bot-avatar.png" alt="Bot" /> */}
                        <AvatarFallback><Bot size={16}/></AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg p-3 text-sm max-w-[80%]">
                        Welcome to ShopEasy! How can I help you today?
                    </div>
                </div>
               )}
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-start gap-3",
                    msg.role === 'user' ? 'justify-end' : ''
                  )}
                >
                  {msg.role === 'model' && (
                     <Avatar className="h-8 w-8 border">
                        {/* <AvatarImage src="/bot-avatar.png" alt="Bot" /> */}
                         <AvatarFallback><Bot size={16}/></AvatarFallback>
                     </Avatar>
                  )}
                  <div
                    className={cn(
                      "rounded-lg p-3 text-sm max-w-[80%]",
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    )}
                  >
                    {msg.text}
                  </div>
                   {msg.role === 'user' && (
                     <Avatar className="h-8 w-8 border">
                        {/* Add user avatar if available */}
                         <AvatarFallback><User size={16}/></AvatarFallback>
                     </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                 <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 border">
                         <AvatarFallback><Bot size={16}/></AvatarFallback>
                     </Avatar>
                    <div className="bg-muted rounded-lg p-3 text-sm flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                         <span className="text-muted-foreground italic">Typing...</span>
                    </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <SheetFooter className="p-4 border-t bg-background">
            <div className="flex items-center gap-2 w-full">
              <Input
                ref={inputRef}
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="flex-grow"
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                size="icon"
                aria-label="Send message"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      </>
  );
}
