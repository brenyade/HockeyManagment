export type Position = 'C' | 'LW' | 'RW' | 'D' | 'G';

export interface Attributes {
  skating: number;
  shooting: number;
  passing: number;
  defense: number;
  physicality: number;
  goaltending: number;
}

export interface SkaterStats {
  gp: number;
  g: number;
  a: number;
  pts: number;
  pim: number;
  shots: number;
  plusMinus: number;
}

export interface GoalieStats {
  gp: number;
  w: number;
  l: number;
  otl: number;
  so: number;
  shotsAgainst: number;
  goalsAgainst: number;
}

export interface Contract {
  salary: number; // in thousands
  yearsLeft: number;
}

export interface Injury {
  gamesRemaining: number;
  description: string;
}

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  position: Position;
  attributes: Attributes;
  overall: number;
  potential: number;
  morale: number; // 0-100
  stamina: number; // 0-100, current energy
  injury: Injury | null;
  contract: Contract;
  seasonStats: SkaterStats | GoalieStats;
  careerGoals: number;
  careerPoints: number;
  isRookie: boolean;
  retired: boolean;
}

export interface LineSlot {
  lw: string | null;
  c: string | null;
  rw: string | null;
}

export interface DPairSlot {
  ld: string | null;
  rd: string | null;
}

export interface Lines {
  forwards: [LineSlot, LineSlot, LineSlot, LineSlot];
  defense: [DPairSlot, DPairSlot, DPairSlot];
  goalies: { starter: string | null; backup: string | null };
}

export interface TeamRecord {
  wins: number;
  losses: number;
  otLosses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  streak: string;
}

export interface Team {
  id: string;
  city: string;
  name: string;
  abbr: string;
  color: string;
  colorSecondary: string;
  roster: string[]; // player ids
  lines: Lines;
  record: TeamRecord;
  isUser: boolean;
  conference: 'East' | 'West';
}

export type GameEventType =
  | 'goal'
  | 'shot'
  | 'save'
  | 'penalty'
  | 'period-start'
  | 'period-end'
  | 'game-start'
  | 'game-end'
  | 'ot-start'
  | 'shootout';

export interface GameEvent {
  period: number;
  time: string; // mm:ss elapsed in period
  type: GameEventType;
  text: string;
  teamId?: string;
  scorerId?: string;
  assist1Id?: string;
  assist2Id?: string;
  homeScore?: number;
  awayScore?: number;
}

export interface BoxScoreLine {
  playerId: string;
  g: number;
  a: number;
  shots: number;
}

export interface GameResult {
  homeScore: number;
  awayScore: number;
  overtime: boolean;
  shootout: boolean;
  events: GameEvent[];
  homeShots: number;
  awayShots: number;
  homeBox: BoxScoreLine[];
  awayBox: BoxScoreLine[];
  homeGoalieId: string | null;
  awayGoalieId: string | null;
}

export interface ScheduledGame {
  id: string;
  day: number; // index into season calendar
  homeTeamId: string;
  awayTeamId: string;
  played: boolean;
  result: GameResult | null;
  isPlayoff?: boolean;
  playoffRound?: number;
  playoffSeriesId?: string;
}

export interface PlayoffSeries {
  id: string;
  round: number; // 1 = QF, 2 = SF, 3 = Final
  conference: 'East' | 'West' | 'League';
  homeTeamId: string; // higher seed
  awayTeamId: string;
  homeWins: number;
  awayWins: number;
  winsNeeded: number;
  gameIds: string[];
  complete: boolean;
  winnerTeamId: string | null;
}

export interface League {
  id: string;
  name: string;
  season: number; // year
  day: number; // current day pointer
  teams: Team[];
  players: Record<string, Player>;
  freeAgents: string[];
  schedule: ScheduledGame[];
  userTeamId: string;
  phase: 'regular' | 'playoffs' | 'offseason' | 'draft';
  playoffSeries: PlayoffSeries[];
  draftClass: string[]; // prospect player ids awaiting draft
  draftOrder: string[];
  draftPickIndex: number;
  champions: { season: number; teamId: string }[];
  lastGameLog: GameResult | null;
  lastGameTeams: { home: string; away: string } | null;
  news: string[];
}
