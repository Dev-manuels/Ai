'use client';

import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');

export const LiveDashboard: React.FC = () => {
  const [signals, setSignals] = useState<any[]>([]);
  const [liveProbs, setLiveProbs] = useState<Record<string, any>>({});

  useEffect(() => {
    socket.on('signal:new', (data) => {
      setSignals((prev) => [data, ...prev].slice(0, 10));
    });

    socket.on('prediction:update', (data) => {
      setLiveProbs((prev) => ({
        ...prev,
        [data.fixtureId]: data.probs
      }));
    });

    return () => {
      socket.off('signal:new');
      socket.off('prediction:update');
    };
  }, []);

  return (
    <div className="p-4 bg-slate-900 text-white rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-4">Real-Time Intelligence</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-semibold mb-2">Live EV Signals</h3>
          <div className="space-y-2">
            {signals.map((s, i) => (
              <div key={i} className="p-3 bg-slate-800 rounded border-l-4 border-green-500">
                <div className="flex justify-between">
                  <span className="font-bold">{s.fixtureId}</span>
                  <span className="text-green-400">EV: {(s.signal.ev * 100).toFixed(1)}%</span>
                </div>
                <div className="text-sm text-slate-400">
                  {s.signal.selection} @ {s.signal.odds.toFixed(2)}
                </div>
                <div className="text-xs mt-1 text-slate-500">
                  Status: {s.execution.status} | Delay: {s.execution.delay.toFixed(1)}s
                </div>
              </div>
            ))}
            {signals.length === 0 && <p className="text-slate-500">Waiting for signals...</p>}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Match Momentum</h3>
          <div className="space-y-2">
            {Object.entries(liveProbs).map(([id, probs]) => (
              <div key={id} className="p-3 bg-slate-800 rounded">
                <div className="font-bold mb-1">Fixture: {id}</div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="p-1 bg-slate-700 rounded">H: {(probs.home * 100).toFixed(0)}%</div>
                  <div className="p-1 bg-slate-700 rounded">D: {(probs.draw * 100).toFixed(0)}%</div>
                  <div className="p-1 bg-slate-700 rounded">A: {(probs.away * 100).toFixed(0)}%</div>
                </div>
              </div>
            ))}
            {Object.keys(liveProbs).length === 0 && <p className="text-slate-500">No active matches...</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
