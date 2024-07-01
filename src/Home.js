import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

function Home({ socket }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [roomID, setRoomID] = useState('');

  const createRoom = () => {
    alert('请输入用户名');
    if (username.trim() === '') {
      alert('请输入用户名');
      return;
    }
    const newRoomID = uuidv4(); // 生成唯一的房间ID
    socket.emit('createRoom', { id: newRoomID, username }, (response) => {
      if (response.status === 'ok') {
        localStorage.setItem('room', newRoomID);
        localStorage.setItem('username', username);
        localStorage.setItem('roles', JSON.stringify(response.roles)); // 保存角色配置
        localStorage.setItem('host', response.host); // 保存房主信息
        navigate(`/room`);
      } else {
        alert(response.message);
      }
    });
  };

  const joinRoom = () => {
    if (roomID.trim() === '') {
      alert('请输入房间号');
      return;
    }
    if (username.trim() === '') {
      alert('请输入用户名');
      return;
    }
    localStorage.setItem('room', roomID);
    localStorage.setItem('username', username);
    socket.emit('joinRoom', { room: roomID, username }, (response) => {
      if (response.status === 'ok') {
        localStorage.setItem('roles', JSON.stringify(response.roles)); // 保存角色配置
        localStorage.setItem('players', JSON.stringify(response.players)); // 保存玩家信息
        localStorage.setItem('host', response.host); // 保存房主信息
        navigate(`/room`);
      } else {
        alert(response.message);
      }
    });
  };

  return (
    <div className="container">
      <h2>一夜终极狼人</h2>
      <div>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="输入用户名"
        />
      </div>
      <button onClick={createRoom}>创建房间</button>
      <div>
        <input
          type="text"
          value={roomID}
          onChange={(e) => setRoomID(e.target.value)}
          placeholder="输入房间号"
        />
        <button onClick={joinRoom}>加入房间</button>
      </div>
    </div>
  );
}

export default Home;
