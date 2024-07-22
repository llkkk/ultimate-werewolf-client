import React from 'react';
import styles from '../App.module.css';

interface DeckDisplayProps {
  leftoverCards: { img: string; name: string }[];
  subPhase: string;
  onDeckClick: (index: number) => void;
}

const DeckDisplay: React.FC<DeckDisplayProps> = ({ leftoverCards, subPhase, onDeckClick }) => {
  return (
    <div className={styles.deckGrid}>
      {leftoverCards.map((role, index) => (
        <>
          {subPhase !== '结算环节' && (
            <img
              key={index}
              src={`/cardback.png`}
              title={`底牌 ${index + 1}`}
              onClick={() => onDeckClick(index)}
              className={styles.deckGridBackImg}
            />
          )}
          {subPhase === '结算环节' && (
            <div className={styles.deckGridItem}>
              <img
                key={index}
                src={role.img}
                title={`底牌 ${index + 1}`}
                className={styles.deckGridImg}
                onClick={() => onDeckClick(index)}
              />
              <div className={styles.roleCount}>{role.name}</div>
            </div>
          )}
        </>
      ))}
    </div>
  );
};

export default DeckDisplay;