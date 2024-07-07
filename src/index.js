import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter as Router } from 'react-router-dom';
import { io } from 'socket.io-client';
import App from './App';

// 连接到 Socket.IO 服务器 http://117.72.8.112:3000/  'http://192.168.50.44:3000'
const socket = io('http://192.168.50.44:3000');


// 渲染 React 应用
ReactDOM.render(
  <React.StrictMode>
    <Router>
      <App socket={socket} />
    </Router>
  </React.StrictMode>,
  document.getElementById('app')
);
