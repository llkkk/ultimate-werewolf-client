import React from 'react';
import styles from '../App.module.css';

interface GameLogsProps {
  logs: { [socketId: string]: { [type: string]: string[] } };
  players: { id: string; username: string; initialRole: { name: string } }[];
  subPhase: string;
}

const GameLogs: React.FC<GameLogsProps> = ({ logs, players, subPhase }) => {
  const getLogMessage = (log: string, username: string | undefined) => {
    const index = players.findIndex((p) => p.username === username) + 1;
    const currentPlayer = players.find((p) => p.username === username);
    return currentPlayer && currentPlayer.initialRole
      ? `玩家${index}-${currentPlayer.username}(${currentPlayer.initialRole.name})：${log}`
      : `未知角色：${log}`;
  };

  return (
    <div className={styles.logs}>
      <div>
        {subPhase !== '结算环节'
          ? Object.keys(logs).map((username) =>
              Object.keys(logs[username]).map((key) =>
                logs[username][key].map((log, idx) => (
                  <p key={`${key}-${idx}`}>
                    {getLogMessage(log, username)}
                  </p>
                ))
              )
            )
          : Object.keys(logs).map(
              (username) =>
                logs[username]['2'] &&
                logs[username]['2'].map((log, idx) => (
                  <p key={`${username}-1-${idx}`}>
                    {getLogMessage(log, username)}
                  </p>
                ))
            )}
      </div>
    </div>
  );
};

export default GameLogs;