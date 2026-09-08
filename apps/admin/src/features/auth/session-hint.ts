'use client';

import { useEffect, useState } from 'react';

const AUTH_SESSION_HINT_KEY = 'ep-auth-session';
const AUTH_SESSION_HINT_EVENT = 'ep-auth-session-change';

export function hasAuthSessionHint() {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(AUTH_SESSION_HINT_KEY) === 'true';
}

export function setAuthSessionHint() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(AUTH_SESSION_HINT_KEY, 'true');
  window.dispatchEvent(new Event(AUTH_SESSION_HINT_EVENT));
}

export function clearAuthSessionHint() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(AUTH_SESSION_HINT_KEY);
  window.dispatchEvent(new Event(AUTH_SESSION_HINT_EVENT));
}

export function useAuthSessionHint() {
  const [hasHint, setHasHint] = useState(hasAuthSessionHint);

  useEffect(() => {
    function syncHint() {
      setHasHint(hasAuthSessionHint());
    }

    window.addEventListener('storage', syncHint);
    window.addEventListener(AUTH_SESSION_HINT_EVENT, syncHint);

    return () => {
      window.removeEventListener('storage', syncHint);
      window.removeEventListener(AUTH_SESSION_HINT_EVENT, syncHint);
    };
  }, []);

  return hasHint;
}
