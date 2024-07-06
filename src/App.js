import React, {useState} from 'react';
import {  Route, Routes } from 'react-router-dom';
import Home from './Home';
import Room from './Room';

function App({ socket }) {

  const [username, setUsername] = useState(localStorage.getItem('username'));
  const [roomID, setRoomID] = useState(localStorage.getItem('roomID'));
  

  socket.on('connect', () => {
    console.log('connected to server with id', socket.id);

  

    if(username && roomID) {
      // 获取服务器的最新信息
      console.log('reconnected to server with room', roomID, username);

      // 发送心跳信号
      socket.emit('heartbeat', username);

      // 重新加入房间
      socket.emit('joinRoom', { roomID, username }, (response) => {
        if (response.status !== 'error') {
          console.log('重新连接并加入房间:', username, roomID);
        } else {
          console.log(response.message);
        }
      });
    }
    
  });
  
  socket.on('disconnect', () => {
    console.log('disconnected from server');
  });


  return (
    <Routes>
      <Route path="/" element={<Home socket={socket} />} />
      <Route path="/room/:roomID" element={<Room socket={socket} />} />
    </Routes>
  );
}

export default App;
