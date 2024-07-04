import React from 'react';
import {  Route, Routes } from 'react-router-dom';
import Home from './Home';
import Room from './Room';

function App({ socket }) {
  return (
    <Routes>
      <Route path="/" element={<Home socket={socket} />} />
      <Route path="/room/:roomID" element={<Room socket={socket} />} />
    </Routes>
  );
}

export default App;
