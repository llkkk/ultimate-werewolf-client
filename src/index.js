import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import { io } from 'socket.io-client';
import App from './App';

// 连接到 Socket.IO 服务器
const socket = io('http://117.72.8.112:3000');

socket.on('connect', () => {
  console.log('connected to server with id', socket.id);
});

socket.on('disconnect', () => {
  console.log('disconnected from server');
});

// 渲染 React 应用
ReactDOM.render(
  <React.StrictMode>
    <Router>
      <App socket={socket} />
    </Router>
  </React.StrictMode>,
  document.getElementById('app')
);
