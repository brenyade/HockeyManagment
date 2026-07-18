import type { League, PlayoffSeries, ScheduledGame, Team } from '../types';
import { conferenceStandings } from './standings';

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${idCounter}_${Math.random().toString(36).slice(2, 7)}`;
}

const HOME_PATTERN: ('home' | 'away')[] = ['home', 'home', 'away', 'away', 'home', 'away', 'home'];
const WINS_NEEDED = 4;

function makeSeries(round: number, conference: PlayoffSeries['conference'], higherSeed: Team, lowerSeed: Team): PlayoffSeries {
  return {
    id: nextId('series'),
    round,
    conference,
    homeTeamId: higherSeed.id,
    awayTeamId: lowerSeed.id,
    homeWins: 0,
    awayWins: 0,
    winsNeeded: WINS_NEEDED,
    gameIds: [],
    complete: false,
    winnerTeamId: null,
  };
}

export function initializePlayoffs(league: League) {
  const east = conferenceStandings(league.teams, 'East').slice(0, 4);
  const west = conferenceStandings(league.teams, 'West').slice(0, 4);
  league.playoffSeries = [
    makeSeries(1, 'East', east[0], east[3]),
    makeSeries(1, 'East', east[1], east[2]),
    makeSeries(1, 'West', west[0], west[3]),
    makeSeries(1, 'West', west[1], west[2]),
  ];
  league.phase = 'playoffs';
  league.news.unshift(`Playoffs begin! Top seeds: ${east[0].city} ${east[0].name} (East), ${west[0].city} ${west[0].name} (West).`);
}

export function ensurePendingPlayoffGame(league: League, series: PlayoffSeries): ScheduledGame | null {
  if (series.complete) return null;
  const gameIndex = series.gameIds.length;
  if (gameIndex >= 7) return null;
  const existing = league.schedule.find((g) => g.id === series.gameIds[gameIndex]);
  if (existing && !existing.played) return existing;

  const side = HOME_PATTERN[gameIndex];
  const home = side === 'home' ? series.homeTeamId : series.awayTeamId;
  const away = side === 'home' ? series.awayTeamId : series.homeTeamId;
  league.day += 1;
  const game: ScheduledGame = {
    id: nextId('pg'),
    day: league.day,
    homeTeamId: home,
    awayTeamId: away,
    played: false,
    result: null,
    isPlayoff: true,
    playoffRound: series.round,
    playoffSeriesId: series.id,
  };
  league.schedule.push(game);
  series.gameIds.push(game.id);
  return game;
}

export function recordSeriesGame(league: League, series: PlayoffSeries, game: ScheduledGame) {
  if (!game.result) return;
  const homeWon = game.result.homeScore > game.result.awayScore;
  const winnerId = homeWon ? game.homeTeamId : game.awayTeamId;
  if (winnerId === series.homeTeamId) series.homeWins += 1;
  else series.awayWins += 1;

  if (series.homeWins >= series.winsNeeded || series.awayWins >= series.winsNeeded) {
    series.complete = true;
    series.winnerTeamId = series.homeWins > series.awayWins ? series.homeTeamId : series.awayTeamId;
    const winner = league.teams.find((t) => t.id === series.winnerTeamId)!;
    league.news.unshift(`${winner.city} ${winner.name} win the series ${Math.max(series.homeWins, series.awayWins)}-${Math.min(series.homeWins, series.awayWins)}!`);
  }
}

export function advanceBracketIfReady(league: League) {
  const currentRound = Math.max(...league.playoffSeries.map((s) => s.round));
  const roundSeries = league.playoffSeries.filter((s) => s.round === currentRound);
  if (!roundSeries.every((s) => s.complete)) return;

  if (currentRound === 3) {
    const finalSeries = roundSeries[0];
    league.phase = 'offseason';
    league.champions.push({ season: league.season, teamId: finalSeries.winnerTeamId! });
    const champ = league.teams.find((t) => t.id === finalSeries.winnerTeamId)!;
    league.news.unshift(`🏆 The ${champ.city} ${champ.name} are your ${league.season} champions!`);
    return;
  }

  const byConf = (conf: 'East' | 'West') => roundSeries.filter((s) => s.conference === conf);
  const nextRound = currentRound + 1;
  const newSeries: PlayoffSeries[] = [];
  if (currentRound === 1) {
    (['East', 'West'] as const).forEach((conf) => {
      const [s1, s2] = byConf(conf);
      const w1 = league.teams.find((t) => t.id === s1.winnerTeamId)!;
      const w2 = league.teams.find((t) => t.id === s2.winnerTeamId)!;
      const [higher, lower] = seedOrder(league, w1, w2);
      newSeries.push(makeSeries(nextRound, conf, higher, lower));
    });
  } else if (currentRound === 2) {
    const eastChamp = league.teams.find((t) => t.id === byConf('East')[0].winnerTeamId)!;
    const westChamp = league.teams.find((t) => t.id === byConf('West')[0].winnerTeamId)!;
    const [higher, lower] = seedOrder(league, eastChamp, westChamp);
    newSeries.push(makeSeries(nextRound, 'League', higher, lower));
  }
  league.playoffSeries.push(...newSeries);
}

function seedOrder(league: League, a: Team, b: Team): [Team, Team] {
  const standings = conferenceStandings(league.teams, a.conference).concat(
    conferenceStandings(league.teams, b.conference),
  );
  const aIdx = standings.findIndex((t) => t.id === a.id);
  const bIdx = standings.findIndex((t) => t.id === b.id);
  return aIdx <= bIdx ? [a, b] : [b, a];
}
