import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listenToRoom, leaveRoom, startGame } from '../../services/firebase';
import { assignRoles } from '../../utils/roleAssignment';
import { GAME_CONFIG } from '../../utils/constants';
import './Lobby.css';

function Lobby({ player, roomCode }) {
  const { roomCode: urlRoomCode } = useParams();
  const navigate = useNavigate();
  const code = roomCode || urlRoomCode;
  
  const [roomData, setRoomData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!player || !code) {
      navigate('/');
      return;
    }

    // Listen to room updates
    const unsubscribe = listenToRoom(code, (data) => {
      if (!data) {
        setError('Room no longer exists');
        setTimeout(() => navigate('/'), 2000);
        return;
      }
      setRoomData(data);
      
      // If game started, navigate to role reveal
    if (data.status === 'in_progress' && data.gameState.phase === 'role_reveal') {
        navigate(`/role-reveal/${code}`);
      }
    });

    return () => unsubscribe();
  }, [player, code, navigate]);

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom(code, player.id);
      navigate('/');
    } catch (err) {
      console.error('Error leaving room:', err);
      setError('Failed to leave room');
    }
  };

  const handleStartGame = async () => {
    const playerCount = Object.keys(roomData.players).length;
    
    if (playerCount < GAME_CONFIG.MIN_PLAYERS) {
      setError(`Need at least ${GAME_CONFIG.MIN_PLAYERS} players to start!`);
      return;
    }
    
    if (playerCount > GAME_CONFIG.MAX_PLAYERS) {
      setError(`Maximum ${GAME_CONFIG.MAX_PLAYERS} players allowed!`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const playerIds = Object.keys(roomData.players);
      const roleAssignments = assignRoles(playerIds);
      await startGame(code, roleAssignments);
    } catch (err) {
      console.error('Error starting game:', err);
      setError('Failed to start game. Please try again.');
      setLoading(false);
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

  const players = Object.values(roomData.players || {});
  const isHost = roomData.hostId === player.id;
  const playerCount = players.length;
  const canStart = playerCount >= GAME_CONFIG.MIN_PLAYERS && playerCount <= GAME_CONFIG.MAX_PLAYERS;

  return (
    <div className="page-container">
      <div className="game-logo">
        <h1>🐱 Naughty Kitty 🐱</h1>
        <p>Waiting for players...</p>
      </div>

      <div className="card lobby-card">
        <div className="room-code-display">
          <div className="room-code-label">Room Code:</div>
          <div className="room-code">{code}</div>
          <div className="room-code-hint">Share this code with your friends!</div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="player-count">
          <strong>{playerCount}</strong> / {GAME_CONFIG.MAX_PLAYERS} Players
          {playerCount < GAME_CONFIG.MIN_PLAYERS && (
            <div className="player-count-warning">
              Need {GAME_CONFIG.MIN_PLAYERS - playerCount} more player{GAME_CONFIG.MIN_PLAYERS - playerCount !== 1 ? 's' : ''} to start
            </div>
          )}
        </div>

        <div className="players-list">
          <h3>Players:</h3>
          <div className="players-grid">
            {players.map((p) => (
              <div key={p.id} className="player-item">
                <div className="player-avatar">🐱</div>
                <div className="player-info">
                  <div className="player-name">
                    {p.name}
                    {p.isHost && <span className="host-badge">👑 Host</span>}
                    {p.id === player.id && <span className="you-badge">(You)</span>}
                  </div>
                  <div className="player-cat">{p.avatar.replace('_', ' ')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lobby-actions">
          {isHost ? (
            <button
              className="btn btn-primary"
              onClick={handleStartGame}
              disabled={!canStart || loading}
            >
              {loading ? 'Starting...' : 'Start Game'}
            </button>
          ) : (
            <div className="waiting-message">
              Waiting for host to start the game...
            </div>
          )}

          <button
            className="btn btn-secondary mt-sm"
            onClick={handleLeaveRoom}
            disabled={loading}
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}

export default Lobby;