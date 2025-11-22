import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { createRoom, joinRoom } from '../../services/firebase';
import { CAT_AVATARS } from '../../utils/constants';
import './Home.css';

function Home({ player, setPlayer, setRoomCode }) {
  const navigate = useNavigate();
  const [view, setView] = useState('welcome'); // 'welcome', 'create', 'join'
  const [playerName, setPlayerName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('orange_tabby');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!selectedAvatar) {
      setError('Please select a cat');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const newPlayer = {
        id: uuidv4(),
        name: playerName.trim(),
        avatar: selectedAvatar
      };

      setPlayer(newPlayer);

      const code = await createRoom(newPlayer);
      setRoomCode(code);
      navigate(`/lobby/${code}`);
    } catch (err) {
      console.error('Error creating room:', err);
      setError('Failed to create room. Please try again.');
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!selectedAvatar) {
      setError('Please select a cat');
      return;
    }

    if (!joinCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const newPlayer = {
        id: uuidv4(),
        name: playerName.trim(),
        avatar: selectedAvatar
      };

      setPlayer(newPlayer);

      await joinRoom(joinCode.toUpperCase(), newPlayer);
      navigate(`/lobby/${joinCode.toUpperCase()}`);
    } catch (err) {
      console.error('Error joining room:', err);
      setError(err.message || 'Failed to join room');
      setLoading(false);
    }
  };

  if (view === 'welcome') {
    return (
      <div className="page-container">
        <div className="game-logo">
          <h1>🐱 Naughty Kitty 🐱</h1>
          <p>Social Deduction Party Game</p>
        </div>

        <div className="card welcome-card">
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

          <div className="how-to-play">
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

  if (view === 'create') {
    return (
      <div className="page-container">
        <div className="game-logo">
          <h1>🐱 Naughty Kitty 🐱</h1>
          <p>Social Deduction Party Game</p>
        </div>

        <div className="card">
          <h2 className="card-title">Create Room</h2>

          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="playerName">Your Name</label>
            <input
              id="playerName"
              type="text"
              className="input"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
            />
          </div>

          <div className="form-group">
            <label>Choose Your Cat</label>
            <div className="avatar-grid">
              {CAT_AVATARS.map((avatar) => (
                <button
                  key={avatar}
                  className={`avatar-option ${selectedAvatar === avatar ? 'selected' : ''}`}
                  onClick={() => setSelectedAvatar(avatar)}
                >
                  <div className="avatar-icon">🐱</div>
                  <div className="avatar-label">
                    {avatar.replace('_', ' ')}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleCreateRoom}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Room'}
          </button>

          <button
            className="btn btn-secondary mt-sm"
            onClick={() => setView('welcome')}
            disabled={loading}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  if (view === 'join') {
    return (
      <div className="page-container">
        <div className="game-logo">
          <h1>🐱 Naughty Kitty 🐱</h1>
          <p>Social Deduction Party Game</p>
        </div>

        <div className="card">
          <h2 className="card-title">Join Room</h2>

          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="joinCode">Room Code</label>
            <input
              id="joinCode"
              type="text"
              className="input"
              placeholder="Enter 6-letter code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="playerNameJoin">Your Name</label>
            <input
              id="playerNameJoin"
              type="text"
              className="input"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
            />
          </div>

          <div className="form-group">
            <label>Choose Your Cat</label>
            <div className="avatar-grid">
              {CAT_AVATARS.map((avatar) => (
                <button
                  key={avatar}
                  className={`avatar-option ${selectedAvatar === avatar ? 'selected' : ''}`}
                  onClick={() => setSelectedAvatar(avatar)}
                >
                  <div className="avatar-icon">🐱</div>
                  <div className="avatar-label">
                    {avatar.replace('_', ' ')}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleJoinRoom}
            disabled={loading}
          >
            {loading ? 'Joining...' : 'Join Room'}
          </button>

          <button
            className="btn btn-secondary mt-sm"
            onClick={() => setView('welcome')}
            disabled={loading}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default Home;