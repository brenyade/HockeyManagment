import { useMemo } from 'react';
import { useLeagueStore } from '../store/useLeagueStore';
import { fullName, gaa, isGoalieStats, savePct } from '../utils/format';
import type { GoalieStats, SkaterStats } from '../types';

export default function StatsLeaders() {
  const league = useLeagueStore((s) => s.league)!;

  const skaters = useMemo(
    () => Object.values(league.players).filter((p) => !isGoalieStats(p.seasonStats) && !p.retired && (p.seasonStats as SkaterStats).gp > 0),
    [league.players],
  );
  const goalies = useMemo(
    () => Object.values(league.players).filter((p) => isGoalieStats(p.seasonStats) && !p.retired && (p.seasonStats as GoalieStats).gp > 0),
    [league.players],
  );

  const teamAbbr = (id: string) => {
    for (const t of league.teams) if (t.roster.includes(id)) return t.abbr;
    return 'FA';
  };

  const topPoints = [...skaters].sort((a, b) => (b.seasonStats as SkaterStats).pts - (a.seasonStats as SkaterStats).pts).slice(0, 15);
  const topGoals = [...skaters].sort((a, b) => (b.seasonStats as SkaterStats).g - (a.seasonStats as SkaterStats).g).slice(0, 15);
  const topGoalies = [...goalies].sort((a, b) => (b.seasonStats as GoalieStats).w - (a.seasonStats as GoalieStats).w).slice(0, 15);

  return (
    <div className="page">
      <div className="page-header"><h1>Stat Leaders</h1></div>
      <div className="dash-grid">
        <div className="card">
          <h3>Points Leaders</h3>
          <table className="mini-table">
            <thead><tr><th>Player</th><th>Tm</th><th>GP</th><th>G</th><th>A</th><th>P</th></tr></thead>
            <tbody>
              {topPoints.map((p) => {
                const s = p.seasonStats as SkaterStats;
                return <tr key={p.id}><td>{fullName(p)}</td><td>{teamAbbr(p.id)}</td><td>{s.gp}</td><td>{s.g}</td><td>{s.a}</td><td><strong>{s.pts}</strong></td></tr>;
              })}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h3>Goal Scorers</h3>
          <table className="mini-table">
            <thead><tr><th>Player</th><th>Tm</th><th>GP</th><th>G</th></tr></thead>
            <tbody>
              {topGoals.map((p) => {
                const s = p.seasonStats as SkaterStats;
                return <tr key={p.id}><td>{fullName(p)}</td><td>{teamAbbr(p.id)}</td><td>{s.gp}</td><td><strong>{s.g}</strong></td></tr>;
              })}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h3>Goaltenders</h3>
          <table className="mini-table">
            <thead><tr><th>Player</th><th>Tm</th><th>GP</th><th>W</th><th>SV%</th><th>GAA</th></tr></thead>
            <tbody>
              {topGoalies.map((p) => {
                const s = p.seasonStats as GoalieStats;
                return <tr key={p.id}><td>{fullName(p)}</td><td>{teamAbbr(p.id)}</td><td>{s.gp}</td><td><strong>{s.w}</strong></td><td>{savePct(s)}</td><td>{gaa(s)}</td></tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
