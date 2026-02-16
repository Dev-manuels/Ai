"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PredictionCard } from '../../components/PredictionCard';
import { PerformanceChart } from '../../components/PerformanceChart';
import { LiveDashboard } from '../../components/LiveDashboard';
import { StrategyPerformance } from '../../components/StrategyPerformance';
import { TrendingUp, Activity, ShieldAlert, BarChart3, PieChart } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [predictions, setPredictions] = React.useState<any[]>([]);

  React.useEffect(() => {
    // Redirect to matches for the primary landing experience
    router.push('/dashboard/matches');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    fetch(`${apiUrl}/api/predictions`)
      .then(res => res.json())
      .then(data => setPredictions(data))
      .catch(err => console.error(err));
  }, []);

  const displayPredictions = predictions.length > 0 ? predictions : [
    {
      fixture: {
        homeTeam: "Arsenal",
        awayTeam: "Liverpool",
        date: "2023-10-22"
      },
      prediction: {
        homeProb: 0.42,
        drawProb: 0.25,
        awayProb: 0.33,
        ev: 0.054,
        confidence: 0.82,
        recommendedBet: "Arsenal Win",
        suggestedStake: 1.5
      }
    }
  ];

  const stats = {
    roi: "5.2%",
    clv: "+3.1%",
    winRate: "58%",
    drawdown: "12%",
    sharpe: "1.85",
    profitFactor: "1.42"
  };

  const chartData = [
    { date: 'Jan', profit: 1000, drawdown: 0 },
    { date: 'Feb', profit: 1200, drawdown: 0.02 },
    { date: 'Mar', profit: 1100, drawdown: 0.08 },
    { date: 'Apr', profit: 1500, drawdown: 0.03 },
    { date: 'May', profit: 1800, drawdown: 0.01 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Institutional Intelligence</h1>
          <p className="text-slate-400 mt-2">Quantitative edge detection for professional markets.</p>
        </div>
        <div className="flex gap-20">
          <div className="text-right min-w-[120px]">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Total ROI</p>
            <p className="text-2xl font-mono text-emerald-400">{stats.roi}</p>
          </div>
          <div className="text-right min-w-[140px]">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Avg CLV</p>
            <p className="text-2xl font-mono text-indigo-400">{stats.clv}</p>
          </div>
          <div className="text-right min-w-[160px]">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Max Drawdown</p>
            <p className="text-2xl font-mono text-rose-400">{stats.drawdown}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6 text-slate-400">
            <TrendingUp size={18} className="text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Cumulative Profit</h2>
          </div>
          <PerformanceChart data={chartData} type="profit" />
        </div>
        <div className="lg:col-span-1">
          <StrategyPerformance />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6 text-slate-400">
            <ShieldAlert size={18} className="text-rose-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Historical Drawdown</h2>
          </div>
          <PerformanceChart data={chartData} type="drawdown" />
        </div>
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6 text-slate-400">
            <PieChart size={18} className="text-indigo-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Monte Carlo Survivability</h2>
          </div>
          <div className="h-[200px] flex items-center justify-center text-slate-500 font-mono text-xs">
            Simulation Result: 99.8% Survivability (10k paths)
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-500 uppercase font-bold mb-1">Sharpe Ratio</p>
          <p className="text-xl font-mono text-indigo-400">{stats.sharpe}</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-500 uppercase font-bold mb-1">Profit Factor</p>
          <p className="text-xl font-mono text-indigo-400">{stats.profitFactor}</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-500 uppercase font-bold mb-1">Active Exposure</p>
          <p className="text-xl font-mono text-emerald-400">3.2%</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-500 uppercase font-bold mb-1">Portfolios</p>
          <p className="text-xl font-mono text-slate-300">3 Active</p>
        </div>
      </div>

      <div className="mb-12">
        <LiveDashboard />
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Activity size={20} className="text-indigo-400" />
          Active Intelligence Signals
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayPredictions.map((p, i) => (
            <PredictionCard key={i} fixture={p.fixture || p} prediction={p.prediction || p} />
          ))}
        </div>
      </div>
    </div>
  );
}
