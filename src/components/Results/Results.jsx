import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listenToRoom, updateGameState } from '../../services/firebase';
import { ROLE_INFO, PHASES } from '../../utils/constants';
import './Results.css';

function Results({ player }) {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [roomData, setRoomData] = useState(null);

  useEffect(() => {
    if (!player || !roomCode) {
      navigate('/');
      return;
    }

    const unsubscribe = listenToRoom(roomCode, (data) => {
      if (!data) {
        navigate('/');
        return;
      }
      setRoomData(data);

      // Navigate when phase changes
      if (data.gameState.phase === PHASES.TRANSITION) {
        navigate(`/transition/${roomCode}`);
      }

      // Return to lobby when game resets
      if (data.gameState.phase === PHASES.LOBBY) {
        navigate(`/lobby/${roomCode}`);
      }
    });

    return () => unsubscribe();
  }, [player, roomCode, navigate]);

  const handleReturnToLobby = async () => {
    if (!roomData || roomData.hostId !== player.id) return;

    // Reset game state but keep players
    await updateGameState(roomCode, {
      phase: PHASES.LOBBY,
      round: 0,
      roles: {},
      votes: {},
      eliminated: [],
      jailed: [],
      nightActions: {},
      discussionReady: {},
      lastEliminated: null
    });

    // Reset all player ready states
    const playerUpdates = {};
    Object.keys(roomData.players).forEach(playerId => {
      playerUpdates[`players/${playerId}/ready`] = false;
    });

    if (Object.keys(playerUpdates).length > 0) {
      const { ref, update } = await import('firebase/database');
      const { database } = await import('../../services/firebase');
      await update(ref(database, `rooms/${roomCode}`), playerUpdates);
    }
  };

  if (!roomData) {
    return (
      <div className="page-container">
        <div className="card">
          <h2 className="card-title">Loading...</h2>
        </div>
      </div>
    );
  }

  const lastEliminated = roomData.gameState.lastEliminated;
  const eliminatedPlayer = lastEliminated ? roomData.players[lastEliminated] : null;
  const eliminatedRole = lastEliminated ? roomData.gameState.roles[lastEliminated] : null;
  const roleInfo = eliminatedRole ? ROLE_INFO[eliminatedRole] : null;

  // Check win conditions
  const roles = roomData.gameState.roles;
  const eliminated = roomData.gameState.eliminated || [];
  const jailed = roomData.gameState.jailed || [];
  
  // Count alive AND active (not jailed) players
  const alivePlayers = Object.keys(roles).filter(id => !eliminated.includes(id));
  const activePlayers = alivePlayers.filter(id => !jailed.includes(id));
  
  const activeNaughty = activePlayers.filter(id => roles[id] === 'naughty');
  const activeGood = activePlayers.filter(id => roles[id] !== 'naughty');

  // Win conditions
  const aliveNaughty = alivePlayers.filter(id => roles[id] === 'naughty');
  const naughtyWins = activeNaughty.length >= activeGood.length && activeNaughty.length > 0;
  const goodWins = aliveNaughty.length === 0;
  const gameOver = naughtyWins || goodWins;

  return (
    <div className="page-container">
      <div className="results-container">
        <h1 className="results-title">📊 Voting Results 📊</h1>

        {lastEliminated ? (
          <div className="elimination-card">
            <h2 className="elimination-header">Player Eliminated:</h2>
            
            <div className="eliminated-player">
              <div className="eliminated-avatar">🐱</div>
              <div className="eliminated-name">{eliminatedPlayer?.name}</div>
            </div>

            <div className="role-reveal-section">
              <h3>Their Role Was:</h3>
              <div 
                className="revealed-role"
                style={{ backgroundColor: roleInfo?.color }}
              >
                {roleInfo?.name}
              </div>
              <p className="role-description-small">{roleInfo?.description}</p>
            </div>
          </div>
        ) : (
          <div className="elimination-card">
            <h2 className="elimination-header">No One Was Eliminated</h2>
            <p className="no-elimination-text">
              The votes were tied or everyone skipped!
            </p>
          </div>
        )}

        {gameOver ? (
          <div className={`game-over-card ${naughtyWins ? 'naughty-win' : 'good-win'}`}>
            <h2 className="game-over-title">
              {naughtyWins ? '😼 Naughty Kitty Wins! 😼' : '😺 Good Cats Win! 😺'}
            </h2>
            <p className="game-over-text">
              {naughtyWins 
                ? 'The Naughty Kitties outnumber the good cats!'
                : 'All Naughty Kitties have been caught!'}
            </p>
            
            <div className="all-roles">
              <h3>All Players & Roles:</h3>
              <div className="roles-grid">
                {Object.entries(roomData.players).map(([id, p]) => (
                  <div key={id} className="role-item">
                    <span className="role-player-name">
                      {p.name}
                      {jailed.includes(id) && <span className="jailed-indicator"> 🔒</span>}
                      {eliminated.includes(id) && <span className="eliminated-indicator"> ☠️</span>}
                    </span>
                    <span 
                      className="role-badge"
                      style={{ backgroundColor: ROLE_INFO[roles[id]]?.color }}
                    >
                      {ROLE_INFO[roles[id]]?.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="game-over-actions">
              {roomData.hostId === player.id ? (
                <>
                  <button
                    className="btn btn-primary btn-large"
                    onClick={handleReturnToLobby}
                  >
                    Return to Lobby
                  </button>
                  <p className="host-hint">Start a new game with the same players!</p>
                </>
              ) : (
                <div className="waiting-message">
                  <p>Waiting for host to return to lobby...</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="continue-card">
            <h3>The Game Continues!</h3>
            <p>{activeGood.length} active good cats vs {activeNaughty.length} active naughty {activeNaughty.length === 1 ? 'kitty' : 'kitties'}</p>
            {jailed.length > 0 && (
              <p className="jailed-count">({jailed.length} player{jailed.length !== 1 ? 's' : ''} in jail)</p>
            )}
            
            {roomData.hostId === player.id ? (
              <button
                className="btn btn-primary btn-large mt-md"
                onClick={async () => {
                  await updateGameState(roomCode, {
                    phase: PHASES.TRANSITION
                  });
                }}
              >
                Continue to Next Round
              </button>
            ) : (
              <div className="waiting-message">
                <p>Waiting for host to continue...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Results;