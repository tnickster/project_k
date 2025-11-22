export const GAME_CONFIG = {
  MIN_PLAYERS: 4,
  MAX_PLAYERS: 10,
  ROUND_TIME: 300 // 5 minutes in seconds
};

export const PHASES = {
  LOBBY: 'lobby',
  ROLE_REVEAL: 'role_reveal',
  NIGHT: 'night',
  MORNING: 'morning',
  VOTING: 'voting',
  RESULT: 'result'
};

export const ROLE_INFO = {
  naughty: {
    name: 'Naughty Kitty',
    description: 'Cause chaos and frame others!',
    color: '#FF6B6B'
  },
  regular: {
    name: 'Regular Kitty',
    description: 'Play mini-games and vote wisely!',
    color: '#B0E0E6'
  },
  sheriff: {
    name: 'Sheriff Kitty',
    description: 'Investigate one player each night',
    color: '#FFD93D'
  },
  healer: {
    name: 'Healer Kitty',
    description: 'Protect a player from being framed',
    color: '#90EE90'
  },
  oracle: {
    name: 'Oracle Kitty',
    description: 'Receive cryptic clues about the Naughty Kitty',
    color: '#DDA0DD'
  }
};

export const ROLES = {
  NAUGHTY: 'naughty',
  REGULAR: 'regular',
  SHERIFF: 'sheriff',
  HEALER: 'healer',
  ORACLE: 'oracle'
};

export const CAT_AVATARS = [
  'orange_tabby',
  'black_cat',
  'white_cat',
  'gray_cat',
  'calico',
  'siamese',
  'tuxedo',
  'brown_tabby'
];