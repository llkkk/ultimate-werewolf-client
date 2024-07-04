import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

function Home({ socket }) {
  const navigate = useNavigate();
  let [username, setUsername] = useState(localStorage.getItem('username') || '');
  let [roomID, setRoomID] = useState('');
  let [recentRooms, setRecentRooms] = JSON.parse(localStorage.getItem('recentRooms')) || [];
  if (!Array.isArray(recentRooms)) {
    console.warn('recentRooms is not an array, defaulting to an empty array');
    recentRooms = [];
  }
  const saveRoomToLocalStorage = (roomID) => {
    const now = new Date();
    const newRoom = { roomID, joinTime: now.toISOString() };

    const storedRooms = JSON.parse(localStorage.getItem('recentRooms')) || [];
    const updatedRooms = [newRoom, ...storedRooms.filter(room => room.roomID !== roomID)].slice(0, 5);
    console.log(storedRooms,updatedRooms)
    localStorage.setItem('recentRooms', JSON.stringify(updatedRooms));
    // setRecentRooms(updatedRooms);
  };
  console.log(recentRooms)
  const createRoom = () => {
    if (username.trim() === '') {
      alert('请输入用户名');
      return;
    }
    const newRoomID = uuidv4().slice(0, 8); // 生成唯一的房间ID 截取前10个字符
    socket.emit('createRoom', { id: newRoomID, username }, (response) => {
      if (response.status === 'ok') {
        // localStorage.setItem('room', newRoomID);
        localStorage.setItem('username', username);
        localStorage.setItem('roles', JSON.stringify(response.roles)); // 保存角色配置
        localStorage.setItem('host', response.host); // 保存房主信息
        saveRoomToLocalStorage(newRoomID);
        navigate(`/room/${newRoomID}`);
      } else {
        alert(response.message);
      }
    });
  };
  const formatTime = (joinTime) => {
    const now = new Date();
    const joinDate = new Date(joinTime);
    const diff = now - joinDate;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) {
      return '最近';
    } else if (hours < 12) {
      return `${hours}小时前`;
    } else if (days < 1) {
      return '12小时前';
    } else {
      return `${days}天前`;
    }
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
    // localStorage.setItem('room', roomID);
    localStorage.setItem('username', username);
    socket.emit('joinRoom', { room: roomID, username }, (response) => {
      if (response.status === 'ok') {
        localStorage.setItem('roles', JSON.stringify(response.roles)); // 保存角色配置
        localStorage.setItem('players', JSON.stringify(response.players)); // 保存玩家信息
        localStorage.setItem('host', response.host); // 保存房主信息
        saveRoomToLocalStorage(roomID);
        navigate(`/room/${roomID}`);
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
      <button onClick={createRoom}>新建房间</button>
      <div>
        <input
          type="text"
          value={roomID}
          onChange={(e) => setRoomID(e.target.value)}
          placeholder="输入房间号"
        />
        <button onClick={joinRoom}>加入房间</button>
      </div>
      <div>
        <h3>最近加入的房间</h3>
        {recentRooms && Array.isArray(recentRooms)&&recentRooms.length > 0 ? (recentRooms && Array.isArray(recentRooms) &&
          recentRooms.map((room, index) => (
            <div key={index}>
              <span>{room.roomID}</span>
              <span>{formatTime(room.joinTime)}</span>
              <button onClick={() => joinRoom(room.roomID)}>加入房间</button>
            </div>
          ))
        ) : (
          <div>暂无房间</div>
        )}
      </div>
    </div>
    
  );
}

export default Home;
