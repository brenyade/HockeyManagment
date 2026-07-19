export interface NhlTeamMeta {
  abbr: string;
  city: string;
  name: string;
  conference: 'East' | 'West';
  division: string;
  color: string;
  colorSecondary: string;
}

// Real NHL club identities: city/name, conference & division alignment, and
// approximate official brand colors (primary/secondary).
export const NHL_TEAMS: NhlTeamMeta[] = [
  { abbr: 'ANA', city: 'Anaheim', name: 'Ducks', conference: 'West', division: 'Pacific', color: '#F47A38', colorSecondary: '#111111' },
  { abbr: 'BOS', city: 'Boston', name: 'Bruins', conference: 'East', division: 'Atlantic', color: '#FFB81C', colorSecondary: '#000000' },
  { abbr: 'BUF', city: 'Buffalo', name: 'Sabres', conference: 'East', division: 'Atlantic', color: '#002654', colorSecondary: '#FCB514' },
  { abbr: 'CAR', city: 'Carolina', name: 'Hurricanes', conference: 'East', division: 'Metropolitan', color: '#CC0000', colorSecondary: '#000000' },
  { abbr: 'CBJ', city: 'Columbus', name: 'Blue Jackets', conference: 'East', division: 'Metropolitan', color: '#002654', colorSecondary: '#CE1126' },
  { abbr: 'CGY', city: 'Calgary', name: 'Flames', conference: 'West', division: 'Pacific', color: '#C8102E', colorSecondary: '#F1BE48' },
  { abbr: 'CHI', city: 'Chicago', name: 'Blackhawks', conference: 'West', division: 'Central', color: '#CF0A2C', colorSecondary: '#000000' },
  { abbr: 'COL', city: 'Colorado', name: 'Avalanche', conference: 'West', division: 'Central', color: '#6F263D', colorSecondary: '#236192' },
  { abbr: 'DAL', city: 'Dallas', name: 'Stars', conference: 'West', division: 'Central', color: '#006847', colorSecondary: '#000000' },
  { abbr: 'DET', city: 'Detroit', name: 'Red Wings', conference: 'East', division: 'Atlantic', color: '#CE1126', colorSecondary: '#FFFFFF' },
  { abbr: 'EDM', city: 'Edmonton', name: 'Oilers', conference: 'West', division: 'Pacific', color: '#FF4C00', colorSecondary: '#041E42' },
  { abbr: 'FLA', city: 'Florida', name: 'Panthers', conference: 'East', division: 'Atlantic', color: '#C8102E', colorSecondary: '#041E42' },
  { abbr: 'LAK', city: 'Los Angeles', name: 'Kings', conference: 'West', division: 'Pacific', color: '#111111', colorSecondary: '#A2AAAD' },
  { abbr: 'MIN', city: 'Minnesota', name: 'Wild', conference: 'West', division: 'Central', color: '#154734', colorSecondary: '#DDCBA4' },
  { abbr: 'MTL', city: 'Montréal', name: 'Canadiens', conference: 'East', division: 'Atlantic', color: '#AF1E2D', colorSecondary: '#192168' },
  { abbr: 'NJD', city: 'New Jersey', name: 'Devils', conference: 'East', division: 'Metropolitan', color: '#CE1126', colorSecondary: '#000000' },
  { abbr: 'NSH', city: 'Nashville', name: 'Predators', conference: 'West', division: 'Central', color: '#FFB81C', colorSecondary: '#041E42' },
  { abbr: 'NYI', city: 'New York', name: 'Islanders', conference: 'East', division: 'Metropolitan', color: '#00539B', colorSecondary: '#F47D30' },
  { abbr: 'NYR', city: 'New York', name: 'Rangers', conference: 'East', division: 'Metropolitan', color: '#0038A8', colorSecondary: '#CE1126' },
  { abbr: 'OTT', city: 'Ottawa', name: 'Senators', conference: 'East', division: 'Atlantic', color: '#C52032', colorSecondary: '#000000' },
  { abbr: 'PHI', city: 'Philadelphia', name: 'Flyers', conference: 'East', division: 'Metropolitan', color: '#F74902', colorSecondary: '#000000' },
  { abbr: 'PIT', city: 'Pittsburgh', name: 'Penguins', conference: 'East', division: 'Metropolitan', color: '#FCB514', colorSecondary: '#000000' },
  { abbr: 'SEA', city: 'Seattle', name: 'Kraken', conference: 'West', division: 'Pacific', color: '#001628', colorSecondary: '#99D9D9' },
  { abbr: 'SJS', city: 'San Jose', name: 'Sharks', conference: 'West', division: 'Pacific', color: '#006D75', colorSecondary: '#000000' },
  { abbr: 'STL', city: 'St. Louis', name: 'Blues', conference: 'West', division: 'Central', color: '#002F87', colorSecondary: '#FCB514' },
  { abbr: 'TBL', city: 'Tampa Bay', name: 'Lightning', conference: 'East', division: 'Atlantic', color: '#002868', colorSecondary: '#FFFFFF' },
  { abbr: 'TOR', city: 'Toronto', name: 'Maple Leafs', conference: 'East', division: 'Atlantic', color: '#00205B', colorSecondary: '#FFFFFF' },
  { abbr: 'UTA', city: 'Utah', name: 'Mammoth', conference: 'West', division: 'Central', color: '#010101', colorSecondary: '#71AFE5' },
  { abbr: 'VAN', city: 'Vancouver', name: 'Canucks', conference: 'West', division: 'Pacific', color: '#00205B', colorSecondary: '#00843D' },
  { abbr: 'VGK', city: 'Vegas', name: 'Golden Knights', conference: 'West', division: 'Pacific', color: '#B4975A', colorSecondary: '#333F42' },
  { abbr: 'WPG', city: 'Winnipeg', name: 'Jets', conference: 'West', division: 'Central', color: '#041E42', colorSecondary: '#004C97' },
  { abbr: 'WSH', city: 'Washington', name: 'Capitals', conference: 'East', division: 'Metropolitan', color: '#C8102E', colorSecondary: '#041E42' },
];
