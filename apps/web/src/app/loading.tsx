'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-slate-950 text-slate-500 font-mono text-sm">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse"></div>
        <RefreshCw className="animate-spin text-indigo-500 relative" size={48} />
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="tracking-[0.2em] font-bold">SYNCHRONIZING TERMINAL</p>
        <div className="w-48 h-1 bg-slate-900 rounded-full overflow-hidden">
          <div className="w-1/3 h-full bg-indigo-600 animate-[loading_2s_ease-in-out_infinite]"></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}
