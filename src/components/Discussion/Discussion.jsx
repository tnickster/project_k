import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listenToRoom, updateGameState } from '../../services/firebase';
import { PHASES } from '../../utils/constants';
import './Discussion.css';

function Discussion({ player }) {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [roomData, setRoomData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isReady, setIsReady] = useState(false);

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

      // Move to voting phase
      if (data.gameState.phase === PHASES.VOTING) {
        navigate(`/voting/${roomCode}`);
      }
    });

    return () => unsubscribe();
  }, [player, roomCode, navigate]);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        return newTime < 0 ? 0 : newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-transition when timer expires OR everyone is ready
  useEffect(() => {
    if (!roomData || roomData.hostId !== player.id) return;

    const discussionReady = roomData.gameState.discussionReady || {};
    const players = Object.keys(roomData.players);
    const jailed = roomData.gameState.jailed || [];
    const eliminated = roomData.gameState.eliminated || [];
    
    // Active players can vote (alive, not jailed, not eliminated)
    const activePlayers = players.filter(
      id => !eliminated.includes(id) && !jailed.includes(id)
    );
    const readyCount = Object.keys(discussionReady).length;

    // Move to voting if timer expired OR all active players are ready
    if (timeLeft === 0 || readyCount >= activePlayers.length) {
      console.log('⏰ Discussion over! Moving to voting...');
      setTimeout(() => {
        updateGameState(roomCode, {
          phase: PHASES.VOTING,
          discussionReady: {} // Clear ready status
        });
      }, 2000);
    }
  }, [timeLeft, roomData, player, roomCode]);

  const handleReady = async () => {
    if (isReady || !roomData) return;

    const discussionReady = roomData.gameState.discussionReady || {};
    
    await updateGameState(roomCode, {
      discussionReady: {
        ...discussionReady,
        [player.id]: true
      }
    });

    setIsReady(true);
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

  const nightActions = roomData.gameState.nightActions || {};
  const naughtyAction = Object.values(nightActions).find(action => action.role === 'naughty');
  const framedPlayer = naughtyAction?.target ? roomData.players[naughtyAction.target] : null;
  const healerAction = Object.values(nightActions).find(action => action.role === 'healer');
  const wasProtected = healerAction?.target === naughtyAction?.target;

  const players = Object.values(roomData.players);
  const jailed = roomData.gameState.jailed || [];
  const eliminated = roomData.gameState.eliminated || [];
  
  const alivePlayers = players.filter(
    p => !eliminated.includes(p.id)
  );
  
  const activePlayers = players.filter(
    p => !eliminated.includes(p.id) && !jailed.includes(p.id)
  );

  const discussionReady = roomData.gameState.discussionReady || {};
  const readyCount = Object.keys(discussionReady).length;
  const totalActivePlayers = activePlayers.length;
  
  const isPlayerJailed = jailed.includes(player.id);

  return (
    <div className="page-container discussion-container">
      <div className="discussion-header">
        <h1>💬 Discussion Time! 💬</h1>
        <div className="discussion-timer">
          Time Remaining: <strong>{timeLeft}s</strong>
        </div>
        <div className="ready-counter">
          {readyCount} / {totalActivePlayers} players ready
        </div>
      </div>

      <div className="card discussion-card">
        <div className="discussion-prompt">
          <h2>Talk it out with your friends!</h2>
          <p>Discuss who you think is the Naughty Kitty</p>
        </div>

        <div className="chaos-reminder">
          <h3>Last Night's Events:</h3>
          {wasProtected ? (
            <div className="chaos-summary protected">
              ✨ The night was peaceful - no chaos found!
            </div>
          ) : framedPlayer ? (
            <div className="chaos-summary framed">
              💥 <strong>{framedPlayer.name}</strong> was sent to jail! 🔒
            </div>
          ) : (
            <div className="chaos-summary quiet">
              ✨ The night was quiet...
            </div>
          )}
        </div>

        <div className="alive-players-section">
          <h3>Players ({alivePlayers.length}):</h3>
          <div className="alive-players-list">
            {alivePlayers.map(p => {
              const isJailed = jailed.includes(p.id);
              return (
                <div key={p.id} className={`alive-player-item ${isJailed ? 'jailed' : ''}`}>
                  <span className="player-avatar">{isJailed ? '🔒' : '🐱'}</span>
                  <span className="player-name">{p.name}</span>
                  {p.id === player.id && <span className="you-badge">(You)</span>}
                  {isJailed && <span className="jailed-badge">In Jail</span>}
                  {discussionReady[p.id] && !isJailed && <span className="ready-badge">✓ Ready</span>}
                </div>
              );
            })}
          </div>
        </div>

        {!isPlayerJailed && (
          <div className="discussion-actions">
            {!isReady ? (
              <button
                className="btn btn-primary btn-large"
                onClick={handleReady}
              >
                Ready to Vote
              </button>
            ) : (
              <div className="ready-message">
                <div className="ready-icon">✅</div>
                <p>You're ready!</p>
                <p className="ready-hint">Waiting for other players...</p>
              </div>
            )}
          </div>
        )}

        {isPlayerJailed && (
          <div className="spectator-notice">
            <h3>🔒 You're in Jail</h3>
            <p>You can't participate in voting, but you can watch!</p>
          </div>
        )}

        <div className="discussion-hints">
          <h3>💡 Tips:</h3>
          <ul>
            <li>Share your suspicions (but don't reveal your role!)</li>
            <li>Listen to what others say</li>
            <li>Defend yourself if you're accused</li>
            {!isPlayerJailed && <li>Click "Ready to Vote" when you're done discussing</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Discussion;