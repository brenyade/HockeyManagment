import type { GameResult, League, ScheduledGame, SkaterStats, GoalieStats, Team } from '../types';
import type { RNG } from './rng';
import { randInt } from './rng';

function isGoalieStats(s: SkaterStats | GoalieStats): s is GoalieStats {
  return (s as GoalieStats).w !== undefined;
}

function updateTeamRecord(team: Team, goalsFor: number, goalsAgainst: number, outcome: 'W' | 'L' | 'OTL') {
  team.record.goalsFor += goalsFor;
  team.record.goalsAgainst += goalsAgainst;
  if (outcome === 'W') {
    team.record.wins += 1;
    team.record.points += 2;
  } else if (outcome === 'OTL') {
    team.record.otLosses += 1;
    team.record.points += 1;
  } else {
    team.record.losses += 1;
  }
  const streakChar = outcome === 'W' ? 'W' : 'L';
  if (team.record.streak && team.record.streak[0] === streakChar) {
    const n = parseInt(team.record.streak.slice(1), 10) || 1;
    team.record.streak = `${streakChar}${n + 1}`;
  } else {
    team.record.streak = `${streakChar}1`;
  }
}

export function applyGameResult(
  league: League,
  game: ScheduledGame,
  result: GameResult,
  rng: RNG,
) {
  const home = league.teams.find((t) => t.id === game.homeTeamId)!;
  const away = league.teams.find((t) => t.id === game.awayTeamId)!;

  // decrement existing injuries for both rosters (a game passed)
  [home, away].forEach((team) => {
    team.roster.forEach((pid) => {
      const p = league.players[pid];
      if (p?.injury) {
        p.injury.gamesRemaining -= 1;
        if (p.injury.gamesRemaining <= 0) p.injury = null;
      }
    });
  });

  const homeWin = result.homeScore > result.awayScore;
  const decidedInOtOrSo = result.overtime;

  if (!game.isPlayoff) {
    if (homeWin) {
      updateTeamRecord(home, result.homeScore, result.awayScore, 'W');
      updateTeamRecord(away, result.awayScore, result.homeScore, decidedInOtOrSo ? 'OTL' : 'L');
    } else {
      updateTeamRecord(away, result.awayScore, result.homeScore, 'W');
      updateTeamRecord(home, result.homeScore, result.awayScore, decidedInOtOrSo ? 'OTL' : 'L');
    }
  }

  const applyBox = (box: GameResult['homeBox'], teamId: string) => {
    box.forEach((line) => {
      const p = league.players[line.playerId];
      if (!p) return;
      const stats = p.seasonStats as SkaterStats;
      stats.gp += 1;
      stats.g += line.g;
      stats.a += line.a;
      stats.pts += line.g + line.a;
      stats.shots += line.shots;
      const teamGoals = teamId === home.id ? result.homeScore : result.awayScore;
      const oppGoals = teamId === home.id ? result.awayScore : result.homeScore;
      if (line.g > 0 || line.a > 0) {
        stats.plusMinus += Math.sign(teamGoals - oppGoals) || 0;
      }
      p.careerGoals += line.g;
      p.careerPoints += line.g + line.a;
      p.stamina = Math.max(30, p.stamina - randInt(rng, 8, 15));
      p.morale = Math.max(10, Math.min(100, p.morale + (homeWin === (teamId === home.id) ? randInt(rng, 0, 3) : -randInt(rng, 0, 2))));
      if (!p.injury && rng() < 0.006) {
        p.injury = { gamesRemaining: randInt(rng, 2, 16), description: injuryDescription(rng) };
      }
    });
  };
  applyBox(result.homeBox, home.id);
  applyBox(result.awayBox, away.id);

  const applyGoalie = (goalieId: string | null, teamWon: boolean, goalsAgainst: number, shotsAgainst: number, otl: boolean) => {
    if (!goalieId) return;
    const p = league.players[goalieId];
    if (!p) return;
    const stats = p.seasonStats as GoalieStats;
    if (!isGoalieStats(stats)) return;
    stats.gp += 1;
    stats.shotsAgainst += shotsAgainst;
    stats.goalsAgainst += goalsAgainst;
    if (teamWon) stats.w += 1;
    else if (otl) stats.otl += 1;
    else stats.l += 1;
    if (goalsAgainst === 0) stats.so += 1;
    p.stamina = Math.max(40, p.stamina - randInt(rng, 4, 10));
  };
  applyGoalie(result.homeGoalieId, homeWin, result.awayScore, result.awayShots, !homeWin && decidedInOtOrSo);
  applyGoalie(result.awayGoalieId, !homeWin, result.homeScore, result.homeShots, homeWin && decidedInOtOrSo);

  game.played = true;
  game.result = result;
  league.lastGameLog = result;
  league.lastGameTeams = { home: home.id, away: away.id };
}

function injuryDescription(rng: RNG): string {
  const options = [
    'Upper-body injury', 'Lower-body injury', 'Sprained knee', 'Shoulder injury',
    'Wrist injury', 'Concussion protocol', 'Groin strain', 'High-ankle sprain',
  ];
  return options[randInt(rng, 0, options.length - 1)];
}

export function restDay(league: League) {
  Object.values(league.players).forEach((p) => {
    if (p.retired) return;
    p.stamina = Math.min(100, p.stamina + 6);
  });
}
