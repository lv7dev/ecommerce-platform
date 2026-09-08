export function getSafeRedirectPath(value: string | null | undefined, fallback = '/products') {
  if (!value?.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }

  return value;
}
