import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import { io } from 'socket.io-client';
import App from './App';

// 连接到 Socket.IO 服务器 http://117.72.8.112:9000/  'http://192.168.50.44:3000'
const socket = io('http://117.72.8.112:9000');



socket.on('connect', () => {
  console.log('connected to server with id', socket.id);

  // 从缓存中获取房间id
  if(localStorage.getItem('room')) {
    // 获取服务器的最新信息
    socket.emit('getLatestInfo', { room: localStorage.getItem('room')});
  }
  
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
