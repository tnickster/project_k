import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listenToRoom, updateGameState } from '../../services/firebase';
import { PHASES } from '../../utils/constants';
import './Voting.css';

function Voting({ player }) {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [roomData, setRoomData] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);

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

      const votes = data.gameState.votes || {};
      const players = Object.keys(data.players || {});
      const alivePlayers = players.filter(
        id => !data.gameState.eliminated?.includes(id)
      );

      if (Object.keys(votes).length === alivePlayers.length && 
          Object.keys(votes).length > 0) {
        if (data.hostId === player.id && data.gameState.phase === PHASES.VOTING) {
          calculateVoteResults(data);
        }
      }

      if (data.gameState.phase === PHASES.RESULT) {
        navigate(`/results/${roomCode}`);
      }
    });

    return () => unsubscribe();
  }, [player, roomCode, navigate]);

  const calculateVoteResults = async (data) => {
    const votes = data.gameState.votes || {};
    const voteCounts = {};
    
    Object.values(votes).forEach(votedPlayerId => {
      voteCounts[votedPlayerId] = (voteCounts[votedPlayerId] || 0) + 1;
    });

    let maxVotes = 0;
    let eliminatedPlayer = null;
    
    Object.entries(voteCounts).forEach(([playerId, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        eliminatedPlayer = playerId;
      }
    });

    const eliminated = [...(data.gameState.eliminated || []), eliminatedPlayer];
    
    await updateGameState(roomCode, {
      phase: PHASES.RESULT,
      eliminated,
      lastEliminated: eliminatedPlayer,
      votes: {}
    });
  };

  const handleVote = async (playerId) => {
    if (hasVoted) return;

    setSelectedPlayer(playerId);
    setHasVoted(true);

    const currentVotes = roomData.gameState.votes || {};
    await updateGameState(roomCode, {
      votes: {
        ...currentVotes,
        [player.id]: playerId
      }
    });
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
  const alivePlayers = players.filter(
    p => !roomData.gameState.eliminated?.includes(p.id)
  );
  const votes = roomData.gameState.votes || {};
  const totalVotes = Object.keys(votes).length;

  return (
    <div className="page-container">
      <div className="game-logo">
        <h1>🗳️ Voting Time 🗳️</h1>
        <p>Who do you think is the Naughty Kitty?</p>
      </div>

      <div className="card voting-card">
        <div className="vote-counter">
          <strong>{totalVotes}</strong> / {alivePlayers.length} players voted
        </div>

        {!hasVoted ? (
          <>
            <h3 className="voting-instruction">Select a player to vote:</h3>
            <div className="voting-grid">
              {alivePlayers.map((p) => (
                <button
                  key={p.id}
                  className={`vote-option ${selectedPlayer === p.id ? 'selected' : ''} ${p.id === player.id ? 'is-you' : ''}`}
                  onClick={() => handleVote(p.id)}
                  disabled={p.id === player.id}
                >
                  <div className="vote-avatar">🐱</div>
                  <div className="vote-info">
                    <div className="vote-name">
                      {p.name}
                      {p.id === player.id && <span className="you-label">(You)</span>}
                    </div>
                    <div className="vote-cat">{p.avatar.replace('_', ' ')}</div>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="voted-message">
            <div className="voted-icon">✅</div>
            <h3>Vote Submitted!</h3>
            <p>You voted for: <strong>{players.find(p => p.id === selectedPlayer)?.name}</strong></p>
            <div className="waiting-text">
              Waiting for other players to vote...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Voting;