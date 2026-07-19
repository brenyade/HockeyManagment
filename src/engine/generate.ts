import type { RNG } from './rng';
import { randInt, clamp, gaussian } from './rng';
import { randomName } from '../data/names';
import { NHL_TEAMS } from '../data/nhlTeams';
import { STAR_TALENT } from '../data/starPlayers';
import nhlRosters from '../data/nhlRosters.json';
import type {
  Player, Team, League, Position, Attributes, Lines, TeamRecord, SkaterStats, GoalieStats,
} from '../types';

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${idCounter}_${Math.random().toString(36).slice(2, 7)}`;
}

function emptySkaterStats(): SkaterStats {
  return { gp: 0, g: 0, a: 0, pts: 0, pim: 0, shots: 0, plusMinus: 0 };
}
function emptyGoalieStats(): GoalieStats {
  return { gp: 0, w: 0, l: 0, otl: 0, so: 0, shotsAgainst: 0, goalsAgainst: 0 };
}

function computeOverall(position: Position, a: Attributes): number {
  if (position === 'G') {
    return Math.round(a.goaltending * 0.82 + a.skating * 0.18);
  }
  if (position === 'D') {
    return Math.round(
      a.skating * 0.2 + a.shooting * 0.1 + a.passing * 0.15 + a.defense * 0.35 + a.physicality * 0.2,
    );
  }
  return Math.round(
    a.skating * 0.25 + a.shooting * 0.28 + a.passing * 0.22 + a.defense * 0.12 + a.physicality * 0.13,
  );
}

interface GenPlayerOpts {
  position: Position;
  ageMin: number;
  ageMax: number;
  talentTier: number; // 0-1, higher = better league-wide talent baseline
  rookie?: boolean;
  firstName?: string;
  lastName?: string;
  age?: number;
}

export function generatePlayer(rng: RNG, opts: GenPlayerOpts): Player {
  const generated = randomName(rng);
  const firstName = opts.firstName ?? generated.firstName;
  const lastName = opts.lastName ?? generated.lastName;
  const age = opts.age ?? randInt(rng, opts.ageMin, opts.ageMax);
  const baseline = 45 + opts.talentTier * 35; // 45-80 baseline center
  const spread = 14;

  const mk = () => clamp(Math.round(gaussian(rng, baseline, spread)), 25, 99);

  let attributes: Attributes;
  if (opts.position === 'G') {
    attributes = {
      skating: clamp(Math.round(gaussian(rng, baseline - 10, spread)), 20, 90),
      shooting: randInt(rng, 20, 40),
      passing: randInt(rng, 25, 45),
      defense: randInt(rng, 25, 45),
      physicality: clamp(Math.round(gaussian(rng, baseline - 5, spread)), 25, 90),
      goaltending: mk(),
    };
  } else if (opts.position === 'D') {
    attributes = {
      skating: mk(),
      shooting: clamp(Math.round(gaussian(rng, baseline - 8, spread)), 20, 95),
      passing: mk(),
      defense: clamp(Math.round(gaussian(rng, baseline + 5, spread)), 25, 99),
      physicality: clamp(Math.round(gaussian(rng, baseline + 3, spread)), 25, 99),
      goaltending: randInt(rng, 5, 15),
    };
  } else {
    attributes = {
      skating: mk(),
      shooting: clamp(Math.round(gaussian(rng, baseline + 4, spread)), 20, 99),
      passing: mk(),
      defense: clamp(Math.round(gaussian(rng, baseline - 10, spread)), 20, 90),
      physicality: mk(),
      goaltending: randInt(rng, 5, 15),
    };
  }

  // Age effect: young players get potential boost, older players slightly reduced current attrs
  let potential = clamp(computeOverall(opts.position, attributes) + randInt(rng, 0, 18), 40, 99);
  if (age > 30) {
    const decline = Math.round((age - 30) * randInt(rng, 1, 2));
    (Object.keys(attributes) as (keyof Attributes)[]).forEach((k) => {
      if (k !== 'goaltending' || opts.position === 'G') {
        attributes[k] = clamp(attributes[k] - Math.round(decline * 0.6), 20, 99);
      }
    });
    potential = computeOverall(opts.position, attributes);
  }
  if (opts.rookie) {
    potential = clamp(potential + randInt(rng, 5, 15), 40, 99);
  }

  const overall = computeOverall(opts.position, attributes);
  const salaryBase = 700 + overall * 90 + Math.max(0, overall - 75) * 150;

  return {
    id: nextId('p'),
    firstName,
    lastName,
    age,
    position: opts.position,
    attributes,
    overall,
    potential: Math.max(potential, overall),
    morale: randInt(rng, 55, 85),
    stamina: 100,
    injury: null,
    contract: { salary: Math.round(salaryBase), yearsLeft: randInt(rng, 1, 5) },
    seasonStats: opts.position === 'G' ? emptyGoalieStats() : emptySkaterStats(),
    careerGoals: 0,
    careerPoints: 0,
    isRookie: !!opts.rookie,
    retired: false,
  };
}

function emptyLines(): Lines {
  return {
    forwards: [
      { lw: null, c: null, rw: null },
      { lw: null, c: null, rw: null },
      { lw: null, c: null, rw: null },
      { lw: null, c: null, rw: null },
    ],
    defense: [
      { ld: null, rd: null },
      { ld: null, rd: null },
      { ld: null, rd: null },
    ],
    goalies: { starter: null, backup: null },
  };
}

export function autoAssignLines(team: Team, players: Record<string, Player>) {
  const roster = team.roster.map((id) => players[id]).filter((p) => !p.retired);
  const byPos = (pos: Position) =>
    roster.filter((p) => p.position === pos).sort((a, b) => b.overall - a.overall);
  const c = byPos('C');
  const lw = byPos('LW');
  const rw = byPos('RW');
  const d = byPos('D');
  const g = byPos('G');

  const lines = emptyLines();
  for (let i = 0; i < 4; i++) {
    lines.forwards[i] = {
      c: c[i]?.id ?? null,
      lw: lw[i]?.id ?? null,
      rw: rw[i]?.id ?? null,
    };
  }
  for (let i = 0; i < 3; i++) {
    lines.defense[i] = {
      ld: d[i * 2]?.id ?? null,
      rd: d[i * 2 + 1]?.id ?? null,
    };
  }
  lines.goalies = { starter: g[0]?.id ?? null, backup: g[1]?.id ?? null };
  team.lines = lines;
}

function emptyRecord(): TeamRecord {
  return { wins: 0, losses: 0, otLosses: 0, points: 0, goalsFor: 0, goalsAgainst: 0, streak: '' };
}

interface RealRosterEntry {
  first: string;
  last: string;
  pos: Position;
  age: number;
}

const NHL_ROSTERS = nhlRosters as Record<string, RealRosterEntry[]>;

/** Builds one real-world NHL team, populated with its actual current roster. */
export function buildRealTeam(rng: RNG, players: Record<string, Player>, abbr: string): Team {
  const meta = NHL_TEAMS.find((t) => t.abbr === abbr)!;
  const entries = NHL_ROSTERS[abbr] ?? [];
  const talentTier = randInt(rng, 45, 65) / 100;

  const roster: string[] = [];
  entries.forEach((entry) => {
    const fullName = `${entry.first} ${entry.last}`;
    const starTier = STAR_TALENT[fullName];
    const player = generatePlayer(rng, {
      position: entry.pos,
      ageMin: entry.age,
      ageMax: entry.age,
      age: entry.age,
      firstName: entry.first,
      lastName: entry.last,
      talentTier: starTier ?? clamp(talentTier + (rng() - 0.5) * 0.3, 0.1, 0.9),
    });
    players[player.id] = player;
    roster.push(player.id);
  });

  // Every NHL club needs at least two netminders to run a starter/backup
  // rotation; a handful of rosters only list one signed goalie mid-offseason.
  const goalieCount = entries.filter((e) => e.pos === 'G').length;
  for (let i = goalieCount; i < 2; i++) {
    const backup = generatePlayer(rng, {
      position: 'G',
      ageMin: 21,
      ageMax: 30,
      talentTier: clamp(talentTier - 0.1, 0.1, 0.7),
    });
    players[backup.id] = backup;
    roster.push(backup.id);
  }

  const team: Team = {
    id: nextId('t'),
    city: meta.city,
    name: meta.name,
    abbr: meta.abbr,
    color: meta.color,
    colorSecondary: meta.colorSecondary,
    roster,
    lines: emptyLines(),
    record: emptyRecord(),
    isUser: false,
    conference: meta.conference,
  };
  autoAssignLines(team, players);
  return team;
}

export function generateLeague(rng: RNG, leagueName: string): League {
  idCounter = 0;
  const players: Record<string, Player> = {};
  const teams: Team[] = NHL_TEAMS.map((meta) => buildRealTeam(rng, players, meta.abbr));

  const draftClass = generateDraftClass(rng, players, teams.length * 2 + 10);

  return {
    id: nextId('lg'),
    name: leagueName,
    season: 2026,
    day: 0,
    teams,
    players,
    freeAgents: [],
    schedule: [],
    userTeamId: teams[0].id,
    phase: 'regular',
    playoffSeries: [],
    draftClass,
    draftOrder: [],
    draftPickIndex: 0,
    champions: [],
    news: [],
  };
}

export function generateDraftClass(
  rng: RNG,
  players: Record<string, Player>,
  count: number,
): string[] {
  const posCycle: Position[] = ['C', 'LW', 'RW', 'D', 'D', 'G'];
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    const position = posCycle[i % posCycle.length];
    const p = generatePlayer(rng, {
      position,
      ageMin: 18,
      ageMax: 19,
      talentTier: randInt(rng, 20, 60) / 100,
      rookie: true,
    });
    players[p.id] = p;
    ids.push(p.id);
  }
  return ids.sort((a, b) => players[b].potential - players[a].potential);
}

export { nextId };
