'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Terminal System Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-slate-950 p-6 text-center">
      <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-8 border border-rose-500/20 shadow-lg shadow-rose-500/10">
        <ShieldAlert className="text-rose-500" size={40} />
      </div>

      <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">System Fault Detected</h1>
      <p className="text-slate-400 max-w-md mb-10 leading-relaxed">
        The intelligence stream has encountered a critical runtime exception. The terminal environment has been isolated to prevent further data corruption.
      </p>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-10 w-full max-w-lg text-left">
        <div className="flex items-center gap-2 text-rose-400 font-mono text-xs uppercase font-bold mb-3">
          <AlertTriangle size={14} />
          Error Signature
        </div>
        <code className="text-slate-300 font-mono text-sm break-all">
          {error.message || 'UNKNOWN_RUNTIME_EXCEPTION'}
          {error.digest && <div className="mt-1 text-slate-600">Digest: {error.digest}</div>}
        </code>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-bold transition-all shadow-lg shadow-indigo-600/20"
        >
          <RefreshCcw size={18} />
          Reboot Terminal
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-white px-8 py-3 rounded-lg font-bold hover:bg-slate-800 transition-all"
        >
          <Home size={18} />
          Return to Hub
        </Link>
      </div>

      <div className="mt-16 text-[10px] text-slate-700 font-mono uppercase tracking-[0.3em]">
        Institutional Intelligence Platform · Isolation Mode v1.0.4
      </div>
    </div>
  );
}
