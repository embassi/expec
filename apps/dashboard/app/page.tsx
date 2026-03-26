'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    // Check session via BFF — middleware will redirect to /login if invalid
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then(res => router.replace(res.ok ? '/dashboard' : '/login'))
      .catch(() => router.replace('/login'));
  }, [router]);
  return null;
}
