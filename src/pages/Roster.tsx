import { useMemo, useState } from 'react';
import { useLeagueStore } from '../store/useLeagueStore';
import { fullName, isGoalieStats, overallGrade, salaryFmt, savePct } from '../utils/format';
import type { Player } from '../types';

type SortKey = 'overall' | 'age' | 'pts' | 'salary' | 'name';

export default function Roster() {
  const league = useLeagueStore((s) => s.league)!;
  const resignPlayer = useLeagueStore((s) => s.resignPlayer);
  const releasePlayer = useLeagueStore((s) => s.releasePlayer);
  const userTeam = league.teams.find((t) => t.id === league.userTeamId)!;
  const [sortKey, setSortKey] = useState<SortKey>('overall');
  const [selected, setSelected] = useState<Player | null>(null);

  const players = useMemo(() => {
    const list = userTeam.roster.map((id) => league.players[id]);
    return list.sort((a, b) => {
      if (sortKey === 'name') return a.lastName.localeCompare(b.lastName);
      if (sortKey === 'age') return a.age - b.age;
      if (sortKey === 'salary') return b.contract.salary - a.contract.salary;
      if (sortKey === 'pts') {
        const ap = isGoalieStats(a.seasonStats) ? 0 : a.seasonStats.pts;
        const bp = isGoalieStats(b.seasonStats) ? 0 : b.seasonStats.pts;
        return bp - ap;
      }
      return b.overall - a.overall;
    });
  }, [league.players, userTeam.roster, sortKey]);

  const totalSalary = players.reduce((sum, p) => sum + p.contract.salary, 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Roster</h1>
        <div className="muted">{players.length} players · Cap hit {salaryFmt(totalSalary)}</div>
      </div>
      <div className="sort-bar">
        Sort by:
        {(['overall', 'name', 'age', 'pts', 'salary'] as SortKey[]).map((k) => (
          <button key={k} className={`chip ${sortKey === k ? 'active' : ''}`} onClick={() => setSortKey(k)}>{k}</button>
        ))}
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Player</th><th>Pos</th><th>Age</th><th>OVR</th><th>Grade</th>
              <th>Stats</th><th>Salary</th><th>Yrs</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id} className={p.injury ? 'row-injured' : ''} onClick={() => setSelected(p)}>
                <td className="player-cell">{fullName(p)} {p.isRookie && <span className="tag">R</span>}</td>
                <td>{p.position}</td>
                <td>{p.age}</td>
                <td><strong>{p.overall}</strong></td>
                <td>{overallGrade(p.overall)}</td>
                <td>
                  {isGoalieStats(p.seasonStats)
                    ? `${p.seasonStats.w}-${p.seasonStats.l}-${p.seasonStats.otl}, ${savePct(p.seasonStats)}`
                    : `${p.seasonStats.g}G ${p.seasonStats.a}A ${p.seasonStats.pts}P`}
                </td>
                <td>{salaryFmt(p.contract.salary)}</td>
                <td>{p.contract.yearsLeft}</td>
                <td>{p.injury ? `OUT (${p.injury.gamesRemaining})` : 'Healthy'}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  {p.contract.yearsLeft <= 1 && (
                    <button className="btn btn-small" onClick={() => resignPlayer(p.id)}>Re-sign</button>
                  )}
                  <button className="btn btn-small btn-danger" onClick={() => {
                    if (confirm(`Release ${fullName(p)}?`)) releasePlayer(p.id);
                  }}>Release</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{fullName(selected)}</h2>
            <div className="muted">{selected.position} · Age {selected.age} · OVR {selected.overall} · POT {selected.potential}</div>
            <div className="attr-grid">
              {Object.entries(selected.attributes).map(([k, v]) => (
                <div key={k} className="attr-row">
                  <span>{k}</span>
                  <div className="attr-bar"><div className="attr-bar-fill" style={{ width: `${v}%` }} /></div>
                  <span>{v}</span>
                </div>
              ))}
            </div>
            <div className="muted">Morale: {selected.morale} · Stamina: {selected.stamina} · Salary: {salaryFmt(selected.contract.salary)} ({selected.contract.yearsLeft} yrs)</div>
            <button className="btn" onClick={() => setSelected(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
