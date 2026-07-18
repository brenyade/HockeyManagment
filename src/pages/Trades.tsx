import { useMemo, useState } from 'react';
import { useLeagueStore } from '../store/useLeagueStore';
import { fullName, salaryFmt, teamName } from '../utils/format';

export default function Trades() {
  const league = useLeagueStore((s) => s.league)!;
  const executeTrade = useLeagueStore((s) => s.executeTrade);
  const userTeam = league.teams.find((t) => t.id === league.userTeamId)!;
  const otherTeams = league.teams.filter((t) => !t.isUser);

  const [otherTeamId, setOtherTeamId] = useState(otherTeams[0]?.id ?? '');
  const [giveIds, setGiveIds] = useState<string[]>([]);
  const [getIds, setGetIds] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const otherTeam = league.teams.find((t) => t.id === otherTeamId);

  const toggle = (list: string[], setList: (l: string[]) => void, id: string) => {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
    setMessage(null);
  };

  const myRoster = userTeam.roster.map((id) => league.players[id]);
  const theirRoster = useMemo(
    () => (otherTeam ? otherTeam.roster.map((id) => league.players[id]) : []),
    [otherTeam, league.players],
  );

  const propose = () => {
    if (giveIds.length === 0 || getIds.length === 0 || !otherTeamId) return;
    const result = executeTrade({ giveIds, getIds, otherTeamId });
    setMessage(result.message);
    if (result.accepted) {
      setGiveIds([]);
      setGetIds([]);
    }
  };

  return (
    <div className="page">
      <div className="page-header"><h1>Trade Center</h1></div>
      <div className="card">
        <label>
          Trade partner
          <select value={otherTeamId} onChange={(e) => { setOtherTeamId(e.target.value); setGetIds([]); }}>
            {otherTeams.map((t) => <option key={t.id} value={t.id}>{teamName(t)}</option>)}
          </select>
        </label>
      </div>

      <div className="trade-columns">
        <div className="card">
          <h3>{teamName(userTeam)} sends</h3>
          <ul className="trade-list">
            {myRoster.map((p) => (
              <li key={p.id}>
                <label>
                  <input type="checkbox" checked={giveIds.includes(p.id)} onChange={() => toggle(giveIds, setGiveIds, p.id)} />
                  {fullName(p)} · {p.position} · OVR {p.overall} · {salaryFmt(p.contract.salary)}
                </label>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3>{otherTeam ? teamName(otherTeam) : ''} sends</h3>
          <ul className="trade-list">
            {theirRoster.map((p) => (
              <li key={p.id}>
                <label>
                  <input type="checkbox" checked={getIds.includes(p.id)} onChange={() => toggle(getIds, setGetIds, p.id)} />
                  {fullName(p)} · {p.position} · OVR {p.overall} · {salaryFmt(p.contract.salary)}
                </label>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <button className="btn btn-primary" onClick={propose} disabled={giveIds.length === 0 || getIds.length === 0}>
          Propose Trade
        </button>
        {message && <p className="muted">{message}</p>}
      </div>
    </div>
  );
}
