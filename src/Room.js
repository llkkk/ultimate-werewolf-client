import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './App.module.css';  // 确保导入了 CSS Modules 文件

import saveRoomToLocalStorage from './utils';

import { useTip } from './globalTip';


function Room({ socket }) {
  const navigate = useNavigate();
  const { roomID } = useParams();
  const { showTip } = useTip();

  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [players, setPlayers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isHide, setIsHide] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [preGameState, setPreRoles] = useState([]);

  const abilities = {
    viewHand: { name: '查看手牌', max: 1 },
    swapHand: { name: '交换手牌', max: 1 },
    seerViewDeck: { name: '预言家查看底牌', max: 2 },
    wolfViewDeck: { name: '狼人查看底牌', max: 1 },
    viewAndSwap: { name: '查看并交换手牌', max: 1 },
    viewSelfHand: { name: '确认自己手牌', max: 1 },
    swapSelfHandDeck: { name: '交换手牌和任意一张底牌', max: 1 },
    viewAndSteal: { name: '查看并交换底牌', max: 1 },
    lockPlayer: { name: '锁定玩家身份', max: 1},
    votePlayer: { name: '票出该玩家则获胜', max: 1},
  };
  const daySubPhases = ['讨论环节', '投票环节', '结算环节'];


  const [isHost, setIsHost] = useState(localStorage.getItem('host') === socket.id);
  const [host, setHost] = useState(localStorage.getItem('host') || '');
  const [logs, setLogs] = useState({});
  const [actionDenied, setActionDenied] = useState('');
  const [swapTargets, setSwapTargets] = useState([]);
  const [isVisible, setIsVisible] = useState(true);

  // 点击事件处理函数
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const generateRandomPlayerName = () => {
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';

    // 生成随机的两个字母
    let randomLetters = '';
    for (let i = 0; i < 2; i++) {
      randomLetters += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // 生成随机的两个数字
    let randomNumbers = '';
    for (let i = 0; i < 2; i++) {
      randomNumbers += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }

    // 组合成最终的玩家名
    const randomPlayerName = `玩家${randomLetters}${randomNumbers}`;
    return randomPlayerName;
  };
  useEffect(() => {
    if (!username) {
      console.error('Room ID or username is undefined');
      //TODO give a random name 
      localStorage.setItem('roomID', roomID);
      let newUserName= generateRandomPlayerName();
      localStorage.setItem('username', newUserName);
      socket.emit('joinRoom', { room: roomID, newUserName }, (response) => {
        if (response.status === 'ok') {
          localStorage.setItem('roles', JSON.stringify(response.roles)); // 保存角色配置
          localStorage.setItem('players', JSON.stringify(response.players)); // 保存玩家信息
          localStorage.setItem('host', response.host); // 保存房主信息
          saveRoomToLocalStorage(roomID);
          setUsername(newUserName);
          setPlayers(response.players || []);
          setRoles(response.roles || roles);
          setIsHost(response.host === socket.id);
          setHost(response.host);
          setGameState(response.gameState);
        } else {
          showTip(response.message);
        }
      });
    }else{
      socket.emit('joinRoom', { room: roomID, username }, (response) => {
        if (response.status === 'ok') {
          setPlayers(response.players || []);
          setRoles(response.roles || roles);
          setIsHost(response.host === socket.id);
          setHost(response.host);
          setGameState(response.gameState);
        } else {
          showTip(response.message);
        }
      });
    }

    

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
      setHost(host);
    });

    socket.on('newHost', () => {
      setIsHost(true);
      setHost(socket.id);
      showTip('你已成为新的房主');
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
      console.log('Game state restart11111', gameState);
      setGameState(null);
      setRoles(gameState.preRoles);
      setPlayers(gameState.players); // 确保玩家状态更新
      console.log('Game state restart', gameState);
    });
  }, [socket, roomID, navigate]);
  

  const handleCopy = ({ roomID }) => {
    console.log('Copying text:', roomID); // 确认传递的是字符串
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(window.location.href).then(() => {
        showTip("复制成功！");
      }).catch(err => {
        console.error("Failed to copy text: ", err);
      });
    } else {
      // Fallback method using execCommand
      const textArea = document.createElement("textarea");
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        showTip("复制成功！");
      } catch (err) {
        console.error("Failed to copy text: ", err);
      }
      document.body.removeChild(textArea);
    }
  };
  const [tooltip, setTooltip] = useState({ visible: false, content: '' });
  const handleInfoClick = (e, description) => {
    e.stopPropagation();
    showTip(description);
  };
  
  const handleInfoLeave = () => {
    setTooltip({ visible: false, content: '' });
  };
  const handleRoleClick = (index) => {
    if (!isHost) return;
    const updatedRoles = roles.map((role, i) => {
      if (index !== i)
        return role;
      if (role.name === '狼人' || role.name === '村民') {
        role.count = (role.count + 1) % 4;
        if (role.count === 0) role.count = 0;
      } else if (role.name === '守夜人') {
        if (role.count === 0) role.count = 2;
        else role.count = 0;
      } else {
        role.count = (role.count + 1) % 2;
        if (role.count === 0) role.count = 0;
      }
      return role;
    });
    setRoles(updatedRoles);
    socket.emit('updateRoles', { room: roomID, roles: updatedRoles });
  };
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
        showTip(response.message);
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
    socket.emit('startGame', { room: roomID }, (response) => {
      if (response.status === 'error') {
        showTip(response.message);
      }
    });
  };

  const nightAction = (action, data) => {
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
    const currentPlayer = gameState.players.find(p => p.id === socket.id);
    return currentPlayer && currentPlayer.initialRole && currentPlayer.initialRole.name === gameState.subPhase &&
      currentPlayer.initialRole.abilities.some(a => a.name === ability.name && a.max > 0);
  };

  const handleCardClick = (player) => {
    if (canPerformAction(abilities.viewHand)) {
      nightAction(abilities.viewHand.name, { target1: { id: player.id } });
    } else if (canPerformAction(abilities.swapHand)) {
      if (swapTargets.length === 0) {
        if (player.id !== socket.id) {
          setSwapTargets([player.id]);
        }
      } else if (swapTargets.length === 1) {
        if (player.id !== socket.id && player.id !== swapTargets[0]) {
          setSwapTargets([...swapTargets, player.id]);
          nightAction(abilities.swapHand.name, { target1: { type: 'player', id: swapTargets[0] }, target2: { type: 'player', id: player.id } });
          setSwapTargets([]);
        }

      }
    } else if (canPerformAction(abilities.viewAndSwap)) {
      if (player.id !== socket.id) {
        const currentPlayer = gameState.players.find(p => p.id === socket.id);
        nightAction(abilities.viewAndSwap.name, { target1: { type: 'player', id: player.id }, target2: { type: 'player', id: currentPlayer.id } });
      }
    } else if (canPerformAction(abilities.votePlayer)) {
      if (player.id !== socket.id) {
        nightAction(abilities.votePlayer.name, { target1: { type: 'player', id: player.id }});
      }
    } else if (canPerformAction(abilities.lockPlayer)) {
      nightAction(abilities.lockPlayer.name, { target1: { type: 'player', id: player.id }});
    }
  };

  const handleDeckClick = (index) => {
    if (canPerformAction(abilities.seerViewDeck)) {
      nightAction(abilities.seerViewDeck.name, { target1: { type: 'deck', id: index } });
    } else if (canPerformAction(abilities.wolfViewDeck)) {
      nightAction(abilities.wolfViewDeck.name, { target1: { type: 'deck', id: index } });
    } else if (canPerformAction(abilities.swapSelfHandDeck)) {
      nightAction(abilities.swapSelfHandDeck.name, { target1: { type: 'player', id: socket.id }, target2: { type: 'deck', id: index } });
    } else if(canPerformAction(abilities.viewAndSteal)) {
      const currentPlayer = gameState.players.find(p => p.id === socket.id);
      nightAction(abilities.viewAndSteal.name, { target1: { type: 'deck', id: index } , target2: { type: 'player', id: currentPlayer.id } });
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

  const getLogMessage = (log, id) => {
    const currentPlayer = gameState.players.find(p => p.id === id);
    return currentPlayer && currentPlayer.initialRole ? `玩家-${currentPlayer.username}：${log}` : `未知角色：${log}`;
  };

  const renderGameConfig = () => {
    return roles.filter(role => role.count > 0).map((role, index) => (
          <div key={index} className={styles.gameRoleItem} >
            <img src={role.img} alt={role.name} title={role.name} />
            <div
              className={styles.gameInfoIcon}
              onClick={(e) => handleInfoClick(e, role.description)}
              onMouseLeave={handleInfoLeave}
            >
              ?
            </div>
            <div  className={styles.gameInfoName}>{role.name}</div>
          </div>
    ));
  };

  const resetGame = () => {
    if (!isHost) return;
    socket.emit('resetGame', { room: roomID });
  };


  useEffect(() => {
    if (gameState) {

    }
  }, [gameState]);

  return (
    <div className={styles.container}>
      <h6>房间号:<span onClick={() => handleCopy({ roomID })} style={{ cursor: 'pointer', userSelect: 'none' }}>
        {roomID}
      </span></h6>
      {gameState && gameState.started && (
        <>
          <h5>本局游戏配置</h5>
          <div className={styles.gameRole}>
            {renderGameConfig()}
          </div>
        </>
      )}
      {gameState && gameState.started && (
        <>
          <h5>底牌</h5>
          <div className={styles.deckGrid}>
            {gameState.leftoverCards.map((card, index) => (
              <><img
                key={index}
                src={gameState.subPhase === '结算环节' ? card.img : '/cardback.png'}
                alt={`底牌 ${index + 1}`}
                title={`底牌 ${index + 1}`}
                onClick={() => handleDeckClick(index)} />
                {/* <div className={styles.deckGridName}>{index===0?'底牌A':(index===1?'底牌B':'底牌C')}</div> */}
                </>
            ))}
          </div>
        </>
      )}
      <h5>玩家列表</h5>
      <div className={styles.playerGrid}>
        {players.map((player, index) => (
          <div key={index}>
          <div  className={styles.playerItem} onClick={player.username === null ?()=>{joinGame(index)}:(gameState && gameState.started && gameState.subPhase && !daySubPhases.includes(gameState.subPhase) )?()=>{handleCardClick(player)}:()=>{removePlayer(index)}} > 
              {host === player.id && (<span className={styles.roomHolder} style={{ backgroundColor: player.id === socket.id ? 'rgb(234 88 12)' : 'black'}}>房主</span>)}
              {(!gameState || !gameState.started) && isHost && player.id!==socket.id &&(<span className={styles.removeItem} >
              ×
              </span>) }
              { socket.id!==player.id &&(<span className={styles.playerItemIndex} style={{ backgroundColor: player.id === socket.id ? 'rgb(234 88 12)' : 'black'}}>
                {index + 1}
              </span>) }
              { socket.id===player.id &&(<span className={styles.isMe} style={{ backgroundColor: player.id === socket.id ? 'rgb(234 88 12)' : 'black'}}>
              我
              </span>) }
              <span className={styles.onlineStatus} style={{ backgroundColor: player.offline ? 'grey' : 'green' }}></span>
          </div>
          {gameState && gameState.started && gameState.subPhase && !daySubPhases.includes(gameState.subPhase) && (
              <>
                 <div  className={styles.playerItemBtn}
                  >
                    {player.username}
                  </div>
              </>
            )}
            {gameState&&gameState.subPhase&&gameState.subPhase === '投票环节' && (
                  <div  className={styles.playerItemBtn}
                    onClick={() => vote(player.id)}
                    disabled={gameState.players.find(p => p.id === socket.id).hasVoted}
                  >
                    投票
                  </div>
                )}
          </div>
        ))}
      </div>
      

      {(!gameState || !gameState.started) && (
        <>
          <h5>角色列表（<span style={{ color: ((roles.reduce((sum, role) => sum + role.count, 0)) > (players.length + 3)) ? 'red' : 'black' }}>{roles.reduce((sum, role) => sum + role.count, 0)}</span>/{players.length + 3}）</h5>
          <div className={styles.roleGrid}>
            {roles.map((role, index) => (
              <div key={index} className={styles.roleItem} onClick={() => handleRoleClick(index)}>
                <img src={role.img} alt={role.name} title={role.name} /><br />
                <div
                  className={styles.infoIcon}
                  onClick={(e) => handleInfoClick(e, role.description)}
                  onMouseLeave={handleInfoLeave}
                >
                  ?
                </div>
                <label className={styles.roleCount}>{role.name}: {role.count}</label>
              </div>
            ))}
          </div>
        </>
      )}

      {isHost && (
        <>
          {!gameState || !gameState.started ? (
            <button onClick={startGame}>开始游戏</button>
          ) : (
            gameState.subPhase === '结算环节' ? (
              <button onClick={resetGame} >重新开始</button>
            ) : (
              <button onClick={nextPhase}>下一阶段</button>
            )
          )}
        </>
      )}

      {gameState && gameState.started && (
         
        <>
          <img
            src={isVisible ? gameState.players.find(p => p.id === socket.id).role.img : '/cardback.png'}
            style={{ width: '9vw', height: '14vw', margin: '0.5vw' }}
            onClick={() => toggleVisibility()}
                /> 
          <h5>当前阶段 {`${gameState.majorPhase} - ${gameState.subPhase}`}</h5>
          {gameState.subPhase === '讨论环节' && gameState.discussionInfo && (
          <div className={styles.currentPhase}>
              <div className={styles.discussionInfo}>
                <p>从 {gameState.discussionInfo.startingPlayer.username} 开始，按 {gameState.discussionInfo.direction} 顺序发言。</p>
              </div>
            
          </div>
          )}
          <h5>游戏日志</h5>
          <div className={styles.logs}>
            <ul>
              {gameState.subPhase !== '结算环节' ? (
                logs[socket.id] && Object.keys(logs[socket.id]).map(key => (
                  logs[socket.id][key].map((log, index) => (
                    <li key={`${key}-${index}`}>{getLogMessage(log, socket.id)}</li>
                  ))
                ))
              ) : (
                Object.keys(logs).map(socketId => (
                  logs[socketId]['2'] && logs[socketId]['2'].map((log, index) => (
                    <li key={`${socketId}-1-${index}`}>{getLogMessage(log, socketId)}</li>
                  ))
                ))
              )}
            </ul>
          </div>

          {gameState.subPhase === '结算环节' && (
            <>
              <h5>投票结果</h5>
              <div className={styles.voteResults}>
                {gameState.winner && (
                  <p style={{ color: 'red', fontWeight: 'bold' }}>{gameState.winner}</p>
                )}
                {gameState.voteResults && gameState.voteResults.length > 0 && (
                  <ul>
                    {gameState.voteResults.map((vote, index) => (
                      <li key={index}>{(players.find(p => p.id === vote.playerId)) && (players.find(p => p.id === vote.playerId)).username} 投票给 {(players.find(p => p.id === vote.targetId)) && players.find(p => p.id === vote.targetId).username}</li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </>
      )}

      

      {(!gameState || !gameState.started) && <button onClick={leaveRoom}>离开房间</button>}
      {tooltip.visible && (
              <div className={styles.tooltip}>
                {tooltip.content}
              </div>
            )}
    </div>
  );
}

export default Room;





