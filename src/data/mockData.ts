import { Product } from '../types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'himsagar-01',
    name: 'Premium Himsagar',
    description: 'Known as the "King of Mangoes" in Bengal, Himsagar is famous for its sweet aroma and fiberless flesh.',
    image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&q=80&w=800',
    pricePerKg: 120,
    stock: 500,
    variety: 'Himsagar',
    origin: 'Rajshahi',
    tasteProfile: 'Extremely sweet, aromatic, and creamy.',
    isAvailable: true,
    variants: [
      { weight: '1kg', price: 120 },
      { weight: '5kg Box', price: 550 },
      { weight: '10kg Box', price: 1050 }
    ]
  },
  {
    id: 'langra-01',
    name: 'Rajshahi Langra',
    description: 'Langra mangoes are known for their unique green skin even when ripe and their incredibly sweet, tangy flavor.',
    image: 'https://images.unsplash.com/photo-1591073113125-e46713c829ed?auto=format&fit=crop&q=80&w=800',
    pricePerKg: 100,
    stock: 300,
    variety: 'Langra',
    origin: 'Rajshahi',
    tasteProfile: 'Sweet with a hint of tanginess, very juicy.',
    isAvailable: true,
    variants: [
      { weight: '1kg', price: 100 },
      { weight: '5kg Box', price: 480 },
      { weight: '10kg Box', price: 900 }
    ]
  },
  {
    id: 'alphonso-01',
    name: 'Premium Alphonso',
    description: 'The global favorite, Alphonso is known for its rich, creamy texture and vibrant orange flesh.',
    image: 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?auto=format&fit=crop&q=80&w=800',
    pricePerKg: 250,
    stock: 100,
    variety: 'Alphonso',
    origin: 'Satkhira',
    tasteProfile: 'Rich, buttery, and intensely sweet.',
    isAvailable: true,
    variants: [
      { weight: '1kg', price: 250 },
      { weight: '2kg Gift Pack', price: 480 }
    ]
  },
  {
    id: 'amrapali-01',
    name: 'Sweet Amrapali',
    description: 'A hybrid variety that is exceptionally sweet and has a deep orange pulp.',
    image: 'https://images.unsplash.com/photo-1591073113125-e46713c829ed?auto=format&fit=crop&q=80&w=800',
    pricePerKg: 90,
    stock: 0,
    variety: 'Amrapali',
    origin: 'Chapainawabganj',
    tasteProfile: 'Very sweet, small seed, high pulp ratio.',
    isAvailable: false,
    variants: [
      { weight: '1kg', price: 90 },
      { weight: '5kg Box', price: 420 }
    ]
  }
];
