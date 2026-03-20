import { Product } from '../types';

const HARIVANGA_ART = '/images/downloaded/hero.webp';
const LANGRA_ART = '/images/downloaded/pattern.webp';
const ALPHONSO_ART = '/images/downloaded/farm.webp';
const HIMSAGAR_ART = '/images/downloaded/himsagar.webp';
const MIXED_BOX_ART = '/images/downloaded/mixed.webp';
const FAZLI_ART = '/images/downloaded/fazli.webp';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'harivanga-01',
    name: 'Signature Harivanga',
    description: 'Rangpur\'s famous Harivanga mango with a thin seed, dense pulp, and a clean honeyed finish.',
    image: HARIVANGA_ART,
    images: [
      HARIVANGA_ART,
      HIMSAGAR_ART,
    ],
    pricePerKg: 140,
    stock: 650,
    variety: 'Harivanga',
    origin: 'Rangpur',
    tasteProfile: 'Honey-sweet, smooth, and low-fiber.',
    isAvailable: true,
    variants: [
      { weight: '1kg', price: 140 },
      { weight: '3kg Family Box', price: 405 },
      { weight: '5kg Premium Box', price: 650 }
    ]
  },
  {
    id: 'himsagar-01',
    name: 'Premium Himsagar',
    description: 'Known as the "King of Mangoes" in Bengal, Himsagar is famous for its sweet aroma and fiberless flesh.',
    image: HIMSAGAR_ART,
    images: [
      HIMSAGAR_ART,
      ALPHONSO_ART,
    ],
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
    image: LANGRA_ART,
    images: [
      LANGRA_ART,
      MIXED_BOX_ART,
    ],
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
    image: ALPHONSO_ART,
    images: [
      ALPHONSO_ART,
      FAZLI_ART,
    ],
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
    image: LANGRA_ART,
    images: [
      LANGRA_ART,
    ],
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
  },
  {
    id: 'fazli-01',
    name: 'Royal Fazli',
    description: 'Large-sized Fazli mangoes with generous pulp and balanced sweetness, ideal for family orders and gifts.',
    image: ALPHONSO_ART,
    images: [
      FAZLI_ART,
      MIXED_BOX_ART,
    ],
    pricePerKg: 110,
    stock: 420,
    variety: 'Fazli',
    origin: 'Rajshahi',
    tasteProfile: 'Mildly sweet, juicy, and generously pulpy.',
    isAvailable: true,
    variants: [
      { weight: '1kg', price: 110 },
      { weight: '5kg Family Box', price: 520 },
      { weight: '10kg Box', price: 990 }
    ]
  },
  {
    id: 'gopalbhog-01',
    name: 'Early Gopalbhog',
    description: 'One of the season\'s earliest arrivals, known for its fragrant flesh and soft bite.',
    image: HARIVANGA_ART,
    images: [
      HARIVANGA_ART,
    ],
    pricePerKg: 115,
    stock: 260,
    variety: 'Gopalbhog',
    origin: 'Rajshahi',
    tasteProfile: 'Fragrant, soft, and lightly floral.',
    isAvailable: true,
    variants: [
      { weight: '1kg', price: 115 },
      { weight: '4kg Box', price: 430 }
    ]
  },
  {
    id: 'podangonj-special-01',
    name: 'Podagonj Special Harivanga',
    description: 'A selected Podagonj lot of Harivanga mangoes chosen for compact seed and deep sweetness.',
    image: HARIVANGA_ART,
    images: [
      HARIVANGA_ART,
      HIMSAGAR_ART,
    ],
    pricePerKg: 150,
    stock: 340,
    variety: 'Harivanga',
    origin: 'Podagonj',
    tasteProfile: 'Dense pulp, sweet finish, and very low fiber.',
    isAvailable: true,
    variants: [
      { weight: '1kg', price: 150 },
      { weight: '3kg Premium Box', price: 435 },
      { weight: '6kg Gift Carton', price: 850 }
    ]
  },
  {
    id: 'mixed-box-01',
    name: 'Seasonal Mixed Box',
    description: 'A curated box of seasonal mango varieties for customers who want to taste more than one orchard style.',
    image: MIXED_BOX_ART,
    images: [
      MIXED_BOX_ART,
      ALPHONSO_ART,
      LANGRA_ART,
    ],
    pricePerKg: 135,
    stock: 180,
    variety: 'Mixed',
    origin: 'Rangpur',
    tasteProfile: 'Varied sweetness, balanced textures, and mixed orchard aromas.',
    isAvailable: true,
    variants: [
      { weight: '3kg Trial Box', price: 399 },
      { weight: '5kg Discovery Box', price: 640 }
    ]
  }
];
