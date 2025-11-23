import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, update, onValue, off, remove } from 'firebase/database';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

/**
 * Generate a random room code
 */
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a new game room
 */
export async function createRoom(hostPlayer) {
  const roomCode = generateRoomCode();
  const roomRef = ref(database, `rooms/${roomCode}`);
  
  await set(roomRef, {
    hostId: hostPlayer.id,
    players: {
      [hostPlayer.id]: {
        id: hostPlayer.id,
        name: hostPlayer.name,
        avatar: hostPlayer.avatar,
        ready: false,
        isHost: true,
        joinedAt: Date.now()
      }
    },
    gameState: {
      phase: 'lobby',
      round: 0,
      roles: {},
      votes: {},
      eliminated: []
    },
    createdAt: Date.now(),
    status: 'waiting'
  });
  
  return roomCode;
}

/**
 * Join an existing room
 */
export async function joinRoom(roomCode, player) {
  const roomRef = ref(database, `rooms/${roomCode}`);
  const snapshot = await get(roomRef);
  
  if (!snapshot.exists()) {
    throw new Error('Room does not exist');
  }
  
  const roomData = snapshot.val();
  const playerCount = Object.keys(roomData.players || {}).length;
  
  if (playerCount >= 10) {
    throw new Error('Room is full');
  }
  
  if (roomData.status !== 'waiting') {
    throw new Error('Game already in progress');
  }
  
  const playerRef = ref(database, `rooms/${roomCode}/players/${player.id}`);
  await set(playerRef, {
    id: player.id,
    name: player.name,
    avatar: player.avatar,
    ready: false,
    isHost: false,
    joinedAt: Date.now()
  });
  
  return true;
}

/**
 * Leave a room
 */
export async function leaveRoom(roomCode, playerId) {
  const playerRef = ref(database, `rooms/${roomCode}/players/${playerId}`);
  await remove(playerRef);
  
  // Check if room is empty and delete
  const roomRef = ref(database, `rooms/${roomCode}`);
  const snapshot = await get(roomRef);
  
  if (snapshot.exists()) {
    const roomData = snapshot.val();
    if (!roomData.players || Object.keys(roomData.players).length === 0) {
      await remove(roomRef);
    }
  }
}

/**
 * Check if a room exists
 */
export async function roomExists(roomCode) {
  const roomRef = ref(database, `rooms/${roomCode}`);
  const snapshot = await get(roomRef);
  return snapshot.exists();
}

/**
 * Listen to room updates
 */
export function listenToRoom(roomCode, callback) {
  const roomRef = ref(database, `rooms/${roomCode}`);
  
  onValue(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });
  
  return () => off(roomRef);
}

/**
 * Update game state
 */
export async function updateGameState(roomCode, updates) {
  const gameStateRef = ref(database, `rooms/${roomCode}/gameState`);
  await update(gameStateRef, updates);
}

/**
 * Start the game
 */
export async function startGame(roomCode, roleAssignments) {
  const updates = {
    [`rooms/${roomCode}/status`]: 'in_progress',
    [`rooms/${roomCode}/gameState/phase`]: 'role_reveal',
    [`rooms/${roomCode}/gameState/roles`]: roleAssignments,
    [`rooms/${roomCode}/gameState/round`]: 1
  };
  
  await update(ref(database), updates);
}

export { database };