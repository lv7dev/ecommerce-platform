import { ProductDetail } from '@/features/products/components/product-detail';

export const metadata = {
  title: 'Product Detail | E-commerce Platform',
};

interface ProductDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;

  return <ProductDetail slug={slug} />;
}
