import { ROLES } from './constants.js';

// Role Distribution by Player Count
const ROLE_DISTRIBUTION = {
  4: { [ROLES.NAUGHTY]: 1, [ROLES.SHERIFF]: 1, [ROLES.REGULAR]: 2 },
  5: { [ROLES.NAUGHTY]: 1, [ROLES.SHERIFF]: 1, [ROLES.HEALER]: 1, [ROLES.REGULAR]: 2 },
  6: { [ROLES.NAUGHTY]: 1, [ROLES.SHERIFF]: 1, [ROLES.HEALER]: 1, [ROLES.REGULAR]: 3 },
  7: { [ROLES.NAUGHTY]: 1, [ROLES.SHERIFF]: 1, [ROLES.HEALER]: 1, [ROLES.ORACLE]: 1, [ROLES.REGULAR]: 3 },
  8: { [ROLES.NAUGHTY]: 1, [ROLES.SHERIFF]: 1, [ROLES.HEALER]: 1, [ROLES.ORACLE]: 1, [ROLES.REGULAR]: 4 },
  9: { [ROLES.NAUGHTY]: 2, [ROLES.SHERIFF]: 1, [ROLES.HEALER]: 1, [ROLES.ORACLE]: 1, [ROLES.REGULAR]: 4 },
  10: { [ROLES.NAUGHTY]: 2, [ROLES.SHERIFF]: 1, [ROLES.HEALER]: 1, [ROLES.ORACLE]: 1, [ROLES.REGULAR]: 5 }
};

/**
 * Shuffles an array
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Assigns roles to players
 */
export function assignRoles(playerIds) {
  const playerCount = playerIds.length;
  const distribution = ROLE_DISTRIBUTION[playerCount];
  
  if (!distribution) {
    throw new Error(`Invalid player count: ${playerCount}`);
  }
  
  // Create role pool
  const rolePool = [];
  for (const [role, count] of Object.entries(distribution)) {
    for (let i = 0; i < count; i++) {
      rolePool.push(role);
    }
  }
  
  // Shuffle and assign
  const shuffledRoles = shuffleArray(rolePool);
  const shuffledPlayers = shuffleArray(playerIds);
  
  const roleAssignments = {};
  shuffledPlayers.forEach((playerId, index) => {
    roleAssignments[playerId] = shuffledRoles[index];
  });
  
  return roleAssignments;
}

/**
 * Generates a random room code
 */
export function generateRoomCode(length = 6) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}