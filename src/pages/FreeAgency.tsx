import { useMemo, useState } from 'react';
import { useLeagueStore } from '../store/useLeagueStore';
import { fullName, salaryFmt } from '../utils/format';
import type { Position } from '../types';

export default function FreeAgency() {
  const league = useLeagueStore((s) => s.league)!;
  const signFreeAgent = useLeagueStore((s) => s.signFreeAgent);
  const userTeam = league.teams.find((t) => t.id === league.userTeamId)!;
  const [posFilter, setPosFilter] = useState<Position | 'ALL'>('ALL');

  const agents = useMemo(() => {
    let list = league.freeAgents.map((id) => league.players[id]).filter((p) => !p.retired);
    if (posFilter !== 'ALL') list = list.filter((p) => p.position === posFilter);
    return list.sort((a, b) => b.overall - a.overall);
  }, [league.freeAgents, league.players, posFilter]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Free Agency</h1>
        <div className="muted">{userTeam.roster.length}/23 roster spots used</div>
      </div>
      <div className="sort-bar">
        {(['ALL', 'C', 'LW', 'RW', 'D', 'G'] as (Position | 'ALL')[]).map((p) => (
          <button key={p} className={`chip ${posFilter === p ? 'active' : ''}`} onClick={() => setPosFilter(p)}>{p}</button>
        ))}
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Player</th><th>Pos</th><th>Age</th><th>OVR</th><th>Asking</th><th></th></tr></thead>
          <tbody>
            {agents.map((p) => (
              <tr key={p.id}>
                <td>{fullName(p)}</td>
                <td>{p.position}</td>
                <td>{p.age}</td>
                <td><strong>{p.overall}</strong></td>
                <td>{salaryFmt(p.contract.salary || 750)}</td>
                <td>
                  <button
                    className="btn btn-small"
                    disabled={userTeam.roster.length >= 23}
                    onClick={() => signFreeAgent(p.id)}
                  >
                    Sign
                  </button>
                </td>
              </tr>
            ))}
            {agents.length === 0 && <tr><td colSpan={6} className="muted">No free agents available at this position.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
