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
      const jailed = data.gameState.jailed || [];
      const eliminated = data.gameState.eliminated || [];
      
      // Only active players can vote
      const activePlayers = players.filter(
        id => !eliminated.includes(id) && !jailed.includes(id)
      );

      if (Object.keys(votes).length === activePlayers.length && 
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
    const jailed = data.gameState.jailed || [];
    
    // Count votes (ignore SKIP votes and votes for jailed players)
    const voteCounts = {};
    Object.values(votes).forEach(votedPlayerId => {
      if (votedPlayerId !== 'SKIP' && !jailed.includes(votedPlayerId)) {
        voteCounts[votedPlayerId] = (voteCounts[votedPlayerId] || 0) + 1;
      }
    });

    // Find player with most votes
    let maxVotes = 0;
    let eliminatedPlayer = null;
    
    Object.entries(voteCounts).forEach(([playerId, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        eliminatedPlayer = playerId;
      }
    });

    // If no one got voted (all skipped or tie at 0), no elimination
    if (!eliminatedPlayer || maxVotes === 0) {
      await updateGameState(roomCode, {
        phase: PHASES.RESULT,
        lastEliminated: null,
        votes: {}
      });
      return;
    }

    // Update game state with elimination
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
  const jailed = roomData.gameState.jailed || [];
  const eliminated = roomData.gameState.eliminated || [];
  
  // Players who can be voted for (alive, not jailed)
  const votablePlayers = players.filter(
    p => !eliminated.includes(p.id) && !jailed.includes(p.id)
  );
  
  // Players who can vote (alive, not jailed)
  const activePlayers = players.filter(
    p => !eliminated.includes(p.id) && !jailed.includes(p.id)
  );
  
  const votes = roomData.gameState.votes || {};
  const totalVotes = Object.keys(votes).length;
  const isPlayerJailed = jailed.includes(player.id);

  // If player is jailed, show spectator screen
  if (isPlayerJailed) {
    return (
      <div className="page-container">
        <div className="game-logo">
          <h1>🔒 You're in Jail! 🔒</h1>
          <p>Evidence points to you...</p>
        </div>

        <div className="card voting-card">
          <div className="jailed-message">
            <div className="jailed-icon">🔒</div>
            <h2>You're Locked Up!</h2>
            <p className="jailed-text">
              You've been framed with evidence! You can't participate in voting.
            </p>
            <p className="jailed-subtext">
              You'll stay in jail for the rest of the game, but you can still watch!
            </p>
            <div className="vote-status">
              <strong>{totalVotes}</strong> / {activePlayers.length} players voted
            </div>
            <div className="waiting-icon">🔒</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="game-logo">
        <h1>🗳️ Voting Time 🗳️</h1>
        <p>Who do you think is the Naughty Kitty?</p>
      </div>

      <div className="card voting-card">
        <div className="vote-counter">
          <strong>{totalVotes}</strong> / {activePlayers.length} players voted
        </div>

        {!hasVoted ? (
          <>
            <h3 className="voting-instruction">Select a player to vote:</h3>
            <div className="voting-grid">
              {votablePlayers.map((p) => (
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
              
              {/* Skip Vote Option */}
              <button
                className={`vote-option skip-option ${selectedPlayer === 'SKIP' ? 'selected' : ''}`}
                onClick={() => handleVote('SKIP')}
              >
                <div className="vote-avatar">🤷</div>
                <div className="vote-info">
                  <div className="vote-name">Skip Vote</div>
                  <div className="vote-cat">Not sure yet</div>
                </div>
              </button>
            </div>
          </>
        ) : (
          <div className="voted-message">
            <div className="voted-icon">✅</div>
            <h3>Vote Submitted!</h3>
            <p>You voted for: <strong>{selectedPlayer === 'SKIP' ? 'Skip' : players.find(p => p.id === selectedPlayer)?.name}</strong></p>
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