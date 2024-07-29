import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter as Router } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import App from './App.tsx';
import './index.css';
import './App.css';

// 连接到 Socket.IO 服务器 http://117.72.8.112:3000/  'http://192.168.50.44:3000'
const socket: Socket = io('127.0.0.1:3000', {
  reconnectionAttempts: 5, // 重新连接尝试次数
  reconnectionDelay: 2000, // 重新连接延迟
  transports: ['websocket'],
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <App socket={socket} />
    </Router>
  </React.StrictMode>,
);
