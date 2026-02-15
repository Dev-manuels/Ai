'use client';

import React, { useEffect, useState } from 'react';

export default function ResearchDashboard() {
  const [models, setModels] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const headers = { 'X-API-KEY': 'inst-key-123' }; // In production, this would come from env/auth
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
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const approveModel = async (id) => {
    try {
      await fetch(`/api/research/models/${id}/approve`, {
        method: 'POST',
        headers: { 'X-API-KEY': 'inst-key-123' }
      });
      setModels(models.map(m => m.id === id ? { ...m, status: 'PRODUCTION' } : m));
    } catch (error) {
      alert('Failed to approve model');
    }
  };

  if (loading) return <div>Loading Research Intelligence...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Autonomous Research & Governance</h1>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Model Registry & Lifecycle</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Model Name</th>
                <th className="px-4 py-2 border">Version</th>
                <th className="px-4 py-2 border">Status</th>
                <th className="px-4 py-2 border">Log Loss</th>
                <th className="px-4 py-2 border">Created At</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {models.map((model) => (
                <tr key={model.id}>
                  <td className="px-4 py-2 border">{model.name}</td>
                  <td className="px-4 py-2 border">{model.version}</td>
                  <td className="px-4 py-2 border">
                    <span className={`px-2 py-1 rounded text-xs ${
                      model.status === 'PRODUCTION' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {model.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 border">{model.metrics?.log_loss || 'N/A'}</td>
                  <td className="px-4 py-2 border">{new Date(model.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-2 border">
                    {model.status !== 'PRODUCTION' && (
                      <button
                        onClick={() => approveModel(model.id)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Model Drift & Performance Monitoring</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 border rounded">
            <h3 className="font-medium mb-3">Recent Drift Alerts</h3>
            <ul className="space-y-2">
              {metrics.filter(m => m.metricName.includes('drift')).slice(0, 5).map(m => (
                <li key={m.id} className="text-sm border-b pb-1">
                  <span className="font-semibold">{m.modelName}</span>: {m.metricName} = <span className={m.value < 0.05 ? 'text-red-600' : ''}>{m.value.toFixed(4)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white p-4 border rounded">
            <h3 className="font-medium mb-3">Calibration Metrics</h3>
            <ul className="space-y-2">
              {metrics.filter(m => m.metricName === 'log_loss' || m.metricName === 'brier_score').slice(0, 5).map(m => (
                <li key={m.id} className="text-sm border-b pb-1">
                  <span className="font-semibold">{m.modelName}</span>: {m.metricName} = {m.value.toFixed(4)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
