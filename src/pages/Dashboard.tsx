import { useMemo, useState } from 'react';
import { useLeagueStore } from '../store/useLeagueStore';
import type { Tab } from '../App';
import { conferenceStandings } from '../engine/standings';
import { teamName } from '../utils/format';

export default function Dashboard({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  const league = useLeagueStore((s) => s.league)!;
  const simNext = useLeagueStore((s) => s.simNext);
  const [busy, setBusy] = useState(false);
  const userTeam = league.teams.find((t) => t.id === league.userTeamId)!;

  const nextGame = useMemo(
    () => league.schedule.find((g) => !g.played && (g.homeTeamId === userTeam.id || g.awayTeamId === userTeam.id)),
    [league.schedule, userTeam.id],
  );

  const recentGames = useMemo(
    () => league.schedule
      .filter((g) => g.played && (g.homeTeamId === userTeam.id || g.awayTeamId === userTeam.id))
      .slice(-5)
      .reverse(),
    [league.schedule, userTeam.id],
  );

  const standings = conferenceStandings(league.teams, userTeam.conference);
  const rank = standings.findIndex((t) => t.id === userTeam.id) + 1;

  const injured = userTeam.roster
    .map((id) => league.players[id])
    .filter((p) => p.injury);

  const handleSim = async () => {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 150));
    simNext();
    setBusy(false);
  };

  return (
    <div className="page dashboard">
      <div className="page-header">
        <h1>{teamName(userTeam)}</h1>
        <div className="record-pill">
          {userTeam.record.wins}-{userTeam.record.losses}-{userTeam.record.otLosses} · {userTeam.record.points} PTS · #{rank} {userTeam.conference}
        </div>
      </div>

      <div className="dash-grid">
        <div className="card next-game-card">
          <h3>Next Game</h3>
          {nextGame ? (
            <>
              <div className="matchup">
                {league.teams.find((t) => t.id === nextGame.awayTeamId)?.abbr}
                <span className="at">@</span>
                {league.teams.find((t) => t.id === nextGame.homeTeamId)?.abbr}
              </div>
              <div className="muted">Day {nextGame.day}</div>
            </>
          ) : (
            <div className="muted">No more regular season games scheduled.</div>
          )}
          <button className="btn btn-primary" disabled={busy} onClick={handleSim}>
            {busy ? 'Simulating…' : league.phase === 'playoffs' ? 'Sim Playoff Round' : 'Sim Next Day'}
          </button>
          <button className="btn btn-ghost" onClick={() => onNavigate('gamecenter')}>View Last Game</button>
        </div>

        <div className="card">
          <h3>League News</h3>
          <ul className="news-list">
            {league.news.slice(0, 8).map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </div>

        <div className="card">
          <h3>{userTeam.conference}ern Conference Standings</h3>
          <table className="mini-table">
            <tbody>
              {standings.slice(0, 8).map((t, i) => (
                <tr key={t.id} className={t.id === userTeam.id ? 'highlight-row' : ''}>
                  <td>{i + 1}</td>
                  <td>{t.abbr}</td>
                  <td>{t.record.wins}-{t.record.losses}-{t.record.otLosses}</td>
                  <td>{t.record.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="btn btn-ghost btn-small" onClick={() => onNavigate('standings')}>Full Standings</button>
        </div>

        <div className="card">
          <h3>Recent Results</h3>
          {recentGames.length === 0 && <div className="muted">No games played yet.</div>}
          <ul className="results-list">
            {recentGames.map((g) => {
              const home = league.teams.find((t) => t.id === g.homeTeamId)!;
              const away = league.teams.find((t) => t.id === g.awayTeamId)!;
              const win = (g.homeTeamId === userTeam.id && g.result!.homeScore > g.result!.awayScore)
                || (g.awayTeamId === userTeam.id && g.result!.awayScore > g.result!.homeScore);
              return (
                <li key={g.id} className={win ? 'win' : 'loss'}>
                  {away.abbr} {g.result!.awayScore} @ {home.abbr} {g.result!.homeScore}
                  {g.result!.shootout ? ' (SO)' : g.result!.overtime ? ' (OT)' : ''}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="card">
          <h3>Injury Report</h3>
          {injured.length === 0 && <div className="muted">Everyone is healthy.</div>}
          <ul className="results-list">
            {injured.map((p) => (
              <li key={p.id}>{p.firstName} {p.lastName} — {p.injury!.description} ({p.injury!.gamesRemaining} games)</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
