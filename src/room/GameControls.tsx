import React from 'react';
import styles from '../App.module.css';

interface GameControlsProps {
  isHost: boolean;
  gameStarted: boolean;
  majorPhase: string;
  subPhase: string;
  onStartGame: () => void;
  onResetGame: () => void;
  onNextPhase: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({
  isHost,
  gameStarted,
  majorPhase,
  subPhase,
  onStartGame,
  onResetGame,
  onNextPhase,
}) => {
  return (
    <>
      {isHost && (
        <>
          {!gameStarted ? (
            <div className={styles.operateBtnn} onClick={onStartGame}>
              开始游戏
            </div>
          ) : subPhase === '结算环节' ? (
            <div className={styles.operateBtnn} onClick={onResetGame}>
              重新开始
            </div>
          ) : majorPhase === '白天' ? (
            <div className={styles.operateBtnn} onClick={onNextPhase}>
              下一阶段
            </div>
          ) : (
            <></>
          )}
        </>
      )}
    </>
  );
};

export default GameControls;