import React, { useState, useRef, useEffect } from 'react';
import { Menu, UtensilsCrossed } from 'lucide-react';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { MenuDisplay } from './components/MenuDisplay';
import { OrderSummary } from './components/OrderSummary';
import { Message, Order } from './types';
import { menu } from './data/menu';

const API_KEY = "AIzaSyAwT68SANskQi4ri6Qed-Jw2PZaFgt9e0k";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

function App() {
  const [messages, setMessages] = useState<Message[]>([
    { type: 'bot', content: '🧑🍳 Welcome to Kababjees! I\'m your digital waiter. How may I serve you?' }
  ]);
  const [order, setOrder] = useState<Order>({});
  const [showMenu, setShowMenu] = useState(false);
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const parseOrder = async (input: string) => {
    const allItems = Object.values(menu).flatMap(category => Object.keys(category));
    
    const prompt = `You are a waiter at Kababjees Restaurant. Analyze this customer message:
    "${input}"
    
    Extract items and quantities in format 'item:quantity'. 
    - Use EXACT menu names (case-sensitive)
    - Default to quantity=1 if not specified
    - Ignore non-menu items
    
    Menu: ${allItems.join(', ')}
    Respond with comma-separated entries. Example: 'Cheese Naan:2, Dynamite Chicken:1'`;

    try {
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();
      const items = data.candidates[0].content.parts[0].text.trim();
      
      const newOrder: Order = { ...order };
      let orderUpdated = false;

      items.split(',').forEach(entry => {
        let [item, qty] = entry.includes(':') 
          ? entry.split(':').map(s => s.trim())
          : [entry.trim(), '1'];

        if (allItems.includes(item)) {
          const price = Object.values(menu).find(
            category => item in category
          )?.[item];

          if (price) {
            if (item in newOrder) {
              newOrder[item].quantity += parseInt(qty) || 1;
            } else {
              newOrder[item] = {
                price,
                quantity: parseInt(qty) || 1
              };
            }
            orderUpdated = true;
          }
        }
      });

      if (orderUpdated) {
        setOrder(newOrder);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error parsing order:', error);
      return false;
    }
  };

  const generateResponse = async (input: string) => {
    const systemPrompt = `You are a Kababjees waiter. Answer only about services/policies.
    Never mention AI. Keep responses under 2 sentences. Menu questions: direct to menu.`;

    try {
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\nQuery: ${input}\nResponse:` }] }]
        })
      });

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error generating response:', error);
      return "How may I assist with your dining experience?";
    }
  };

  const handleSend = async (message: string) => {
    setMessages(prev => [...prev, { type: 'user', content: message }]);

    const input = message.toLowerCase();
    if (input === 'menu') {
      setShowMenu(true);
      return;
    }

    if (['confirm', 'bill', 'total', 'pay', 'payment'].some(word => input.includes(word)) && Object.keys(order).length > 0) {
      setShowOrderSummary(true);
      return;
    }

    const isOrder = await parseOrder(message);
    if (!isOrder) {
      const response = await generateResponse(message);
      setMessages(prev => [...prev, { type: 'bot', content: response }]);
    }
  };

  const handleOrderConfirm = (orderType: 'Dine-In' | 'Takeaway') => {
    const total = Object.entries(order).reduce(
      (sum, [_, { price, quantity }]) => sum + price * quantity,
      0
    );

    const orderSummary = Object.entries(order)
      .map(([item, { price, quantity }]) => `${item} x${quantity}: RS.${price * quantity}`)
      .join('\n');

    setMessages(prev => [
      ...prev,
      {
        type: 'bot',
        content: `Order confirmed for ${orderType}!\n\n${orderSummary}\n\nTotal: RS.${total}`
      }
    ]);

    setOrder({});
    setShowOrderSummary(false);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex flex-1 flex-col">
        <header className="bg-white px-6 py-4 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-800">Kababjees Restaurant</h1>
            </div>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="rounded-lg bg-blue-100 p-2 text-blue-600 hover:bg-blue-200"
            >
              <Menu size={24} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          <div className="grid h-full grid-cols-1 gap-4 p-4 md:grid-cols-[1fr,auto]">
            <div className="flex flex-col rounded-lg bg-white shadow-md">
              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {messages.map((message, index) => (
                  <ChatMessage key={index} message={message} />
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="border-t p-4">
                <ChatInput onSend={handleSend} />
              </div>
            </div>

            {showMenu && (
              <div className="hidden w-96 overflow-y-auto rounded-lg bg-white shadow-md md:block">
                <MenuDisplay />
              </div>
            )}
          </div>
        </main>

        {showOrderSummary && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <OrderSummary
              order={order}
              onClose={() => setShowOrderSummary(false)}
              onConfirm={handleOrderConfirm}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;