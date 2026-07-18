import type { Player, Team } from '../types';

export interface ActiveForwardLine {
  lw: Player | null;
  c: Player | null;
  rw: Player | null;
}
export interface ActiveDPair {
  ld: Player | null;
  rd: Player | null;
}
export interface ActiveLineup {
  forwards: ActiveForwardLine[];
  defense: ActiveDPair[];
  starter: Player | null;
  backup: Player | null;
}

function isAvailable(p: Player | undefined): p is Player {
  return !!p && !p.retired && !p.injury;
}

export function getActiveLineup(team: Team, players: Record<string, Player>): ActiveLineup {
  const used = new Set<string>();
  const roster = team.roster.map((id) => players[id]).filter((p) => p && !p.retired);

  const forwards: ActiveForwardLine[] = team.lines.forwards.map((slot) => {
    const lw = slot.lw ? players[slot.lw] : undefined;
    const c = slot.c ? players[slot.c] : undefined;
    const rw = slot.rw ? players[slot.rw] : undefined;
    return {
      lw: isAvailable(lw) ? lw : null,
      c: isAvailable(c) ? c : null,
      rw: isAvailable(rw) ? rw : null,
    };
  });
  forwards.forEach((line) => {
    if (line.lw) used.add(line.lw.id);
    if (line.c) used.add(line.c.id);
    if (line.rw) used.add(line.rw.id);
  });

  const defense: ActiveDPair[] = team.lines.defense.map((slot) => {
    const ld = slot.ld ? players[slot.ld] : undefined;
    const rd = slot.rd ? players[slot.rd] : undefined;
    return {
      ld: isAvailable(ld) ? ld : null,
      rd: isAvailable(rd) ? rd : null,
    };
  });
  defense.forEach((pair) => {
    if (pair.ld) used.add(pair.ld.id);
    if (pair.rd) used.add(pair.rd.id);
  });

  const bench = roster
    .filter((p) => isAvailable(p) && !used.has(p.id))
    .sort((a, b) => b.overall - a.overall);

  const takeReplacement = (pos: string): Player | null => {
    let idx = bench.findIndex((p) => p.position === pos);
    if (idx === -1 && (pos === 'LW' || pos === 'RW' || pos === 'C')) {
      idx = bench.findIndex((p) => p.position === 'LW' || p.position === 'RW' || p.position === 'C');
    }
    if (idx === -1) return null;
    const [p] = bench.splice(idx, 1);
    used.add(p.id);
    return p;
  };

  forwards.forEach((line) => {
    if (!line.lw) line.lw = takeReplacement('LW');
    if (!line.c) line.c = takeReplacement('C');
    if (!line.rw) line.rw = takeReplacement('RW');
  });
  defense.forEach((pair) => {
    if (!pair.ld) pair.ld = takeReplacement('D');
    if (!pair.rd) pair.rd = takeReplacement('D');
  });

  const goalies = roster
    .filter((p) => p.position === 'G' && isAvailable(p))
    .sort((a, b) => b.overall - a.overall);
  let starter = team.lines.goalies.starter ? players[team.lines.goalies.starter] : undefined;
  if (!isAvailable(starter)) starter = goalies[0];
  let backup = team.lines.goalies.backup ? players[team.lines.goalies.backup] : undefined;
  if (!isAvailable(backup) || backup?.id === starter?.id) {
    backup = goalies.find((g) => g.id !== starter?.id);
  }

  return {
    forwards,
    defense,
    starter: isAvailable(starter) ? starter : null,
    backup: isAvailable(backup) ? backup : null,
  };
}
