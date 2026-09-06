import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-12">
      <EmptyState
        icon={SearchX}
        title="Page not found"
        description="The page you are looking for does not exist or has moved."
      />
      <Button asChild className="fixed bottom-8">
        <Link href="/">Go home</Link>
      </Button>
    </main>
  );
}
