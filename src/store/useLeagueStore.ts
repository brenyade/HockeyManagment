import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { League, Lines, Player, Team } from '../types';
import { generateLeague, autoAssignLines } from '../engine/generate';
import { generateSchedule } from '../engine/schedule';
import { simulateGame } from '../engine/simulate';
import { applyGameResult, restDay, trimOldPlayByPlay } from '../engine/applyResult';
import { initializePlayoffs, ensurePendingPlayoffGame, recordSeriesGame, advanceBracketIfReady } from '../engine/playoffs';
import {
  processOffseason, beginDraft, autoDraftPick, performDraftPick, isUsersTurnToDraft,
  finishDraftAndStartSeason,
} from '../engine/offseason';
import type { RNG } from '../engine/rng';
import { MAX_ROSTER_SIZE } from '../engine/constants';

const rng: RNG = Math.random;

interface TradeOffer {
  giveIds: string[];
  getIds: string[];
  otherTeamId: string;
}

function tradeValue(players: Player[]): number {
  return players.reduce((sum, p) => sum + p.overall + Math.max(0, 30 - p.age) * 0.4, 0);
}

interface LeagueStore {
  league: League | null;
  simSpeed: number;
  startFranchise: (league: League, userTeamId: string) => void;
  loadDemo: () => void;
  setLines: (teamId: string, lines: Lines) => void;
  simNext: () => { simulatedGameIds: string[] } | null;
  draftUserPick: (playerId: string) => void;
  draftAutoStep: () => void;
  resignPlayer: (playerId: string) => void;
  releasePlayer: (playerId: string) => void;
  signFreeAgent: (playerId: string) => void;
  evaluateTrade: (offer: TradeOffer) => { accepted: boolean; message: string };
  executeTrade: (offer: TradeOffer) => { accepted: boolean; message: string };
  resetSave: () => void;
}

export const useLeagueStore = create<LeagueStore>()(
  persist(
    (set, get) => ({
      league: null,
      simSpeed: 1,

      startFranchise: (league, userTeamId) => {
        league.userTeamId = userTeamId;
        league.teams.forEach((t) => { t.isUser = t.id === userTeamId; });
        league.schedule = generateSchedule(league.teams, 1);
        league.day = league.schedule[0]?.day ?? 1;
        league.news = [`Welcome to the ${league.season} season! Good luck.`];
        set({ league });
      },

      loadDemo: () => {
        const league = generateLeague(rng, 'Pro Hockey League');
        get().startFranchise(league, league.teams[0].id);
      },

      setLines: (teamId, lines) => {
        set((state) => {
          if (!state.league) return state;
          const league = structuredClone(state.league);
          const team = league.teams.find((t: Team) => t.id === teamId);
          if (team) team.lines = lines;
          return { league };
        });
      },

      simNext: () => {
        const state = get();
        if (!state.league) return null;
        const league: League = structuredClone(state.league);
        const simulatedGameIds: string[] = [];

        if (league.phase === 'regular') {
          const unplayed = league.schedule.filter((g) => !g.played);
          if (unplayed.length === 0) {
            initializePlayoffs(league);
          } else {
            const day = Math.min(...unplayed.map((g) => g.day));
            const dayGames = league.schedule.filter((g) => !g.played && g.day === day);
            dayGames.forEach((game) => {
              const home = league.teams.find((t) => t.id === game.homeTeamId)!;
              const away = league.teams.find((t) => t.id === game.awayTeamId)!;
              const result = simulateGame(home, away, league.players, rng);
              applyGameResult(league, game, result, rng);
              simulatedGameIds.push(game.id);
            });
            restDay(league);
            const remaining = league.schedule.filter((g) => !g.played);
            league.day = remaining.length > 0 ? Math.min(...remaining.map((g) => g.day)) : day;
            if (remaining.length === 0) {
              initializePlayoffs(league);
            }
            trimOldPlayByPlay(league);
          }
        } else if (league.phase === 'playoffs') {
          const active = league.playoffSeries.filter((s) => !s.complete);
          const currentRound = Math.max(...league.playoffSeries.map((s) => s.round));
          const roundActive = active.filter((s) => s.round === currentRound);
          roundActive.forEach((series) => {
            const game = ensurePendingPlayoffGame(league, series);
            if (!game) return;
            const home = league.teams.find((t) => t.id === game.homeTeamId)!;
            const away = league.teams.find((t) => t.id === game.awayTeamId)!;
            const result = simulateGame(home, away, league.players, rng);
            applyGameResult(league, game, result, rng);
            recordSeriesGame(league, series, game);
            simulatedGameIds.push(game.id);
          });
          restDay(league);
          trimOldPlayByPlay(league);
          advanceBracketIfReady(league);
          if (String(league.phase) === 'offseason') {
            processOffseason(league, rng);
            beginDraft(league, rng);
          }
        } else if (league.phase === 'draft') {
          if (isUsersTurnToDraft(league)) {
            // no-op; UI should call draftUserPick instead
          } else {
            autoDraftPick(league, rng);
            if (league.draftPickIndex >= league.draftOrder.length) {
              finishDraftAndStartSeason(league, rng);
            }
          }
        }

        set({ league });
        return { simulatedGameIds };
      },

      draftUserPick: (playerId) => {
        set((state) => {
          if (!state.league) return state;
          const league: League = structuredClone(state.league);
          performDraftPick(league, league.userTeamId, playerId);
          if (league.draftPickIndex >= league.draftOrder.length) {
            finishDraftAndStartSeason(league, rng);
          }
          return { league };
        });
      },

      draftAutoStep: () => {
        set((state) => {
          if (!state.league) return state;
          const league: League = structuredClone(state.league);
          if (!isUsersTurnToDraft(league) && league.draftPickIndex < league.draftOrder.length) {
            autoDraftPick(league, rng);
          }
          if (league.draftPickIndex >= league.draftOrder.length) {
            finishDraftAndStartSeason(league, rng);
          }
          return { league };
        });
      },

      resignPlayer: (playerId) => {
        set((state) => {
          if (!state.league) return state;
          const league: League = structuredClone(state.league);
          const p = league.players[playerId];
          if (p) {
            p.contract = {
              salary: Math.round(p.contract.salary * (1 + Math.random() * 0.1)),
              yearsLeft: 2 + Math.floor(Math.random() * 3),
            };
          }
          return { league };
        });
      },

      releasePlayer: (playerId) => {
        set((state) => {
          if (!state.league) return state;
          const league: League = structuredClone(state.league);
          const team = league.teams.find((t: Team) => t.id === league.userTeamId)!;
          team.roster = team.roster.filter((id) => id !== playerId);
          league.freeAgents.push(playerId);
          autoAssignLines(team, league.players);
          return { league };
        });
      },

      signFreeAgent: (playerId) => {
        set((state) => {
          if (!state.league) return state;
          const league: League = structuredClone(state.league);
          const team = league.teams.find((t: Team) => t.id === league.userTeamId)!;
          if (team.roster.length >= MAX_ROSTER_SIZE) return { league: state.league };
          league.freeAgents = league.freeAgents.filter((id) => id !== playerId);
          team.roster.push(playerId);
          const p = league.players[playerId];
          if (p) p.contract = { salary: p.contract.salary || 750, yearsLeft: 2 };
          autoAssignLines(team, league.players);
          return { league };
        });
      },

      evaluateTrade: (offer) => {
        const state = get();
        if (!state.league) return { accepted: false, message: 'No league loaded.' };
        const league = state.league;
        const give = offer.giveIds.map((id) => league.players[id]);
        const get_ = offer.getIds.map((id) => league.players[id]);
        const giveVal = tradeValue(give);
        const getVal = tradeValue(get_);
        const ratio = giveVal === 0 ? 1 : getVal / giveVal;
        if (ratio <= 1.18) {
          return { accepted: true, message: 'The front office accepts this trade.' };
        }
        return { accepted: false, message: 'The other team feels this trade favors you too heavily.' };
      },

      executeTrade: (offer) => {
        const evalResult = get().evaluateTrade(offer);
        if (!evalResult.accepted) return evalResult;
        set((state) => {
          if (!state.league) return state;
          const league: League = structuredClone(state.league);
          const userTeam = league.teams.find((t: Team) => t.id === league.userTeamId)!;
          const otherTeam = league.teams.find((t: Team) => t.id === offer.otherTeamId)!;
          userTeam.roster = userTeam.roster.filter((id) => !offer.giveIds.includes(id));
          otherTeam.roster = otherTeam.roster.filter((id) => !offer.getIds.includes(id));
          userTeam.roster.push(...offer.getIds);
          otherTeam.roster.push(...offer.giveIds);
          autoAssignLines(userTeam, league.players);
          autoAssignLines(otherTeam, league.players);
          league.news.unshift(`Trade completed with the ${otherTeam.city} ${otherTeam.name}.`);
          return { league };
        });
        return evalResult;
      },

      resetSave: () => set({ league: null }),
    }),
    { name: 'hockey-mgmt-save' },
  ),
);
