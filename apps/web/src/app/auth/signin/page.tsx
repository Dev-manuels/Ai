'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Mail, AlertCircle, Loader2, Key, ArrowRight } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function SignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleSupabaseSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${callbackUrl}`,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage('We\'ve sent a secure access link to your email.');
        setShowOtpInput(true);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (error) {
        setError(error.message);
      } else {
        router.push(callbackUrl);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-slate-800 text-center">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
            <Shield className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white">Quantum Intelligence</h1>
          <p className="text-slate-400 text-sm mt-2">Secure access to institutional signals</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-3 text-rose-400 text-sm">
              <AlertCircle size={18} className="shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-3 text-emerald-400 text-sm">
              <Shield size={18} className="shrink-0" />
              <p>{message}</p>
            </div>
          )}

          <div className="space-y-6">
              {!showOtpInput ? (
                <form onSubmit={handleSupabaseSignIn} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
                  >
                    {loading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        Send Access Link <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-center text-slate-500 uppercase tracking-widest">
                    A secure link will be sent to your inbox
                  </p>
                </form>
              ) : (
                <div className="space-y-8">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="text-emerald-400" size={32} />
                    </div>
                    <h3 className="text-white font-bold">Check your email</h3>
                    <p className="text-slate-400 text-sm">
                      We've sent a magic link to <span className="text-indigo-400">{email}</span>.
                      Click the link to sign in instantly.
                    </p>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-800"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-slate-900 px-2 text-slate-500 tracking-widest">Or enter code manually</span>
                    </div>
                  </div>

                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input
                        type="text"
                        required
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-center tracking-[0.5em] font-mono text-xl"
                        placeholder="000000"
                        maxLength={6}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
                    >
                      {loading ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        'Verify & Access'
                      )}
                    </button>
                  </form>

                  <div className="pt-4 space-y-3">
                    <button
                      type="button"
                      disabled={loading || isResending}
                      onClick={async () => {
                        setIsResending(true);
                        await handleSupabaseSignIn({ preventDefault: () => {} } as any);
                        setIsResending(false);
                      }}
                      className="w-full text-indigo-400 hover:text-indigo-300 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                      {isResending ? 'Sending...' : 'Didn\'t receive an email? Resend link'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowOtpInput(false);
                        setError('');
                        setMessage('');
                      }}
                      className="w-full text-slate-500 hover:text-slate-300 text-xs font-bold uppercase tracking-widest transition-all"
                    >
                      Back to email entry
                    </button>
                  </div>
                </div>
              )}
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-500 uppercase tracking-tighter">
              Secured by Supabase Auth · Passwordless
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
