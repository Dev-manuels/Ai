'use client';

import React from 'react';

interface StrategyInfo {
  id: string;
  name: string;
  type: string;
  allocation: number;
  contribution: number;
  sharpe: number;
}

export const StrategyPerformance: React.FC = () => {
  const strategies: StrategyInfo[] = [
    { id: '1', name: 'PL Underdog Pre-match', type: 'PRE_MATCH', allocation: 0.4, contribution: 0.021, sharpe: 2.1 },
    { id: '2', name: 'Live Momentum', type: 'LIVE', allocation: 0.3, contribution: 0.015, sharpe: 1.8 },
    { id: '3', name: 'Arbitrage Engine', type: 'ARBITRAGE', allocation: 0.2, contribution: 0.008, sharpe: 3.5 },
    { id: '4', name: 'Volatility Spike', type: 'VOLATILITY', allocation: 0.1, contribution: 0.005, sharpe: 1.2 },
  ];

  return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
      <h3 className="text-lg font-bold mb-6 text-slate-200 uppercase tracking-widest">Strategy Attribution</h3>
      <div className="space-y-4">
        {strategies.map((s) => (
          <div key={s.id} className="group">
            <div className="flex justify-between items-end mb-2">
              <div>
                <span className="text-sm font-medium text-slate-400 group-hover:text-indigo-400 transition-colors">{s.name}</span>
                <span className="ml-2 px-1.5 py-0.5 bg-slate-800 text-[10px] text-slate-500 rounded font-mono">{s.type}</span>
              </div>
              <span className="text-xs font-mono text-emerald-400">+{(s.contribution * 100).toFixed(2)}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-indigo-500 rounded-full"
                style={{ width: `${s.allocation * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-slate-500 font-mono">
              <span>Allocation: {(s.allocation * 100).toFixed(0)}%</span>
              <span>Sharpe: {s.sharpe.toFixed(1)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
