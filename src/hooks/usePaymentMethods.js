'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { methodLabel } from '@/config/payment-methods';

// Payment methods from Dashboard → Payment Methods (public GET /api/settings/payments), loaded once per page
let cached = null;
const load = () => (cached ??= api.get('/settings/payments').then((res) => res.data.data.methods || []).catch(() => ((cached = null), [])));

export default function usePaymentMethods() {
  const [methods, setMethods] = useState(null);
  useEffect(() => {
    let active = true;
    load().then((list) => active && setMethods(list));
    return () => {
      active = false;
    };
  }, []);
  return { methods: methods || [], loading: methods === null, label: (key) => methodLabel(methods || [], key), refresh: () => ((cached = null), load().then(setMethods)) };
}
