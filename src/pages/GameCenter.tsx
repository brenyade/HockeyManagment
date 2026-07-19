import { useEffect, useMemo, useRef, useState } from 'react';
import { useLeagueStore } from '../store/useLeagueStore';
import { fullName } from '../utils/format';
import type { ScheduledGame } from '../types';

export default function GameCenter() {
  const league = useLeagueStore((s) => s.league)!;
  const userTeam = league.teams.find((t) => t.id === league.userTeamId)!;

  const playedGames = useMemo(
    () => league.schedule.filter((g) => g.played).slice().reverse(),
    [league.schedule],
  );
  const [selectedId, setSelectedId] = useState<string | null>(playedGames[0]?.id ?? null);
  const game: ScheduledGame | undefined = playedGames.find((g) => g.id === selectedId) ?? playedGames[0];

  const [revealed, setRevealed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    setRevealed(0);
    setPlaying(false);
  }, [game?.id]);

  useEffect(() => {
    if (!playing || !game?.result) return;
    if (revealed >= game.result.events.length) { setPlaying(false); return; }
    timer.current = window.setTimeout(() => setRevealed((r) => r + 1), 220);
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [playing, revealed, game]);

  if (!game || !game.result) {
    return (
      <div className="page">
        <div className="page-header"><h1>Game Center</h1></div>
        <div className="card"><p className="muted">No games have been played yet. Sim a day from the Dashboard to see play-by-play here.</p></div>
      </div>
    );
  }

  const home = league.teams.find((t) => t.id === game.homeTeamId)!;
  const away = league.teams.find((t) => t.id === game.awayTeamId)!;
  const result = game.result;
  const events = result.events.slice(0, Math.max(revealed, 1));
  const isDone = revealed >= result.events.length;

  const boxFor = (box: typeof result.homeBox) => box
    .filter((b) => b.g > 0 || b.a > 0)
    .sort((a, b) => (b.g + b.a) - (a.g + a.a));

  return (
    <div className="page">
      <div className="page-header">
        <h1>Game Center</h1>
        <select value={game.id} onChange={(e) => setSelectedId(e.target.value)}>
          {playedGames.map((g) => {
            const h = league.teams.find((t) => t.id === g.homeTeamId)!;
            const a = league.teams.find((t) => t.id === g.awayTeamId)!;
            return <option key={g.id} value={g.id}>Day {g.day}: {a.abbr} @ {h.abbr}{g.isPlayoff ? ' (Playoffs)' : ''}</option>;
          })}
        </select>
      </div>

      <div className="scoreboard">
        <div className="score-team">
          <div className="team-badge" style={{ background: away.color, boxShadow: `inset 0 0 0 3px ${away.colorSecondary}` }}>{away.abbr}</div>
          <div>{away.city} {away.name}</div>
        </div>
        <div className="score-center">
          <div className="score-big">{isDone ? result.awayScore : (events.filter((e) => e.type === 'goal' && e.teamId === away.id).length)} - {isDone ? result.homeScore : (events.filter((e) => e.type === 'goal' && e.teamId === home.id).length)}</div>
          <div className="muted">
            {isDone
              ? (result.shootout ? 'Final (SO)' : result.overtime ? 'Final (OT)' : 'Final')
              : `LIVE — Period ${events[events.length - 1]?.period ?? 1}`}
            {isDone && ` · Shots ${result.awayShots}-${result.homeShots}`}
          </div>
        </div>
        <div className="score-team">
          <div className="team-badge" style={{ background: home.color, boxShadow: `inset 0 0 0 3px ${home.colorSecondary}` }}>{home.abbr}</div>
          <div>{home.city} {home.name}</div>
        </div>
      </div>

      {result.events.length > 0 && (
        <div className="gc-controls">
          <button className="btn" onClick={() => setPlaying((p) => !p)} disabled={isDone}>
            {playing ? 'Pause' : isDone ? 'Finished' : 'Play Recap ▶'}
          </button>
          <button className="btn btn-ghost" onClick={() => setRevealed(result.events.length)}>Skip to End</button>
          <button className="btn btn-ghost" onClick={() => setRevealed(0)}>Restart</button>
        </div>
      )}

      <div className="gc-body">
        <div className="card pbp-feed">
          <h3>Play-by-Play</h3>
          {result.events.length === 0 ? (
            <p className="muted">Play-by-play for this game is no longer available — it's an older result. Final score and box score are still tracked below.</p>
          ) : (
            <ul className="pbp-list">
              {events.slice().reverse().map((e, i) => (
                <li key={i} className={`pbp-${e.type}`}>
                  <span className="pbp-time">P{e.period > 3 ? 'OT' : e.period} {e.time}</span>
                  <span>{e.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h3>Box Score</h3>
          {result.homeBox.length === 0 && result.awayBox.length === 0 ? (
            <p className="muted">Box score for this game is no longer available — it's an older result.</p>
          ) : (
            <>
              <h4>{away.abbr}</h4>
              <ul className="box-list">
                {boxFor(result.awayBox).map((b) => (
                  <li key={b.playerId}>{fullName(league.players[b.playerId])} — {b.g}G {b.a}A</li>
                ))}
                {boxFor(result.awayBox).length === 0 && <li className="muted">No points recorded.</li>}
              </ul>
              <h4>{home.abbr}</h4>
              <ul className="box-list">
                {boxFor(result.homeBox).map((b) => (
                  <li key={b.playerId}>{fullName(league.players[b.playerId])} — {b.g}G {b.a}A</li>
                ))}
                {boxFor(result.homeBox).length === 0 && <li className="muted">No points recorded.</li>}
              </ul>
            </>
          )}
        </div>
      </div>
      {(home.id === userTeam.id || away.id === userTeam.id) && <div className="muted">Your team played in this game.</div>}
    </div>
  );
}
