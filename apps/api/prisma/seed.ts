import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { createHash, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import { PrismaClient } from '../src/generated/prisma/client.js';
import {
  Currency,
  FulfillmentStatus,
  Locale,
  OrderStatus,
  PaymentStatus,
  ProductStatus,
  UserStatus,
} from '../src/generated/prisma/enums.js';

const scrypt = promisify(scryptCallback);

type Translation = {
  vi: string;
  en: string;
};

type CategorySeed = {
  key: string;
  parentKey?: string;
  name: Translation;
  slug: Translation;
  description: Translation;
};

type OptionSeed = {
  code: string;
  name: Translation;
  values: Array<{
    code: string;
    value: Translation;
  }>;
};

type VariantKind =
  | 'apparel'
  | 'footwear'
  | 'electronics'
  | 'audio'
  | 'bags'
  | 'home'
  | 'beauty'
  | 'sports';

type VariantPresetGroup = {
  optionCode: string;
  valueCodes: readonly string[];
};

type ProductSeed = {
  vi: string;
  en: string;
  slugVi: string;
  slugEn: string;
  brand: string;
  categories: string[];
  kind: VariantKind;
  priceVnd: number;
  priceUsd: number;
};

type DemoUserSeed = {
  email: string;
  name: string;
  roleCode: 'ADMIN' | 'STAFF' | 'CUSTOMER';
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const categories: CategorySeed[] = [
  {
    key: 'fashion',
    name: { vi: 'Thời trang', en: 'Fashion' },
    slug: { vi: 'thoi-trang', en: 'fashion' },
    description: {
      vi: 'Quần áo và phụ kiện thời trang hằng ngày.',
      en: 'Everyday clothing and fashion accessories.',
    },
  },
  {
    key: 'men-fashion',
    parentKey: 'fashion',
    name: { vi: 'Thời trang nam', en: 'Men Fashion' },
    slug: { vi: 'thoi-trang-nam', en: 'men-fashion' },
    description: {
      vi: 'Trang phục nam năng động, dễ phối.',
      en: 'Versatile menswear for everyday outfits.',
    },
  },
  {
    key: 'women-fashion',
    parentKey: 'fashion',
    name: { vi: 'Thời trang nữ', en: 'Women Fashion' },
    slug: { vi: 'thoi-trang-nu', en: 'women-fashion' },
    description: {
      vi: 'Trang phục nữ hiện đại và thoải mái.',
      en: 'Modern and comfortable womenswear.',
    },
  },
  {
    key: 'tshirts',
    parentKey: 'fashion',
    name: { vi: 'Áo thun', en: 'T-shirts' },
    slug: { vi: 'ao-thun', en: 't-shirts' },
    description: {
      vi: 'Áo thun cotton, oversize và basic.',
      en: 'Cotton, oversized, and basic T-shirts.',
    },
  },
  {
    key: 'footwear',
    name: { vi: 'Giày dép', en: 'Footwear' },
    slug: { vi: 'giay-dep', en: 'footwear' },
    description: {
      vi: 'Giày thể thao, sandal và giày đi hằng ngày.',
      en: 'Sneakers, sandals, and daily footwear.',
    },
  },
  {
    key: 'sneakers',
    parentKey: 'footwear',
    name: { vi: 'Giày thể thao', en: 'Sneakers' },
    slug: { vi: 'giay-the-thao', en: 'sneakers' },
    description: {
      vi: 'Giày thể thao cho đi bộ, chạy bộ và phối đồ.',
      en: 'Sneakers for walking, running, and styling.',
    },
  },
  {
    key: 'electronics',
    name: { vi: 'Điện tử', en: 'Electronics' },
    slug: { vi: 'dien-tu', en: 'electronics' },
    description: {
      vi: 'Thiết bị công nghệ cá nhân và gia đình.',
      en: 'Personal and home technology devices.',
    },
  },
  {
    key: 'phones',
    parentKey: 'electronics',
    name: { vi: 'Điện thoại', en: 'Phones' },
    slug: { vi: 'dien-thoai', en: 'phones' },
    description: {
      vi: 'Điện thoại thông minh nhiều cấu hình.',
      en: 'Smartphones with multiple configurations.',
    },
  },
  {
    key: 'audio',
    parentKey: 'electronics',
    name: { vi: 'Âm thanh', en: 'Audio' },
    slug: { vi: 'am-thanh', en: 'audio' },
    description: {
      vi: 'Tai nghe, loa và phụ kiện âm thanh.',
      en: 'Headphones, speakers, and audio accessories.',
    },
  },
  {
    key: 'bags',
    name: { vi: 'Túi & balo', en: 'Bags & Backpacks' },
    slug: { vi: 'tui-va-balo', en: 'bags-and-backpacks' },
    description: {
      vi: 'Balo, túi đeo chéo và túi đi làm.',
      en: 'Backpacks, crossbody bags, and work bags.',
    },
  },
  {
    key: 'home',
    name: { vi: 'Nhà cửa', en: 'Home & Living' },
    slug: { vi: 'nha-cua', en: 'home-and-living' },
    description: {
      vi: 'Đồ gia dụng và vật dụng trang trí.',
      en: 'Home goods and decor essentials.',
    },
  },
  {
    key: 'beauty',
    name: { vi: 'Làm đẹp', en: 'Beauty' },
    slug: { vi: 'lam-dep', en: 'beauty' },
    description: {
      vi: 'Mỹ phẩm, chăm sóc da và chăm sóc cá nhân.',
      en: 'Cosmetics, skincare, and personal care.',
    },
  },
  {
    key: 'sports',
    name: { vi: 'Thể thao', en: 'Sports' },
    slug: { vi: 'the-thao', en: 'sports' },
    description: {
      vi: 'Trang phục và dụng cụ tập luyện.',
      en: 'Training apparel and sports equipment.',
    },
  },
];

const options: OptionSeed[] = [
  {
    code: 'color',
    name: { vi: 'Màu sắc', en: 'Color' },
    values: [
      { code: 'black', value: { vi: 'Đen', en: 'Black' } },
      { code: 'white', value: { vi: 'Trắng', en: 'White' } },
      { code: 'navy', value: { vi: 'Xanh navy', en: 'Navy' } },
      { code: 'beige', value: { vi: 'Be', en: 'Beige' } },
      { code: 'red', value: { vi: 'Đỏ', en: 'Red' } },
      { code: 'blue', value: { vi: 'Xanh dương', en: 'Blue' } },
      { code: 'silver', value: { vi: 'Bạc', en: 'Silver' } },
      { code: 'pink', value: { vi: 'Hồng', en: 'Pink' } },
    ],
  },
  {
    code: 'size',
    name: { vi: 'Kích cỡ', en: 'Size' },
    values: [
      { code: 's', value: { vi: 'S', en: 'S' } },
      { code: 'm', value: { vi: 'M', en: 'M' } },
      { code: 'l', value: { vi: 'L', en: 'L' } },
      { code: 'xl', value: { vi: 'XL', en: 'XL' } },
    ],
  },
  {
    code: 'shoe_size',
    name: { vi: 'Cỡ giày', en: 'Shoe Size' },
    values: [
      { code: '38', value: { vi: '38', en: '38' } },
      { code: '39', value: { vi: '39', en: '39' } },
      { code: '40', value: { vi: '40', en: '40' } },
      { code: '41', value: { vi: '41', en: '41' } },
      { code: '42', value: { vi: '42', en: '42' } },
      { code: '43', value: { vi: '43', en: '43' } },
    ],
  },
  {
    code: 'storage',
    name: { vi: 'Dung lượng', en: 'Storage' },
    values: [
      { code: '64gb', value: { vi: '64GB', en: '64GB' } },
      { code: '128gb', value: { vi: '128GB', en: '128GB' } },
      { code: '256gb', value: { vi: '256GB', en: '256GB' } },
      { code: '512gb', value: { vi: '512GB', en: '512GB' } },
    ],
  },
  {
    code: 'volume',
    name: { vi: 'Dung tích', en: 'Volume' },
    values: [
      { code: '30ml', value: { vi: '30ml', en: '30ml' } },
      { code: '50ml', value: { vi: '50ml', en: '50ml' } },
      { code: '100ml', value: { vi: '100ml', en: '100ml' } },
      { code: '250ml', value: { vi: '250ml', en: '250ml' } },
    ],
  },
  {
    code: 'scent',
    name: { vi: 'Mùi hương', en: 'Scent' },
    values: [
      { code: 'fresh', value: { vi: 'Tươi mát', en: 'Fresh' } },
      { code: 'citrus', value: { vi: 'Cam chanh', en: 'Citrus' } },
      { code: 'floral', value: { vi: 'Hoa nhẹ', en: 'Floral' } },
      { code: 'unscented', value: { vi: 'Không mùi', en: 'Unscented' } },
    ],
  },
  {
    code: 'material',
    name: { vi: 'Chất liệu', en: 'Material' },
    values: [
      { code: 'canvas', value: { vi: 'Vải canvas', en: 'Canvas' } },
      { code: 'leather', value: { vi: 'Da', en: 'Leather' } },
      { code: 'polyester', value: { vi: 'Polyester', en: 'Polyester' } },
      { code: 'cotton', value: { vi: 'Cotton', en: 'Cotton' } },
    ],
  },
];

const variantPresets: Record<VariantKind, readonly VariantPresetGroup[]> = {
  apparel: [
    { optionCode: 'color', valueCodes: ['black', 'white', 'navy'] },
    { optionCode: 'size', valueCodes: ['s', 'm', 'l', 'xl'] },
  ],
  footwear: [
    { optionCode: 'color', valueCodes: ['black', 'white', 'blue'] },
    { optionCode: 'shoe_size', valueCodes: ['39', '40', '41', '42'] },
  ],
  electronics: [
    { optionCode: 'color', valueCodes: ['black', 'white', 'silver'] },
    { optionCode: 'storage', valueCodes: ['128gb', '256gb'] },
  ],
  audio: [{ optionCode: 'color', valueCodes: ['black', 'white', 'blue'] }],
  bags: [
    { optionCode: 'color', valueCodes: ['black', 'beige', 'navy'] },
    { optionCode: 'material', valueCodes: ['canvas', 'leather'] },
  ],
  home: [
    { optionCode: 'color', valueCodes: ['white', 'beige', 'blue'] },
    { optionCode: 'size', valueCodes: ['m', 'l'] },
  ],
  beauty: [
    { optionCode: 'scent', valueCodes: ['fresh', 'citrus', 'floral'] },
    { optionCode: 'volume', valueCodes: ['30ml', '50ml', '100ml'] },
  ],
  sports: [
    { optionCode: 'color', valueCodes: ['black', 'red', 'blue'] },
    { optionCode: 'size', valueCodes: ['m', 'l', 'xl'] },
  ],
};

const products: ProductSeed[] = [
  {
    vi: 'Áo thun cotton basic',
    en: 'Basic Cotton T-shirt',
    slugVi: 'ao-thun-cotton-basic',
    slugEn: 'basic-cotton-t-shirt',
    brand: 'Luma',
    categories: ['tshirts', 'men-fashion', 'women-fashion'],
    kind: 'apparel',
    priceVnd: 249000,
    priceUsd: 1299,
  },
  {
    vi: 'Áo thun oversize urban',
    en: 'Urban Oversized T-shirt',
    slugVi: 'ao-thun-oversize-urban',
    slugEn: 'urban-oversized-t-shirt',
    brand: 'Luma',
    categories: ['tshirts', 'men-fashion'],
    kind: 'apparel',
    priceVnd: 329000,
    priceUsd: 1599,
  },
  {
    vi: 'Áo polo pique cổ bẻ',
    en: 'Pique Polo Shirt',
    slugVi: 'ao-polo-pique-co-be',
    slugEn: 'pique-polo-shirt',
    brand: 'Nordic Wear',
    categories: ['fashion', 'men-fashion'],
    kind: 'apparel',
    priceVnd: 459000,
    priceUsd: 2299,
  },
  {
    vi: 'Sơ mi linen dài tay',
    en: 'Long Sleeve Linen Shirt',
    slugVi: 'so-mi-linen-dai-tay',
    slugEn: 'long-sleeve-linen-shirt',
    brand: 'Nordic Wear',
    categories: ['fashion', 'men-fashion'],
    kind: 'apparel',
    priceVnd: 699000,
    priceUsd: 3499,
  },
  {
    vi: 'Áo khoác bomber nhẹ',
    en: 'Lightweight Bomber Jacket',
    slugVi: 'ao-khoac-bomber-nhe',
    slugEn: 'lightweight-bomber-jacket',
    brand: 'Aero Street',
    categories: ['fashion', 'men-fashion'],
    kind: 'apparel',
    priceVnd: 899000,
    priceUsd: 4499,
  },
  {
    vi: 'Quần jean slim fit',
    en: 'Slim Fit Jeans',
    slugVi: 'quan-jean-slim-fit',
    slugEn: 'slim-fit-jeans',
    brand: 'Denim Lab',
    categories: ['fashion', 'men-fashion'],
    kind: 'apparel',
    priceVnd: 799000,
    priceUsd: 3999,
  },
  {
    vi: 'Quần short chino',
    en: 'Chino Shorts',
    slugVi: 'quan-short-chino',
    slugEn: 'chino-shorts',
    brand: 'Denim Lab',
    categories: ['fashion', 'men-fashion'],
    kind: 'apparel',
    priceVnd: 399000,
    priceUsd: 1999,
  },
  {
    vi: 'Váy midi xếp ly',
    en: 'Pleated Midi Skirt',
    slugVi: 'vay-midi-xep-ly',
    slugEn: 'pleated-midi-skirt',
    brand: 'Mira Studio',
    categories: ['fashion', 'women-fashion'],
    kind: 'apparel',
    priceVnd: 549000,
    priceUsd: 2799,
  },
  {
    vi: 'Đầm suông công sở',
    en: 'Office Shift Dress',
    slugVi: 'dam-suong-cong-so',
    slugEn: 'office-shift-dress',
    brand: 'Mira Studio',
    categories: ['fashion', 'women-fashion'],
    kind: 'apparel',
    priceVnd: 749000,
    priceUsd: 3799,
  },
  {
    vi: 'Áo cardigan len mỏng',
    en: 'Light Knit Cardigan',
    slugVi: 'ao-cardigan-len-mong',
    slugEn: 'light-knit-cardigan',
    brand: 'Mira Studio',
    categories: ['fashion', 'women-fashion'],
    kind: 'apparel',
    priceVnd: 629000,
    priceUsd: 3199,
  },
  {
    vi: 'Giày sneaker daily runner',
    en: 'Daily Runner Sneakers',
    slugVi: 'giay-sneaker-daily-runner',
    slugEn: 'daily-runner-sneakers',
    brand: 'Stride',
    categories: ['sneakers'],
    kind: 'footwear',
    priceVnd: 1199000,
    priceUsd: 5999,
  },
  {
    vi: 'Giày chạy bộ air cushion',
    en: 'Air Cushion Running Shoes',
    slugVi: 'giay-chay-bo-air-cushion',
    slugEn: 'air-cushion-running-shoes',
    brand: 'Stride',
    categories: ['sneakers', 'sports'],
    kind: 'footwear',
    priceVnd: 1499000,
    priceUsd: 7499,
  },
  {
    vi: 'Giày tennis court classic',
    en: 'Court Classic Tennis Shoes',
    slugVi: 'giay-tennis-court-classic',
    slugEn: 'court-classic-tennis-shoes',
    brand: 'Courtly',
    categories: ['sneakers'],
    kind: 'footwear',
    priceVnd: 1299000,
    priceUsd: 6499,
  },
  {
    vi: 'Sandal quai ngang tối giản',
    en: 'Minimal Strap Sandals',
    slugVi: 'sandal-quai-ngang-toi-gian',
    slugEn: 'minimal-strap-sandals',
    brand: 'StepEase',
    categories: ['footwear'],
    kind: 'footwear',
    priceVnd: 499000,
    priceUsd: 2499,
  },
  {
    vi: 'Dép slide êm chân',
    en: 'Comfort Slide Sandals',
    slugVi: 'dep-slide-em-chan',
    slugEn: 'comfort-slide-sandals',
    brand: 'StepEase',
    categories: ['footwear'],
    kind: 'footwear',
    priceVnd: 299000,
    priceUsd: 1499,
  },
  {
    vi: 'Điện thoại Nova X1',
    en: 'Nova X1 Smartphone',
    slugVi: 'dien-thoai-nova-x1',
    slugEn: 'nova-x1-smartphone',
    brand: 'NovaTech',
    categories: ['phones', 'electronics'],
    kind: 'electronics',
    priceVnd: 7990000,
    priceUsd: 32900,
  },
  {
    vi: 'Điện thoại Nova X1 Pro',
    en: 'Nova X1 Pro Smartphone',
    slugVi: 'dien-thoai-nova-x1-pro',
    slugEn: 'nova-x1-pro-smartphone',
    brand: 'NovaTech',
    categories: ['phones', 'electronics'],
    kind: 'electronics',
    priceVnd: 11990000,
    priceUsd: 49900,
  },
  {
    vi: 'Điện thoại Pixelia Mini',
    en: 'Pixelia Mini Smartphone',
    slugVi: 'dien-thoai-pixelia-mini',
    slugEn: 'pixelia-mini-smartphone',
    brand: 'Pixelia',
    categories: ['phones', 'electronics'],
    kind: 'electronics',
    priceVnd: 6490000,
    priceUsd: 26900,
  },
  {
    vi: 'Điện thoại Pixelia Max',
    en: 'Pixelia Max Smartphone',
    slugVi: 'dien-thoai-pixelia-max',
    slugEn: 'pixelia-max-smartphone',
    brand: 'Pixelia',
    categories: ['phones', 'electronics'],
    kind: 'electronics',
    priceVnd: 13990000,
    priceUsd: 57900,
  },
  {
    vi: 'Máy tính bảng TabGo 11',
    en: 'TabGo 11 Tablet',
    slugVi: 'may-tinh-bang-tabgo-11',
    slugEn: 'tabgo-11-tablet',
    brand: 'TabGo',
    categories: ['electronics'],
    kind: 'electronics',
    priceVnd: 8990000,
    priceUsd: 37900,
  },
  {
    vi: 'Tai nghe true wireless AirBeat',
    en: 'AirBeat True Wireless Earbuds',
    slugVi: 'tai-nghe-true-wireless-airbeat',
    slugEn: 'airbeat-true-wireless-earbuds',
    brand: 'Soundly',
    categories: ['audio', 'electronics'],
    kind: 'audio',
    priceVnd: 1290000,
    priceUsd: 5999,
  },
  {
    vi: 'Tai nghe chống ồn QuietPro',
    en: 'QuietPro Noise Cancelling Headphones',
    slugVi: 'tai-nghe-chong-on-quietpro',
    slugEn: 'quietpro-noise-cancelling-headphones',
    brand: 'Soundly',
    categories: ['audio', 'electronics'],
    kind: 'audio',
    priceVnd: 3490000,
    priceUsd: 14900,
  },
  {
    vi: 'Loa bluetooth MiniBoom',
    en: 'MiniBoom Bluetooth Speaker',
    slugVi: 'loa-bluetooth-miniboom',
    slugEn: 'miniboom-bluetooth-speaker',
    brand: 'BoomBox',
    categories: ['audio', 'electronics'],
    kind: 'audio',
    priceVnd: 990000,
    priceUsd: 4499,
  },
  {
    vi: 'Bàn phím cơ compact 68',
    en: 'Compact 68 Mechanical Keyboard',
    slugVi: 'ban-phim-co-compact-68',
    slugEn: 'compact-68-mechanical-keyboard',
    brand: 'KeyForge',
    categories: ['electronics'],
    kind: 'audio',
    priceVnd: 1890000,
    priceUsd: 7999,
  },
  {
    vi: 'Chuột không dây Ergo Lite',
    en: 'Ergo Lite Wireless Mouse',
    slugVi: 'chuot-khong-day-ergo-lite',
    slugEn: 'ergo-lite-wireless-mouse',
    brand: 'KeyForge',
    categories: ['electronics'],
    kind: 'audio',
    priceVnd: 690000,
    priceUsd: 2999,
  },
  {
    vi: 'Balo laptop city 15 inch',
    en: 'City 15-inch Laptop Backpack',
    slugVi: 'balo-laptop-city-15-inch',
    slugEn: 'city-15-inch-laptop-backpack',
    brand: 'CarryOn',
    categories: ['bags'],
    kind: 'bags',
    priceVnd: 799000,
    priceUsd: 3999,
  },
  {
    vi: 'Túi tote canvas daily',
    en: 'Daily Canvas Tote Bag',
    slugVi: 'tui-tote-canvas-daily',
    slugEn: 'daily-canvas-tote-bag',
    brand: 'CarryOn',
    categories: ['bags', 'fashion'],
    kind: 'bags',
    priceVnd: 349000,
    priceUsd: 1799,
  },
  {
    vi: 'Túi đeo chéo mini',
    en: 'Mini Crossbody Bag',
    slugVi: 'tui-deo-cheo-mini',
    slugEn: 'mini-crossbody-bag',
    brand: 'CarryOn',
    categories: ['bags', 'fashion'],
    kind: 'bags',
    priceVnd: 459000,
    priceUsd: 2299,
  },
  {
    vi: 'Ví da gập đôi classic',
    en: 'Classic Bifold Leather Wallet',
    slugVi: 'vi-da-gap-doi-classic',
    slugEn: 'classic-bifold-leather-wallet',
    brand: 'CarryOn',
    categories: ['bags', 'fashion'],
    kind: 'bags',
    priceVnd: 599000,
    priceUsd: 2999,
  },
  {
    vi: 'Túi du lịch weekend',
    en: 'Weekend Travel Duffel Bag',
    slugVi: 'tui-du-lich-weekend',
    slugEn: 'weekend-travel-duffel-bag',
    brand: 'CarryOn',
    categories: ['bags'],
    kind: 'bags',
    priceVnd: 1199000,
    priceUsd: 5999,
  },
  {
    vi: 'Bình giữ nhiệt Urban 500ml',
    en: 'Urban 500ml Insulated Bottle',
    slugVi: 'binh-giu-nhiet-urban-500ml',
    slugEn: 'urban-500ml-insulated-bottle',
    brand: 'HomePeak',
    categories: ['home'],
    kind: 'home',
    priceVnd: 329000,
    priceUsd: 1599,
  },
  {
    vi: 'Đèn bàn LED Focus',
    en: 'Focus LED Desk Lamp',
    slugVi: 'den-ban-led-focus',
    slugEn: 'focus-led-desk-lamp',
    brand: 'HomePeak',
    categories: ['home'],
    kind: 'home',
    priceVnd: 599000,
    priceUsd: 2899,
  },
  {
    vi: 'Bộ ga giường cotton soft',
    en: 'Soft Cotton Bedding Set',
    slugVi: 'bo-ga-giuong-cotton-soft',
    slugEn: 'soft-cotton-bedding-set',
    brand: 'HomePeak',
    categories: ['home'],
    kind: 'home',
    priceVnd: 1299000,
    priceUsd: 6499,
  },
  {
    vi: 'Khăn tắm bamboo plush',
    en: 'Plush Bamboo Bath Towel',
    slugVi: 'khan-tam-bamboo-plush',
    slugEn: 'plush-bamboo-bath-towel',
    brand: 'HomePeak',
    categories: ['home'],
    kind: 'home',
    priceVnd: 259000,
    priceUsd: 1299,
  },
  {
    vi: 'Hộp đựng đồ modular',
    en: 'Modular Storage Box',
    slugVi: 'hop-dung-do-modular',
    slugEn: 'modular-storage-box',
    brand: 'HomePeak',
    categories: ['home'],
    kind: 'home',
    priceVnd: 199000,
    priceUsd: 999,
  },
  {
    vi: 'Sữa rửa mặt dịu nhẹ',
    en: 'Gentle Facial Cleanser',
    slugVi: 'sua-rua-mat-diu-nhe',
    slugEn: 'gentle-facial-cleanser',
    brand: 'GlowLab',
    categories: ['beauty'],
    kind: 'beauty',
    priceVnd: 259000,
    priceUsd: 1299,
  },
  {
    vi: 'Kem dưỡng ẩm daily gel',
    en: 'Daily Gel Moisturizer',
    slugVi: 'kem-duong-am-daily-gel',
    slugEn: 'daily-gel-moisturizer',
    brand: 'GlowLab',
    categories: ['beauty'],
    kind: 'beauty',
    priceVnd: 399000,
    priceUsd: 1999,
  },
  {
    vi: 'Serum vitamin C sáng da',
    en: 'Brightening Vitamin C Serum',
    slugVi: 'serum-vitamin-c-sang-da',
    slugEn: 'brightening-vitamin-c-serum',
    brand: 'GlowLab',
    categories: ['beauty'],
    kind: 'beauty',
    priceVnd: 549000,
    priceUsd: 2799,
  },
  {
    vi: 'Kem chống nắng SPF50',
    en: 'SPF50 Sunscreen Cream',
    slugVi: 'kem-chong-nang-spf50',
    slugEn: 'spf50-sunscreen-cream',
    brand: 'GlowLab',
    categories: ['beauty'],
    kind: 'beauty',
    priceVnd: 329000,
    priceUsd: 1699,
  },
  {
    vi: 'Nước hoa mini fresh day',
    en: 'Fresh Day Mini Perfume',
    slugVi: 'nuoc-hoa-mini-fresh-day',
    slugEn: 'fresh-day-mini-perfume',
    brand: 'Aroma Nine',
    categories: ['beauty'],
    kind: 'beauty',
    priceVnd: 699000,
    priceUsd: 3499,
  },
  {
    vi: 'Áo tập dry-fit training',
    en: 'Dry-Fit Training Tee',
    slugVi: 'ao-tap-dry-fit-training',
    slugEn: 'dry-fit-training-tee',
    brand: 'MoveFit',
    categories: ['sports', 'fashion'],
    kind: 'sports',
    priceVnd: 399000,
    priceUsd: 1999,
  },
  {
    vi: 'Quần jogger thể thao',
    en: 'Training Jogger Pants',
    slugVi: 'quan-jogger-the-thao',
    slugEn: 'training-jogger-pants',
    brand: 'MoveFit',
    categories: ['sports', 'fashion'],
    kind: 'sports',
    priceVnd: 599000,
    priceUsd: 2999,
  },
  {
    vi: 'Thảm yoga grip pro',
    en: 'Grip Pro Yoga Mat',
    slugVi: 'tham-yoga-grip-pro',
    slugEn: 'grip-pro-yoga-mat',
    brand: 'MoveFit',
    categories: ['sports'],
    kind: 'sports',
    priceVnd: 499000,
    priceUsd: 2499,
  },
  {
    vi: 'Bình nước thể thao squeeze',
    en: 'Squeeze Sports Bottle',
    slugVi: 'binh-nuoc-the-thao-squeeze',
    slugEn: 'squeeze-sports-bottle',
    brand: 'MoveFit',
    categories: ['sports'],
    kind: 'sports',
    priceVnd: 159000,
    priceUsd: 799,
  },
  {
    vi: 'Dây kháng lực power band',
    en: 'Power Resistance Band',
    slugVi: 'day-khang-luc-power-band',
    slugEn: 'power-resistance-band',
    brand: 'MoveFit',
    categories: ['sports'],
    kind: 'sports',
    priceVnd: 229000,
    priceUsd: 1199,
  },
  {
    vi: 'Mũ lưỡi trai cotton logo',
    en: 'Cotton Logo Cap',
    slugVi: 'mu-luoi-trai-cotton-logo',
    slugEn: 'cotton-logo-cap',
    brand: 'Aero Street',
    categories: ['fashion'],
    kind: 'apparel',
    priceVnd: 249000,
    priceUsd: 1299,
  },
  {
    vi: 'Áo hoodie fleece classic',
    en: 'Classic Fleece Hoodie',
    slugVi: 'ao-hoodie-fleece-classic',
    slugEn: 'classic-fleece-hoodie',
    brand: 'Aero Street',
    categories: ['fashion', 'men-fashion', 'women-fashion'],
    kind: 'apparel',
    priceVnd: 799000,
    priceUsd: 3999,
  },
  {
    vi: 'Áo sơ mi nữ satin',
    en: 'Women Satin Shirt',
    slugVi: 'ao-so-mi-nu-satin',
    slugEn: 'women-satin-shirt',
    brand: 'Mira Studio',
    categories: ['fashion', 'women-fashion'],
    kind: 'apparel',
    priceVnd: 649000,
    priceUsd: 3299,
  },
  {
    vi: 'Giày loafer da mềm',
    en: 'Soft Leather Loafers',
    slugVi: 'giay-loafer-da-mem',
    slugEn: 'soft-leather-loafers',
    brand: 'StepEase',
    categories: ['footwear'],
    kind: 'footwear',
    priceVnd: 1399000,
    priceUsd: 6999,
  },
  {
    vi: 'Sạc nhanh USB-C 65W',
    en: '65W USB-C Fast Charger',
    slugVi: 'sac-nhanh-usb-c-65w',
    slugEn: '65w-usb-c-fast-charger',
    brand: 'Voltix',
    categories: ['electronics'],
    kind: 'audio',
    priceVnd: 590000,
    priceUsd: 2499,
  },
];

const systemRoles = [
  {
    id: 'role_admin',
    code: 'ADMIN',
    name: 'Administrator',
    description: 'Full back-office access.',
  },
  {
    id: 'role_staff',
    code: 'STAFF',
    name: 'Staff',
    description: 'Operational back-office access.',
  },
  {
    id: 'role_customer',
    code: 'CUSTOMER',
    name: 'Customer',
    description: 'Default shopper access.',
  },
] as const;

const systemPermissions = [
  ['permission_auth_me', 'auth:me', 'Read own profile'],
  ['permission_cart_manage_own', 'cart:manage_own', 'Manage own cart'],
  ['permission_order_create_own', 'order:create_own', 'Create own order'],
  ['permission_order_read_own', 'order:read_own', 'Read own orders'],
  ['permission_category_create', 'category:create', 'Create categories'],
  ['permission_category_update', 'category:update', 'Update categories'],
  ['permission_category_delete', 'category:delete', 'Delete categories'],
  ['permission_option_create', 'option:create', 'Create options'],
  ['permission_option_update', 'option:update', 'Update options'],
  ['permission_option_delete', 'option:delete', 'Delete options'],
  ['permission_product_create', 'product:create', 'Create products'],
  ['permission_product_update', 'product:update', 'Update products'],
  ['permission_product_delete', 'product:delete', 'Delete products'],
  ['permission_order_read', 'order:read', 'Read orders'],
  [
    'permission_order_update_status',
    'order:update_status',
    'Update order status',
  ],
  ['permission_user_read', 'user:read', 'Read users'],
  ['permission_user_update', 'user:update', 'Update users'],
  ['permission_user_manage_roles', 'user:manage_roles', 'Manage user roles'],
  ['permission_user_suspend', 'user:suspend', 'Suspend users'],
  ['permission_user_ban', 'user:ban', 'Ban users'],
  ['permission_session_revoke', 'session:revoke', 'Revoke sessions'],
  ['permission_audit_read', 'audit:read', 'Read audit logs'],
] as const;

const rolePermissionCodes: Record<string, string[]> = {
  ADMIN: systemPermissions.map((permission) => permission[1]),
  STAFF: [
    'order:read',
    'order:update_status',
    'category:create',
    'category:update',
    'option:create',
    'option:update',
    'product:create',
    'product:update',
    'user:read',
  ],
  CUSTOMER: [
    'auth:me',
    'cart:manage_own',
    'order:create_own',
    'order:read_own',
  ],
};

const roleTranslations: Record<
  string,
  Record<Locale, { name: string; description: string }>
> = {
  ADMIN: {
    [Locale.en]: {
      name: 'Administrator',
      description: 'Full back-office access.',
    },
    [Locale.vi]: {
      name: 'Quản trị viên',
      description: 'Toàn quyền truy cập khu vực quản trị.',
    },
  },
  STAFF: {
    [Locale.en]: {
      name: 'Staff',
      description: 'Operational back-office access.',
    },
    [Locale.vi]: {
      name: 'Nhân viên',
      description: 'Quyền vận hành khu vực quản trị.',
    },
  },
  CUSTOMER: {
    [Locale.en]: {
      name: 'Customer',
      description: 'Default shopper access.',
    },
    [Locale.vi]: {
      name: 'Khách hàng',
      description: 'Quyền mua sắm mặc định.',
    },
  },
};

const permissionTranslations: Record<
  string,
  Record<Locale, { name: string; description: string }>
> = {
  'auth:me': {
    [Locale.en]: {
      name: 'Read own profile',
      description: 'View the authenticated user profile.',
    },
    [Locale.vi]: {
      name: 'Xem hồ sơ cá nhân',
      description: 'Xem hồ sơ của người dùng đang đăng nhập.',
    },
  },
  'cart:manage_own': {
    [Locale.en]: {
      name: 'Manage own cart',
      description: 'Create and update the authenticated user cart.',
    },
    [Locale.vi]: {
      name: 'Quản lý giỏ hàng cá nhân',
      description: 'Tạo và cập nhật giỏ hàng của người dùng đang đăng nhập.',
    },
  },
  'order:create_own': {
    [Locale.en]: {
      name: 'Create own order',
      description: 'Create orders for the authenticated user.',
    },
    [Locale.vi]: {
      name: 'Tạo đơn hàng cá nhân',
      description: 'Tạo đơn hàng cho người dùng đang đăng nhập.',
    },
  },
  'order:read_own': {
    [Locale.en]: {
      name: 'Read own orders',
      description: 'View orders owned by the authenticated user.',
    },
    [Locale.vi]: {
      name: 'Xem đơn hàng cá nhân',
      description: 'Xem đơn hàng thuộc về người dùng đang đăng nhập.',
    },
  },
  'category:create': {
    [Locale.en]: {
      name: 'Create categories',
      description: 'Create catalog categories.',
    },
    [Locale.vi]: {
      name: 'Tạo danh mục',
      description: 'Tạo danh mục sản phẩm.',
    },
  },
  'category:update': {
    [Locale.en]: {
      name: 'Update categories',
      description: 'Update catalog categories.',
    },
    [Locale.vi]: {
      name: 'Cập nhật danh mục',
      description: 'Cập nhật danh mục sản phẩm.',
    },
  },
  'category:delete': {
    [Locale.en]: {
      name: 'Delete categories',
      description: 'Delete catalog categories.',
    },
    [Locale.vi]: {
      name: 'Xóa danh mục',
      description: 'Xóa danh mục sản phẩm.',
    },
  },
  'option:create': {
    [Locale.en]: {
      name: 'Create options',
      description: 'Create catalog options.',
    },
    [Locale.vi]: {
      name: 'Tạo thuộc tính',
      description: 'Tạo thuộc tính sản phẩm.',
    },
  },
  'option:update': {
    [Locale.en]: {
      name: 'Update options',
      description: 'Update catalog options and option values.',
    },
    [Locale.vi]: {
      name: 'Cập nhật thuộc tính',
      description: 'Cập nhật thuộc tính và giá trị thuộc tính sản phẩm.',
    },
  },
  'option:delete': {
    [Locale.en]: {
      name: 'Delete options',
      description: 'Delete catalog options and option values.',
    },
    [Locale.vi]: {
      name: 'Xóa thuộc tính',
      description: 'Xóa thuộc tính và giá trị thuộc tính sản phẩm.',
    },
  },
  'product:create': {
    [Locale.en]: {
      name: 'Create products',
      description: 'Create catalog products.',
    },
    [Locale.vi]: {
      name: 'Tạo sản phẩm',
      description: 'Tạo sản phẩm trong catalog.',
    },
  },
  'product:update': {
    [Locale.en]: {
      name: 'Update products',
      description: 'Update catalog products.',
    },
    [Locale.vi]: {
      name: 'Cập nhật sản phẩm',
      description: 'Cập nhật sản phẩm trong catalog.',
    },
  },
  'product:delete': {
    [Locale.en]: {
      name: 'Delete products',
      description: 'Delete catalog products.',
    },
    [Locale.vi]: {
      name: 'Xóa sản phẩm',
      description: 'Xóa sản phẩm trong catalog.',
    },
  },
  'order:read': {
    [Locale.en]: {
      name: 'Read orders',
      description: 'View customer orders.',
    },
    [Locale.vi]: {
      name: 'Xem đơn hàng',
      description: 'Xem đơn hàng của khách hàng.',
    },
  },
  'order:update_status': {
    [Locale.en]: {
      name: 'Update order status',
      description: 'Change order fulfillment and payment status.',
    },
    [Locale.vi]: {
      name: 'Cập nhật trạng thái đơn hàng',
      description: 'Thay đổi trạng thái thanh toán và xử lý đơn hàng.',
    },
  },
  'user:read': {
    [Locale.en]: {
      name: 'Read users',
      description: 'View user accounts.',
    },
    [Locale.vi]: {
      name: 'Xem người dùng',
      description: 'Xem tài khoản người dùng.',
    },
  },
  'user:update': {
    [Locale.en]: {
      name: 'Update users',
      description: 'Update user accounts.',
    },
    [Locale.vi]: {
      name: 'Cập nhật người dùng',
      description: 'Cập nhật tài khoản người dùng.',
    },
  },
  'user:manage_roles': {
    [Locale.en]: {
      name: 'Manage user roles',
      description: 'Assign and remove user roles.',
    },
    [Locale.vi]: {
      name: 'Quản lý vai trò người dùng',
      description: 'Gán và gỡ vai trò của người dùng.',
    },
  },
  'user:suspend': {
    [Locale.en]: {
      name: 'Suspend users',
      description: 'Temporarily block user access.',
    },
    [Locale.vi]: {
      name: 'Tạm khóa người dùng',
      description: 'Tạm thời chặn quyền truy cập của người dùng.',
    },
  },
  'user:ban': {
    [Locale.en]: {
      name: 'Ban users',
      description: 'Permanently block user access.',
    },
    [Locale.vi]: {
      name: 'Cấm người dùng',
      description: 'Chặn vĩnh viễn quyền truy cập của người dùng.',
    },
  },
  'session:revoke': {
    [Locale.en]: {
      name: 'Revoke sessions',
      description: 'Force logout user sessions.',
    },
    [Locale.vi]: {
      name: 'Thu hồi phiên đăng nhập',
      description: 'Buộc đăng xuất các phiên của người dùng.',
    },
  },
  'audit:read': {
    [Locale.en]: {
      name: 'Read audit logs',
      description: 'View security and administration audit logs.',
    },
    [Locale.vi]: {
      name: 'Xem nhật ký kiểm toán',
      description: 'Xem nhật ký bảo mật và quản trị hệ thống.',
    },
  },
};

const demoUsers: DemoUserSeed[] = [
  {
    email: 'admin@example.com',
    name: 'Demo Admin',
    roleCode: 'ADMIN',
  },
  {
    email: 'staff@example.com',
    name: 'Demo Staff',
    roleCode: 'STAFF',
  },
  {
    email: 'customer@example.com',
    name: 'Demo Customer',
    roleCode: 'CUSTOMER',
  },
];

async function seedSystemAccessData(): Promise<void> {
  for (const role of systemRoles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: {
        name: role.name,
        description: role.description,
        isSystem: true,
      },
      create: {
        ...role,
        isSystem: true,
      },
    });
  }

  for (const [id, code, name] of systemPermissions) {
    await prisma.permission.upsert({
      where: { code },
      update: { name },
      create: { id, code, name },
    });
  }

  const roles = await prisma.role.findMany({
    select: { id: true, code: true },
  });
  const permissions = await prisma.permission.findMany({
    select: { id: true, code: true },
  });
  const roleIdByCode = new Map(roles.map((role) => [role.code, role.id]));
  const permissionIdByCode = new Map(
    permissions.map((permission) => [permission.code, permission.id]),
  );

  await prisma.rolePermission.createMany({
    data: Object.entries(rolePermissionCodes).flatMap(
      ([roleCode, permissionCodes]) =>
        permissionCodes
          .map((permissionCode) => ({
            roleId: roleIdByCode.get(roleCode),
            permissionId: permissionIdByCode.get(permissionCode),
          }))
          .filter(
            (
              item,
            ): item is {
              roleId: string;
              permissionId: string;
            } => Boolean(item.roleId && item.permissionId),
          ),
    ),
    skipDuplicates: true,
  });

  for (const role of roles) {
    const translations = roleTranslations[role.code];

    if (!translations) {
      continue;
    }

    for (const [locale, translation] of Object.entries(translations) as Array<
      [Locale, { name: string; description: string }]
    >) {
      await prisma.roleTranslation.upsert({
        where: {
          roleId_locale: {
            roleId: role.id,
            locale,
          },
        },
        update: translation,
        create: {
          roleId: role.id,
          locale,
          ...translation,
        },
      });
    }
  }

  for (const permission of permissions) {
    const translations = permissionTranslations[permission.code];

    if (!translations) {
      continue;
    }

    for (const [locale, translation] of Object.entries(translations) as Array<
      [Locale, { name: string; description: string }]
    >) {
      await prisma.permissionTranslation.upsert({
        where: {
          permissionId_locale: {
            permissionId: permission.id,
            locale,
          },
        },
        update: translation,
        create: {
          permissionId: permission.id,
          locale,
          ...translation,
        },
      });
    }
  }
}

async function seedDemoUsers(): Promise<void> {
  const passwordHash = await hashSeedPassword('Password123!');

  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        passwordHash,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
        roles: {
          deleteMany: {},
          create: {
            role: {
              connect: {
                code: user.roleCode,
              },
            },
          },
        },
      },
      create: {
        email: user.email,
        name: user.name,
        passwordHash,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
        roles: {
          create: {
            role: {
              connect: {
                code: user.roleCode,
              },
            },
          },
        },
      },
    });
  }
}

async function hashSeedPassword(password: string): Promise<string> {
  const salt = createHash('sha256')
    .update('ecommerce-platform-demo-users')
    .digest('base64url')
    .slice(0, 22);
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

  return `scrypt$${salt}$${derivedKey.toString('base64url')}`;
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickTwo<T>(items: readonly T[], offset: number): T[] {
  return [items[offset % items.length], items[(offset + 1) % items.length]];
}

function cartesianProduct<T>(groups: T[][]): T[][] {
  return groups.reduce<T[][]>(
    (acc, group) =>
      acc.flatMap((items) => group.map((item) => [...items, item])),
    [[]],
  );
}

function skuPart(value: string): string {
  return value.replace(/[^a-z0-9]/gi, '').toUpperCase();
}

async function clearCatalogData(): Promise<void> {
  await prisma.checkoutIdempotencyKey.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productSearchDocument.deleteMany();
  await prisma.productVariantPrice.deleteMany();
  await prisma.variantOptionValue.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productOption.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.productTranslation.deleteMany();
  await prisma.product.deleteMany();
  await prisma.optionValueTranslation.deleteMany();
  await prisma.optionValue.deleteMany();
  await prisma.optionTranslation.deleteMany();
  await prisma.option.deleteMany();
  await prisma.categoryTranslation.deleteMany();
  await prisma.category.deleteMany();
}

async function seedCategories(): Promise<Map<string, string>> {
  const categoryIds = new Map<string, string>();

  for (const [position, category] of categories.entries()) {
    const created = await prisma.category.create({
      data: {
        parentId: category.parentKey
          ? categoryIds.get(category.parentKey)
          : null,
        position,
        translations: {
          create: [
            {
              locale: Locale.vi,
              name: category.name.vi,
              slug: category.slug.vi,
              description: category.description.vi,
            },
            {
              locale: Locale.en,
              name: category.name.en,
              slug: category.slug.en,
              description: category.description.en,
            },
          ],
        },
      },
    });

    categoryIds.set(category.key, created.id);
  }

  return categoryIds;
}

async function seedOptions(): Promise<Map<string, Map<string, string>>> {
  const optionValueIds = new Map<string, Map<string, string>>();

  for (const option of options) {
    const createdOption = await prisma.option.create({
      data: {
        code: option.code,
        translations: {
          create: [
            { locale: Locale.vi, name: option.name.vi },
            { locale: Locale.en, name: option.name.en },
          ],
        },
      },
    });

    const valueIds = new Map<string, string>();

    for (const [position, value] of option.values.entries()) {
      const createdValue = await prisma.optionValue.create({
        data: {
          optionId: createdOption.id,
          code: value.code,
          position,
          translations: {
            create: [
              { locale: Locale.vi, value: value.value.vi },
              { locale: Locale.en, value: value.value.en },
            ],
          },
        },
      });

      valueIds.set(value.code, createdValue.id);
    }

    optionValueIds.set(option.code, valueIds);
  }

  return optionValueIds;
}

async function seedProducts(
  categoryIds: Map<string, string>,
  optionValueIds: Map<string, Map<string, string>>,
): Promise<void> {
  const optionByCode = new Map(
    await prisma.option
      .findMany({ select: { id: true, code: true } })
      .then((items) => items.map((item) => [item.code, item.id] as const)),
  );

  const valueTranslations = new Map(
    await prisma.optionValue
      .findMany({
        include: {
          translations: true,
          option: { select: { code: true } },
        },
      })
      .then((items) =>
        items.map(
          (item) =>
            [
              item.id,
              {
                optionCode: item.option.code,
                code: item.code,
                vi:
                  item.translations.find(
                    (translation) => translation.locale === Locale.vi,
                  )?.value ?? item.code,
                en:
                  item.translations.find(
                    (translation) => translation.locale === Locale.en,
                  )?.value ?? item.code,
              },
            ] as const,
        ),
      ),
  );

  for (const [index, product] of products.entries()) {
    const preset = variantPresets[product.kind];
    const variantGroups = preset.map((group) =>
      pickTwo(group.valueCodes, index).map((valueCode) => ({
        optionCode: group.optionCode,
        valueCode,
        valueId: optionValueIds.get(group.optionCode)?.get(valueCode),
      })),
    );

    const variantCombos = cartesianProduct(variantGroups).filter((combo) =>
      combo.every((item) => item.valueId),
    );

    const createdProduct = await prisma.product.create({
      data: {
        brand: product.brand,
        status: ProductStatus.ACTIVE,
        translations: {
          create: [
            {
              locale: Locale.vi,
              name: product.vi,
              slug: product.slugVi,
              shortDescription: `${product.vi} chính hãng từ ${product.brand}.`,
              description: `${product.vi} có nhiều lựa chọn mẫu mã, phù hợp cho mua sắm online tại Việt Nam và quốc tế.`,
            },
            {
              locale: Locale.en,
              name: product.en,
              slug: product.slugEn,
              shortDescription: `Authentic ${product.en} by ${product.brand}.`,
              description: `${product.en} comes with multiple variants for local and international ecommerce shoppers.`,
            },
          ],
        },
        categories: {
          create: product.categories.map((categoryKey) => ({
            categoryId: categoryIds.get(categoryKey)!,
          })),
        },
        options: {
          create: preset.map((group, position) => ({
            optionId: optionByCode.get(group.optionCode)!,
            position,
          })),
        },
      },
    });

    const skuPrefix = skuPart(product.slugEn).split('-').join('').slice(0, 10);
    const variantSearchParts: string[] = [];

    for (const [variantIndex, combo] of variantCombos.entries()) {
      const sku = [
        skuPrefix || `P${index + 1}`,
        ...combo.map((item) => skuPart(item.valueCode)),
      ].join('-');

      const variant = await prisma.productVariant.create({
        data: {
          productId: createdProduct.id,
          sku,
          stock: 20 + ((index + variantIndex) % 30),
          imageUrl: `https://placehold.co/800x800?text=${encodeURIComponent(product.en)}`,
          optionValues: {
            create: combo.map((item) => ({
              optionValueId: item.valueId!,
            })),
          },
          prices: {
            create: [
              {
                currency: Currency.VND,
                amountMinor: BigInt(product.priceVnd + variantIndex * 10000),
                compareAtAmountMinor: BigInt(
                  Math.round((product.priceVnd + variantIndex * 10000) * 1.15),
                ),
              },
              {
                currency: Currency.USD,
                amountMinor: BigInt(product.priceUsd + variantIndex * 100),
                compareAtAmountMinor: BigInt(
                  Math.round((product.priceUsd + variantIndex * 100) * 1.15),
                ),
              },
            ],
          },
        },
      });

      const optionText = combo
        .map((item) => valueTranslations.get(item.valueId!)!)
        .flatMap((value) => [value.code, value.vi, value.en])
        .join(' ');

      variantSearchParts.push(`${variant.sku} ${optionText}`);
    }

    const categoryText = product.categories
      .map((categoryKey) =>
        categories.find((category) => category.key === categoryKey),
      )
      .filter(Boolean)
      .flatMap((category) => [
        category!.name.vi,
        category!.name.en,
        category!.slug.vi,
        category!.slug.en,
      ])
      .join(' ');

    const sharedSearchText = [
      product.brand,
      product.vi,
      product.en,
      product.slugVi,
      product.slugEn,
      categoryText,
      variantSearchParts.join(' '),
    ].join(' ');

    await prisma.productSearchDocument.createMany({
      data: [
        {
          productId: createdProduct.id,
          locale: Locale.vi,
          content: sharedSearchText,
          normalizedContent: normalizeSearchText(sharedSearchText),
        },
        {
          productId: createdProduct.id,
          locale: Locale.en,
          content: sharedSearchText,
          normalizedContent: normalizeSearchText(sharedSearchText),
        },
      ],
    });
  }
}

async function getDemoOrderVariants() {
  return prisma.productVariant.findMany({
    where: {
      isActive: true,
      product: {
        status: ProductStatus.ACTIVE,
      },
      prices: {
        some: {
          currency: Currency.VND,
          isActive: true,
        },
      },
    },
    include: {
      product: {
        include: {
          translations: {
            orderBy: {
              locale: 'asc',
            },
          },
        },
      },
      optionValues: {
        include: {
          optionValue: {
            include: {
              translations: {
                orderBy: {
                  locale: 'asc',
                },
              },
              option: {
                include: {
                  translations: {
                    orderBy: {
                      locale: 'asc',
                    },
                  },
                },
              },
            },
          },
        },
      },
      prices: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
    take: 8,
  });
}

type DemoOrderVariant = Awaited<
  ReturnType<typeof getDemoOrderVariants>
>[number];

type DemoOrderSeed = {
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  note: string;
  variantIndex: number;
  quantity: number;
  createdAt: Date;
  cancelledAt?: Date;
  cancelReason?: string;
};

const demoShippingAddress = {
  fullName: 'Demo Customer',
  phone: '0901234567',
  addressLine1: '123 Nguyen Trai',
  addressLine2: 'Tang 5, can 502',
  ward: 'Phuong Ben Thanh',
  district: 'Quan 1',
  province: 'TP. Ho Chi Minh',
  postalCode: '700000',
  countryCode: 'VN',
};

async function seedDemoCustomerOrders(): Promise<number> {
  const customer = await prisma.user.findUniqueOrThrow({
    where: { email: 'customer@example.com' },
  });
  const variants = await getDemoOrderVariants();

  if (variants.length < 4) {
    throw new Error('Not enough product variants to seed demo orders');
  }

  const now = new Date();
  const daysAgo = (days: number) =>
    new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const orderSeeds: DemoOrderSeed[] = [
    {
      orderNumber: 'ORD-DEMO-CONFIRMED',
      status: OrderStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      fulfillmentStatus: FulfillmentStatus.PROCESSING,
      note: 'Demo order paid and being prepared.',
      variantIndex: 0,
      quantity: 1,
      createdAt: daysAgo(2),
    },
    {
      orderNumber: 'ORD-DEMO-SHIPPED',
      status: OrderStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      fulfillmentStatus: FulfillmentStatus.SHIPPED,
      note: 'Demo order handed to the carrier.',
      variantIndex: 1,
      quantity: 2,
      createdAt: daysAgo(5),
    },
    {
      orderNumber: 'ORD-DEMO-COMPLETED',
      status: OrderStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      fulfillmentStatus: FulfillmentStatus.DELIVERED,
      note: 'Demo order delivered successfully.',
      variantIndex: 2,
      quantity: 1,
      createdAt: daysAgo(12),
    },
    {
      orderNumber: 'ORD-DEMO-CANCELLED',
      status: OrderStatus.CANCELLED,
      paymentStatus: PaymentStatus.FAILED,
      fulfillmentStatus: FulfillmentStatus.CANCELLED,
      note: 'Demo order cancelled after payment failed.',
      variantIndex: 3,
      quantity: 1,
      createdAt: daysAgo(20),
      cancelledAt: daysAgo(19),
      cancelReason: 'Payment failed in demo seed.',
    },
  ];

  for (const seed of orderSeeds) {
    const variant = variants[seed.variantIndex];
    const price = getDemoOrderPrice(variant);
    const subtotalMinor = price.amountMinor * BigInt(seed.quantity);

    if (seed.paymentStatus === PaymentStatus.PAID) {
      await prisma.productVariant.update({
        where: { id: variant.id },
        data: {
          stock: {
            decrement: seed.quantity,
          },
        },
      });
    }

    await prisma.order.create({
      data: {
        orderNumber: seed.orderNumber,
        userId: customer.id,
        currency: Currency.VND,
        status: seed.status,
        paymentStatus: seed.paymentStatus,
        fulfillmentStatus: seed.fulfillmentStatus,
        subtotalMinor,
        totalMinor: subtotalMinor,
        note: seed.note,
        shippingAddressSnapshot: demoShippingAddress,
        expiresAt: null,
        cancelledAt: seed.cancelledAt ?? null,
        cancelReason: seed.cancelReason ?? null,
        createdAt: seed.createdAt,
        updatedAt: seed.createdAt,
        items: {
          create: {
            variantId: variant.id,
            productId: variant.productId,
            productName: getDemoOrderProductName(variant),
            variantName: getDemoOrderVariantName(variant),
            sku: variant.sku,
            imageUrl: variant.imageUrl,
            unitAmountMinor: price.amountMinor,
            quantity: seed.quantity,
            lineTotalMinor: subtotalMinor,
            snapshot: buildDemoOrderItemSnapshot(variant, price),
            createdAt: seed.createdAt,
          },
        },
      },
    });
  }

  return orderSeeds.length;
}

function getDemoOrderPrice(variant: DemoOrderVariant) {
  const now = new Date();
  const price = variant.prices.find(
    (price) =>
      price.currency === Currency.VND &&
      price.isActive &&
      (!price.startsAt || price.startsAt <= now) &&
      (!price.endsAt || price.endsAt >= now),
  );

  if (!price) {
    throw new Error(`Variant ${variant.sku} has no active VND price`);
  }

  return price;
}

function getDemoOrderProductName(variant: DemoOrderVariant): string {
  return (
    variant.product.translations.find(
      (translation) => translation.locale === Locale.vi,
    )?.name ??
    variant.product.translations[0]?.name ??
    variant.sku
  );
}

function getDemoOrderVariantName(variant: DemoOrderVariant): string | null {
  const optionNames = getDemoOrderOptionValues(variant).map(
    (optionValue) => `${optionValue.optionName}: ${optionValue.valueName}`,
  );

  return optionNames.length ? optionNames.join(' / ') : null;
}

function getDemoOrderOptionValues(variant: DemoOrderVariant) {
  return variant.optionValues.map(({ optionValue }) => {
    const optionName =
      optionValue.option.translations.find(
        (translation) => translation.locale === Locale.vi,
      )?.name ??
      optionValue.option.translations[0]?.name ??
      optionValue.option.code;
    const valueName =
      optionValue.translations.find(
        (translation) => translation.locale === Locale.vi,
      )?.value ??
      optionValue.translations[0]?.value ??
      optionValue.code;

    return {
      optionCode: optionValue.option.code,
      optionName,
      valueCode: optionValue.code,
      valueName,
    };
  });
}

function buildDemoOrderItemSnapshot(
  variant: DemoOrderVariant,
  price: DemoOrderVariant['prices'][number],
) {
  return {
    product: {
      id: variant.productId,
      translations: variant.product.translations.map((translation) => ({
        locale: translation.locale,
        name: translation.name,
        slug: translation.slug,
      })),
    },
    variant: {
      id: variant.id,
      sku: variant.sku,
      barcode: variant.barcode,
      imageUrl: variant.imageUrl,
      optionValues: getDemoOrderOptionValues(variant),
    },
    price: {
      currency: price.currency,
      amountMinor: price.amountMinor.toString(),
      compareAtAmountMinor: price.compareAtAmountMinor?.toString() ?? null,
    },
  };
}

async function main(): Promise<void> {
  await seedSystemAccessData();
  await seedDemoUsers();
  await clearCatalogData();

  const categoryIds = await seedCategories();
  const optionValueIds = await seedOptions();

  await seedProducts(categoryIds, optionValueIds);
  const demoOrderCount = await seedDemoCustomerOrders();

  console.log(`Seeded ${categories.length} categories.`);
  console.log(`Seeded ${options.length} options.`);
  console.log(`Seeded ${products.length} products with variants and prices.`);
  console.log(`Seeded ${demoUsers.length} demo users.`);
  console.log(`Seeded ${demoOrderCount} demo customer orders.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
