import { ArrowRight, ShoppingBag } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16">
      <section className="max-w-2xl space-y-6">
        <Badge variant="secondary" className="w-fit">
          Frontend foundation
        </Badge>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            E-commerce storefront ready for product features.
          </h1>
          <p className="text-base leading-7 text-muted-foreground sm:text-lg">
            The app now has token-driven UI primitives, API conventions, query infrastructure, auth
            contracts, cart state, and testing hooks in place.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button>
            <ShoppingBag className="size-4" />
            Start catalog
          </Button>
          <Button variant="outline">
            View architecture
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>
    </main>
  );
}
