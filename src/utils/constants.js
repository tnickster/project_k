export const PHASES = {
  LOBBY: 'lobby',
  ROLE_REVEAL: 'role_reveal',
  NIGHT: 'night',
  MORNING: 'morning',
  DISCUSSION: 'discussion',
  VOTING: 'voting',
  RESULT: 'result',
  TRANSITION: 'transition'
};

export const ROLES = {
  NAUGHTY: 'naughty',
  SHERIFF: 'sheriff',
  HEALER: 'healer',
  ORACLE: 'oracle',
  REGULAR: 'regular'
};

export const ROLE_INFO = {
  naughty: {
    name: 'Naughty Kitty',
    description: 'Frame other cats and cause chaos!',
    color: '#FF6B6B',
    team: 'naughty'
  },
  sheriff: {
    name: 'Sheriff Kitty',
    description: 'Investigate one player each night',
    color: '#FFD700',
    team: 'good'
  },
  healer: {
    name: 'Healer Kitty',
    description: 'Protect one player from being framed',
    color: '#87CEEB',
    team: 'good'
  },
  oracle: {
    name: 'Oracle Kitty',
    description: 'Receive cryptic clues about the naughty kitty',
    color: '#DDA0DD',
    team: 'good'
  },
  regular: {
    name: 'Regular Kitty',
    description: 'Play mini-games and vote wisely!',
    color: '#90EE90',
    team: 'good'
  }
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

/**
 * Assign roles to players based on player count
 * @param {string[]} playerIds - Array of player IDs
 * @returns {Object} Object mapping player IDs to roles
 */
export function assignRoles(playerIds) {
  const playerCount = playerIds.length;
  const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
  const roles = {};

  let naughtyCount = 1;
  let sheriffCount = 1;
  let healerCount = 0;
  let oracleCount = 0;

  // Determine role distribution based on player count
  if (playerCount >= 6) {
    healerCount = 1;
  }
  if (playerCount >= 8) {
    oracleCount = 1;
  }
  if (playerCount >= 9) {
    naughtyCount = 2;
  }

  let index = 0;

  // Assign naughty kitties
  for (let i = 0; i < naughtyCount; i++) {
    roles[shuffled[index]] = ROLES.NAUGHTY;
    index++;
  }

  // Assign sheriff
  for (let i = 0; i < sheriffCount; i++) {
    roles[shuffled[index]] = ROLES.SHERIFF;
    index++;
  }

  // Assign healer
  for (let i = 0; i < healerCount; i++) {
    roles[shuffled[index]] = ROLES.HEALER;
    index++;
  }

  // Assign oracle
  for (let i = 0; i < oracleCount; i++) {
    roles[shuffled[index]] = ROLES.ORACLE;
    index++;
  }

  // Assign regular cats to remaining players
  while (index < playerCount) {
    roles[shuffled[index]] = ROLES.REGULAR;
    index++;
  }

  return roles;
}