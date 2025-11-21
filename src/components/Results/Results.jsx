import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listenToRoom } from '../../services/firebase';
import { ROLE_INFO } from '../../utils/constants';
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
    });

    return () => unsubscribe();
  }, [player, roomCode, navigate]);

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
  const eliminatedPlayer = roomData.players[lastEliminated];
  const eliminatedRole = roomData.gameState.roles[lastEliminated];
  const roleInfo = ROLE_INFO[eliminatedRole];

  // Check win conditions
  const roles = roomData.gameState.roles;
  const eliminated = roomData.gameState.eliminated || [];
  
  const alivePlayers = Object.keys(roles).filter(id => !eliminated.includes(id));
  const aliveNaughty = alivePlayers.filter(id => roles[id] === 'naughty');
  const aliveGood = alivePlayers.filter(id => roles[id] !== 'naughty');

  const naughtyWins = aliveNaughty.length >= aliveGood.length && aliveNaughty.length > 0;
  const goodWins = aliveNaughty.length === 0;
  const gameOver = naughtyWins || goodWins;

  return (
    <div className="page-container">
      <div className="results-container">
        <h1 className="results-title">📊 Voting Results 📊</h1>

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
                    <span className="role-player-name">{p.name}</span>
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

            <button
              className="btn btn-primary btn-large mt-md"
              onClick={() => navigate('/')}
            >
              Return to Home
            </button>
          </div>
        ) : (
          <div className="continue-card">
            <h3>Game Continues!</h3>
            <p>{aliveGood.length} good cats vs {aliveNaughty.length} naughty {aliveNaughty.length === 1 ? 'kitty' : 'kitties'}</p>
            <p className="continue-hint">Another round would start here...</p>
            <button
              className="btn btn-primary mt-md"
              onClick={() => navigate('/')}
            >
              End Game (More rounds coming soon!)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Results;