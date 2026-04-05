import React from 'react';
import { Bot, MessageCircleMore, MessageSquareText, Phone, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import {
  canUseChatAssistant,
  requestChatAssistant,
  type ChatAssistantMessage,
  type ChatAssistantProduct,
} from '../lib/chatAssistant';

const PHONE_LINK = 'tel:+8801342262821';
const WHATSAPP_LINK = 'https://wa.me/8801342262821?text=Hello! I would like to place an order.';

const INITIAL_MESSAGE =
  'আসসালামু আলাইকুম। আমি আপনাকে আমের ধরন, দাম, ডেলিভারি, পেমেন্ট এবং অর্ডার করার নিয়ম সম্পর্কে সাহায্য করতে পারি।';

const DISABLED_MESSAGE =
  'AI assistant এখনো configure করা হয়নি। লোকাল ব্যবহারের জন্য `VITE_GEMINI_API_KEY` যোগ করুন, অথবা Supabase connect করে `chat-assistant` Edge Function deploy করুন।';

const SUGGESTIONS = [
  'অর্ডার কীভাবে করব?',
  'ডেলিভারি প্রসেস কী?',
  'আনুমানিক ডেলিভারি তারিখ কত?',
  'কোনো FAQ আছে?',
];

type WidgetMessage = ChatAssistantMessage & {
  id: string;
};

const GENERIC_ASSISTANT_ERROR =
  'এই মুহূর্তে Store assistant ব্যস্ত আছে। অনুগ্রহ করে কিছুক্ষণ পরে আবার চেষ্টা করুন অথবা WhatsApp এ যোগাযোগ করুন।';

function getFriendlyAssistantError(_error: unknown) {
  return GENERIC_ASSISTANT_ERROR;
}

function createMessage(role: WidgetMessage['role'], content: string): WidgetMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
  };
}

function toAssistantProducts(products: ReturnType<typeof useProducts>['products']): ChatAssistantProduct[] {
  return products.map((product) => ({
    id: product.id,
    name: product.name,
    variety: product.variety,
    pricePerKg: product.pricePerKg,
    stock: product.stock,
    origin: product.origin,
    description: product.description,
    tasteProfile: product.tasteProfile,
    isAvailable: product.isAvailable,
    variants: product.variants.map((variant) => ({
      weight: variant.weight,
      price: variant.price,
    })),
  }));
}

export const UnifiedContactWidget: React.FC = () => {
  const { pathname } = useLocation();
  const { products } = useProducts();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [messages, setMessages] = React.useState<WidgetMessage[]>(() => [createMessage('assistant', INITIAL_MESSAGE)]);
  const viewportRef = React.useRef<HTMLDivElement | null>(null);

  const assistantEnabled = canUseChatAssistant();
  const assistantProducts = React.useMemo(() => toAssistantProducts(products), [products]);

  React.useEffect(() => {
    setIsMenuOpen(false);
    setIsChatOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!isChatOpen || !viewportRef.current) {
      return;
    }

    viewportRef.current.scrollTo({
      top: viewportRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [isChatOpen, messages, isLoading]);

  const sendMessage = React.useCallback(async (rawValue: string) => {
    const trimmedValue = rawValue.trim();
    if (!trimmedValue || isLoading) {
      return;
    }

    const userMessage = createMessage('user', trimmedValue);
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setError(null);

    if (!assistantEnabled) {
      setMessages((current) => [...current, createMessage('assistant', DISABLED_MESSAGE)]);
      return;
    }

    setIsLoading(true);

    try {
      const reply = await requestChatAssistant({
        pathname,
        messages: nextMessages.slice(-10).map(({ role, content }) => ({ role, content })),
        products: assistantProducts,
      });

      setMessages((current) => [...current, createMessage('assistant', reply)]);
    } catch (requestError) {
      console.error('Chat assistant request failed', requestError);
      setError(getFriendlyAssistantError(requestError));
    } finally {
      setIsLoading(false);
    }
  }, [assistantEnabled, assistantProducts, isLoading, messages, pathname]);

  const handleSubmit = React.useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  }, [input, sendMessage]);

  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[92] sm:bottom-5 sm:right-5">
      {isChatOpen ? (
        <div className="mb-4 flex w-[min(calc(100vw-2rem),21rem)] flex-col overflow-hidden rounded-[1.6rem] border border-[#f0d9bc] bg-[linear-gradient(180deg,#fffaf3_0%,#fff4ea_100%)] shadow-[0_28px_70px_rgba(90,47,0,0.2)]">
          <div className="flex items-start justify-between gap-3 border-b border-[#f2dfc8] bg-[linear-gradient(135deg,#ff9f5a_0%,#ff6b35_58%,#d85927_100%)] px-4 py-3.5 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/14">
                <Bot size={17} />
              </span>
              <div>
                <p className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-white/75">Harivanga.com</p>
                <h2 className="text-sm font-black">Store Assistant</h2>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsChatOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/14 transition hover:bg-white/22"
              aria-label="Close AI assistant"
            >
              <X size={15} />
            </button>
          </div>

          <div ref={viewportRef} className="max-h-[20rem] space-y-3 overflow-y-auto px-3.5 py-3.5 sm:px-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[88%] rounded-[1.1rem] px-3 py-2.5 text-[0.78rem] leading-relaxed shadow-sm ${
                    message.role === 'user'
                      ? 'bg-[#2a1a10] text-white'
                      : 'border border-[#f1dec8] bg-white text-[#4f3823]'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isLoading ? (
              <div className="flex justify-start">
                <div className="rounded-[1.1rem] border border-[#f1dec8] bg-white px-3 py-2.5 text-[0.76rem] text-[#8f4b00] shadow-sm">
                  উত্তর তৈরি হচ্ছে...
                </div>
              </div>
            ) : null}

            {messages.length === 1 ? (
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void sendMessage(suggestion)}
                    className="rounded-full border border-[#f0d9bc] bg-white px-2.5 py-1.5 text-[0.68rem] font-bold text-[#8f4b00] transition hover:border-[#ffb184] hover:text-mango-orange"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-[1rem] border border-[#ffd1bf] bg-[#fff2ec] px-3 py-2.5 text-[0.74rem] text-[#8a3f14]">
                {error}
              </div>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-[#f2dfc8] bg-white/88 p-3.5">
            <div className="flex items-end gap-2.5">
              <label htmlFor="assistant-input" className="sr-only">Message</label>
              <textarea
                id="assistant-input"
                rows={1}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="আম, দাম বা ডেলিভারি সম্পর্কে লিখুন..."
                className="max-h-24 min-h-[42px] flex-1 resize-y rounded-[1rem] border border-[#ead8be] bg-[#fffaf5] px-3 py-2.5 text-[0.78rem] text-[#3d2a1b] outline-none transition placeholder:text-[0.74rem] placeholder:text-[#b28d6c] focus:border-mango-orange"
              />
              <button
                type="submit"
                disabled={isLoading || input.trim().length === 0}
                className="flex h-[42px] w-[42px] items-center justify-center rounded-[0.95rem] bg-mango-orange text-white transition hover:bg-[#f4622d] disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Send message"
              >
                <MessageSquareText size={15} />
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {isMenuOpen ? (
        <div className="mb-4 flex flex-col items-end gap-3">
          <a
            href={PHONE_LINK}
            className="inline-flex items-center gap-0 rounded-full bg-white px-3 py-2 text-[#1f2b3d] shadow-[0_8px_24px_rgba(22,32,61,0.14)] transition hover:-translate-y-0.5"
          >
            <span className="text-[0.72rem] font-semibold leading-none">Call Us</span>
            <span className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#14b649] text-white">
              <Phone size={15} />
            </span>
          </a>

          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-0 rounded-full bg-white px-3 py-2 text-[#1f2b3d] shadow-[0_8px_24px_rgba(22,32,61,0.14)] transition hover:-translate-y-0.5"
          >
            <span className="text-[0.72rem] font-semibold leading-none">WhatsApp</span>
            <span className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#14b649] text-white">
              <MessageSquareText size={15} />
            </span>
          </a>

          <button
            type="button"
            onClick={() => {
              setIsChatOpen(true);
              setIsMenuOpen(false);
            }}
            className="inline-flex items-center gap-0 rounded-full bg-white px-3 py-2 text-[#1f2b3d] shadow-[0_8px_24px_rgba(22,32,61,0.14)] transition hover:-translate-y-0.5"
          >
            <span className="text-[0.72rem] font-semibold leading-none">AI Assistant</span>
            <span className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-mango-orange text-white">
              <Bot size={15} />
            </span>
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => {
          setIsMenuOpen((current) => !current);
          setIsChatOpen(false);
        }}
        className="widget-attention ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff9f5a_0%,#ff6b35_58%,#d85927_100%)] text-white shadow-[0_16px_34px_rgba(255,107,53,0.32)] transition hover:-translate-y-0.5"
        aria-label={isMenuOpen ? 'Close contact options' : 'Open contact options'}
      >
        {isMenuOpen ? <X size={19} className="text-[#fff1df]" /> : <MessageCircleMore size={18} className="text-[#fff1df]" />}
      </button>
    </div>
  );
};

