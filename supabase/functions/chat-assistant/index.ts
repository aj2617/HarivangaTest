import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type ChatAssistantMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatAssistantProduct = {
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
  messages?: ChatAssistantMessage[];
  pathname?: string;
  products?: ChatAssistantProduct[];
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

function extractOutputText(payload: GeminiResponsePayload) {
  return payload.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text?.trim() ?? '')
    .filter(Boolean)
    .join('\n\n')
    .trim() || '';
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  const model = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';

  if (!geminiKey) {
    return new Response(JSON.stringify({ error: 'Missing GEMINI_API_KEY secret in Supabase.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await request.json()) as ChatAssistantRequest;
    const messages = Array.isArray(body.messages) ? body.messages.slice(-10) : [];
    const products = Array.isArray(body.products) ? body.products : [];
    const pathname = typeof body.pathname === 'string' ? body.pathname : '/';
    const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user')?.content?.trim();

    if (!latestUserMessage) {
      return new Response(JSON.stringify({ error: 'A user message is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const conversationTranscript = messages
      .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
      .join('\n');

    const prompt = [
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
      `Current storefront path: ${pathname}`,
      '',
      'Store facts:',
      STORE_CONTEXT,
      '',
      'Product catalog:',
      createCatalogContext(products),
      '',
      'Conversation so far:',
      conversationTranscript || 'No earlier messages.',
      '',
      'Latest shopper message:',
      latestUserMessage,
    ].join('\n');

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            maxOutputTokens: 300,
          },
        }),
      }
    );

    const payload = (await geminiResponse.json()) as GeminiResponsePayload;

    if (!geminiResponse.ok) {
      return new Response(
        JSON.stringify({ error: payload.error?.message || 'Gemini request failed.' }),
        {
          status: geminiResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const reply = extractOutputText(payload);
    if (!reply) {
      return new Response(JSON.stringify({ error: 'Gemini returned no text.' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unexpected Gemini assistant error.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
