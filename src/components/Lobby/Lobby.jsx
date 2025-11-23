import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listenToRoom, updateGameState, leaveRoom } from '../../services/firebase';
import { PHASES, assignRoles } from '../../utils/constants';
import './Lobby.css';

function Lobby({ player, roomCode: propRoomCode }) {
  const { roomCode: paramRoomCode } = useParams();
  const roomCode = propRoomCode || paramRoomCode;
  const navigate = useNavigate();
  const [roomData, setRoomData] = useState(null);
  const [copied, setCopied] = useState(false);

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

      if (data.gameState.phase === PHASES.ROLE_REVEAL) {
        navigate(`/role-reveal/${roomCode}`);
      }
    });

    return () => unsubscribe();
  }, [player, roomCode, navigate]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleReady = async () => {
    if (!roomData) return;

    const currentPlayer = roomData.players[player.id];
    const newReadyState = !currentPlayer.ready;

    const { ref, update } = await import('firebase/database');
    const { database } = await import('../../services/firebase');
    
    await update(ref(database, `rooms/${roomCode}/players/${player.id}`), {
      ready: newReadyState
    });
  };

  const handleStartGame = async () => {
    if (!roomData) return;

    const playerIds = Object.keys(roomData.players);
    const playerCount = playerIds.length;

    if (playerCount < 4) {
      alert('Need at least 4 players to start!');
      return;
    }

    const allReady = Object.values(roomData.players).every(p => p.ready);
    if (!allReady) {
      alert('All players must be ready!');
      return;
    }

    const roles = assignRoles(playerIds);

    await updateGameState(roomCode, {
      phase: PHASES.ROLE_REVEAL,
      roles: roles,
      round: 1
    });
  };

  const handleLeaveLobby = async () => {
    await leaveRoom(roomCode, player.id);
    navigate('/');
  };

  if (!roomData) {
    return (
      <div className="page-container">
        <div className="card">
          <h2 className="card-title">Loading lobby...</h2>
        </div>
      </div>
    );
  }

  const players = Object.values(roomData.players || {});
  const isHost = roomData.hostId === player.id;
  const allReady = players.length >= 4 && players.every(p => p.ready);
  const playerCount = players.length;

  return (
    <div className="page-container">
      <div className="lobby-container">
        <h1 className="lobby-title">🐱 Game Lobby 🐱</h1>

        <div className="card lobby-card">
          <div className="room-code-section">
            <h3>Room Code:</h3>
            <div className="room-code-display">
              <span className="room-code">{roomCode}</span>
              <button 
                className="btn btn-secondary copy-btn"
                onClick={handleCopyCode}
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <p className="room-hint">Share this code with your friends!</p>
          </div>

          <div className="players-section">
            <h3>Players ({playerCount}/10):</h3>
            <div className="players-list">
              {players.map((p) => (
                <div key={p.id} className="player-item">
                  <div className="player-avatar">🐱</div>
                  <div className="player-info">
                    <span className="player-name">
                      {p.name}
                      {p.isHost && <span className="host-badge">Host</span>}
                      {p.id === player.id && <span className="you-badge">(You)</span>}
                    </span>
                  </div>
                  <div className="player-status">
                    {p.ready ? (
                      <span className="ready-badge">✓ Ready</span>
                    ) : (
                      <span className="not-ready-badge">Not Ready</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lobby-info">
            <h4>Game Info:</h4>
            <ul>
              <li>4-10 players required</li>
              <li>All players must be ready to start</li>
              <li>Roles will be assigned randomly</li>
              <li>Find the Naughty Kitty before it's too late!</li>
            </ul>
          </div>

          <div className="lobby-actions">
            <button
              className={`btn btn-large ${roomData.players[player.id]?.ready ? 'btn-secondary' : 'btn-primary'}`}
              onClick={handleToggleReady}
            >
              {roomData.players[player.id]?.ready ? 'Not Ready' : 'Ready Up!'}
            </button>

            {isHost && (
              <button
                className="btn btn-primary btn-large mt-sm"
                onClick={handleStartGame}
                disabled={!allReady}
              >
                Start Game
              </button>
            )}

            <button
              className="btn btn-secondary mt-sm"
              onClick={handleLeaveLobby}
            >
              Leave Lobby
            </button>
          </div>

          {isHost && !allReady && (
            <div className="start-hint">
              {playerCount < 4 
                ? `Need ${4 - playerCount} more player${4 - playerCount !== 1 ? 's' : ''} to start`
                : 'All players must be ready to start'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Lobby;