import { hasSupabaseConfig } from './env';

export type ChatAssistantRole = 'user' | 'assistant';

export type ChatAssistantMessage = {
  role: ChatAssistantRole;
  content: string;
};

export type ChatAssistantProduct = {
  id: string;
  name: string;
  variety: string;
  pricePerKg: number;
  stock: number;
  origin: string;
  description: string;
  tasteProfile: string;
  isAvailable: boolean;
  variants: Array<{
    weight: string;
    price: number;
  }>;
};

type ChatAssistantRequest = {
  messages: ChatAssistantMessage[];
  pathname?: string;
  products: ChatAssistantProduct[];
};

type ChatAssistantSuccess = {
  reply: string;
};

type ChatAssistantError = {
  error?: string;
};

type GeminiResponsePayload = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

const STORE_CONTEXT = [
  'Store: Harivanga.com',
  'Location: Podagonj, Mithapukur, Rangpur, Bangladesh',
  'WhatsApp orders: 01342262821 / +8801342262821',
  'Email: hello@harivanga.com',
  'Store summary: tree-ripened, chemical-free Harivanga and premium mangoes sourced from Rangpur.',
  'Delivery: there is no same-day delivery in Dhaka or any other city.',
  'Estimated delivery guidance: around 48 hours depending on route, location, and order volume.',
  'Delivery pricing in checkout code: Home Delivery = 110 BDT per kg, Courier Pickup = 100 BDT per kg.',
  'Payment methods in the app: Cash on Delivery, bKash, Nagad, Rocket.',
  'Return guidance: customers should report damaged or incorrect fruit quickly, ideally with photo evidence.',
  'Ordering guidance: users can shop through the website cart and checkout, or contact WhatsApp for order help.',
].join('\n');

function isChatAssistantSuccess(data: ChatAssistantSuccess | ChatAssistantError | null): data is ChatAssistantSuccess {
  return Boolean(data && typeof data === 'object' && 'reply' in data && typeof data.reply === 'string');
}

function isChatAssistantError(data: ChatAssistantSuccess | ChatAssistantError | null): data is ChatAssistantError {
  return Boolean(data && typeof data === 'object' && 'error' in data);
}

function getChatFunctionUrl() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');

  if (!supabaseUrl) {
    throw new Error('Missing VITE_SUPABASE_URL. The Gemini assistant needs Supabase to reach the server function.');
  }

  return `${supabaseUrl}/functions/v1/chat-assistant`;
}

function getBrowserGeminiApiKey() {
  return import.meta.env.VITE_GEMINI_API_KEY?.trim() || '';
}

function getGeminiModel() {
  return import.meta.env.VITE_GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
}

function canUseBrowserGemini() {
  return Boolean(getBrowserGeminiApiKey());
}

function createCatalogContext(products: ChatAssistantProduct[]) {
  if (products.length === 0) {
    return 'No live product catalog was sent by the storefront.';
  }

  return products
    .slice(0, 40)
    .map((product) => {
      const variants = product.variants.map((variant) => `${variant.weight}: BDT ${variant.price}`).join(', ');
      return [
        `- ${product.name}`,
        `variety=${product.variety}`,
        `available=${product.isAvailable ? 'yes' : 'no'}`,
        `price_per_kg=BDT ${product.pricePerKg}`,
        `stock=${product.stock}`,
        `origin=${product.origin}`,
        `taste=${product.tasteProfile || 'n/a'}`,
        `variants=${variants || 'n/a'}`,
        `description=${product.description || 'n/a'}`,
      ].join(' | ');
    })
    .join('\n');
}

function createGeminiPrompt(request: ChatAssistantRequest) {
  const messages = request.messages.slice(-10);
  const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user')?.content?.trim() || '';
  const conversationTranscript = messages.map((message) => `${message.role.toUpperCase()}: ${message.content}`).join('\n');

  return [
    'You are the Harivanga.com AI shopping assistant for a mango e-commerce site in Bangladesh.',
    'Always reply in Bangla. Do not switch to English, even if the user writes in English or asks for English.',
    'Answer in a warm, concise, helpful tone.',
    'Focus only on product discovery, pricing, ripeness, delivery, payment methods, and order guidance.',
    'Use only the store facts and product catalog provided below.',
    'Never invent facts, prices, delivery promises, stock, policies, or product details.',
    'If information is missing, uncertain, or not present in the provided data, clearly say you are not sure.',
    'Never say there is same-day delivery. The store does not offer same-day delivery in Dhaka or any other city.',
    'Guide the user using the given store data and currently provided products.',
    'Do not claim to place, edit, cancel, or track orders yourself.',
    'When human support is needed, suggest WhatsApp at +8801342262821.',
    'If the user asks what to buy, recommend from the provided catalog using price, availability, variety, taste profile, and variants.',
    'If a product is marked unavailable, say it is currently unavailable.',
    'Do not mention products that are not in the provided catalog.',
    'Do not say "best" unless you explain it using the provided taste, price, or availability data.',
    'Keep answers brief and practical. Prefer short Bangla paragraphs unless the shopper is comparing options.',
    'If the user asks for something outside your data, politely redirect them to WhatsApp support.',
    '',
    `Current storefront path: ${request.pathname || '/'}`,
    '',
    'Store facts:',
    STORE_CONTEXT,
    '',
    'Product catalog:',
    createCatalogContext(request.products),
    '',
    'Conversation so far:',
    conversationTranscript || 'No earlier messages.',
    '',
    'Latest shopper message:',
    latestUserMessage,
  ].join('\n');
}

function extractGeminiText(payload: GeminiResponsePayload) {
  return payload.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text?.trim() ?? '')
    .filter(Boolean)
    .join('\n\n')
    .trim() || '';
}

export function canUseChatAssistant() {
  return hasSupabaseConfig || canUseBrowserGemini();
}

async function requestBrowserGemini(request: ChatAssistantRequest, signal?: AbortSignal) {
  const apiKey = getBrowserGeminiApiKey();
  const model = getGeminiModel();
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: createGeminiPrompt(request) }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens: 300,
      },
    }),
    signal,
  });

  const data = (await response.json().catch(() => null)) as GeminiResponsePayload | null;
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Gemini request failed.');
  }

  const reply = extractGeminiText(data ?? { candidates: [] });
  if (!reply) {
    throw new Error('Gemini returned an empty response.');
  }

  return reply;
}

export async function requestChatAssistant(
  request: ChatAssistantRequest,
  signal?: AbortSignal
) {
  if (hasSupabaseConfig) {
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const response = await fetch(getChatFunctionUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify(request),
      signal,
    });

    const data = (await response.json().catch(() => null)) as ChatAssistantSuccess | ChatAssistantError | null;

    if (!response.ok) {
      throw new Error((isChatAssistantError(data) && data.error) || 'The Gemini assistant could not answer right now.');
    }

    if (!isChatAssistantSuccess(data) || !data.reply) {
      throw new Error('The Gemini assistant returned an empty response.');
    }

    return data.reply;
  }

  if (canUseBrowserGemini()) {
    return requestBrowserGemini(request, signal);
  }

  throw new Error(
    'Configure either Supabase (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) or add VITE_GEMINI_API_KEY for local Gemini access.'
  );
}
