import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listenToRoom, updateGameState } from '../../services/firebase';
import { ROLE_INFO, PHASES } from '../../utils/constants';
import './RoleReveal.css';

function RoleReveal({ player }) {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [roomData, setRoomData] = useState(null);
  const [acknowledged, setAcknowledged] = useState(false);

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
      if (data.gameState.phase === 'voting') {
        navigate(`/voting/${roomCode}`);
      }
    });

    return () => unsubscribe();
  }, [player, roomCode, navigate]);

  const handleContinue = async () => {
  setAcknowledged(true);
  
  // Simple version: just move to voting after a delay
  // (In full version, we'd wait for all players)
  setTimeout(async () => {
    if (roomData.hostId === player.id) {
      await updateGameState(roomCode, {
        phase: 'voting'
      });
    }
  }, 3000);
};

  if (!roomData || !roomData.gameState.roles) {
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

  if (!roleInfo) {
    return (
      <div className="page-container">
        <div className="card">
          <h2 className="card-title">Error</h2>
          <p>Role not assigned. Please rejoin the game.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container role-reveal-container">
      <div className="role-reveal-header">
        <h1>🤫 Your Secret Role 🤫</h1>
        <p>Don't show this to anyone!</p>
      </div>

      <div className="role-card-container">
        <div 
          className="role-card"
          style={{ borderColor: roleInfo.color }}
        >
          <div 
            className="role-card-header"
            style={{ backgroundColor: roleInfo.color }}
          >
            <h2 className="role-name">{roleInfo.name}</h2>
          </div>

          <div className="role-icon">
            {myRole === 'naughty' && '😼'}
            {myRole === 'regular' && '😺'}
            {myRole === 'sheriff' && '🤠'}
            {myRole === 'healer' && '😇'}
            {myRole === 'oracle' && '🔮'}
          </div>

          <div className="role-description">
            <p>{roleInfo.description}</p>
          </div>

          {myRole === 'naughty' && (
            <div className="role-objective naughty">
              <strong>Objective:</strong> Cause chaos each night and frame innocent cats. 
              Avoid getting voted out!
            </div>
          )}

          {myRole === 'regular' && (
            <div className="role-objective good">
              <strong>Objective:</strong> Play mini-games and vote to find the Naughty Kitty!
            </div>
          )}

          {myRole === 'sheriff' && (
            <div className="role-objective good">
              <strong>Objective:</strong> Investigate players each night to find the Naughty Kitty!
            </div>
          )}

          {myRole === 'healer' && (
            <div className="role-objective good">
              <strong>Objective:</strong> Protect a player each night from being framed!
            </div>
          )}

          {myRole === 'oracle' && (
            <div className="role-objective good">
              <strong>Objective:</strong> Use vague clues to help find the Naughty Kitty!
            </div>
          )}
        </div>
      </div>

      <div className="role-reveal-actions">
        {!acknowledged ? (
          <button
            className="btn btn-primary btn-large"
            onClick={handleContinue}
          >
            I Understand My Role
          </button>
        ) : (
          <div className="waiting-message">
            <div className="waiting-spinner">⏳</div>
            <p>Waiting for other players...</p>
            <p className="waiting-hint">Keep your role secret!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default RoleReveal;