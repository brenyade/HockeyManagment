import { useState } from 'react';
import { useLeagueStore } from '../store/useLeagueStore';
import { autoAssignLines } from '../engine/generate';
import type { Lines as LinesType, Player, Position } from '../types';
import { fullName } from '../utils/format';

function PlayerSelect({
  value, options, onChange, placeholder,
}: {
  value: string | null;
  options: Player[];
  onChange: (id: string | null) => void;
  placeholder: string;
}) {
  return (
    <select value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
      <option value="">{placeholder}</option>
      {options.map((p) => (
        <option key={p.id} value={p.id}>{fullName(p)} ({p.overall}){p.injury ? ' 🚑' : ''}</option>
      ))}
    </select>
  );
}

export default function Lines() {
  const league = useLeagueStore((s) => s.league)!;
  const setLinesStore = useLeagueStore((s) => s.setLines);
  const userTeam = league.teams.find((t) => t.id === league.userTeamId)!;
  const [lines, setLines] = useState<LinesType>(() => structuredClone(userTeam.lines));
  const [dirty, setDirty] = useState(false);

  const roster = userTeam.roster.map((id) => league.players[id]);
  const byPos = (pos: Position) => roster.filter((p) => p.position === pos);

  const update = (mutator: (l: LinesType) => void) => {
    setLines((prev) => {
      const next = structuredClone(prev);
      mutator(next);
      return next;
    });
    setDirty(true);
  };

  const save = () => {
    setLinesStore(userTeam.id, lines);
    setDirty(false);
  };

  const autoFill = () => {
    const temp = structuredClone(userTeam);
    autoAssignLines(temp, league.players);
    setLines(temp.lines);
    setDirty(true);
  };

  const usedIds = new Set<string>();
  lines.forwards.forEach((l) => { if (l.lw) usedIds.add(l.lw); if (l.c) usedIds.add(l.c); if (l.rw) usedIds.add(l.rw); });
  lines.defense.forEach((d) => { if (d.ld) usedIds.add(d.ld); if (d.rd) usedIds.add(d.rd); });
  if (lines.goalies.starter) usedIds.add(lines.goalies.starter);
  if (lines.goalies.backup) usedIds.add(lines.goalies.backup);

  const availableFor = (id: string | null, pos: Position) =>
    byPos(pos).filter((p) => p.id === id || !usedIds.has(p.id));

  return (
    <div className="page">
      <div className="page-header">
        <h1>Line Combinations</h1>
        <div>
          <button className="btn btn-ghost" onClick={autoFill}>Auto-Fill Best</button>
          <button className="btn btn-primary" disabled={!dirty} onClick={save}>Save Lines</button>
        </div>
      </div>

      <div className="card">
        <h3>Forward Lines</h3>
        {lines.forwards.map((line, i) => (
          <div className="line-row" key={i}>
            <span className="line-label">Line {i + 1}</span>
            <PlayerSelect placeholder="LW" value={line.lw} options={availableFor(line.lw, 'LW')} onChange={(id) => update((l) => { l.forwards[i].lw = id; })} />
            <PlayerSelect placeholder="C" value={line.c} options={availableFor(line.c, 'C')} onChange={(id) => update((l) => { l.forwards[i].c = id; })} />
            <PlayerSelect placeholder="RW" value={line.rw} options={availableFor(line.rw, 'RW')} onChange={(id) => update((l) => { l.forwards[i].rw = id; })} />
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Defense Pairs</h3>
        {lines.defense.map((pair, i) => (
          <div className="line-row" key={i}>
            <span className="line-label">Pair {i + 1}</span>
            <PlayerSelect placeholder="LD" value={pair.ld} options={availableFor(pair.ld, 'D')} onChange={(id) => update((l) => { l.defense[i].ld = id; })} />
            <PlayerSelect placeholder="RD" value={pair.rd} options={availableFor(pair.rd, 'D')} onChange={(id) => update((l) => { l.defense[i].rd = id; })} />
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Goalies</h3>
        <div className="line-row">
          <span className="line-label">Starter</span>
          <PlayerSelect placeholder="Starter" value={lines.goalies.starter} options={availableFor(lines.goalies.starter, 'G')} onChange={(id) => update((l) => { l.goalies.starter = id; })} />
          <span className="line-label">Backup</span>
          <PlayerSelect placeholder="Backup" value={lines.goalies.backup} options={availableFor(lines.goalies.backup, 'G')} onChange={(id) => update((l) => { l.goalies.backup = id; })} />
        </div>
      </div>
    </div>
  );
}
