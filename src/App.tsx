import { useState, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import Home from './Home.tsx';
import Room from './Room.js';
import { TipProvider } from './globalTip.tsx';
import { Socket } from 'socket.io-client';

interface AppProps {
  socket: Socket;
}

function App({ socket }: AppProps) {
  const path = location.pathname;
  const roomMatch = path.match(/\/room(\w+)/);
  const isMatch = roomMatch ? roomMatch[1] : '';
  // const [username, setUsername] = useState<string | null>(localStorage.getItem('username'));
  const [roomID] = useState<string | null>(
    isMatch
      ? path.substring(path.lastIndexOf('/') + 1)
      : localStorage.getItem('roomID'),
  );

  useEffect(() => {
    socket.on('connect', () => {
      console.log('connected to server with id', socket.id);

      const username = localStorage.getItem('username');

      if (username && roomID) {
        // 获取服务器的最新信息
        console.log('reconnected to server with room', roomID, username);

        // 发送心跳信号
        socket.emit('heartbeat', username);

        // 重新加入房间
        socket.emit(
          'joinRoom',
          { room: roomID, username: username },
          (response: { status: string; message: string }) => {
            if (response.status !== 'error') {
              console.log('重新连接并加入房间:', username, roomID);
            } else {
              console.log(response.message);
            }
          },
        );
      }
    });

    socket.on('reconnect_attempt', () => {
      console.log('Attempting to reconnect');
    });

    const handleVisibilityChange = () => {
      // 如果切换到后台
      if (document.visibilityState === 'hidden') {
        // do nothing
      } else {
        const room = localStorage.getItem('roomID');
        const username = localStorage.getItem('username');
        if (username && roomID) {
          socket.emit('heartbeat2', { room: room, username });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    socket.on('disconnect', () => {
      console.log('disconnected from server');
    });

    // 清理函数
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('reconnect_attempt');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [roomID, socket]);

  return (
    <TipProvider>
      <Routes>
        <Route path='/' element={<Home socket={socket} />} />
        <Route path='/room/:roomID' element={<Room socket={socket} />} />
      </Routes>
    </TipProvider>
  );
}

export default App;
