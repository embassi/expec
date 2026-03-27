'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase';

type Method = 'phone' | 'email';
type Step = 'input' | 'otp';

export default function LoginPage() {
  const router = useRouter();
  const [method, setMethod] = useState<Method>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<Step>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createSupabaseClient();

  function switchMethod(m: Method) {
    setMethod(m);
    setStep('input');
    setOtp('');
    setError('');
  }

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (method === 'phone') {
        const { error } = await supabase.auth.signInWithOtp({
          phone,
          options: { channel: 'whatsapp' },
        });
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw new Error(error.message);
      }
      setStep('otp');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let sessionData;
      if (method === 'phone') {
        const { data, error } = await supabase.auth.verifyOtp({
          phone,
          token: otp,
          type: 'sms',
        });
        if (error) throw new Error(error.message);
        sessionData = data;
      } else {
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: 'email',
        });
        if (error) throw new Error(error.message);
        sessionData = data;
      }

      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('No session returned');

      // Store the Supabase JWT as an HttpOnly cookie for SSR and set up our user
      const res = await fetch('/api/auth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ access_token: accessToken, refresh_token: sessionData.session?.refresh_token }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(err.message ?? 'Login failed');
      }

      router.replace('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  }

  const identifier = method === 'phone' ? phone : email;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Simsim</h1>
          <p className="text-sm text-gray-500 mt-1">Community Manager Dashboard</p>
        </div>

        {/* Method toggle */}
        <div className="flex rounded-lg border border-gray-200 p-1 mb-6 gap-1">
          <button
            type="button"
            onClick={() => switchMethod('phone')}
            className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${
              method === 'phone'
                ? 'bg-brand-600 text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            WhatsApp
          </button>
          <button
            type="button"
            onClick={() => switchMethod('email')}
            className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${
              method === 'email'
                ? 'bg-brand-600 text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Email
          </button>
        </div>

        {step === 'input' ? (
          <form onSubmit={handleRequest} className="space-y-4">
            {method === 'phone' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
                <input
                  type="tel"
                  placeholder="+20..."
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            )}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 rounded-lg text-sm disabled:opacity-50"
            >
              {loading
                ? 'Sending…'
                : method === 'phone'
                ? 'Send OTP via WhatsApp'
                : 'Send OTP via Email'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-sm text-gray-600">
              Enter the 6-digit code sent to <strong>{identifier}</strong>
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">OTP code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                autoComplete="one-time-code"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 tracking-widest text-center text-lg"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 rounded-lg text-sm disabled:opacity-50"
            >
              {loading ? 'Verifying…' : 'Verify & Sign in'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('input'); setOtp(''); setError(''); }}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              ← Change {method === 'phone' ? 'number' : 'email'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
