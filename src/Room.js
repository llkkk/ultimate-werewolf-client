import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './App.module.css';  // 确保导入了 CSS Modules 文件

const abilities = {
  viewHand: { name: '查看手牌', max: 1 },
  swapHand: { name: '交换手牌', max: 1 },
  seerViewDeck: { name: '预言家查看底牌', max: 2 },
  wolfViewDeck: { name: '狼人查看底牌', max: 1 },
  viewAndSwap: { name: '查看并交换手牌', max: 1 },
  swapDeck: { name: '交换底牌', max: 1 },
  seeTeammate: { name: '确认队友', max: 1 },
  viewSelfHand: { name: '确认自己手牌', max: 1 },
  swapSelfHandDeck: { name: '交换手牌和任意一张底牌', max: 1 },
};

function Room({ socket }) {
  const navigate = useNavigate();
  const [roomID, setRoomID] = useState(localStorage.getItem('room') || '');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [players, setPlayers] = useState([]);
  const [roles, setRoles] = useState([
    { name: '狼人', description: '每晚可以确认同伴身份,单狼可查看一张底牌', img: '/werewolf.jpg', count: 1, abilities: [abilities.seeTeammate], faction: '狼人阵营' },
    { name: '预言家', description: '每晚可以查验一人的身份', img: '/seer.jpg', count: 1, abilities: [abilities.viewHand, abilities.viewDeck], faction: '好人阵营' },
    { name: '捣蛋鬼', description: '可以交换两名玩家的身份', img: '/troublemaker.jpg', count: 1, abilities: [abilities.swapHand], faction: '好人阵营' },
    { name: '强盗', description: '可以与一名玩家交换身份', img: '/robber.jpg', count: 1, abilities: [abilities.viewAndSwap], faction: '好人阵营' },
    { name: '村民', description: '没有特殊能力，白天参与投票', img: '/villager.jpg', count: 1, abilities: [], faction: '好人阵营' },
    { name: '失眠者', description: '可重新确认自己的卡牌', img: '/insomniac.jpg', count: 1, abilities: [], faction: '好人阵营' },
    { name: '爪牙', description: '能知道场上的狼人牌，白天被投出去算狼人阵营获胜', img: '/minion.jpg', count: 1, abilities: [], faction: '狼人阵营' },
    { name: '狼先知', description: '在狼人基础上，可验证一张场上玩家的身份', img: '/mystic.jpg', count: 1, abilities: [], faction: '狼人阵营' },
    { name: '守夜人', description: '每晚可以确认同伴身份', img: '/mason.jpg', count: 1, abilities: [], faction: '好人阵营' }
  ]);
  const [gameState, setGameState] = useState(null);
  //const [preGameState, setGameState] = useState(null);

  
  const [isHost, setIsHost] = useState(localStorage.getItem('host') === socket.id);
  const [logs, setLogs] = useState({});
  const [visibleCards, setVisibleCards] = useState([]);
  const [actionDenied, setActionDenied] = useState('');
  const [swapTargets, setSwapTargets] = useState([]);
  const [seerAction, setSeerAction] = useState(null);

  useEffect(() => {
    if (!roomID || !username) {
      console.error('Room ID or username is undefined');
      navigate('/');
      return;
    }

    socket.emit('joinRoom', { room: roomID, username }, (response) => {
      if (response.status === 'ok') {
        setPlayers(response.players || []);
        setRoles(response.roles || roles);
        setIsHost(response.host === socket.id);
      } else {
        alert(response.message);
      }
    });

    socket.on('updatePlayers', (players) => {
      setPlayers(players || []);
      console.log('Updated players:', players);
    });

    socket.on('updateRoles', (roles) => {
      setRoles(roles || []);
      console.log('Updated roles:', roles);
    });

    socket.on('updateHost', (host) => {
      setIsHost(host === socket.id);
    });

    socket.on('newHost', () => {
      setIsHost(true);
      alert('你已成为新的房主');
    });

    socket.on('gameStarted', (gameState) => {
      setGameState(gameState);
      setLogs(gameState.logs);
      console.log('Game started', gameState);
    });

    socket.on('updateGameState', (gameState) => {
      setGameState(gameState);
      setLogs(gameState.logs);
      setPlayers(gameState.players); // 确保玩家状态更新
      console.log('Game state updated', gameState);
    });

    socket.on('updateVisibleCards', ({ visibleCards }) => {
      setVisibleCards(visibleCards);
    });

    socket.on('actionDenied', ({ message }) => {
      setActionDenied(message);
    });

    socket.on('restartGame', (gameState) => {
      setGameState(null);
      setRoles(gameState.preRoles);
      setPlayers(gameState.players); // 确保玩家状态更新
      console.log('Game state restart', gameState);
    });

    return () => {
      socket.off('updatePlayers');
      socket.off('updateRoles');
      socket.off('updateHost');
      socket.off('newHost');
      socket.off('gameStarted');
      socket.off('updateGameState');
      socket.off('updateVisibleCards');
      socket.off('actionDenied');
    };
  }, [socket, roomID, username, navigate]);

  const handleRoleChange = (index, delta) => {
    if (!isHost) return;
    const updatedRoles = roles.map((role, i) => i === index ? { ...role, count: role.count + delta } : role);
    setRoles(updatedRoles);
    socket.emit('updateRoles', { room: roomID, roles: updatedRoles });
  };

  const joinGame = (index) => {
    if (players[index] && players[index].username) return;
    socket.emit('joinGame', { room: roomID, username, index }, (response) => {
      if (response.status === 'ok') {
        setPlayers(response.players);
        setGameState(response.gameState);
      } else {
        alert(response.message);
      }
    });
  };

  const removePlayer = (index) => {
    if (!isHost) return;
    socket.emit('removePlayer', { room: roomID, index });
  };

  const leaveRoom = () => {
    socket.emit('leaveRoom', { room: roomID, username });
    navigate('/');
  };

  const startGame = () => {
    if (!isHost) return;
    socket.emit('startGame', { room: roomID });
  };

  const nightAction = (action, data) => {
    console.log('执行行动', action)
    socket.emit('nightAction', { room: roomID, action, data });
  };

  const nextPhase = () => {
    if (!isHost) return;
    socket.emit('nextPhase', { room: roomID });
  };

  const vote = (targetId) => {
    socket.emit('vote', { room: roomID, targetId });
  };

  const canPerformAction = (ability) => {
    console.log('Checking ability:', ability);
    const currentPlayer = gameState.players.find(p => p.id === socket.id);
    console.log('Current player:', currentPlayer);
    return currentPlayer && currentPlayer.initialRole && currentPlayer.initialRole.name === gameState.subPhase && currentPlayer.initialRole.abilities.some(a => a.name === ability.name && a.max > 0);
  };

  const handleCardClick = (player) => {
    if (seerAction) {
      nightAction(seerAction, { type: 'player', target: player.id });
      setSeerAction(null);
    } else if (canPerformAction(abilities.swapHand)) {
      if (swapTargets.length === 0) {
        setSwapTargets([player.id]);
      } else if (swapTargets.length === 1) {
        setSwapTargets([...swapTargets, player.id]);
        nightAction(abilities.swapHand.name, { target1: swapTargets[0], target2: player.id });
        setSwapTargets([]);
      }
    } else if (canPerformAction(abilities.viewHand)) {
      nightAction(abilities.viewHand.name, { type: 'player', target: player.id });
    } else if (canPerformAction(abilities.viewAndSwap)) {
      nightAction(abilities.viewAndSwap.name, { target: player.id });
    } else if (canPerformAction(abilities.viewSelfHand.name)) {
      nightAction(abilities.viewSelfHand.name, {});
    } 
  };

  const handleDeckClick = (index) => {
    if (seerAction) {
      nightAction(seerAction, { type: 'deck', target: [index] });
      setSeerAction(null);
    } else if (canPerformAction(abilities.viewDeck)) {
      nightAction(abilities.viewDeck.name, { type: 'deck', targets: [index] });
    }
  };

  const getRoleName = () => {
    const currentPlayer = gameState.players.find(p => p.id === socket.id);
    return currentPlayer && currentPlayer.initialRole ? currentPlayer.initialRole.name : '未知';
  };

  const getRoleImage = () => {
    const currentPlayer = gameState.players.find(p => p.id === socket.id);
    return currentPlayer && currentPlayer.initialRole ? currentPlayer.initialRole.img : '/cardback.png';
  };

  const getLogMessage = (log) => {
    const currentPlayer = gameState.players.find(p => p.id === socket.id);
    return currentPlayer && currentPlayer.initialRole ? `${currentPlayer.initialRole.name}：${log}` : `未知角色：${log}`;
  };

  const renderGameConfig = () => {
    return roles.map((role, index) => (
      <p key={index}>{role.name}：{role.count}</p>
    ));
  };

  const renderWerewolfInfo = () => {
    const currentPlayer = gameState.players.find(p => p.id === socket.id);
    if (currentPlayer && currentPlayer.initialRole && currentPlayer.initialRole.name === '狼人') {
      const werewolves = gameState.players.filter(p => p.initialRole && p.initialRole.name === '狼人' && p.id !== socket.id);
      if (werewolves.length > 0) {
        return <p>本局狼人有：{werewolves.map(w => w.username).join(', ')}</p>;
      } else {
        return <p>你是唯一的狼人，你可以查看一张底牌。</p>;
      }
    }
    return null;
  };

  const resetGame = () => {
    if (!isHost) return;
    socket.emit('resetGame', { room: roomID });
  };
  

  useEffect(() => {
    if (gameState) {
      const currentPlayer = gameState.players.find(p => p.id === socket.id);
      if (currentPlayer && currentPlayer.hasVoted) {
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
          button.disabled = true;
        });
      }
    }
  }, [gameState]);

  return (
    <div className={styles.container}>
      <h2>房间号: {roomID}</h2>
      <div className={styles.message}>
        <p>公告：一夜狼人为发言游戏，建议线下玩，或群语音开麦玩。</p>
        {actionDenied && <p style={{ color: 'red' }}>{actionDenied}</p>}
      </div>
      <h3>玩家列表</h3>
      <div className={styles.playerGrid}>
        {players.map((player, index) => (
          <div key={index} className={styles.playerItem}>
            <label>
              <span style={{ color: player.id === socket.id ? 'red' : 'black' }}>
                玩家 {index + 1}: {player.username}
              </span>
              {player.username === null ? (
                <button onClick={() => joinGame(index)}>加入</button>
              ) : (
                !gameState && isHost && <button onClick={() => removePlayer(index)}>移除</button>
              )}
            </label>
            {gameState && (
              <>
                <img
                  src={player.role && visibleCards.includes(player.role) ? player.role.img : '/cardback.png'}
                  alt={`玩家${index + 1}`}
                  title={player.username}
                  style={{ width: '100px', height: '150px', margin: '10px 0' }}
                  onClick={() => handleCardClick(player)}
                />
                {gameState.subPhase === '投票环节' && (
                  <button 
                    onClick={() => vote(player.id)} 
                    disabled={gameState.players.find(p => p.id === socket.id).hasVoted}
                  >
                    投票
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {gameState && (
        <>
          <h3>底牌</h3>
          <div className={styles.deckGrid}>
            {gameState.leftoverCards.map((card, index) => (
              <img
                key={index}
                src='/cardback.png'
                alt={`底牌 ${index + 1}`}
                title={`底牌 ${index + 1}`}
                style={{ width: '100px', height: '150px', margin: '10px' }}
                onClick={() => handleDeckClick(index)}
              />
            ))}
          </div>
        </>
      )}

      {!gameState && (
        <>
          <h3>角色列表</h3>
          <div className={styles.roleGrid}>
            {roles.map((role, index) => (
              <div key={index} className={styles.roleItem}>
                <img src={role.img} alt={role.name} title={role.name} style={{ width: '100px', height: '150px', margin: '10px 0' }} /><br/>
                <label>{role.name}: {role.count}</label>
                {isHost && (
                  <>
                    <button onClick={() => handleRoleChange(index, -1)}>-</button>
                    <button onClick={() => handleRoleChange(index, 1)}>+</button>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {isHost && (
        <>
          {!gameState ? (
            <button onClick={startGame}>开始游戏</button>
          ) : (
            gameState.subPhase === '结算环节' ? (
              <button onClick={resetGame} disabled={false}>重新开始</button>
            ) : (
              <button onClick={nextPhase}>下一阶段</button>
            )
          )}
        </>
      )}

      {gameState && (
        <>
          <h3>当前身份</h3>
          <div className={styles.currentRole}>
            <img src={getRoleImage()} alt={getRoleName()} title={getRoleName()} />
          </div>
          {renderWerewolfInfo()}
          <h3>当前阶段</h3>
          <div className={styles.currentPhase}>
            <p>{`${gameState.majorPhase} - ${gameState.subPhase}`}</p>
          </div>
          {gameState.subPhase === '讨论环节' && gameState.discussionInfo && (
            <div className={styles.discussionInfo}>
              <p>从 {gameState.discussionInfo.startingPlayer.username} 开始，按 {gameState.discussionInfo.direction} 顺序发言。</p>
            </div>
          )}
          <h3>游戏日志</h3>
          <div className={styles.logs}>
            <ul>
              {logs[socket.id] && logs[socket.id].map((log, index) => (
                <li key={index}>{getLogMessage(log)}</li>
              ))}
            </ul>
          </div>
          {gameState.subPhase === '结算环节' && (
            <>
              <h3>投票结果</h3>
              <div className={styles.voteResults}>
                {gameState.winner && (
                  <p style={{ color: 'red', fontWeight: 'bold' }}>{gameState.winner}</p>
                )}
                {gameState.voteResults && gameState.voteResults.length > 0 && (
                  <ul>
                    {gameState.voteResults.map((vote, index) => (
                      <li key={index}>{players.find(p => p.id === vote.playerId).username} 投票给 {players.find(p => p.id === vote.targetId).username}</li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </>
      )}

      {gameState && (
        <>
          <h3>本局游戏配置</h3>
          <div className={styles.gameConfig}>
            {renderGameConfig()}
          </div>
        </>
      )}

      {!gameState && <button onClick={leaveRoom}>离开房间</button>}
    </div>
  );
}

export default Room;
