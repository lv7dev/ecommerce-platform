'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  Package,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { LogoutButton } from '@/features/auth/components/logout-button';
import { currentUserQueryOptions } from '@/features/auth/queries';
import { Button } from '@/shared/ui/button';

const navItems = [
  { icon: LayoutDashboard, label: 'Overview' },
  { icon: Package, label: 'Products' },
  { icon: ClipboardList, label: 'Orders' },
  { icon: Users, label: 'Customers' },
];

const stats = [
  { label: 'Today revenue', value: '0 VND', detail: 'Waiting for analytics data' },
  { label: 'New orders', value: '0', detail: 'No orders need attention' },
  { label: 'Active products', value: '0', detail: 'Will sync from the catalog API' },
  { label: 'Stock alerts', value: '0', detail: 'Alert rules are not enabled yet' },
];

export function AdminDashboard() {
  const { data: user } = useQuery(currentUserQueryOptions());
  const displayName = user?.name || user?.email || 'Admin';

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-card lg:flex lg:flex-col">
        <div className="border-b px-6 py-5">
          <p className="text-sm font-semibold uppercase text-muted-foreground">
            E-commerce
          </p>
          <h1 className="mt-1 text-xl font-semibold">Admin</h1>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item, index) => (
            <Button
              className="w-full justify-start"
              key={item.label}
              variant={index === 0 ? 'secondary' : 'ghost'}
            >
              <item.icon className="size-4" />
              {item.label}
            </Button>
          ))}
        </nav>
        <div className="border-t p-4">
          <div className="rounded-md border bg-background p-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              <span className="text-sm font-medium">Admin session</span>
            </div>
            <p className="mt-2 truncate text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </aside>

      <main className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <div>
              <p className="text-sm text-muted-foreground">Welcome, {displayName}</p>
              <h2 className="text-xl font-semibold">Dashboard</h2>
            </div>
            <LogoutButton>Sign out</LogoutButton>
          </div>
        </header>

        <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <article className="rounded-md border bg-card p-4 shadow-sm" key={stat.label}>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-3 text-2xl font-semibold">{stat.value}</p>
                <p className="mt-2 text-sm text-muted-foreground">{stat.detail}</p>
              </article>
            ))}
          </section>

          <section>
            <div className="rounded-md border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold">Recent activity</h3>
                  <p className="text-sm text-muted-foreground">
                    Placeholder data is shown until analytics APIs are connected.
                  </p>
                </div>
                <BarChart3 className="size-5 text-muted-foreground" />
              </div>
              <div className="mt-6 h-56 rounded-md border bg-muted/35 p-4">
                <div className="flex h-full items-end gap-3">
                  {[34, 52, 41, 68, 45, 76, 58].map((height, index) => (
                    <div className="flex flex-1 flex-col items-center gap-2" key={index}>
                      <div
                        className="w-full rounded-sm bg-primary/80"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-xs text-muted-foreground">T{index + 2}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
