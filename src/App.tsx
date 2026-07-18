import { useState } from 'react';
import { useLeagueStore } from './store/useLeagueStore';
import NewGameSetup from './pages/NewGameSetup';
import Dashboard from './pages/Dashboard';
import Roster from './pages/Roster';
import Lines from './pages/Lines';
import Schedule from './pages/Schedule';
import Standings from './pages/Standings';
import GameCenter from './pages/GameCenter';
import Playoffs from './pages/Playoffs';
import Trades from './pages/Trades';
import FreeAgency from './pages/FreeAgency';
import Draft from './pages/Draft';
import StatsLeaders from './pages/StatsLeaders';
import './App.css';

export type Tab =
  | 'dashboard' | 'roster' | 'lines' | 'schedule' | 'standings'
  | 'gamecenter' | 'playoffs' | 'trades' | 'freeagency' | 'stats';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 'roster', label: 'Roster', icon: '📋' },
  { id: 'lines', label: 'Lines', icon: '🧩' },
  { id: 'schedule', label: 'Schedule', icon: '📅' },
  { id: 'standings', label: 'Standings', icon: '📊' },
  { id: 'gamecenter', label: 'Game Center', icon: '🏒' },
  { id: 'playoffs', label: 'Playoffs', icon: '🏆' },
  { id: 'stats', label: 'Stat Leaders', icon: '⭐' },
  { id: 'trades', label: 'Trades', icon: '🔁' },
  { id: 'freeagency', label: 'Free Agency', icon: '✍️' },
];

function App() {
  const league = useLeagueStore((s) => s.league);
  const resetSave = useLeagueStore((s) => s.resetSave);
  const [tab, setTab] = useState<Tab>('dashboard');

  if (!league) return <NewGameSetup />;

  const userTeam = league.teams.find((t) => t.id === league.userTeamId)!;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div
            className="team-badge"
            style={{ background: userTeam.color, boxShadow: `inset 0 0 0 3px ${userTeam.colorSecondary}` }}
          >
            {userTeam.abbr}
          </div>
          <div>
            <div className="sidebar-team-name">{userTeam.city} {userTeam.name}</div>
            <div className="sidebar-season">{league.season} Season · Day {league.day}</div>
          </div>
        </div>
        <nav>
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`nav-btn ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
              disabled={league.phase === 'draft'}
            >
              <span className="nav-icon">{t.icon}</span>{t.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className={`phase-pill phase-${league.phase}`}>{league.phase.toUpperCase()}</span>
          <button
            className="btn btn-ghost btn-small"
            onClick={() => {
              if (confirm('Abandon this franchise and start over? This cannot be undone.')) resetSave();
            }}
          >
            New Franchise
          </button>
        </div>
      </aside>
      <main className="content">
        {league.phase === 'draft' ? (
          <Draft />
        ) : (
          <>
            {tab === 'dashboard' && <Dashboard onNavigate={setTab} />}
            {tab === 'roster' && <Roster />}
            {tab === 'lines' && <Lines />}
            {tab === 'schedule' && <Schedule />}
            {tab === 'standings' && <Standings />}
            {tab === 'gamecenter' && <GameCenter />}
            {tab === 'playoffs' && <Playoffs />}
            {tab === 'trades' && <Trades />}
            {tab === 'freeagency' && <FreeAgency />}
            {tab === 'stats' && <StatsLeaders />}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
