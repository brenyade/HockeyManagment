// Names for fictional future draft prospects (the real 32 NHL rosters live
// in nhlRosters.json). Kept generic/hockey-sounding but deliberately avoids
// exact matches with current real players to prevent name collisions.
export const FIRST_NAMES = [
  'Owen', 'Noah', 'Logan', 'Ryan', 'Kevin', 'Filip', 'Gabriel', 'Lucas',
  'Marco', 'Jesse', 'Jordan', 'Jake', 'Jared', 'Josh', 'Josef', 'Jaromir',
  'Petr', 'Pavel', 'Anton', 'Andrei', 'Ivan', 'Igor', 'Sergei', 'Vladimir',
  'Yegor', 'Yuri', 'Oskar', 'Olli', 'Oliver', 'Otto', 'Henrik', 'Hampus',
  'Gustav', 'Zach', 'Zachary', 'Wyatt', 'Wade', 'Vince', 'Vincent', 'Travis',
  'Sean', 'Scott', 'Sam', 'Riley', 'Reid', 'Patrik', 'Patrick', 'Nolan',
  'Miro', 'Milan', 'Max', 'Mason', 'Liam', 'Levi', 'Kyle', 'Kaapo',
  'Juuso', 'Joel', 'Joe', 'Jamie', 'Isaac', 'Hunter', 'Grant', 'Greg',
  'Frank', 'Evan', 'Ethan', 'Eric', 'Dougie', 'Dmitri', 'Denis', 'Damon',
  'Colton', 'Colin', 'Charlie', 'Cameron', 'Calvin', 'Brock', 'Braden', 'Bo',
  'Blake', 'Ben', 'Anders', 'Axel', 'Bjorn', 'Casper', 'Emil', 'Felix',
  'Gunnar', 'Hugo', 'Ludvig', 'Magnus', 'Niklas', 'Rasmus', 'Sven', 'Viktor',
];

export const LAST_NAMES = [
  'Barzal', 'Bergeron', 'Stone', 'Kopitar', 'Toews', 'Kane', 'Giroux',
  'Stamkos', 'Backstrom', 'Getzlaf', 'Perry', 'Seguin', 'Benn', 'Voracek',
  'Palat', 'Marchessault', 'Smith', 'Johnson', 'Anderson', 'Brown', 'Miller',
  'Wilson', 'Moore', 'Taylor', 'Clark', 'Lewis', 'Walker', 'Young', 'Novak',
  'Svoboda', 'Dvorak', 'Cerny', 'Prochazka', 'Kral', 'Vlasic', 'Sedin',
  'Lindqvist', 'Bergman', 'Andersson', 'Nilsson', 'Forsberg', 'Lindgren',
  'Petrov', 'Volkov', 'Sokolov', 'Popov', 'Fedorov', 'Orlov', 'Zaitsev',
  'Makarov', 'Belov', 'Koivu', 'Laine', 'Rask', 'Granlund', 'Heinola',
  'Virtanen', 'Suomi', 'Halonen', 'Ristolainen', 'Manninen', 'Korpi', 'Salo',
  'Muller', 'Weber', 'Fischer', 'Schmidt', 'Meyer', 'Wagner', 'Becker',
  'Hoffmann', 'Novy', 'Kovar', 'Hruska', 'Benes', 'Simek', 'Vesely', 'Zeman',
  'Kolar', 'Reilly', 'Sullivan', 'Murphy', 'Kelly', 'Doyle', 'Byrne',
  'Fitzgerald', 'Larsen', 'Hansen', 'Jensen', 'Nielsen', 'Pedersen', 'Olsen',
  'Kristiansen', 'Bergstrom', 'Dahl', 'Ekholm', 'Franzen', 'Holm', 'Isaksson',
  'Jonsson', 'Karlstrom', 'Lindberg',
];

let nameCounter = 0;
export function randomName(rng: () => number): { firstName: string; lastName: string } {
  nameCounter++;
  const first = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
  return { firstName: first, lastName: `${last}${nameCounter % 37 === 0 ? ' Jr.' : ''}` };
}
