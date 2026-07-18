import { useMemo, useState } from 'react';
import { generateLeague } from '../engine/generate';
import { useLeagueStore } from '../store/useLeagueStore';
import { teamName } from '../utils/format';
import type { Team } from '../types';

export default function NewGameSetup() {
  const startFranchise = useLeagueStore((s) => s.startFranchise);
  const [leagueName, setLeagueName] = useState('Pro Hockey League');
  const [preview] = useState(() => generateLeague(Math.random, 'preview'));
  const [selectedTeamId, setSelectedTeamId] = useState<string>(preview.teams[0].id);

  const eastTeams = useMemo(() => preview.teams.filter((t) => t.conference === 'East'), [preview]);
  const westTeams = useMemo(() => preview.teams.filter((t) => t.conference === 'West'), [preview]);

  const start = () => {
    preview.name = leagueName || 'Pro Hockey League';
    startFranchise(preview, selectedTeamId);
  };

  const TeamCard = ({ t }: { t: Team }) => (
    <button
      className={`team-card ${selectedTeamId === t.id ? 'selected' : ''}`}
      style={{ borderColor: t.color }}
      onClick={() => setSelectedTeamId(t.id)}
    >
      <span className="team-swatch" style={{ background: t.color, boxShadow: `inset 0 0 0 3px ${t.colorSecondary}` }} />
      <span className="team-card-name">
        <strong>{t.city}</strong>
        <span>{t.name}</span>
      </span>
      <span className="team-card-abbr">{t.abbr}</span>
    </button>
  );

  return (
    <div className="new-game-screen">
      <div className="new-game-hero">
        <h1>🏒 Ice Manager</h1>
        <p>Build a champion. Draft prospects, manage lines, make trades, and chase the cup.</p>
      </div>
      <div className="new-game-form">
        <label>
          League Name
          <input value={leagueName} onChange={(e) => setLeagueName(e.target.value)} maxLength={40} />
        </label>
        <h3>Choose Your Team</h3>
        <div className="conference-columns">
          <div>
            <h4>Eastern Conference</h4>
            <div className="team-grid">
              {eastTeams.map((t) => <TeamCard key={t.id} t={t} />)}
            </div>
          </div>
          <div>
            <h4>Western Conference</h4>
            <div className="team-grid">
              {westTeams.map((t) => <TeamCard key={t.id} t={t} />)}
            </div>
          </div>
        </div>
        <div className="selected-team-preview">
          Selected: <strong>{teamName(preview.teams.find((t) => t.id === selectedTeamId)!)}</strong>
        </div>
        <button className="btn btn-primary btn-large" onClick={start}>Start Franchise</button>
      </div>
    </div>
  );
}
