import type { ReactNode } from 'react';

interface AuthFormShellProps {
  children: ReactNode;
  description: string;
  footer: ReactNode;
  title: string;
}

export function AuthFormShell({ children, description, footer, title }: AuthFormShellProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-16">
      <section className="grid w-full gap-10 lg:grid-cols-[minmax(0,0.9fr)_420px] lg:items-center">
        <div className="max-w-xl space-y-4">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            E-commerce account
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="text-base leading-7 text-muted-foreground sm:text-lg">{description}</p>
        </div>
        <div className="rounded-md border bg-card p-6 shadow-sm">
          {children}
          <div className="mt-6 border-t pt-5 text-sm text-muted-foreground">{footer}</div>
        </div>
      </section>
    </main>
  );
}
