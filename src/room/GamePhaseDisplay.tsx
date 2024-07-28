import React from 'react';
import styles from '../App.module.css';
import Countdown from '../Countdown';

interface GamePhaseDisplayProps {
  majorPhase: string;
  subPhase: string;
  initialCount:number;
  discussionInfo: { index: number; startingPlayer: { username: string }; direction: string } | null;
}

const GamePhaseDisplay: React.FC<GamePhaseDisplayProps> = ({ majorPhase, subPhase,initialCount, discussionInfo }) => {
  return (
    <div className={styles.currentPhase}>
      <h6>
        当前阶段 {`${majorPhase} - ${subPhase}`}{majorPhase && majorPhase == '夜晚' && (
                  <Countdown initialCount={initialCount} />
                )}
      </h6>
      {subPhase === '讨论环节' && discussionInfo && (
        <div className={styles.discussionInfo}>
          <p>
            从玩家{discussionInfo.index + 1}-{discussionInfo.startingPlayer.username} 开始，按 {discussionInfo.direction} 顺序发言。
          </p>
        </div>
      )}
    </div>
  );
};

export default GamePhaseDisplay;