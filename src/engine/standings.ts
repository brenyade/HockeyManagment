import type { Team } from '../types';

export function sortByStandings(teams: Team[]): Team[] {
  return [...teams].sort((a, b) => {
    if (b.record.points !== a.record.points) return b.record.points - a.record.points;
    const aDiff = a.record.goalsFor - a.record.goalsAgainst;
    const bDiff = b.record.goalsFor - b.record.goalsAgainst;
    if (bDiff !== aDiff) return bDiff - aDiff;
    return b.record.goalsFor - a.record.goalsFor;
  });
}

export function conferenceStandings(teams: Team[], conference: 'East' | 'West'): Team[] {
  return sortByStandings(teams.filter((t) => t.conference === conference));
}
