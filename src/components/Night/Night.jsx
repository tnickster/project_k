import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listenToRoom, updateGameState } from '../../services/firebase';
import { PHASES, ROLE_INFO } from '../../utils/constants';
import './Night.css';

function Night({ player }) {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [roomData, setRoomData] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [actionSubmitted, setActionSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

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

      // Check if night phase is over
      if (data.gameState.phase === PHASES.MORNING) {
        navigate(`/morning/${roomCode}`);
      }
    });

    return () => unsubscribe();
  }, [player, roomCode, navigate]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Auto-submit if time runs out
          if (!actionSubmitted && roomData) {
            handleAutoSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, actionSubmitted, roomData]);

  const handleAutoSubmit = async () => {
    if (!roomData) return;
    
    const myRole = roomData.gameState.roles[player.id];
    const nightActions = roomData.gameState.nightActions || {};

    // Auto-submit with no action
    await updateGameState(roomCode, {
      nightActions: {
        ...nightActions,
        [player.id]: {
          role: myRole,
          target: null,
          timestamp: Date.now()
        }
      }
    });

    setActionSubmitted(true);
    checkIfAllActionsComplete();
  };

  const handleSubmitAction = async () => {
    if (actionSubmitted || !roomData) return;

    const myRole = roomData.gameState.roles[player.id];
    const nightActions = roomData.gameState.nightActions || {};

    await updateGameState(roomCode, {
      nightActions: {
        ...nightActions,
        [player.id]: {
          role: myRole,
          target: selectedTarget,
          timestamp: Date.now()
        }
      }
    });

    setActionSubmitted(true);
    checkIfAllActionsComplete();
  };

  const checkIfAllActionsComplete = async () => {
    if (!roomData) return;

    const players = Object.keys(roomData.players);
    const alivePlayers = players.filter(
      id => !roomData.gameState.eliminated?.includes(id)
    );

    const nightActions = roomData.gameState.nightActions || {};
    const actionCount = Object.keys(nightActions).length;

    // If all alive players submitted, move to morning
    if (actionCount >= alivePlayers.length && roomData.hostId === player.id) {
      setTimeout(async () => {
        await updateGameState(roomCode, {
          phase: PHASES.MORNING
        });
      }, 2000);
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

  const myRole = roomData.gameState.roles[player.id];
  const roleInfo = ROLE_INFO[myRole];
  const players = Object.values(roomData.players);
  const alivePlayers = players.filter(
    p => !roomData.gameState.eliminated?.includes(p.id) && p.id !== player.id
  );

  const nightActions = roomData.gameState.nightActions || {};
  const totalActions = Object.keys(nightActions).length;
  const totalPlayers = Object.keys(roomData.players).filter(
    id => !roomData.gameState.eliminated?.includes(id)
  ).length;

  return (
    <div className="page-container night-container">
      <div className="night-header">
        <h1>🌙 Night Time 🌙</h1>
        <div className="night-timer">
          Time Remaining: <strong>{timeLeft}s</strong>
        </div>
        <div className="actions-counter">
          {totalActions} / {totalPlayers} players ready
        </div>
      </div>

      <div className="card night-card">
        <div 
          className="role-reminder"
          style={{ borderColor: roleInfo.color, backgroundColor: roleInfo.color + '20' }}
        >
          <h3>You are: {roleInfo.name}</h3>
          <p>{roleInfo.description}</p>
        </div>

        {!actionSubmitted ? (
          <>
            {/* REGULAR CAT */}
            {myRole === 'regular' && (
              <div className="night-action-section">
                <h2>Time to Rest</h2>
                <p className="night-instruction">
                  You're a regular cat! Sleep peacefully while the night passes.
                  In future versions, you'll play a fun mini-game here!
                </p>
                <button
                  className="btn btn-primary btn-large"
                  onClick={() => {
                    setActionSubmitted(true);
                    handleSubmitAction();
                  }}
                >
                  Sleep 😴
                </button>
              </div>
            )}

            {/* NAUGHTY KITTY */}
            {myRole === 'naughty' && (
              <div className="night-action-section naughty-action">
                <h2>😼 Cause Chaos!</h2>
                <p className="night-instruction">
                  Pick a cat to frame! Evidence will point to them in the morning.
                </p>
                <div className="target-selection">
                  {alivePlayers.map(p => (
                    <button
                      key={p.id}
                      className={`target-option ${selectedTarget === p.id ? 'selected' : ''}`}
                      onClick={() => setSelectedTarget(p.id)}
                    >
                      <span className="target-avatar">🐱</span>
                      <span className="target-name">{p.name}</span>
                    </button>
                  ))}
                </div>
                <button
                  className="btn btn-primary btn-large"
                  onClick={handleSubmitAction}
                  disabled={!selectedTarget}
                >
                  Frame This Cat
                </button>
              </div>
            )}

            {/* SHERIFF */}
            {myRole === 'sheriff' && (
              <div className="night-action-section sheriff-action">
                <h2>🤠 Investigate a Player</h2>
                <p className="night-instruction">
                  Choose someone to investigate. You'll learn if they're Good or Naughty!
                </p>
                <div className="target-selection">
                  {alivePlayers.map(p => (
                    <button
                      key={p.id}
                      className={`target-option ${selectedTarget === p.id ? 'selected' : ''}`}
                      onClick={() => setSelectedTarget(p.id)}
                    >
                      <span className="target-avatar">🐱</span>
                      <span className="target-name">{p.name}</span>
                    </button>
                  ))}
                </div>
                <button
                  className="btn btn-primary btn-large"
                  onClick={handleSubmitAction}
                  disabled={!selectedTarget}
                >
                  Investigate
                </button>
              </div>
            )}

            {/* HEALER */}
            {myRole === 'healer' && (
              <div className="night-action-section healer-action">
                <h2>😇 Protect a Player</h2>
                <p className="night-instruction">
                  Choose someone to protect from being framed tonight!
                </p>
                <div className="target-selection">
                  {alivePlayers.map(p => (
                    <button
                      key={p.id}
                      className={`target-option ${selectedTarget === p.id ? 'selected' : ''}`}
                      onClick={() => setSelectedTarget(p.id)}
                    >
                      <span className="target-avatar">🐱</span>
                      <span className="target-name">{p.name}</span>
                    </button>
                  ))}
                </div>
                <button
                  className="btn btn-primary btn-large"
                  onClick={handleSubmitAction}
                  disabled={!selectedTarget}
                >
                  Protect
                </button>
              </div>
            )}

            {/* ORACLE */}
            {myRole === 'oracle' && (
              <div className="night-action-section oracle-action">
                <h2>🔮 Receive a Vision</h2>
                <p className="night-instruction">
                  The spirits are sending you a cryptic clue...
                </p>
                <div className="oracle-clue">
                  <div className="clue-text">
                    "The darkness surrounds someone whose name {
                      Math.random() > 0.5 ? 'is short' : 'contains the letter A'
                    }..."
                  </div>
                  <p className="clue-hint">Share this hint carefully during voting!</p>
                </div>
                <button
                  className="btn btn-primary btn-large"
                  onClick={() => {
                    setActionSubmitted(true);
                    handleSubmitAction();
                  }}
                >
                  Accept Vision
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="action-submitted">
            <div className="submitted-icon">✅</div>
            <h3>Action Submitted!</h3>
            <p>Waiting for other players to finish the night phase...</p>
            <div className="waiting-spinner">🌙</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Night;