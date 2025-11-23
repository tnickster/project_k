import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listenToRoom, updateGameState } from '../../services/firebase';
import { PHASES } from '../../utils/constants';
import './Morning.css';

function Morning({ player }) {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [roomData, setRoomData] = useState(null);
  const [investigationResult, setInvestigationResult] = useState(null);

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

      // Check if sheriff investigated
      const myRole = data.gameState.roles[player.id];
      if (myRole === 'sheriff') {
        const nightActions = data.gameState.nightActions || {};
        const myAction = nightActions[player.id];
        
        if (myAction && myAction.target) {
          const targetRole = data.gameState.roles[myAction.target];
          const targetPlayer = data.players[myAction.target];
          const isNaughty = targetRole === 'naughty';
          
          setInvestigationResult({
            playerName: targetPlayer.name,
            isNaughty: isNaughty
          });
        }
      }

      // Move to discussion phase
      if (data.gameState.phase === PHASES.DISCUSSION) {
        navigate(`/discussion/${roomCode}`);
      }
    });

    return () => unsubscribe();
  }, [player, roomCode, navigate]);

  const handleContinue = async () => {
    if (!roomData) return;

    // Host transitions to discussion and processes night actions
    if (roomData.hostId === player.id) {
      const nightActions = roomData.gameState.nightActions || {};
      const naughtyAction = Object.values(nightActions).find(action => action.role === 'naughty');
      const healerAction = Object.values(nightActions).find(action => action.role === 'healer');
      
      // Check if healer protected the framed player
      const wasProtected = healerAction?.target === naughtyAction?.target;
      
      // Get current jailed players
      const currentJailed = roomData.gameState.jailed || [];
      
      let newJailed = [...currentJailed];
      
      // If someone was framed and NOT protected, add them to jail
      if (naughtyAction?.target && !wasProtected) {
        if (!currentJailed.includes(naughtyAction.target)) {
          newJailed.push(naughtyAction.target);
        }
      }

      await updateGameState(roomCode, {
        phase: PHASES.DISCUSSION,
        jailed: newJailed
      });
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

  const nightActions = roomData.gameState.nightActions || {};
  const myRole = roomData.gameState.roles[player.id];
  
  // Find naughty's action
  const naughtyAction = Object.values(nightActions).find(action => action.role === 'naughty');
  const framedPlayer = naughtyAction?.target ? roomData.players[naughtyAction.target] : null;
  
  // Check if healer protected the framed player
  const healerAction = Object.values(nightActions).find(action => action.role === 'healer');
  const wasProtected = healerAction?.target === naughtyAction?.target;

  return (
    <div className="page-container morning-container">
      <div className="morning-header">
        <h1>🌅 Morning Has Arrived 🌅</h1>
        <p>What happened during the night?</p>
      </div>

      <div className="card morning-card">
        {/* Show chaos event */}
        <div className="chaos-reveal">
          <h2 className="chaos-title">🔍 Last Night...</h2>
          
          {wasProtected ? (
            <div className="chaos-message protected">
              <div className="chaos-icon">🛡️</div>
              <p className="chaos-text">
                The night was peaceful! No chaos was found.
              </p>
              <p className="chaos-subtext">
                (Someone was protected from being framed!)
              </p>
            </div>
          ) : framedPlayer ? (
            <div className="chaos-message">
              <div className="chaos-icon">💥</div>
              <p className="chaos-text">
                Chaos was discovered! Evidence points to...
              </p>
              <div className="framed-player">
                <div className="framed-avatar">🐱</div>
                <div className="framed-name">{framedPlayer.name}</div>
              </div>
              <p className="chaos-subtext">
                A knocked over vase was found near their bed!
              </p>
              <div className="jail-notice">
                <strong>{framedPlayer.name}</strong> has been sent to jail! 🔒
              </div>
            </div>
          ) : (
            <div className="chaos-message">
              <div className="chaos-icon">✨</div>
              <p className="chaos-text">
                The night was quiet. No chaos was found.
              </p>
            </div>
          )}
        </div>

        {/* Show sheriff investigation result (private) */}
        {myRole === 'sheriff' && investigationResult && (
          <div className="investigation-result">
            <h3>🤠 Your Investigation Result:</h3>
            <div className={`result-box ${investigationResult.isNaughty ? 'naughty' : 'good'}`}>
              <p className="result-player">{investigationResult.playerName}</p>
              <p className="result-verdict">
                {investigationResult.isNaughty ? (
                  <>
                    <span className="verdict-icon">😼</span>
                    <strong>IS NAUGHTY!</strong>
                  </>
                ) : (
                  <>
                    <span className="verdict-icon">😺</span>
                    <strong>IS GOOD</strong>
                  </>
                )}
              </p>
            </div>
            <p className="investigation-hint">Use this information wisely during voting!</p>
          </div>
        )}

        {/* Show healer confirmation (private) */}
        {myRole === 'healer' && healerAction?.target && (
          <div className="healer-result">
            <h3>😇 You protected someone last night!</h3>
            {wasProtected && framedPlayer && (
              <p className="healer-success">
                ✅ Your protection was successful! You saved {framedPlayer.name} from jail!
              </p>
            )}
          </div>
        )}

        {/* Continue button */}
        <div className="morning-actions">
          {roomData.hostId === player.id ? (
            <button
              className="btn btn-primary btn-large"
              onClick={handleContinue}
            >
              Proceed to Discussion
            </button>
          ) : (
            <div className="waiting-message">
              <p>Waiting for host to continue...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Morning;