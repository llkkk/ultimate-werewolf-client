import { Avatar } from 'antd';
import { Player } from '../types/player';
import { GameState } from '../types/gameState';
import React from 'react';
import styles from '../App.module.css';

interface PlayerAvatarProps {
  gameState: GameState | null;
  player: Player;
  role_resources_base_url: string;
}

const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ gameState, player, role_resources_base_url }) => {
  const avatarSrc = gameState && gameState.subPhase === '结算环节'
    ? role_resources_base_url + player.role.img
    : player.avatar && player.avatar.img
      ? player.avatar.img
      : null;

  return (
    <Avatar
      className={styles.ownCardImg}
      src={avatarSrc || undefined}
    >
      {!avatarSrc && player.username.charAt(0)}
    </Avatar>
  );
};

export default PlayerAvatar;