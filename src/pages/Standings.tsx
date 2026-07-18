import { useLeagueStore } from '../store/useLeagueStore';
import { conferenceStandings } from '../engine/standings';
import { teamName } from '../utils/format';

function Table({ title, teams, userTeamId }: { title: string; teams: ReturnType<typeof conferenceStandings>; userTeamId: string }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>#</th><th>Team</th><th>GP</th><th>W</th><th>L</th><th>OTL</th><th>PTS</th><th>GF</th><th>GA</th><th>DIFF</th><th>STRK</th></tr>
          </thead>
          <tbody>
            {teams.map((t, i) => {
              const gp = t.record.wins + t.record.losses + t.record.otLosses;
              const diff = t.record.goalsFor - t.record.goalsAgainst;
              return (
                <tr key={t.id} className={t.id === userTeamId ? 'highlight-row' : ''}>
                  <td>{i + 1}</td>
                  <td>{teamName(t)}</td>
                  <td>{gp}</td>
                  <td>{t.record.wins}</td>
                  <td>{t.record.losses}</td>
                  <td>{t.record.otLosses}</td>
                  <td><strong>{t.record.points}</strong></td>
                  <td>{t.record.goalsFor}</td>
                  <td>{t.record.goalsAgainst}</td>
                  <td>{diff > 0 ? `+${diff}` : diff}</td>
                  <td>{t.record.streak || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Standings() {
  const league = useLeagueStore((s) => s.league)!;
  const east = conferenceStandings(league.teams, 'East');
  const west = conferenceStandings(league.teams, 'West');

  return (
    <div className="page">
      <div className="page-header"><h1>Standings</h1></div>
      <Table title="Eastern Conference" teams={east} userTeamId={league.userTeamId} />
      <Table title="Western Conference" teams={west} userTeamId={league.userTeamId} />
    </div>
  );
}
