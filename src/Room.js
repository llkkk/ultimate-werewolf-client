import React, { useState, useEffect } from 'react';
import { useNavigate,useParams  } from 'react-router-dom';
import styles from './App.module.css';  // 确保导入了 CSS Modules 文件




function Room({ socket }) {
  const navigate = useNavigate();
  const {roomID} = useParams();

    useEffect(() => {
      if (roomID) {
      }
    }, [roomID, socket]);
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [players, setPlayers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isHide,setIsHide] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [preGameState, setPreRoles] = useState([]);

  const abilities = {
    viewHand: { name: '查看手牌', max: 1},
    swapHand: { name: '交换手牌', max: 1},
    seerViewDeck: { name: '预言家查看底牌', max: 2},
    wolfViewDeck: { name: '狼人查看底牌', max: 1},
    viewAndSwap: { name: '查看并交换手牌', max: 1},
    swapHand: { name: '交换手牌', max: 1},
    viewSelfHand: { name: '确认自己手牌', max: 1 },
    swapSelfHandDeck: { name: '交换手牌和任意一张底牌', max: 1 },
  };

  
  const [isHost, setIsHost] = useState(localStorage.getItem('host') === socket.id);
  const [host, setHost] = useState(localStorage.getItem('host')||'');
  const [logs, setLogs] = useState({});
  const [actionDenied, setActionDenied] = useState('');
  const [swapTargets, setSwapTargets] = useState([]);

  useEffect(() => {
    if (!username) {
      console.error('Room ID or username is undefined');
      
      navigate('/');
      return;
    }

    socket.emit('joinRoom', { room: roomID, username }, (response) => {
      if (response.status === 'ok') {
        setPlayers(response.players || []);
        setRoles(response.roles || roles);
        setIsHost(response.host === socket.id);
        setHost(response.host);
        setGameState(response.gameState);
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
      setHost(host);
    });

    socket.on('newHost', () => {
      setIsHost(true);
      setHost(socket.id);
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
      console.log('Game state restart11111', gameState);
      setGameState(null);
      setRoles(gameState.preRoles);
      setPlayers(gameState.players); // 确保玩家状态更新
      console.log('Game state restart', gameState);
    });
  }, [socket, roomID, username, navigate]);


  const handleCopy = ({roomID}) => {
    console.log('Copying text:', roomID); // 确认传递的是字符串
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert("复制成功！");
      }).catch(err => {
        console.error("Failed to copy text: ", err);
      });
    } else {
      // Fallback method using execCommand
      const textArea = document.createElement("textarea");
      textArea.value = roomID;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert("复制成功！");
      } catch (err) {
        console.error("Failed to copy text: ", err);
      }
      document.body.removeChild(textArea);
    }
  };
  const [tooltip, setTooltip] = useState({ visible: false, content: '' });
  const handleInfoClick = (e,description) => {
    e.stopPropagation();
    setTooltip({ visible: true, content: description });
    setTimeout(() => {
      setTooltip({ visible: false, content: description });
    }, 1500);
  };

  const handleInfoLeave = () => {
    setTooltip({ visible: false, content: '' });
  };
  const handleRoleClick = (index) => {
    if (!isHost) return;
    const updatedRoles = roles.map((role, i) => {
      if(index!==i)
        return role;
      if (role.name === '狼人' || role.name === '村民') {
        role.count = (role.count + 1) % 4;
        if (role.count === 0) role.count = 0;
      } else if(role.name === '守夜人' ){
        if (role.count === 0) role.count = 2;
        else  role.count = 0;
      }else{
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
    socket.emit('startGame', { room: roomID }, (response) => {
      if (response.status === 'error') {
        alert(response.message);
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
      nightAction(abilities.viewHand.name, {target1: {id:player.id}});
    } else if (canPerformAction(abilities.swapHand)) {
      if (swapTargets.length === 0) {
        if(player.id !== socket.id) {
          setSwapTargets([player.id]);
        }
      } else if (swapTargets.length === 1) {
        if(player.id !== socket.id && player.id !== swapTargets[0]) {
          setSwapTargets([...swapTargets, player.id]);
          nightAction(abilities.swapHand.name, { target1: {type:'player', id:swapTargets[0]}, target2: {type:'player', id:player.id} });
          setSwapTargets([]);
        }
    
      }
    } else if (canPerformAction(abilities.viewAndSwap)) {
      if(player.id != socket.id) {
        const currentPlayer = gameState.players.find(p => p.id === socket.id);
        nightAction(abilities.viewAndSwap.name, { target1: {type:'player', id: player.id}, target2: {type:'player', id: currentPlayer.id} });
      }

    }
  };

  const handleDeckClick = (index) => {
    if (canPerformAction(abilities.seerViewDeck)) {
      nightAction(abilities.seerViewDeck.name, { targets: [index] });
    } else if (canPerformAction(abilities.wolfViewDeck)) {
      nightAction(abilities.wolfViewDeck.name, { targets: [index] });
    } else if (canPerformAction(abilities.swapSelfHandDeck)) {
      nightAction(abilities.swapSelfHandDeck.name, { target1: {type:'player', id: socket.id}, target2: {type:'deck', id: index} });
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
        <p key={index}>{role.name}：{role.count}</p>
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
      <h2>房间号:<span onClick={() => handleCopy({roomID})} style={{ cursor: 'pointer', userSelect: 'none' }}>
          {roomID}
        </span></h2>
      <div className={styles.message}>
        <p>公告：一夜狼人为发言游戏，建议线下玩，或群语音开麦玩。</p>
        {actionDenied && <p style={{ color: 'red' }}>{actionDenied}</p>}
      </div>
      <h3>玩家列表</h3>
      <div className={styles.playerGrid}>
        {players.map((player, index) => (
          <div key={index} className={styles.playerItem}>
            <label>
              {host==player.id && (<span style={{color:true?'red':'black'}}>※</span>)}
              <span style={{ color: player.id === socket.id ? 'red' : 'black' }}>
                玩家 {index + 1}: <p>{player.username}</p>
              </span>
              {player.username === null ? (
                <button onClick={() => joinGame(index)}>加入</button>
              ) : (
                (!gameState || !gameState.started) && isHost && <button onClick={() => removePlayer(index)}>移除</button>
              )}
            </label>
            {gameState && gameState.started && (
              <>
                <img
                  src={gameState.subPhase === '结算环节' ? player.role.img : '/cardback.png'}
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

      {gameState && gameState.started && (
        <>
          <h3>底牌</h3>
          <div className={styles.deckGrid}>
            {gameState.leftoverCards.map((card, index) => (
              <img
                key={index}
                src={gameState.subPhase === '结算环节' ? card.img : '/cardback.png'}
                alt={`底牌 ${index + 1}`}
                title={`底牌 ${index + 1}`}
                style={{ width: '100px', height: '150px', margin: '10px' }}
                onClick={() => handleDeckClick(index)}
              />
            ))}
          </div>
        </>
      )}

      {(!gameState || !gameState.started) && (
        <>
          <h3>角色列表（<span style={{color:((roles.reduce((sum, role) => sum + role.count, 0))>(players.length + 3))?'red':'black'}}>{roles.reduce((sum, role) => sum + role.count, 0)}</span>/{players.length + 3}）</h3>
          <div className={styles.roleGrid}>
            {roles.map((role, index) => (
              <div key={index} className={styles.roleItem}  onClick={() => handleRoleClick(index)}>
                <img src={role.img} alt={role.name} title={role.name} /><br/>
                <div 
              className={styles.infoIcon} 
              onClick={(e) => handleInfoClick(e,role.description)} 
              onMouseLeave={handleInfoLeave}
            >
              ?
            </div>
                <label>{role.name}: {role.count}</label>
              </div>
            ))}
            {tooltip.visible && (
        <div className={styles.tooltip}>
          {tooltip.content}
        </div>
      )}
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
          <h3>初始身份</h3>
          <div onClick={()=>setIsHide(!isHide)} className={styles.currentRole}>
            <img src={isHide?'/cardback.png':getRoleImage()} alt={getRoleName()} title={getRoleName()} />
          </div>
          <h3>当前阶段</h3>
          <div className={styles.currentPhase}>
            <p>{`${gameState.majorPhase} - ${gameState.subPhase}`}</p>
            {gameState.subPhase === '讨论环节' && gameState.discussionInfo && (
            <div className={styles.discussionInfo}>
              <p>从 {gameState.discussionInfo.startingPlayer.username} 开始，按 {gameState.discussionInfo.direction} 顺序发言。</p>
            </div>
          )}
          </div>
          <h3>游戏日志</h3>
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

      {gameState && gameState.started && (
        <>
          <h3>本局游戏配置</h3>
          <div className={styles.gameConfig}>
            {renderGameConfig()}
          </div>
        </>
      )}

      {(!gameState || !gameState.started) && <button onClick={leaveRoom}>离开房间</button>}
    </div>
  );
}

export default Room;





