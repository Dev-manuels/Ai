'use client';

import React, { useEffect, useState } from 'react';
import {
  Database,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ArrowUpRight,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';

export default function ResearchDashboard() {
  const [models, setModels] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function fetchData() {
    setIsRefreshing(true);
    try {
      const headers = { 'X-API-KEY': 'inst-key-123' };
      const [modelsRes, metricsRes] = await Promise.all([
        fetch('/api/research/models', { headers }),
        fetch('/api/research/metrics', { headers })
      ]);
      const modelsData = await modelsRes.json();
      const metricsData = await metricsRes.json();
      setModels(modelsData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Failed to fetch research data', error);
      // Fallback data for demonstration if API is not available
      setModels([
        { id: 'm1', name: 'Dixon-Coles-v4', version: '4.2.1', status: 'PRODUCTION', metrics: { log_loss: 0.6842 }, createdAt: new Date() },
        { id: 'm2', name: 'XGBoost-Momentum', version: '1.0.4', status: 'STAGING', metrics: { log_loss: 0.6711 }, createdAt: new Date() },
        { id: 'm3', name: 'Poisson-Live-v2', version: '2.1.0', status: 'PRODUCTION', metrics: { log_loss: 0.6925 }, createdAt: new Date() },
      ]);
      setMetrics([
        { id: 'me1', modelName: 'Dixon-Coles-v4', metricName: 'drift_index', value: 0.042, createdAt: new Date() },
        { id: 'me2', modelName: 'XGBoost-Momentum', metricName: 'log_loss', value: 0.6711, createdAt: new Date() },
        { id: 'me3', modelName: 'Poisson-Live-v2', metricName: 'brier_score', value: 0.1842, createdAt: new Date() },
      ]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const approveModel = async (id: string) => {
    try {
      await fetch(`/api/research/models/${id}/approve`, {
        method: 'POST',
        headers: { 'X-API-KEY': 'inst-key-123' }
      });
      setModels(models.map(m => m.id === id ? { ...m, status: 'PRODUCTION' } : m));
    } catch (error) {
      // For demo, just update state
      setModels(models.map(m => m.id === id ? { ...m, status: 'PRODUCTION' } : m));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] text-slate-500 font-mono text-sm">
        <RefreshCw className="animate-spin mb-4 text-indigo-500" size={32} />
        INITIALIZING RESEARCH INTELLIGENCE...
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 text-white p-8">
      <header className="mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Database className="text-indigo-400" size={28} />
            Autonomous Research & Governance
          </h1>
          <p className="text-slate-400 mt-2">Model registry, performance lineage, and production lifecycle management.</p>
        </div>
        <button
          onClick={fetchData}
          disabled={isRefreshing}
          className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          Refresh Registry
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
        <div className="lg:col-span-3 bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400" />
              Model Registry & Lifecycle
            </h2>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                <input
                  type="text"
                  placeholder="Filter models..."
                  className="bg-slate-950 border border-slate-800 rounded-md py-1 pl-8 pr-3 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button className="p-1.5 bg-slate-950 border border-slate-800 rounded-md text-slate-500 hover:text-white">
                <Filter size={14} />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="bg-slate-900/20 text-slate-500 text-xs font-bold uppercase tracking-tighter">
                  <th className="px-6 py-4 border-b border-slate-800">Model Name</th>
                  <th className="px-6 py-4 border-b border-slate-800">Version</th>
                  <th className="px-6 py-4 border-b border-slate-800 text-center">Status</th>
                  <th className="px-6 py-4 border-b border-slate-800">Log Loss</th>
                  <th className="px-6 py-4 border-b border-slate-800">Deployed</th>
                  <th className="px-6 py-4 border-b border-slate-800 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {models.map((model) => (
                  <tr key={model.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-200">{model.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono uppercase">ID: {model.id}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-indigo-400">{model.version}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest border ${
                          model.status === 'PRODUCTION'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {model.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-300">{model.metrics?.log_loss || 'N/A'}</td>
                    <td className="px-6 py-4 text-slate-500 text-sm">{new Date(model.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      {model.status !== 'PRODUCTION' ? (
                        <button
                          onClick={() => approveModel(model.id)}
                          className="bg-indigo-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
                        >
                          Approve
                        </button>
                      ) : (
                        <button className="text-slate-600 group-hover:text-slate-400 transition-colors">
                          <ArrowUpRight size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-400" />
              Live Drift Alerts
            </h3>
            <div className="space-y-4">
              {metrics.filter(m => m.metricName.includes('drift')).map(m => (
                <div key={m.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/50"></div>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-slate-300">{m.modelName}</span>
                    <span className="text-[10px] font-mono text-amber-400">{(m.value * 100).toFixed(2)}%</span>
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">PSI DRIFT DETECTED</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
              <Activity size={14} className="text-indigo-400" />
              Calibration
            </h3>
            <div className="space-y-4">
              {metrics.filter(m => m.metricName === 'log_loss' || m.metricName === 'brier_score').slice(0, 3).map(m => (
                <div key={m.id} className="flex justify-between items-center p-2 border-b border-slate-800/50 last:border-0">
                  <div className="text-xs">
                    <div className="text-slate-300 font-bold">{m.modelName}</div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase">{m.metricName}</div>
                  </div>
                  <div className="text-sm font-mono text-emerald-400">{m.value.toFixed(4)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
