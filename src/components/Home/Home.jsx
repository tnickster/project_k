import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { createRoom, joinRoom, roomExists } from '../../services/firebase';
import { generateRoomCode } from '../../utils/roleAssignment';
import { CAT_AVATARS } from '../../utils/constants';
import './Home.css';

function Home({ player, setPlayer, setRoomCode }) {
  const navigate = useNavigate();
  const [view, setView] = useState('main'); // main, create, join
  const [playerName, setPlayerName] = useState(player?.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(player?.avatar || CAT_AVATARS[0].id);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const newPlayer = {
        id: player?.id || uuidv4(),
        name: playerName.trim(),
        avatar: selectedAvatar
      };

      // Generate unique room code
      let code;
      let attempts = 0;
      do {
        code = generateRoomCode();
        attempts++;
      } while (await roomExists(code) && attempts < 10);

      if (attempts >= 10) {
        throw new Error('Could not generate room code. Please try again.');
      }

      await createRoom(code, newPlayer);
      setPlayer(newPlayer);
      setRoomCode(code);
      
      navigate(`/lobby/${code}`);
    } catch (err) {
      console.error('Error creating room:', err);
      setError(err.message || 'Failed to create room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!joinCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const code = joinCode.trim().toUpperCase();

      if (!(await roomExists(code))) {
        throw new Error('Room not found. Please check the code.');
      }

      const newPlayer = {
        id: player?.id || uuidv4(),
        name: playerName.trim(),
        avatar: selectedAvatar
      };

      await joinRoom(code, newPlayer);
      setPlayer(newPlayer);
      setRoomCode(code);
      
      navigate(`/lobby/${code}`);
    } catch (err) {
      console.error('Error joining room:', err);
      setError(err.message || 'Failed to join room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (view === 'create' || view === 'join') {
    return (
      <div className="page-container">
        <div className="game-logo">
          <h1>🐱 Naughty Kitty 🐱</h1>
          <p>Social Deduction Party Game</p>
        </div>

        <div className="card">
          <h2 className="card-title">
            {view === 'create' ? 'Create Room' : 'Join Room'}
          </h2>

          {error && <div className="error-message">{error}</div>}

          <div className="input-group">
            <label htmlFor="playerName">Your Name</label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label>Choose Your Cat</label>
            <div className="avatar-grid">
              {CAT_AVATARS.map((avatar) => (
                <button
                  key={avatar.id}
                  className={`avatar-option ${selectedAvatar === avatar.id ? 'selected' : ''}`}
                  onClick={() => setSelectedAvatar(avatar.id)}
                  disabled={loading}
                  type="button"
                >
                  <div className="avatar-placeholder">🐱</div>
                  <span className="avatar-name">{avatar.name}</span>
                </button>
              ))}
            </div>
          </div>

          {view === 'join' && (
            <div className="input-group">
              <label htmlFor="roomCode">Room Code</label>
              <input
                id="roomCode"
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit code"
                maxLength={6}
                disabled={loading}
                style={{ textTransform: 'uppercase' }}
              />
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={view === 'create' ? handleCreateRoom : handleJoinRoom}
            disabled={loading}
          >
            {loading ? 'Loading...' : view === 'create' ? 'Create Room' : 'Join Room'}
          </button>

          <button
            className="btn btn-secondary mt-sm"
            onClick={() => setView('main')}
            disabled={loading}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="game-logo">
        <h1>🐱 Naughty Kitty 🐱</h1>
        <p>Social Deduction Party Game</p>
      </div>

      <div className="card">
        <h2 className="card-title">Welcome!</h2>
        <p className="welcome-text">
          Play as cute cats in a game of deception! Can you figure out who's causing chaos?
        </p>

        <button
          className="btn btn-primary"
          onClick={() => setView('create')}
        >
          Create New Room
        </button>

        <button
          className="btn btn-secondary mt-sm"
          onClick={() => setView('join')}
        >
          Join Existing Room
        </button>

        <div className="game-info mt-md">
          <h3>How to Play:</h3>
          <ul>
            <li>4-10 players needed</li>
            <li>One player creates a room and shares the code</li>
            <li>Others join using the room code</li>
            <li>Find the Naughty Kitty causing chaos!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Home;