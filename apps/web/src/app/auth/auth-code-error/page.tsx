'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

export default function AuthCodeError() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="text-rose-500" size={32} />
        </div>

        <h1 className="text-2xl font-bold text-white mb-4">Authentication Error</h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          The authentication link you used is invalid or has expired.
          Please try signing in again to receive a new link.
        </p>

        <div className="space-y-4">
          <Link
            href="/auth/signin"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
          >
            <ArrowLeft size={18} />
            Back to Login
          </Link>

          <p className="text-xs text-slate-500 uppercase tracking-widest pt-4">
            Security Code: ERR_AUTH_CODE_INVALID
          </p>
        </div>
      </div>
    </div>
  );
}
