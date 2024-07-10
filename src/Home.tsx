import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import saveRoomToLocalStorage, { removeRecentRoom } from './utils.tsx';
import { Room } from './types/room.ts';
import { Role } from './types/role.ts';
import { Player } from './types/player.ts';
import { useTip } from './globalTip';
import { Socket } from 'socket.io-client';

interface HomeProps {
  socket: Socket;
}

const Home: React.FC<HomeProps> = ({ socket }) => {
  const navigate = useNavigate();
  const { showTip } = useTip();
  const [username, setUsername] = useState(
    localStorage.getItem('username') || '',
  );
  const [roomID, setRoomID] = useState('');
  let recentRooms: Room[] = JSON.parse(
    localStorage.getItem('recentRooms') || '[]',
  ) as Room[];
  if (!Array.isArray(recentRooms)) {
    console.warn('recentRooms is not an array, defaulting to an empty array');
    recentRooms = [];
  }

  const createRoom = () => {
    if (username.trim() === '') {
      showTip('请输入用户名');
      return;
    }

    const newRoomID = uuidv4().slice(0, 8); // 生成唯一的房间ID 截取前10个字符
    socket.emit(
      'createRoom',
      { id: newRoomID, username },
      (response: {
        status: string;
        message?: string;
        roles?: string;
        host?: string;
      }) => {
        if (response.status === 'ok') {
          localStorage.setItem('roomID', newRoomID);
          localStorage.setItem('username', username);
          localStorage.setItem('roles', JSON.stringify(response.roles)); // 保存角色配置
          if (response.host) {
            localStorage.setItem('host', response.host); // 保存房主信息
          }
          saveRoomToLocalStorage(newRoomID);
          navigate(`/room/${newRoomID}`);
        } else {
          showTip(response.message || '');
        }
      },
    );
  };

  const formatTime = (joinTime: string) => {
    const now = new Date();
    const joinDate = new Date(joinTime);
    const diff = now.getTime() - joinDate.getTime();

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

  const joinRoom = (joinRoomID?: string) => {
    if (joinRoomID) setRoomID(joinRoomID);
    if (roomID.trim() === '') {
      showTip('请输入房间号');
      return;
    }
    if (username.trim() === '') {
      showTip('请输入用户名');
      return;
    }
    localStorage.setItem('username', username);
    socket.emit(
      'joinRoom',
      { room: roomID, username },
      (response: {
        status: string;
        message?: string;
        roles?: Role;
        players?: Player;
        host?: string;
      }) => {
        if (response.status === 'ok') {
          localStorage.setItem('roles', JSON.stringify(response.roles)); // 保存角色配置
          localStorage.setItem('players', JSON.stringify(response.players)); // 保存玩家信息
          if (response.host) {
            localStorage.setItem('host', response.host); // 保存房主信息
          }
          saveRoomToLocalStorage(roomID);
          localStorage.setItem('roomID', roomID);
          navigate(`/room/${roomID}`);
        } else {
          showTip(response.message || '');
          removeRecentRoom(roomID);
        }
      },
    );
  };

  return (
    <div className='container'>
      <h2>一夜终极狼人</h2>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <input
          type='text'
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder='输入用户名'
          style={{ flex: 2, textAlign: 'center', marginRight: '20px' }}
        />
        <button onClick={createRoom} style={{ flex: 1, width: '100%' }}>
          新建房间
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <input
          type='text'
          value={roomID}
          onChange={(e) => setRoomID(e.target.value)}
          placeholder='输入房间号'
          style={{ flex: 2, textAlign: 'center', marginRight: '20px' }}
        />
        <button
          onClick={() => joinRoom(roomID)}
          style={{ flex: 1, width: '100%' }}
        >
          加入房间
        </button>
      </div>

      <div style={{ border: '1px solid', padding: '10px' }}>
        <h3>最近加入的房间</h3>
        {recentRooms && recentRooms.length > 0 ? (
          recentRooms.map((room, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ flex: 1, textAlign: 'center' }}>
                {room.roomID}
              </span>
              <span style={{ flex: 1, textAlign: 'center' }}>
                {formatTime(room.joinTime)}
              </span>
              <button
                style={{ flex: 1, width: '100%' }}
                onClick={() => joinRoom(room.roomID)}
              >
                加入房间
              </button>
            </div>
          ))
        ) : (
          <div>暂无房间</div>
        )}
      </div>
    </div>
  );
};

export default Home;
