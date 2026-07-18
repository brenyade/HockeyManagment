export const FIRST_NAMES = [
  'Connor', 'Nathan', 'Auston', 'Jack', 'Cale', 'Mikko', 'Leon', 'Nikita',
  'Sidney', 'Alex', 'Erik', 'Victor', 'Adam', 'Elias', 'Kirill', 'Tage',
  'Jesper', 'William', 'Trevor', 'Quinn', 'Dylan', 'Robert', 'Matt', 'Mark',
  'Brayden', 'Brady', 'Tyler', 'Tyson', 'Cole', 'Owen', 'Noah', 'Logan',
  'Ryan', 'Kevin', 'Filip', 'Gabriel', 'Lucas', 'Marco', 'Jesse', 'Jordan',
  'Jake', 'Jared', 'Josh', 'Josef', 'Jaromir', 'Petr', 'Pavel', 'Anton',
  'Andrei', 'Artemi', 'Ivan', 'Igor', 'Sergei', 'Vladimir', 'Yegor', 'Yuri',
  'Oskar', 'Olli', 'Oliver', 'Otto', 'Henrik', 'Hampus', 'Gustav', 'Gabriel',
  'Zach', 'Zachary', 'Wyatt', 'Wade', 'Vince', 'Vincent', 'Travis', 'Troy',
  'Sean', 'Shane', 'Scott', 'Sam', 'Riley', 'Reid', 'Patrik', 'Patrick',
  'Nolan', 'Nick', 'Miro', 'Milan', 'Max', 'Mason', 'Liam', 'Levi',
  'Kyle', 'Kaapo', 'Juuso', 'Joel', 'Joe', 'Jason', 'Jamie', 'Isaac',
  'Ilya', 'Hunter', 'Grant', 'Greg', 'Frank', 'Evan', 'Ethan', 'Eric',
  'Dougie', 'Dmitri', 'Denis', 'David', 'Damon', 'Colton', 'Colin', 'Chris',
  'Charlie', 'Cameron', 'Calvin', 'Brock', 'Braden', 'Bo', 'Blake', 'Ben',
];

export const LAST_NAMES = [
  'McDavid', 'MacKinnon', 'Matthews', 'Hughes', 'Makar', 'Rantanen', 'Draisaitl',
  'Kucherov', 'Crosby', 'Ovechkin', 'Karlsson', 'Hedman', 'Fox', 'Pastrnak',
  'Kaprizov', 'Thompson', 'Bratt', 'Nylander', 'Zegras', 'Byfield', 'Larkin',
  'Barzal', 'Marner', 'Point', 'Tkachuk', 'Bergeron', 'Marchand', 'Panarin',
  'Eichel', 'Aho', 'Stone', 'Kopitar', 'Doughty', 'Toews', 'Kane', 'Giroux',
  'Stamkos', 'Backstrom', 'Getzlaf', 'Perry', 'Seguin', 'Benn', 'Skinner',
  'Voracek', 'Palat', 'Marchessault', 'Smith', 'Johnson', 'Anderson', 'Brown',
  'Miller', 'Wilson', 'Moore', 'Taylor', 'Clark', 'Lewis', 'Walker', 'Young',
  'Novak', 'Svoboda', 'Dvorak', 'Cerny', 'Prochazka', 'Kral', 'Vlasic', 'Sedin',
  'Lindqvist', 'Bergman', 'Andersson', 'Nilsson', 'Karlsson', 'Forsberg', 'Lindgren',
  'Petrov', 'Volkov', 'Sokolov', 'Popov', 'Fedorov', 'Kuznetsov', 'Orlov', 'Zaitsev',
  'Makarov', 'Belov', 'Koivu', 'Laine', 'Rask', 'Granlund', 'Aho', 'Heinola',
  'Virtanen', 'Suomi', 'Halonen', 'Ristolainen', 'Manninen', 'Korpi', 'Salo',
  'Muller', 'Weber', 'Fischer', 'Schmidt', 'Meyer', 'Wagner', 'Becker', 'Hoffmann',
  'Novy', 'Kovar', 'Hruska', 'Benes', 'Simek', 'Vesely', 'Zeman', 'Kolar',
  'Reilly', 'Sullivan', 'Murphy', 'Kelly', 'Ryan', 'Doyle', 'Byrne', 'Fitzgerald',
  'Larsen', 'Hansen', 'Jensen', 'Nielsen', 'Pedersen', 'Olsen', 'Kristiansen',
];

export const CITIES = [
  'Ironcrest', 'Northgate', 'Bay Harbor', 'Redstone', 'Silver Lake', 'Frostbridge',
  'Granite Falls', 'Cedar Point', 'Harborview', 'Stormwatch', 'Lakeshore',
  'Mountview', 'Riverton', 'Steelport', 'Copperfield', 'Ashwood', 'Brighton Bay',
  'Thundercreek', 'Winterhold', 'Emberfield',
];

export const TEAM_NICKNAMES = [
  'Blizzards', 'Wolves', 'Titans', 'Hawks', 'Miners', 'Voyagers', 'Marauders',
  'Rangers', 'Comets', 'Griffins', 'Renegades', 'Kings', 'Vipers', 'Raptors',
  'Sentinels', 'Ironclads', 'Mammoths', 'Wildcats', 'Blazers', 'Reapers',
];

export const TEAM_COLORS: [string, string][] = [
  ['#1f4e8c', '#f5b301'], ['#8c1f2f', '#1a1a1a'], ['#0e5c36', '#c9a227'],
  ['#2a2a72', '#e8e8e8'], ['#7a0c2e', '#f2f2f2'], ['#00485e', '#f47b20'],
  ['#3a3a3a', '#d4af37'], ['#5c1a1a', '#9e9e9e'], ['#1b4332', '#f1c40f'],
  ['#0b3d91', '#ff6b35'], ['#4b0082', '#c0c0c0'], ['#1a1a2e', '#e94560'],
  ['#003049', '#d62828'], ['#2b2d42', '#ef233c'], ['#264653', '#e9c46a'],
  ['#3d2645', '#f4a261'], ['#132a13', '#90a955'], ['#370617', '#dc2f02'],
  ['#03071e', '#d00000'], ['#023047', '#fb8500'],
];

let nameCounter = 0;
export function randomName(rng: () => number): { firstName: string; lastName: string } {
  nameCounter++;
  const first = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
  return { firstName: first, lastName: `${last}${nameCounter % 37 === 0 ? ' Jr.' : ''}` };
}
