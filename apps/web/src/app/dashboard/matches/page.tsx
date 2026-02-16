'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Search,
  Trophy,
  AlertCircle
} from 'lucide-react';
import { PredictionCard } from '../../../components/PredictionCard';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Fixture {
  id: string;
  date: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  league: { name: string; country: string };
  status: string;
  predictions: any[];
}

export default function MatchesPage() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [leagues, setLeagues] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

        const [fixturesRes, leaguesRes] = await Promise.all([
          fetch(`${apiUrl}/api/fixtures`),
          fetch(`${apiUrl}/api/leagues`)
        ]);

        const fixturesData = await fixturesRes.json();
        const leaguesData = await leaguesRes.json();

        setFixtures(fixturesData);
        setLeagues(leaguesData);
      } catch (err) {
        console.error('Failed to fetch matches:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredFixtures = fixtures.filter(f => {
    const matchesSearch = f.homeTeam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         f.awayTeam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         f.league.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLeague = !selectedLeague || f.league.name === selectedLeague;
    return matchesSearch && matchesLeague;
  });

  const groupedFixtures = filteredFixtures.reduce((acc, fixture) => {
    const leagueName = fixture.league.name;
    if (!acc[leagueName]) acc[leagueName] = [];
    acc[leagueName].push(fixture);
    return acc;
  }, {} as Record<string, Fixture[]>);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Daily Intel</h1>
              <p className="text-slate-400 mt-1">Institutional-grade signals for today's global markets.</p>
            </div>
            <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2">
              <Calendar size={18} className="text-indigo-400" />
              <span className="text-sm font-medium">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </header>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search teams, leagues, or countries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <button
              onClick={() => setSelectedLeague(null)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border",
                !selectedLeague
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
              )}
            >
              All Leagues
            </button>
            {leagues.map(league => (
              <button
                key={league.id}
                onClick={() => setSelectedLeague(league.name)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border",
                  selectedLeague === league.name
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                )}
              >
                {league.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-6 w-48 bg-slate-900 rounded mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="h-48 bg-slate-900 rounded-2xl"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : Object.keys(groupedFixtures).length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-3xl">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="text-slate-500" size={32} />
            </div>
            <h3 className="text-xl font-bold text-white">No matches found</h3>
            <p className="text-slate-400 mt-2">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(groupedFixtures).map(([leagueName, matches]) => (
              <div key={leagueName}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center">
                    <Trophy size={16} className="text-indigo-400" />
                  </div>
                  <h2 className="text-lg font-bold uppercase tracking-wider text-slate-300">{leagueName}</h2>
                  <div className="h-px flex-1 bg-slate-800 ml-2"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {matches.map((match) => (
                    <PredictionCard
                      key={match.id}
                      fixture={match}
                      prediction={match.predictions[0]}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
