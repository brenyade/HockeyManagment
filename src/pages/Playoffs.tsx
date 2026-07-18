import { useState } from 'react';
import { useLeagueStore } from '../store/useLeagueStore';
import { teamName } from '../utils/format';

const ROUND_NAMES: Record<number, string> = { 1: 'Conference Quarterfinals', 2: 'Conference Finals', 3: 'League Final' };

export default function Playoffs() {
  const league = useLeagueStore((s) => s.league)!;
  const simNext = useLeagueStore((s) => s.simNext);
  const [busy, setBusy] = useState(false);

  const handleSim = async () => {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 150));
    simNext();
    setBusy(false);
  };

  if (league.phase !== 'playoffs' && league.playoffSeries.length === 0) {
    return (
      <div className="page">
        <div className="page-header"><h1>Playoffs</h1></div>
        <div className="card"><p className="muted">The playoff bracket will appear here once the regular season concludes.</p></div>
      </div>
    );
  }

  const rounds = [1, 2, 3];
  const champion = league.champions.find((c) => c.season === league.season);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Playoffs</h1>
        {league.phase === 'playoffs' && (
          <button className="btn btn-primary" disabled={busy} onClick={handleSim}>
            {busy ? 'Simulating…' : 'Sim Playoff Games'}
          </button>
        )}
      </div>

      {champion && (
        <div className="card champion-banner">
          🏆 {teamName(league.teams.find((t) => t.id === champion.teamId)!)} are the {league.season} Champions!
        </div>
      )}

      {rounds.map((round) => {
        const series = league.playoffSeries.filter((s) => s.round === round);
        if (series.length === 0) return null;
        return (
          <div className="card" key={round}>
            <h3>{ROUND_NAMES[round]}</h3>
            <div className="bracket-grid">
              {series.map((s) => {
                const home = league.teams.find((t) => t.id === s.homeTeamId)!;
                const away = league.teams.find((t) => t.id === s.awayTeamId)!;
                return (
                  <div className={`series-card ${s.complete ? 'series-complete' : ''}`} key={s.id}>
                    <div className={s.winnerTeamId === home.id ? 'series-winner' : ''}>{home.abbr} — {s.homeWins}</div>
                    <div className={s.winnerTeamId === away.id ? 'series-winner' : ''}>{away.abbr} — {s.awayWins}</div>
                    {s.complete && <div className="muted">Series final</div>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
