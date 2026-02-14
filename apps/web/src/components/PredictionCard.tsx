import React from 'react';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export const PredictionCard = ({ fixture, prediction }: any) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 shadow-xl">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold">
            {fixture.homeTeam} <span className="text-slate-500 font-normal mx-1">vs</span> {fixture.awayTeam}
          </h3>
          <p className="text-sm text-slate-400">{fixture.date}</p>
        </div>
        {prediction.confidence >= 0.75 && (
          <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-500/20">
            <ShieldCheck size={14} />
            Institutional Grade
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-slate-800/50 rounded-lg">
          <p className="text-xs text-slate-500 uppercase font-bold mb-1">Home</p>
          <p className="text-xl font-mono">{(prediction.homeProb * 100).toFixed(1)}%</p>
        </div>
        <div className="text-center p-3 bg-slate-800/50 rounded-lg">
          <p className="text-xs text-slate-500 uppercase font-bold mb-1">Draw</p>
          <p className="text-xl font-mono">{(prediction.drawProb * 100).toFixed(1)}%</p>
        </div>
        <div className="text-center p-3 bg-slate-800/50 rounded-lg">
          <p className="text-xs text-slate-500 uppercase font-bold mb-1">Away</p>
          <p className="text-xl font-mono">{(prediction.awayProb * 100).toFixed(1)}%</p>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg mb-4">
        <div>
          <p className="text-xs text-indigo-400 uppercase font-bold">Recommended Bet</p>
          <p className="text-lg font-bold text-white">{prediction.recommendedBet}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-indigo-400 uppercase font-bold">Expected Value</p>
          <p className="text-lg font-bold text-emerald-400">
            {(prediction.ev * 100).toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  );
};
