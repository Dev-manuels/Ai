import React from 'react';
import { PredictionCard } from '../../components/PredictionCard';

export default function Dashboard() {
  const [predictions, setPredictions] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetch('http://localhost:3001/api/predictions')
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

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Institutional Intelligence</h1>
        <p className="text-slate-400 mt-2">Quantitative edge detection for professional markets.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayPredictions.map((p, i) => (
          <PredictionCard key={i} fixture={p.fixture || p} prediction={p.prediction || p} />
        ))}
      </div>
    </div>
  );
}
