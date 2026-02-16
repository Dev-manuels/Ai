'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, RefreshCcw, Mail, ShieldAlert } from 'lucide-react';

export default function AuthCodeError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const code = searchParams.get('code');
  const description = searchParams.get('description');

  useEffect(() => {
    if (error || code) {
      console.error('[Auth Monitoring] Auth Code Error Page accessed:', {
        error,
        code,
        description,
        timestamp: new Date().toISOString()
      });
    }
  }, [error, code, description]);

  let title = "Authentication Error";
  let message = "The authentication link you used is invalid or has expired.";
  let Icon = AlertTriangle;
  let iconColor = "text-rose-500";
  let bgColor = "bg-rose-500/10";

  if (code === 'otp_expired' || error === 'access_denied') {
    title = "Link Expired";
    message = "For security, authentication links expire quickly. This link is no longer valid.";
    Icon = RefreshCcw;
  } else if (error === 'exchange_error') {
    title = "Connection Error";
    message = "We couldn't verify your session. This can happen if you use the same link twice or click it in a different browser.";
    Icon = ShieldAlert;
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
        <div className={`w-16 h-16 ${bgColor} rounded-full flex items-center justify-center mx-auto mb-6`}>
          <Icon className={iconColor} size={32} />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
        {description && (
          <p className="text-rose-400/80 text-xs font-mono mb-4 px-4 py-2 bg-rose-500/5 rounded border border-rose-500/10">
            {description}
          </p>
        )}
        <p className="text-slate-400 mb-8 leading-relaxed">
          {message} Please try signing in again to receive a new secure link.
        </p>

        <div className="space-y-4">
          <Link
            href="/auth/signin"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
          >
            <Mail size={18} />
            Request New Link
          </Link>

          <Link
            href="/"
            className="w-full text-slate-500 hover:text-slate-300 text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          <p className="text-[10px] text-slate-600 uppercase tracking-widest pt-6 border-t border-slate-800/50">
            Error Ref: {code || error || 'AUTH_UNKNOWN'}
          </p>
        </div>
      </div>
    </div>
  );
}
