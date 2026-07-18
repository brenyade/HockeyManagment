import type { League, Player } from '../types';
import type { RNG } from './rng';
import { clamp, randInt } from './rng';
import { generateDraftClass, generatePlayer, autoAssignLines } from './generate';
import { generateSchedule } from './schedule';

function emptySeasonStats(p: Player) {
  if (p.position === 'G') {
    p.seasonStats = { gp: 0, w: 0, l: 0, otl: 0, so: 0, shotsAgainst: 0, goalsAgainst: 0 };
  } else {
    p.seasonStats = { gp: 0, g: 0, a: 0, pts: 0, pim: 0, shots: 0, plusMinus: 0 };
  }
}

function developPlayer(rng: RNG, p: Player) {
  p.age += 1;
  p.stamina = 100;
  p.morale = clamp(p.morale + randInt(rng, -5, 10), 20, 100);

  const growthPhase = p.age <= 24;
  const primePhase = p.age > 24 && p.age <= 29;
  const declinePhase = p.age > 29;

  const attrs = p.attributes;
  const keys = (Object.keys(attrs) as (keyof typeof attrs)[]).filter(
    (k) => (p.position === 'G' ? k === 'goaltending' || k === 'skating' : k !== 'goaltending'),
  );

  keys.forEach((k) => {
    let delta = 0;
    if (growthPhase) delta = randInt(rng, -1, 4) + (p.potential - p.overall > 10 ? 1 : 0);
    else if (primePhase) delta = randInt(rng, -1, 2);
    else if (declinePhase) delta = -randInt(rng, 0, 1 + Math.floor((p.age - 29) / 3));
    attrs[k] = clamp(attrs[k] + delta, 20, 99);
  });

  p.overall = computeOverallLocal(p);
  p.contract.yearsLeft = Math.max(0, p.contract.yearsLeft - 1);
}

function computeOverallLocal(p: Player): number {
  const a = p.attributes;
  if (p.position === 'G') return Math.round(a.goaltending * 0.82 + a.skating * 0.18);
  if (p.position === 'D') {
    return Math.round(a.skating * 0.2 + a.shooting * 0.1 + a.passing * 0.15 + a.defense * 0.35 + a.physicality * 0.2);
  }
  return Math.round(a.skating * 0.25 + a.shooting * 0.28 + a.passing * 0.22 + a.defense * 0.12 + a.physicality * 0.13);
}

export function processOffseason(league: League, rng: RNG) {
  const retiredIds: string[] = [];

  Object.values(league.players).forEach((p) => {
    if (p.retired) return;
    developPlayer(rng, p);
    emptySeasonStats(p);

    const retireChance = p.age >= 38 ? 0.55 : p.age >= 35 ? 0.18 : p.age >= 33 ? 0.05 : 0;
    if (retireChance > 0 && rng() < retireChance) {
      p.retired = true;
      retiredIds.push(p.id);
    }
  });

  league.teams.forEach((team) => {
    team.roster = team.roster.filter((id) => !retiredIds.includes(id));
    // contracts expiring
    const expiring = team.roster.filter((id) => league.players[id].contract.yearsLeft <= 0);
    expiring.forEach((id) => {
      const p = league.players[id];
      if (team.isUser) {
        team.roster = team.roster.filter((rid) => rid !== id);
        league.freeAgents.push(id);
      } else {
        p.contract = { salary: Math.round(p.contract.salary * randInt(rng, 90, 115) / 100), yearsLeft: randInt(rng, 1, 4) };
      }
    });
    team.record = { wins: 0, losses: 0, otLosses: 0, points: 0, goalsFor: 0, goalsAgainst: 0, streak: '' };
  });

  // Backfill any roster short on players (from retirement) using free agents or fresh replacement-level players
  league.teams.forEach((team) => {
    while (team.roster.length < 20) {
      const needPos = shortagePosition(team, league);
      let fillId = league.freeAgents.find((id) => league.players[id].position === needPos);
      if (fillId) {
        league.freeAgents = league.freeAgents.filter((id) => id !== fillId);
      } else {
        const p = generatePlayer(rng, { position: needPos, ageMin: 22, ageMax: 32, talentTier: randInt(rng, 20, 45) / 100 });
        league.players[p.id] = p;
        fillId = p.id;
      }
      team.roster.push(fillId);
    }
    autoAssignLines(team, league.players);
  });

  league.news.unshift(`${retiredIds.length} player(s) announced their retirement this offseason.`);
}

function shortagePosition(team: League['teams'][number], league: League): 'C' | 'LW' | 'RW' | 'D' | 'G' {
  const counts: Record<string, number> = { C: 0, LW: 0, RW: 0, D: 0, G: 0 };
  team.roster.forEach((id) => { counts[league.players[id].position] += 1; });
  const targets: Record<string, number> = { C: 4, LW: 4, RW: 4, D: 6, G: 2 };
  let worst: 'C' | 'LW' | 'RW' | 'D' | 'G' = 'D';
  let worstDiff = -Infinity;
  (Object.keys(targets) as (keyof typeof targets)[]).forEach((pos) => {
    const diff = targets[pos] - counts[pos];
    if (diff > worstDiff) { worstDiff = diff; worst = pos as any; }
  });
  return worst;
}

export function beginDraft(league: League, rng: RNG) {
  const order = [...league.teams].sort((a, b) => a.record.points - b.record.points).map((t) => t.id);
  league.draftOrder = [...order, ...order]; // 2 rounds
  league.draftPickIndex = 0;
  league.draftClass = generateDraftClass(rng, league.players, 40);
  league.phase = 'draft';
  league.news.unshift(`The ${league.season + 1} Entry Draft is underway. Draft order set by reverse standings.`);
}

export function autoDraftPick(league: League, rng: RNG): { teamId: string; playerId: string } | null {
  if (league.draftPickIndex >= league.draftOrder.length || league.draftClass.length === 0) return null;
  const teamId = league.draftOrder[league.draftPickIndex];
  const best = [...league.draftClass].sort((a, b) => league.players[b].potential - league.players[a].potential);
  const pickFrom = best.slice(0, Math.min(3, best.length));
  const playerId = pickFrom[randInt(rng, 0, pickFrom.length - 1)];
  performDraftPick(league, teamId, playerId);
  return { teamId, playerId };
}

export function performDraftPick(league: League, teamId: string, playerId: string) {
  const team = league.teams.find((t) => t.id === teamId);
  if (!team) return;
  team.roster.push(playerId);
  league.draftClass = league.draftClass.filter((id) => id !== playerId);
  league.draftPickIndex += 1;
  autoAssignLines(team, league.players);
}

export function isUsersTurnToDraft(league: League): boolean {
  if (league.draftPickIndex >= league.draftOrder.length) return false;
  return league.draftOrder[league.draftPickIndex] === league.userTeamId;
}

export function finishDraftAndStartSeason(league: League, _rng: RNG) {
  // remaining undrafted prospects become free agents
  league.freeAgents.push(...league.draftClass);
  league.draftClass = [];
  league.season += 1;
  league.day += 1;
  league.schedule = generateSchedule(league.teams, league.day);
  league.day = league.schedule[0]?.day ?? league.day;
  league.phase = 'regular';
  league.playoffSeries = [];
  league.news.unshift(`The ${league.season} season is underway!`);
}
