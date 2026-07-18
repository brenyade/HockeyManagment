import { useMemo, useState } from 'react';
import { useLeagueStore } from '../store/useLeagueStore';

export default function Schedule() {
  const league = useLeagueStore((s) => s.league)!;
  const userTeam = league.teams.find((t) => t.id === league.userTeamId)!;
  const [onlyMine, setOnlyMine] = useState(true);

  const games = useMemo(() => {
    let list = league.schedule.filter((g) => !g.isPlayoff);
    if (onlyMine) list = list.filter((g) => g.homeTeamId === userTeam.id || g.awayTeamId === userTeam.id);
    return list;
  }, [league.schedule, onlyMine, userTeam.id]);

  const teamAbbr = (id: string) => league.teams.find((t) => t.id === id)?.abbr ?? '???';

  return (
    <div className="page">
      <div className="page-header">
        <h1>Schedule</h1>
        <label className="check-label">
          <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} />
          My team only
        </label>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Day</th><th>Away</th><th></th><th>Home</th><th>Result</th></tr></thead>
          <tbody>
            {games.map((g) => (
              <tr key={g.id} className={g.day === league.day ? 'highlight-row' : ''}>
                <td>{g.day}</td>
                <td>{teamAbbr(g.awayTeamId)}</td>
                <td>@</td>
                <td>{teamAbbr(g.homeTeamId)}</td>
                <td>
                  {g.played && g.result
                    ? `${g.result.awayScore} - ${g.result.homeScore}${g.result.shootout ? ' (SO)' : g.result.overtime ? ' (OT)' : ''}`
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
