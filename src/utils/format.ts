import type { GoalieStats, Player, SkaterStats } from '../types';

export function fullName(p: Player): string {
  return `${p.firstName} ${p.lastName}`;
}

export function salaryFmt(salaryThousands: number): string {
  return `$${(salaryThousands / 1000).toFixed(2)}M`;
}

export function overallGrade(overall: number): string {
  if (overall >= 90) return 'A+';
  if (overall >= 84) return 'A';
  if (overall >= 78) return 'B+';
  if (overall >= 72) return 'B';
  if (overall >= 65) return 'C+';
  if (overall >= 58) return 'C';
  if (overall >= 50) return 'D';
  return 'F';
}

export function isGoalieStats(s: SkaterStats | GoalieStats): s is GoalieStats {
  return (s as GoalieStats).w !== undefined;
}

export function savePct(s: GoalieStats): string {
  if (s.shotsAgainst === 0) return '.000';
  const pct = 1 - s.goalsAgainst / s.shotsAgainst;
  return pct.toFixed(3).replace(/^0/, '');
}

export function gaa(s: GoalieStats): string {
  if (s.gp === 0) return '0.00';
  return ((s.goalsAgainst / s.gp)).toFixed(2);
}

export function teamName(t: { city: string; name: string }): string {
  return `${t.city} ${t.name}`;
}
