import { useEffect, useState } from 'react';
import { useLeagueStore } from '../store/useLeagueStore';
import { isUsersTurnToDraft } from '../engine/offseason';
import { fullName } from '../utils/format';

export default function Draft() {
  const league = useLeagueStore((s) => s.league)!;
  const draftUserPick = useLeagueStore((s) => s.draftUserPick);
  const draftAutoStep = useLeagueStore((s) => s.draftAutoStep);
  const [autoRunning, setAutoRunning] = useState(false);

  const usersTurn = isUsersTurnToDraft(league);
  const pickNum = league.draftPickIndex + 1;
  const round = league.draftPickIndex >= league.teams.length ? 2 : 1;

  useEffect(() => {
    if (!autoRunning) return;
    if (usersTurn || league.phase !== 'draft') { setAutoRunning(false); return; }
    const t = window.setTimeout(() => draftAutoStep(), 260);
    return () => window.clearTimeout(t);
  }, [autoRunning, usersTurn, league.phase, league.draftPickIndex, draftAutoStep]);

  if (league.phase !== 'draft') {
    return <div className="page"><div className="card">Draft complete. Returning to season…</div></div>;
  }

  const onClockTeam = league.teams.find((t) => t.id === league.draftOrder[league.draftPickIndex]);
  const prospects = [...league.draftClass].sort((a, b) => league.players[b].potential - league.players[a].potential);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Entry Draft — Round {round}</h1>
        <div className="muted">Pick #{pickNum} of {league.draftOrder.length}</div>
      </div>

      <div className="card">
        <h3>On the Clock: {onClockTeam ? `${onClockTeam.city} ${onClockTeam.name}` : 'Draft Complete'}</h3>
        {usersTurn ? (
          <p>It's your pick! Select a prospect below.</p>
        ) : (
          <button className="btn btn-primary" onClick={() => setAutoRunning(true)} disabled={autoRunning}>
            {autoRunning ? 'Simulating picks…' : 'Simulate to My Next Pick'}
          </button>
        )}
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Prospect</th><th>Pos</th><th>Age</th><th>OVR</th><th>POT</th><th></th></tr></thead>
          <tbody>
            {prospects.map((id) => {
              const p = league.players[id];
              return (
                <tr key={id}>
                  <td>{fullName(p)}</td>
                  <td>{p.position}</td>
                  <td>{p.age}</td>
                  <td>{p.overall}</td>
                  <td><strong>{p.potential}</strong></td>
                  <td>
                    {usersTurn && (
                      <button className="btn btn-small" onClick={() => draftUserPick(id)}>Draft</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
