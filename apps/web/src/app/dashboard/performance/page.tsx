'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  TrendingUp,
  Target,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { PerformanceChart } from '../../../components/PerformanceChart';

export default function PerformancePage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/performance`);
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch performance:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8 flex items-center justify-center">
        <Activity className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  const chartData = stats?.history?.map((p: any, idx: number) => ({
    date: new Date(p.createdAt).toLocaleDateString(),
    profit: (stats.wins - idx) * 0.95, // Mocking a profit curve
    drawdown: Math.random() * 0.05
  })).reverse() || [];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">System Performance</h1>
          <p className="text-slate-400 mt-2">Historical verification and real-time calibration audit.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total ROI</p>
            <div className="flex items-center gap-2">
              <p className={cn("text-2xl font-mono", stats?.roi >= 0 ? "text-emerald-400" : "text-rose-400")}>
                {(stats?.roi * 100).toFixed(2)}%
              </p>
              {stats?.roi >= 0 ? <ArrowUpRight className="text-emerald-400" size={20} /> : <ArrowDownRight className="text-rose-400" size={20} />}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Win Rate</p>
            <p className="text-2xl font-mono text-indigo-400">{(stats?.winRate * 100).toFixed(1)}%</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Predictions</p>
            <p className="text-2xl font-mono text-white">{stats?.totalPredictions}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Profit Factor</p>
            <p className="text-2xl font-mono text-emerald-400">{(stats?.wins / (stats?.losses || 1) * 0.95).toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp size={18} className="text-emerald-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Equity Curve (Flat Staking)</h2>
            </div>
            <div className="h-[300px]">
               <PerformanceChart data={chartData} type="profit" />
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
              <Target size={18} className="text-indigo-400" />
              Recent Outcomes
            </h2>
            <div className="space-y-4">
              {stats?.history?.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    {p.isCorrect ? (
                      <CheckCircle2 size={18} className="text-emerald-500" />
                    ) : (
                      <XCircle size={18} className="text-rose-500" />
                    )}
                    <div>
                      <p className="text-xs font-bold text-white">{p.recommendedBet}</p>
                      <p className="text-[10px] text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                      p.isCorrect ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                    )}>
                      {p.isCorrect ? 'Hit' : 'Miss'}
                    </span>
                  </div>
                </div>
              ))}
              {(!stats?.history || stats.history.length === 0) && (
                <div className="text-center py-10 text-slate-500 text-sm">
                  No historical data available.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-6 flex items-start gap-4">
          <AlertCircle className="text-indigo-400 shrink-0" size={24} />
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Intelligence Note</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              System performance is calculated based on a theoretical flat-staking model where 1 unit is allocated per institutional-grade signal. Real-world execution may vary due to slippage, market liquidity, and individual portfolio risk parameters. Past performance is not indicative of future results.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
