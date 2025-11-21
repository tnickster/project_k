// Game Phases
export const PHASES = {
  LOBBY: 'lobby',
  ROLE_REVEAL: 'role_reveal',
  NIGHT: 'night',
  CUTSCENE: 'cutscene',
  MORNING: 'morning',
  VOTING: 'voting',
  RESULT: 'result',
  GAME_OVER: 'game_over'
};

// Player Roles
export const ROLES = {
  REGULAR: 'regular',
  NAUGHTY: 'naughty',
  SHERIFF: 'sheriff',
  HEALER: 'healer',
  ORACLE: 'oracle'
};

// Role Information
export const ROLE_INFO = {
  [ROLES.REGULAR]: {
    name: 'Regular Kitty',
    description: 'Play mini-games and vote wisely!',
    color: '#B0E0E6'
  },
  [ROLES.NAUGHTY]: {
    name: 'Naughty Kitty',
    description: 'Cause chaos and frame others!',
    color: '#FF6B6B'
  },
  [ROLES.SHERIFF]: {
    name: 'Sheriff Kitty',
    description: 'Investigate one player each night',
    color: '#FFD93D'
  },
  [ROLES.HEALER]: {
    name: 'Healer Kitty',
    description: 'Protect one player each night',
    color: '#6BCB77'
  },
  [ROLES.ORACLE]: {
    name: 'Catnip Oracle',
    description: 'Receive vague clues about chaos',
    color: '#C77DFF'
  }
};

// Chaos Types
export const CHAOS_TYPES = {
  PLANT: 'plant',
  TOILET_PAPER: 'toilet_paper',
  WATER: 'water',
  LAMP: 'lamp',
  YARN: 'yarn',
  REMOTE: 'remote',
  DISHES: 'dishes',
  TREATS: 'treats'
};

// Cat Avatars
export const CAT_AVATARS = [
  { id: 'orange_tabby', name: 'Orange Tabby' },
  { id: 'black_cat', name: 'Black Cat' },
  { id: 'white_cat', name: 'White Cat' },
  { id: 'gray_cat', name: 'Gray Cat' },
  { id: 'calico', name: 'Calico' },
  { id: 'siamese', name: 'Siamese' },
  { id: 'tuxedo', name: 'Tuxedo' },
  { id: 'brown_tabby', name: 'Brown Tabby' }
];

// Game Configuration
export const GAME_CONFIG = {
  MIN_PLAYERS: 4,
  MAX_PLAYERS: 10,
  ROOM_CODE_LENGTH: 6
};