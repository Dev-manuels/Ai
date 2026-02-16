'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { PerformanceChart } from '@/components/PerformanceChart';
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  History,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function PortfolioPage() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchPortfolio = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/portfolios`, {
          headers: { 'x-user-id': user.id }
        });
        const data = await res.json();
        setPortfolio(data[0]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [user]);

  if (loading) {
    return <div className="p-8 animate-pulse text-slate-500">Loading portfolio intelligence...</div>;
  }

  if (!portfolio) {
    return (
      <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-3xl m-8">
        <AlertCircle className="mx-auto mb-4 text-slate-500" size={48} />
        <h2 className="text-xl font-bold text-white">No Active Portfolio</h2>
        <p className="text-slate-400 mt-2">Place your first simulated bet to initialize your portfolio.</p>
      </div>
    );
  }

  const totalProfit = portfolio.bankroll - portfolio.initialBankroll;
  const roi = (totalProfit / portfolio.initialBankroll) * 100;

  const chartData = [
    { date: 'Initial', profit: portfolio.initialBankroll, drawdown: 0 },
    { date: 'Current', profit: portfolio.bankroll, drawdown: 0 }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">Portfolio Alpha</h1>
          <p className="text-slate-400 mt-2">Management and performance tracking for simulated capital.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Wallet size={64} />
             </div>
             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Available Bankroll</p>
             <p className="text-3xl font-mono font-bold text-white">${portfolio.bankroll.toLocaleString()}</p>
             <div className="mt-4 flex items-center gap-2">
                <span className={cn(
                  "flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border",
                  totalProfit >= 0 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                )}>
                  {totalProfit >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {roi.toFixed(2)}% ROI
                </span>
                <span className="text-[10px] text-slate-500 uppercase font-mono">Total P/L: ${totalProfit.toLocaleString()}</span>
             </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Risk Strategy</p>
             <p className="text-3xl font-mono font-bold text-indigo-400">Fractional Kelly</p>
             <div className="mt-4 flex items-center gap-2">
                <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold px-2 py-0.5 rounded-full">
                  Multiplier: {portfolio.riskValue}
                </span>
             </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">System Status</p>
             <p className="text-3xl font-mono font-bold text-emerald-400">Active</p>
             <div className="mt-4 flex items-center gap-2">
                <span className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full">
                  <ShieldCheck size={12} /> Circuit Breaker: Nominal
                </span>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp size={20} className="text-indigo-500" />
                  Equity Curve
                </h3>
              </div>
              <PerformanceChart data={chartData} type="profit" />
            </div>

            <div>
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <History size={20} className="text-indigo-500" />
                Recent Positions
              </h3>
              <div className="space-y-3">
                {portfolio.bets && portfolio.bets.length === 0 && (
                  <p className="text-slate-500 italic p-8 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl text-center">
                    No positions recorded yet.
                  </p>
                )}
                {portfolio.bets && portfolio.bets.slice().reverse().map((bet: any) => (
                  <div key={bet.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between group hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs",
                        bet.status === 'WON' ? "bg-emerald-500/10 text-emerald-500" :
                        bet.status === 'LOST' ? "bg-rose-500/10 text-rose-500" :
                        "bg-slate-800 text-slate-400"
                      )}>
                        {bet.status === 'WON' ? 'W' : bet.status === 'LOST' ? 'L' : 'P'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          {bet.prediction.fixture.homeTeam.name} vs {bet.prediction.fixture.awayTeam.name}
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase font-mono mt-0.5">
                          {bet.betType} @ {bet.odds.toFixed(2)} | Stake: ${bet.stake}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-sm font-mono font-bold",
                        bet.profit > 0 ? "text-emerald-400" : bet.profit < 0 ? "text-rose-400" : "text-slate-400"
                      )}>
                        {bet.profit > 0 ? '+' : ''}{bet.profit !== null ? `$${bet.profit.toFixed(2)}` : 'Pending'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {new Date(bet.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
             <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Risk Analytics</h4>
                <div className="space-y-6">
                   <div>
                      <div className="flex justify-between text-xs mb-2">
                         <span className="text-slate-400 font-medium">Drawdown Recovery</span>
                         <span className="text-white font-mono">94%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                         <div className="h-full bg-indigo-500 w-[94%]"></div>
                      </div>
                   </div>
                   <div>
                      <div className="flex justify-between text-xs mb-2">
                         <span className="text-slate-400 font-medium">Capital Exposure</span>
                         <span className="text-emerald-400 font-mono">Low</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                         <div className="h-full bg-emerald-500 w-[12%]"></div>
                      </div>
                   </div>
                </div>
             </div>

             <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-6">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Portfolio Insight</h4>
                <p className="text-xs text-indigo-300 leading-relaxed">
                  Your current allocation follows a conservative 0.25 Kelly multiplier. This strategy prioritizes bankroll survivability over aggressive growth, aiming for a 99.8% recovery probability from typical drawdowns.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
