import type { ScheduledGame, Team } from '../types';

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `g_${idCounter}_${Math.random().toString(36).slice(2, 7)}`;
}

// Circle-method round robin. Returns rounds of [homeTeamId, awayTeamId] pairs.
function circleRoundRobin(teamIds: string[]): [string, string][][] {
  const ids = [...teamIds];
  if (ids.length % 2 !== 0) ids.push('BYE');
  const n = ids.length;
  const rounds: [string, string][][] = [];
  const fixed = ids[0];
  let rotating = ids.slice(1);

  for (let r = 0; r < n - 1; r++) {
    const roundTeams = [fixed, ...rotating];
    const pairs: [string, string][] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = roundTeams[i];
      const b = roundTeams[n - 1 - i];
      if (a !== 'BYE' && b !== 'BYE') {
        // alternate home/away by round parity for balance
        pairs.push(r % 2 === 0 ? [a, b] : [b, a]);
      }
    }
    rounds.push(pairs);
    rotating = [rotating[rotating.length - 1], ...rotating.slice(0, rotating.length - 1)];
  }
  return rounds;
}

export function generateSchedule(teams: Team[], startDay = 1): ScheduledGame[] {
  idCounter = 0;
  const teamIds = teams.map((t) => t.id);
  const cycle1 = circleRoundRobin(teamIds);
  const cycle2 = cycle1.map((round) => round.map(([h, a]) => [a, h] as [string, string]));
  const allRounds = [...cycle1, ...cycle2];

  const games: ScheduledGame[] = [];
  let day = startDay;
  for (const round of allRounds) {
    for (const [home, away] of round) {
      games.push({
        id: nextId(),
        day,
        homeTeamId: home,
        awayTeamId: away,
        played: false,
        result: null,
      });
    }
    day += 1;
  }
  return games;
}
