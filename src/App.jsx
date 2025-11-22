import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Home from './components/Home/Home';
import Lobby from './components/Lobby/Lobby';
import RoleReveal from './components/RoleReveal/RoleReveal';
import Night from './components/Night/Night';
import Voting from './components/Voting/Voting';
import Results from './components/Results/Results';
import './App.css';
import Morning from './components/Morning/Morning';

function App() {
  const [player, setPlayer] = useState(null);
  const [roomCode, setRoomCode] = useState(null);

  useEffect(() => {
    const savedPlayer = localStorage.getItem('naughtyKittyPlayer');
    if (savedPlayer) {
      setPlayer(JSON.parse(savedPlayer));
    }
  }, []);

  useEffect(() => {
    if (player) {
      localStorage.setItem('naughtyKittyPlayer', JSON.stringify(player));
    }
  }, [player]);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={
              <Home 
                player={player} 
                setPlayer={setPlayer}
                setRoomCode={setRoomCode}
              />
            } 
          />
          <Route 
            path="/lobby/:roomCode" 
            element={
              player ? (
                <Lobby 
                  player={player}
                  roomCode={roomCode}
                />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/role-reveal/:roomCode" 
            element={
              player ? (
                <RoleReveal 
                  player={player}
                />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/night/:roomCode" 
            element={
              player ? (
                <Night 
                  player={player}
                />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/morning/:roomCode" 
            element={
              player ? (
                <Morning 
                  player={player}
                />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/voting/:roomCode" 
            element={
              player ? (
                <Voting 
                  player={player}
                />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/results/:roomCode" 
            element={
              player ? (
                <Results 
                  player={player}
                />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;