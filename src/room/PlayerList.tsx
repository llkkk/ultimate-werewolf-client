import React from 'react';
import { Player } from '../types/player';
import styles from '../App.module.css';

interface PlayerListProps {
  players: Player[];
  host: string;
  onPlayerClick: (player: Player, index: number) => void;
  onJoinGame: (index: number) => void;
  isHost: boolean;
  socketId: string | undefined; // 修改类型定义
}

const PlayerList: React.FC<PlayerListProps> = ({ players, host, onPlayerClick, onJoinGame, isHost, socketId }) => {
  return (
    <div className={styles.playerGrid}>
      {players.map((player, index) => (
        <div key={index}>
          <div
            className={styles.playerItem}
            onClick={player.username === null ? () => onJoinGame(index) : () => onPlayerClick(player, index)}
          >
            <img
              className={styles.ownCardImg}
              src={player.avatar && player.avatar.img ? player.avatar.img : ''}
            />
            {host === player.id && (
              <span
                className={styles.roomHolder}
                style={{
                  backgroundColor: player.id === socketId ? 'rgb(234 88 12)' : 'black',
                }}
              >
                房主
              </span>
            )}
            {(!isHost || !player.username) && isHost && player.id !== socketId && (
              <span className={styles.removeItem}>×</span>
            )}
            {socketId !== player.id && (
              <span
                className={styles.playerItemIndex}
                style={{
                  backgroundColor: player.id === socketId ? 'rgb(234 88 12)' : 'black',
                }}
              >
                {index + 1}
              </span>
            )}
            {socketId === player.id && (
              <span
                className={styles.isMe}
                style={{
                  backgroundColor: player.id === socketId ? 'rgb(234 88 12)' : 'black',
                }}
              >
                我
              </span>
            )}
            <span
              className={styles.onlineStatus}
              style={{ backgroundColor: player.offline ? 'grey' : 'green' }}
            ></span>
          </div>
          <span
            className={styles.username}
            style={{ color: '#666', fontWeight: 'bold' }}
          >
            {player.username}
          </span>
        </div>
      ))}
    </div>
  );
};

export default PlayerList;