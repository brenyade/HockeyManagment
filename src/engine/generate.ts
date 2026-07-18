import type { RNG } from './rng';
import { randInt, clamp, gaussian } from './rng';
import { randomName, CITIES, TEAM_NICKNAMES, TEAM_COLORS } from '../data/names';
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
}

export function generatePlayer(rng: RNG, opts: GenPlayerOpts): Player {
  const { firstName, lastName } = randomName(rng);
  const age = randInt(rng, opts.ageMin, opts.ageMax);
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

const ROSTER_POSITIONS: Position[] = [
  'C', 'C', 'C', 'C', 'LW', 'LW', 'LW', 'LW', 'RW', 'RW', 'RW', 'RW',
  'D', 'D', 'D', 'D', 'D', 'D', 'G', 'G',
];

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

export function generateTeam(
  rng: RNG,
  players: Record<string, Player>,
  city: string,
  nickname: string,
  colors: [string, string],
  conference: 'East' | 'West',
  talentTier: number,
): Team {
  const roster: string[] = [];
  for (const pos of ROSTER_POSITIONS) {
    const ageMin = pos === 'G' ? 20 : 18;
    const player = generatePlayer(rng, {
      position: pos,
      ageMin,
      ageMax: 36,
      talentTier: clamp(talentTier + (rng() - 0.5) * 0.3, 0.1, 0.95),
    });
    players[player.id] = player;
    roster.push(player.id);
  }

  const team: Team = {
    id: nextId('t'),
    city,
    name: nickname,
    abbr: (city.slice(0, 1) + nickname.slice(0, 2)).toUpperCase(),
    color: colors[0],
    colorSecondary: colors[1],
    roster,
    lines: emptyLines(),
    record: emptyRecord(),
    isUser: false,
    conference,
  };
  autoAssignLines(team, players);
  return team;
}

export function generateLeague(rng: RNG, leagueName: string): League {
  idCounter = 0;
  const players: Record<string, Player> = {};
  const teams: Team[] = [];
  const cityOrder = [...CITIES];
  const nickOrder = [...TEAM_NICKNAMES];
  const numTeams = 16;

  for (let i = 0; i < numTeams; i++) {
    const conference: 'East' | 'West' = i % 2 === 0 ? 'East' : 'West';
    const talentTier = randInt(rng, 30, 70) / 100;
    const team = generateTeam(
      rng,
      players,
      cityOrder[i % cityOrder.length],
      nickOrder[i % nickOrder.length],
      TEAM_COLORS[i % TEAM_COLORS.length],
      conference,
      talentTier,
    );
    teams.push(team);
  }

  const draftClass = generateDraftClass(rng, players, 40);

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
    lastGameLog: null,
    lastGameTeams: null,
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
