import type { GameEvent, GameResult, BoxScoreLine, Player, Team } from '../types';
import type { RNG } from './rng';
import { clamp, poisson, randInt, weightedPick } from './rng';
import { getActiveLineup } from './lineup';
import type { ActiveForwardLine, ActiveDPair } from './lineup';

const FWD_LINE_WEIGHTS = [0.32, 0.27, 0.22, 0.19];
const D_PAIR_WEIGHTS = [0.4, 0.34, 0.26];

function avgAttr(players: (Player | null)[], fn: (p: Player) => number): number {
  const valid = players.filter((p): p is Player => !!p);
  if (valid.length === 0) return 45;
  return valid.reduce((sum, p) => sum + fn(p), 0) / valid.length;
}

function staminaFactor(p: Player | null): number {
  if (!p) return 1;
  return 0.85 + (p.stamina / 100) * 0.15;
}

function teamRatings(forwards: ActiveForwardLine[], defense: ActiveDPair[]) {
  let offense = 0;
  let defenseRating = 0;
  forwards.forEach((line, i) => {
    const units = [line.lw, line.c, line.rw];
    const off = avgAttr(units, (p) => (p.attributes.shooting * 0.4 + p.attributes.passing * 0.35 + p.attributes.skating * 0.25) * staminaFactor(p));
    const def = avgAttr(units, (p) => p.attributes.defense * 0.5 + p.attributes.physicality * 0.3 + p.attributes.skating * 0.2);
    offense += off * FWD_LINE_WEIGHTS[i] * 0.75;
    defenseRating += def * FWD_LINE_WEIGHTS[i] * 0.35;
  });
  defense.forEach((pair, i) => {
    const units = [pair.ld, pair.rd];
    const off = avgAttr(units, (p) => (p.attributes.shooting * 0.3 + p.attributes.passing * 0.3 + p.attributes.skating * 0.4) * staminaFactor(p));
    const def = avgAttr(units, (p) => p.attributes.defense * 0.6 + p.attributes.physicality * 0.25 + p.attributes.skating * 0.15);
    offense += off * D_PAIR_WEIGHTS[i] * 0.25;
    defenseRating += def * D_PAIR_WEIGHTS[i] * 0.65;
  });
  return { offense, defense: defenseRating };
}

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface GoalPick {
  scorer: Player;
  assist1: Player | null;
  assist2: Player | null;
}

function pickGoalScorer(
  rng: RNG,
  forwards: ActiveForwardLine[],
  defense: ActiveDPair[],
): GoalPick | null {
  const useForwardLine = rng() < 0.82;
  if (useForwardLine) {
    const line = weightedPick(rng, forwards, FWD_LINE_WEIGHTS);
    const units = [line.lw, line.c, line.rw].filter((p): p is Player => !!p);
    if (units.length === 0) return fallbackPick(rng, forwards, defense);
    const scorer = weightedPick(rng, units, units.map((p) => p.attributes.shooting + 10));
    return buildAssists(rng, scorer, units);
  }
  const pair = weightedPick(rng, defense, D_PAIR_WEIGHTS);
  const units = [pair.ld, pair.rd].filter((p): p is Player => !!p);
  if (units.length === 0) return fallbackPick(rng, forwards, defense);
  const scorer = weightedPick(rng, units, units.map((p) => p.attributes.shooting + 5));
  // defenseman goal - assists could come from a forward line too, but keep simple: pair mate + none
  return buildAssists(rng, scorer, units);
}

function fallbackPick(rng: RNG, forwards: ActiveForwardLine[], defense: ActiveDPair[]): GoalPick | null {
  const all: Player[] = [];
  forwards.forEach((l) => [l.lw, l.c, l.rw].forEach((p) => p && all.push(p)));
  defense.forEach((d) => [d.ld, d.rd].forEach((p) => p && all.push(p)));
  if (all.length === 0) return null;
  const scorer = weightedPick(rng, all, all.map((p) => p.attributes.shooting + 5));
  return buildAssists(rng, scorer, all);
}

function buildAssists(rng: RNG, scorer: Player, unit: Player[]): GoalPick {
  const mates = unit.filter((p) => p.id !== scorer.id);
  let assist1: Player | null = null;
  let assist2: Player | null = null;
  if (mates.length > 0 && rng() < 0.72) {
    assist1 = weightedPick(rng, mates, mates.map((p) => p.attributes.passing + 8));
    const mates2 = mates.filter((p) => p.id !== assist1!.id);
    if (mates2.length > 0 && rng() < 0.45) {
      assist2 = weightedPick(rng, mates2, mates2.map((p) => p.attributes.passing + 5));
    }
  }
  return { scorer, assist1, assist2 };
}

const FILLER_SHOT_TEXTS = [
  'fires a shot that sails wide',
  'lets a wrist shot go, blocked',
  'rings one off the post',
  'tests the goaltender with a low shot',
];
const FILLER_SAVE_TEXTS = [
  'makes a sharp glove save',
  'stops it with the pad',
  'freezes the puck for a whistle',
  'turns aside a scoring chance',
];

interface TeamSimContext {
  team: Team;
  lineup: ReturnType<typeof getActiveLineup>;
  offense: number;
  defense: number;
  goalieRating: number;
  goalie: Player | null;
}

function buildContext(team: Team, players: Record<string, Player>): TeamSimContext {
  const lineup = getActiveLineup(team, players);
  const { offense, defense } = teamRatings(lineup.forwards, lineup.defense);
  const goalie = lineup.starter ?? lineup.backup;
  const goalieRating = goalie ? goalie.attributes.goaltending * staminaFactor(goalie) : 55;
  return { team, lineup, offense, defense, goalieRating, goalie };
}

function expectedGoals(attacker: TeamSimContext, defender: TeamSimContext, home: boolean): number {
  const suppression = defender.defense * 0.42 + defender.goalieRating * 0.58;
  const offenseFactor = attacker.offense / 62;
  const suppressionFactor = 62 / Math.max(30, suppression);
  let lambda = 2.85 * offenseFactor * suppressionFactor;
  lambda *= home ? 1.06 : 0.96;
  return clamp(lambda, 0.35, 7.5);
}

function simulateGoalsForPeriods(rng: RNG, totalGoals: number): number[] {
  const weights = [0.28, 0.34, 0.38];
  const periods = [0, 0, 0];
  for (let i = 0; i < totalGoals; i++) {
    const p = weightedPick(rng, [0, 1, 2], weights);
    periods[p] += 1;
  }
  return periods;
}

export function simulateGame(
  homeTeam: Team,
  awayTeam: Team,
  players: Record<string, Player>,
  rng: RNG,
): GameResult {
  const home = buildContext(homeTeam, players);
  const away = buildContext(awayTeam, players);

  const homeLambda = expectedGoals(home, away, true);
  const awayLambda = expectedGoals(away, home, false);

  let homeGoals = clamp(poisson(rng, homeLambda), 0, 9);
  let awayGoals = clamp(poisson(rng, awayLambda), 0, 9);

  const events: GameEvent[] = [];
  const goalStatMap = new Map<string, { g: number; a: number }>();
  const shotStatMap = new Map<string, number>();
  const bumpGoal = (id: string) => {
    const cur = goalStatMap.get(id) ?? { g: 0, a: 0 };
    cur.g += 1;
    goalStatMap.set(id, cur);
  };
  const bumpAssist = (id: string) => {
    const cur = goalStatMap.get(id) ?? { g: 0, a: 0 };
    cur.a += 1;
    goalStatMap.set(id, cur);
  };
  const bumpShot = (id: string) => shotStatMap.set(id, (shotStatMap.get(id) ?? 0) + 1);

  events.push({ period: 1, time: '0:00', type: 'game-start', text: `Puck drop at center ice. ${awayTeam.city} ${awayTeam.name} at ${homeTeam.city} ${homeTeam.name}.` });

  const homePeriods = simulateGoalsForPeriods(rng, homeGoals);
  const awayPeriods = simulateGoalsForPeriods(rng, awayGoals);

  let runningHome = 0;
  let runningAway = 0;
  let homeShots = 0;
  let awayShots = 0;

  for (let period = 1; period <= 3; period++) {
    events.push({ period, time: '0:00', type: 'period-start', text: `Period ${period} begins.` });
    const periodGoalEvents: { team: 'home' | 'away'; time: number }[] = [];
    for (let i = 0; i < homePeriods[period - 1]; i++) {
      periodGoalEvents.push({ team: 'home', time: randInt(rng, 5, 1195) });
    }
    for (let i = 0; i < awayPeriods[period - 1]; i++) {
      periodGoalEvents.push({ team: 'away', time: randInt(rng, 5, 1195) });
    }
    // filler non-scoring shot chances
    const fillerCount = randInt(rng, 4, 8);
    for (let i = 0; i < fillerCount; i++) {
      periodGoalEvents.push({ team: rng() < 0.5 ? 'home' : 'away', time: randInt(rng, 5, 1195) });
    }
    periodGoalEvents.sort((a, b) => a.time - b.time);

    for (const evt of periodGoalEvents) {
      const isHomeEvt = evt.team === 'home';
      const offCtx = isHomeEvt ? home : away;
      const defCtx = isHomeEvt ? away : home;
      const goalsRemainingThisPeriod = isHomeEvt
        ? homePeriods[period - 1]
        : awayPeriods[period - 1];
      const alreadyScored = isHomeEvt
        ? events.filter((e) => e.type === 'goal' && e.teamId === homeTeam.id && e.period === period).length
        : events.filter((e) => e.type === 'goal' && e.teamId === awayTeam.id && e.period === period).length;
      const isGoal = alreadyScored < goalsRemainingThisPeriod && periodGoalEvents.filter((e) => e.team === evt.team).indexOf(evt) < goalsRemainingThisPeriod;

      if (isHomeEvt) homeShots += 1; else awayShots += 1;

      if (isGoal) {
        const pick = pickGoalScorer(rng, offCtx.lineup.forwards, offCtx.lineup.defense);
        if (pick) {
          bumpGoal(pick.scorer.id);
          bumpShot(pick.scorer.id);
          if (pick.assist1) bumpAssist(pick.assist1.id);
          if (pick.assist2) bumpAssist(pick.assist2.id);
          if (isHomeEvt) runningHome += 1; else runningAway += 1;
          const assistText = [pick.assist1, pick.assist2]
            .filter((p): p is Player => !!p)
            .map((p) => `${p.firstName[0]}. ${p.lastName}`)
            .join(', ');
          events.push({
            period,
            time: fmtTime(evt.time),
            type: 'goal',
            text: `GOAL! ${pick.scorer.firstName} ${pick.scorer.lastName} (${offCtx.team.abbr})${assistText ? ` assisted by ${assistText}` : ' unassisted'}.`,
            teamId: offCtx.team.id,
            scorerId: pick.scorer.id,
            assist1Id: pick.assist1?.id,
            assist2Id: pick.assist2?.id,
            homeScore: runningHome,
            awayScore: runningAway,
          });
        }
      } else if (rng() < 0.6) {
        const shooterPool: Player[] = [];
        offCtx.lineup.forwards.forEach((l) => [l.lw, l.c, l.rw].forEach((p) => p && shooterPool.push(p)));
        offCtx.lineup.defense.forEach((d) => [d.ld, d.rd].forEach((p) => p && shooterPool.push(p)));
        if (shooterPool.length > 0) {
          const shooter = weightedPick(rng, shooterPool, shooterPool.map((p) => p.attributes.shooting));
          bumpShot(shooter.id);
          const text = rng() < 0.5
            ? `${shooter.firstName} ${shooter.lastName} ${FILLER_SHOT_TEXTS[randInt(rng, 0, FILLER_SHOT_TEXTS.length - 1)]}.`
            : `${defCtx.goalie ? `${defCtx.goalie.firstName} ${defCtx.goalie.lastName}` : 'The goaltender'} ${FILLER_SAVE_TEXTS[randInt(rng, 0, FILLER_SAVE_TEXTS.length - 1)]} on ${shooter.lastName}.`;
          events.push({ period, time: fmtTime(evt.time), type: rng() < 0.5 ? 'shot' : 'save', text });
        }
      }
    }
    events.push({ period, time: '20:00', type: 'period-end', text: `End of period ${period}. Score: ${homeTeam.abbr} ${runningHome} - ${awayTeam.abbr} ${runningAway}.` });
  }

  homeGoals = runningHome;
  awayGoals = runningAway;
  let overtime = false;
  let shootout = false;

  if (homeGoals === awayGoals) {
    overtime = true;
    events.push({ period: 4, time: '0:00', type: 'ot-start', text: 'Overtime! 3-on-3 sudden death.' });
    const homeStrength = home.offense + home.goalieRating * 0.3;
    const awayStrength = away.offense + away.goalieRating * 0.3;
    const otDecided = rng() < 0.72;
    if (otDecided) {
      const winner = weightedPick(rng, ['home', 'away'], [homeStrength, awayStrength]);
      const ctx = winner === 'home' ? home : away;
      const pick = pickGoalScorer(rng, ctx.lineup.forwards, ctx.lineup.defense);
      const otTime = randInt(rng, 8, 299);
      if (pick) {
        bumpGoal(pick.scorer.id);
        bumpShot(pick.scorer.id);
        if (pick.assist1) bumpAssist(pick.assist1.id);
        if (winner === 'home') { homeGoals += 1; homeShots += 1; } else { awayGoals += 1; awayShots += 1; }
        const assistText = pick.assist1 ? ` assisted by ${pick.assist1.firstName[0]}. ${pick.assist1.lastName}` : ' unassisted';
        events.push({
          period: 4,
          time: fmtTime(otTime),
          type: 'goal',
          text: `OVERTIME WINNER! ${pick.scorer.firstName} ${pick.scorer.lastName} (${ctx.team.abbr})${assistText}!`,
          teamId: ctx.team.id,
          scorerId: pick.scorer.id,
          assist1Id: pick.assist1?.id,
          homeScore: homeGoals,
          awayScore: awayGoals,
        });
      }
    } else {
      shootout = true;
      events.push({ period: 5, time: '0:00', type: 'shootout', text: 'No goals in overtime. We go to a shootout!' });
      const homeSkill = home.offense;
      const awaySkill = away.offense;
      const winner = weightedPick(rng, ['home', 'away'], [homeSkill + 5, awaySkill]);
      if (winner === 'home') homeGoals += 1; else awayGoals += 1;
      events.push({
        period: 5,
        time: 'SO',
        type: 'shootout',
        text: `${winner === 'home' ? homeTeam.name : awayTeam.name} win it in the shootout, ${homeGoals}-${awayGoals}!`,
        homeScore: homeGoals,
        awayScore: awayGoals,
      });
    }
  }

  events.push({
    period: overtime ? (shootout ? 5 : 4) : 3,
    time: 'FINAL',
    type: 'game-end',
    text: `FINAL: ${homeTeam.city} ${homeTeam.name} ${homeGoals} - ${awayTeam.city} ${awayTeam.name} ${awayGoals}.`,
    homeScore: homeGoals,
    awayScore: awayGoals,
  });

  const buildBox = (ctx: TeamSimContext): BoxScoreLine[] => {
    const ids = new Set<string>();
    ctx.lineup.forwards.forEach((l) => [l.lw, l.c, l.rw].forEach((p) => p && ids.add(p.id)));
    ctx.lineup.defense.forEach((d) => [d.ld, d.rd].forEach((p) => p && ids.add(p.id)));
    return Array.from(ids).map((id) => ({
      playerId: id,
      g: goalStatMap.get(id)?.g ?? 0,
      a: goalStatMap.get(id)?.a ?? 0,
      shots: shotStatMap.get(id) ?? 0,
    }));
  };

  return {
    homeScore: homeGoals,
    awayScore: awayGoals,
    overtime,
    shootout,
    events,
    homeShots: Math.max(homeShots, homeGoals),
    awayShots: Math.max(awayShots, awayGoals),
    homeBox: buildBox(home),
    awayBox: buildBox(away),
    homeGoalieId: home.goalie?.id ?? null,
    awayGoalieId: away.goalie?.id ?? null,
  };
}
