'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Home, Menu, Package, ShoppingCart, UserCircle, X } from 'lucide-react';
import { LogoutButton } from '@/features/auth/components/logout-button';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { cartQueryOptions } from '@/features/cart/queries';
import { useCartStore } from '@/features/cart/store/cart-store';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';

const publicLinks = [
  {
    href: '/',
    icon: Home,
    label: 'Home',
  },
  {
    href: '/products',
    icon: Package,
    label: 'Products',
  },
];

export function SiteNavigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const currentUserQuery = useCurrentUser();
  const user = currentUserQuery.data;
  const guestCartItemCount = useCartStore((state) => state.itemCount);
  const cartQuery = useQuery(cartQueryOptions(Boolean(user)));
  const cartItemCount = user
    ? (cartQuery.data?.items.reduce((total, item) => total + item.quantity, 0) ?? 0)
    : guestCartItemCount;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2 font-semibold text-foreground">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            EP
          </span>
          <span className="hidden sm:block">E-commerce Platform</span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {publicLinks.map((link) => (
            <NavLink key={link.href} href={link.href} active={isActivePath(pathname, link.href)}>
              <link.icon className="size-4" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <CartBadge itemCount={cartItemCount} active={isActivePath(pathname, '/cart')} />
          {user ? (
            <>
              <NavLink href="/account" active={isActivePath(pathname, '/account')}>
                <UserCircle className="size-4" />
                Account
              </NavLink>
              <LogoutButton size="sm" />
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="md:hidden"
          aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen((current) => !current)}
        >
          {isMobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </Button>
      </div>

      {isMobileMenuOpen ? (
        <div className="border-t bg-background px-4 py-3 md:hidden">
          <nav className="mx-auto grid w-full max-w-7xl gap-2">
            {publicLinks.map((link) => (
              <MobileNavLink
                key={link.href}
                href={link.href}
                active={isActivePath(pathname, link.href)}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <link.icon className="size-4" />
                {link.label}
              </MobileNavLink>
            ))}

            {user ? (
              <>
                <MobileNavLink
                  href="/cart"
                  active={isActivePath(pathname, '/cart')}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <ShoppingCart className="size-4" />
                  Cart
                  <Badge variant="secondary" className="ml-auto">
                    {cartItemCount}
                  </Badge>
                </MobileNavLink>
                <MobileNavLink
                  href="/account"
                  active={isActivePath(pathname, '/account')}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <UserCircle className="size-4" />
                  Account
                </MobileNavLink>
                <LogoutButton
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              </>
            ) : (
              <>
                <MobileNavLink
                  href="/cart"
                  active={isActivePath(pathname, '/cart')}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <ShoppingCart className="size-4" />
                  Cart
                  <Badge variant="secondary" className="ml-auto">
                    {cartItemCount}
                  </Badge>
                </MobileNavLink>
                <Button asChild className="justify-start">
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    Login
                  </Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

interface NavLinkProps {
  active: boolean;
  children: React.ReactNode;
  href: string;
}

function NavLink({ active, children, href }: NavLinkProps) {
  return (
    <Button asChild size="sm" variant={active ? 'secondary' : 'ghost'}>
      <Link href={href} aria-current={active ? 'page' : undefined}>
        {children}
      </Link>
    </Button>
  );
}

interface MobileNavLinkProps extends NavLinkProps {
  onClick: () => void;
}

function MobileNavLink({ active, children, href, onClick }: MobileNavLinkProps) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
      className={cn(
        'flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors',
        active
          ? 'bg-secondary text-secondary-foreground'
          : 'hover:bg-accent hover:text-accent-foreground',
      )}
    >
      {children}
    </Link>
  );
}

function CartBadge({ active, itemCount }: { active: boolean; itemCount: number }) {
  return (
    <Link
      href="/cart"
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex h-9 items-center gap-2 rounded-md border px-3 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
        active ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground',
      )}
    >
      <ShoppingCart className="size-4" />
      <span>Cart</span>
      <Badge variant="secondary">{itemCount}</Badge>
    </Link>
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === '/') {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
