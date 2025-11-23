import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listenToRoom, updateGameState } from '../../services/firebase';
import { PHASES } from '../../utils/constants';
import './Transition.css';

function Transition({ player }) {
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

      // Move to night phase
      if (data.gameState.phase === PHASES.NIGHT) {
        navigate(`/night/${roomCode}`);
      }
    });

    return () => unsubscribe();
  }, [player, roomCode, navigate]);

  // Auto-transition after 5 seconds
  useEffect(() => {
    if (roomData && roomData.hostId === player.id) {
      const timer = setTimeout(() => {
        // Increment round and move to night
        const currentRound = roomData.gameState.round || 1;
        updateGameState(roomCode, {
          phase: PHASES.NIGHT,
          round: currentRound + 1,
          nightActions: {} // Clear previous night actions
        });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [roomData, player, roomCode]);

  if (!roomData) {
    return (
      <div className="page-container">
        <div className="card">
          <h2 className="card-title">Loading...</h2>
        </div>
      </div>
    );
  }

  const currentRound = roomData.gameState.round || 1;

  return (
    <div className="page-container transition-container">
      <div className="transition-content">
        <div className="transition-icon">😼</div>
        <h1 className="transition-title">The Naughty Kitty Still Roams...</h1>
        <p className="transition-subtitle">The chaos continues...</p>
        
        <div className="round-info">
          <h2>Round {currentRound + 1} Beginning</h2>
          <p>Night falls once again...</p>
        </div>

        <div className="transition-loading">
          <div className="loading-spinner">🌙</div>
          <p>Preparing next round...</p>
        </div>
      </div>
    </div>
  );
}

export default Transition;