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

  // Auto-transition when timer expires
  useEffect(() => {
    if (timeLeft === 0 && roomData && roomData.hostId === player.id) {
      console.log('⏰ Discussion time over! Moving to voting...');
      setTimeout(() => {
        updateGameState(roomCode, {
          phase: PHASES.VOTING
        });
      }, 2000);
    }
  }, [timeLeft, roomData, player, roomCode]);

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
  const alivePlayers = players.filter(
    p => !roomData.gameState.eliminated?.includes(p.id)
  );

  return (
    <div className="page-container discussion-container">
      <div className="discussion-header">
        <h1>💬 Discussion Time! 💬</h1>
        <div className="discussion-timer">
          Time Remaining: <strong>{timeLeft}s</strong>
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
              💥 Evidence points to: <strong>{framedPlayer.name}</strong>
            </div>
          ) : (
            <div className="chaos-summary quiet">
              ✨ The night was quiet...
            </div>
          )}
        </div>

        <div className="alive-players-section">
          <h3>Alive Players ({alivePlayers.length}):</h3>
          <div className="alive-players-list">
            {alivePlayers.map(p => (
              <div key={p.id} className="alive-player-item">
                <span className="player-avatar">🐱</span>
                <span className="player-name">{p.name}</span>
                {p.id === player.id && <span className="you-badge">(You)</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="discussion-hints">
          <h3>💡 Tips:</h3>
          <ul>
            <li>Share your suspicions (but don't reveal your role!)</li>
            <li>Listen to what others say</li>
            <li>Defend yourself if you're accused</li>
            <li>Work together to find the Naughty Kitty!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Discussion;