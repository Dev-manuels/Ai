"use client";

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface PerformanceChartProps {
  data: any[];
  type: 'profit' | 'drawdown';
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ data, type }) => {
  return (
    <div className="h-[300px] w-full bg-slate-900/50 border border-slate-800 rounded-xl p-4">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'profit' ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
              itemStyle={{ color: '#10b981' }}
            />
            <Line
              type="monotone"
              dataKey="profit"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        ) : (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
              itemStyle={{ color: '#ef4444' }}
            />
            <Area
              type="monotone"
              dataKey="drawdown"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.1}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};
