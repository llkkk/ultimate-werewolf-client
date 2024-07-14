import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import styles from './App.module.css'; // 确保导入了 CSS Modules 文件

import saveRoomToLocalStorage from './utils';
import { Role } from './types/role';
import { Player } from './types/player';
import { Response } from './types/response';
import { GameState } from './types/gameState';
import { useTip } from './globalTip';
import { Ability } from './types/ability';
import { Avatar } from './types/avatar';

interface GameProps {
  socket: Socket;
}

function Game({ socket }: GameProps) {
  const navigate = useNavigate();
  const { roomID } = useParams();
  const { showTip } = useTip();

  const [username, setUsername] = useState(
    localStorage.getItem('username') || '',
  );
  const [userAvatar, setUserAvatar] = useState<Avatar | null>(null);

  const [players, setPlayers] = useState<Player[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  // const [isHide, setIsHide] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  // const [preGameState, setPreRoles] = useState([]);

  // 用户头像相关
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // 角色图片基础地址
  const role_resources_base_url =
    'https://cdn.jsdelivr.net/gh/uchihasasuka/ultimate-werewolf-resource@master/images/roles';

  // 获取头像图片列表地址
  const avatar_resources_list_url =
    'https://api.github.com/repos/UchihaSasuka/ultimate-werewolf-resource/contents/images/avatars';

  // 头像图片基础地址
  const avatar_resources_base_url =
    'https://cdn.jsdelivr.net/gh/uchihasasuka/ultimate-werewolf-resource@master/images/avatars/';

  const abilities = {
    viewHand: { name: '查看手牌', max: 1 },
    swapHand: { name: '交换手牌', max: 1 },
    seerViewDeck: { name: '预言家查看底牌', max: 2 },
    wolfViewDeck: { name: '狼人查看底牌', max: 1 },
    viewAndSwap: { name: '查看并交换手牌', max: 1 },
    viewSelfHand: { name: '确认自己手牌', max: 1 },
    swapSelfHandDeck: { name: '交换手牌和任意一张底牌', max: 1 },
    viewAndSteal: { name: '查看并交换底牌', max: 1 },
    lockPlayer: { name: '锁定玩家身份', max: 1 },
    votePlayer: { name: '票出该玩家则获胜', max: 1 },
  };
  //const daySubPhases = ['讨论环节', '投票环节', '结算环节'];
  const nightSubPhases = [
    '爪牙',
    '狼人',
    '狼先知',
    '守夜人',
    '诅咒者',
    '预言家',
    '哨兵',
    '强盗',
    '女巫',
    '捣蛋鬼',
    '新捣蛋鬼',
    '酒鬼',
    '盗贼',
    '失眠者',
  ];
  let [existingRoles, setExistingRoles] = useState<string[]>([]);

  useEffect(() => {
    const filteredRoles = roles.filter((role) => role.count > 0);
    const updatedExistingRoles = nightSubPhases.filter((phase) =>
      filteredRoles.some((role) => role.name === phase),
    );

    setExistingRoles(updatedExistingRoles);
    // 初始化头像图片
    const fetchAvatars = async () => {
      const response = await fetch(avatar_resources_list_url);
      const data = await response.json();
      const avatarsData = data.map((avatar: Avatar, index: number) => ({
        name: avatar.name,
        sha: index,
        img: avatar_resources_base_url + avatar.name,
      }));
      setAvatars(avatarsData);
    };
    fetchAvatars();

    //获取缓存的用户头像
    const storedAvatar = localStorage.getItem('userAvatar');

    if (storedAvatar) {
      try {
        const parsedAvatar: Avatar = JSON.parse(storedAvatar);
        setUserAvatar(parsedAvatar);
        console.log(parsedAvatar);
      } catch (error) {
        console.error('Failed to parse userAvatar from localStorage', error);
      }
    }
  }, [roles]);

  const [isHost, setIsHost] = useState(
    localStorage.getItem('host') === socket.id,
  );
  const [host, setHost] = useState<string>(localStorage.getItem('host') || '');
  const [logs, setLogs] = useState<{
    [socketId: string]: { [type: string]: string[] };
  }>({});
  const [swapTargets, setSwapTargets] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isDivVisible, setIsDivVisible] = useState(true);

  // 点击事件处理函数
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
    const timer = setTimeout(() => {
      // 1秒后执行的方法
      setIsDivVisible(!isDivVisible);
    }, 1000);

    // 清除定时器，防止内存泄漏
    return () => clearTimeout(timer);
  };

  const generateRandomPlayerName = () => {
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';

    // 生成随机的两个字母
    let randomLetters = '';
    for (let i = 0; i < 2; i++) {
      randomLetters += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }

    // 生成随机的两个数字
    let randomNumbers = '';
    for (let i = 0; i < 2; i++) {
      randomNumbers += numbers.charAt(
        Math.floor(Math.random() * numbers.length),
      );
    }

    // 组合成最终的玩家名
    const randomPlayerName = `玩家${randomLetters}${randomNumbers}`;
    return randomPlayerName;
  };

  // 更换用户头像
  const handleAvatarClick = (avatar: Avatar) => {
    console.log('更新头像信息1');
    if (selectedPlayer) {
      const currentPlayer = gameState?.players.find((p) => p.id === socket.id);
      if (currentPlayer) {
        currentPlayer.avatar = avatar;
      }
      selectedPlayer.avatar = avatar;
      setShowAvatarSelector(false);
      setSelectedPlayer(null);
      localStorage.setItem('userAvatar', JSON.stringify(avatar));
      socket.emit('updatePlayer', {
        room: roomID,
        player: currentPlayer,
      });
    }
  };

  useEffect(() => {
    if (!username) {
      const newUserName = generateRandomPlayerName();
      localStorage.setItem('username', newUserName);
      setUsername(newUserName);
    }
    if (roomID) {
      localStorage.setItem('roomID', roomID);
      socket.emit(
        'joinRoom',
        { room: roomID, username },
        (response: Response) => {
          if (response.status === 'ok') {
            localStorage.setItem('roles', JSON.stringify(response.roles)); // 保存角色配置
            localStorage.setItem('players', JSON.stringify(response.players)); // 保存玩家信息
            localStorage.setItem('host', response.host); // 保存房主信息
            //TODO头像本地有保存，直接取本地更新远端
            saveRoomToLocalStorage(roomID);
            setPlayers(response.players || []);
            setRoles(response.roles || roles);
            setIsHost(response.host === socket.id);
            setHost(response.host);
            setGameState(response.gameState);
          } else {
            showTip(response.message);
          }
        },
      );
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
      setHost(socket.id || '');
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

    socket.on('actionDenied', ({ message }) => {
      showTip(message);
    });

    socket.on('restartGame', (gameState) => {
      setGameState(null);
      setRoles(gameState.preRoles);
      setPlayers(gameState.players); // 确保玩家状态更新
      console.log('Game state restart', gameState);
    });
  }, [socket, roomID, navigate]);

  const handleCopy = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => {
          showTip('复制成功！');
        })
        .catch((err) => {
          console.error('Failed to copy text: ', err);
        });
    } else {
      // Fallback method using execCommand
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        showTip('复制成功！');
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
      document.body.removeChild(textArea);
    }
  };
  const [tooltip, setTooltip] = useState({ visible: false, content: '' });
  const handleInfoClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    description: string,
  ) => {
    e.stopPropagation();
    showTip(description);
  };

  const handleInfoLeave = () => {
    setTooltip({ visible: false, content: '' });
  };
  const handleRoleClick = (index: number) => {
    if (!isHost) return;
    const updatedRoles = roles.map((role, i) => {
      if (index !== i) return role;
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

  const joinGame = (index: number) => {
    if (players[index] && players[index].username) return;
    socket.emit(
      'joinGame',
      { room: roomID, username, index },
      (response: Response) => {
        if (response.status === 'ok') {
          setPlayers(response.players);
          setGameState(response.gameState);
        } else {
          showTip(response.message);
        }
      },
    );
  };

  const removePlayer = (index: number) => {
    // 先判断是否是自己 是自己统一走换头像的逻辑
    if (socket.id == players[index].id) {
      const player = players[index];
      setSelectedPlayer(player);
      setShowAvatarSelector(true);
    } else {
      // 如果不是房主没有移除权限
      if (!isHost) return;
    }

    socket.emit('removePlayer', { room: roomID, index });
  };

  const leaveRoom = () => {
    socket.emit('leaveRoom', { room: roomID, username });
    navigate('/');
  };

  const startGame = () => {
    if (!isHost) return;
    socket.emit('startGame', { room: roomID }, (response: Response) => {
      if (response.status === 'error') {
        showTip(response.message);
      }
    });
  };

  const nightAction = (action: string, data: object) => {
    socket.emit('nightAction', { room: roomID, action, data });
  };

  const nextPhase = () => {
    if (!isHost) return;
    socket.emit('nextPhase', { room: roomID });
  };

  const vote = (targetId: string) => {
    if (gameState?.players.find((p) => p.id === socket.id)?.hasVoted) {
      // 玩家已经投过票了
      return;
    }
    socket.emit('vote', { room: roomID, targetId });
  };

  const canPerformAction = (ability: Ability) => {
    const currentPlayer = gameState?.players.find((p) => p.id === socket.id);
    return (
      currentPlayer &&
      currentPlayer.initialRole &&
      currentPlayer.initialRole.name === gameState?.subPhase &&
      currentPlayer.initialRole.abilities.some(
        (a) => a.name === ability.name && a.max > 0,
      )
    );
  };

  const handleCardClick = (player: Player) => {
    if (player.id === socket.id) return;
    if (canPerformAction(abilities.viewHand)) {
      nightAction(abilities.viewHand.name, { target1: { id: player.id } });
    } else if (canPerformAction(abilities.swapHand)) {
      if (swapTargets.length === 0) {
        setSwapTargets([player.id]);
      } else if (swapTargets.length === 1) {
        if (player.id !== swapTargets[0]) {
          setSwapTargets([...swapTargets, player.id]);
          nightAction(abilities.swapHand.name, {
            target1: { type: 'player', id: swapTargets[0] },
            target2: { type: 'player', id: player.id },
          });
          setSwapTargets([]);
        }
      }
    } else if (canPerformAction(abilities.viewAndSwap)) {
      const currentPlayer = gameState?.players.find((p) => p.id === socket.id);
      nightAction(abilities.viewAndSwap.name, {
        target1: { type: 'player', id: player.id },
        target2: { type: 'player', id: currentPlayer?.id },
      });
    } else if (canPerformAction(abilities.votePlayer)) {
      nightAction(abilities.votePlayer.name, {
        target1: { type: 'player', id: player.id },
      });
    } else if (canPerformAction(abilities.lockPlayer)) {
      nightAction(abilities.lockPlayer.name, {
        target1: { type: 'player', id: player.id },
      });
    }
  };

  const handleDeckClick = (index: number) => {
    if (canPerformAction(abilities.seerViewDeck)) {
      nightAction(abilities.seerViewDeck.name, {
        target1: { type: 'deck', id: index },
      });
    } else if (canPerformAction(abilities.wolfViewDeck)) {
      nightAction(abilities.wolfViewDeck.name, {
        target1: { type: 'deck', id: index },
      });
    } else if (canPerformAction(abilities.swapSelfHandDeck)) {
      nightAction(abilities.swapSelfHandDeck.name, {
        target1: { type: 'player', id: socket.id },
        target2: { type: 'deck', id: index },
      });
    } else if (canPerformAction(abilities.viewAndSteal)) {
      const currentPlayer = gameState?.players.find((p) => p.id === socket.id);
      nightAction(abilities.viewAndSteal.name, {
        target1: { type: 'deck', id: index },
        target2: { type: 'player', id: currentPlayer?.id },
      });
    }
  };

  const getLogMessage = (log: string, id: string | undefined) => {
    const index = gameState
      ? gameState.players.findIndex((p) => p.id === id) + 1
      : 0;
    const currentPlayer = gameState?.players.find((p) => p.id === id);
    console.log('玩家索引', index);
    return currentPlayer && currentPlayer.initialRole
      ? `玩家${index}-${currentPlayer.username}(${currentPlayer.initialRole.name})：${log}`
      : `未知角色：${log}`;
  };

  const renderGameConfig = () => {
    return roles
      .filter((role) => role.count > 0)
      .map((role, index) => (
        <div key={index} className={styles.gameRoleItem}>
          <img src={role.img} alt={role.name} title={role.name} />
          <div
            className={styles.gameInfoIcon}
            onClick={(e) => handleInfoClick(e, role.description)}
            onMouseLeave={handleInfoLeave}
          >
            ?
          </div>
          <div className={styles.gameInfoName}>
            {role.name}:{role.count}
          </div>
        </div>
      ));
  };

  const resetGame = () => {
    if (!isHost) return;
    socket.emit('resetGame', { room: roomID });
  };

  return (
    <div className={styles.container}>
      <div
        className={`${styles.operateBtnn} ${styles.backHome}`}
        onClick={() => leaveRoom()}
      >
        返回主页
      </div>
      <h4>
        房间号:
        <span
          onClick={() => handleCopy()}
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          {roomID}
        </span>
      </h4>
      {gameState && gameState.started && (
        <>
          <h5>本局游戏配置</h5>
          <div className={styles.gameRole}>{renderGameConfig()}</div>
          <h5>行动顺序</h5>
          <div className={styles.moveRange}>
            {existingRoles.map((phase, index) => (
              <>
                <span
                  key={index}
                  style={{
                    color: phase === gameState.subPhase ? 'red' : 'black',
                  }}
                >
                  {phase}
                </span>
                <span>{index < existingRoles.length - 1 ? '→' : ''}</span>
              </>
            ))}
          </div>
        </>
      )}
      {gameState && gameState.started && (
        <>
          <h5>底牌</h5>
          <div className={styles.deckGrid}>
            {gameState.leftoverCards.map((role, index) => (
              <>
                {gameState.subPhase !== '结算环节' && (
                  <img
                    key={index}
                    src={role_resources_base_url + '/cardback.png'}
                    alt={`底牌 ${index + 1}`}
                    title={`底牌 ${index + 1}`}
                    onClick={() => handleDeckClick(index)}
                    className={styles.deckGridBackImg}
                  />
                )}
                {gameState.subPhase === '结算环节' && (
                  <div className={styles.deckGridItem}>
                    <img
                      key={index}
                      src={role_resources_base_url + role.img}
                      alt={`底牌 ${index + 1}`}
                      title={`底牌 ${index + 1}`}
                      className={styles.deckGridImg}
                      onClick={() => handleDeckClick(index)}
                    />
                    <div className={styles.roleCount}>{role.name}</div>
                  </div>
                )}
              </>
            ))}
          </div>
        </>
      )}
      <h5>玩家列表</h5>
      <div className={styles.playerGrid}>
        {players.map((player, index) => (
          <div key={index}>
            <div
              className={styles.playerItem}
              onClick={
                player.username === null
                  ? () => {
                      joinGame(index);
                    }
                  : gameState && gameState.started
                  ? () => {
                      handleCardClick(player);
                    }
                  : () => {
                      removePlayer(index);
                    }
              }
            >
              {((socket.id == player.id && userAvatar && userAvatar.img) ||
                player.avatar) && (
                <img
                  className={styles.ownCardImg}
                  src={
                    socket.id == player.id && userAvatar && userAvatar.img
                      ? userAvatar.img
                      : player.avatar.img
                  }
                  alt='Role Image'
                />
              )}
              {host === player.id && (
                <span
                  className={styles.roomHolder}
                  style={{
                    backgroundColor:
                      player.id === socket.id ? 'rgb(234 88 12)' : 'black',
                  }}
                >
                  房主
                </span>
              )}
              {(!gameState || !gameState.started) &&
                isHost &&
                player.id !== socket.id && (
                  <span className={styles.removeItem}>×</span>
                )}
              {socket.id !== player.id && (
                <span
                  className={styles.playerItemIndex}
                  style={{
                    backgroundColor:
                      player.id === socket.id ? 'rgb(234 88 12)' : 'black',
                  }}
                >
                  {index + 1}
                </span>
              )}
              {socket.id === player.id && (
                <span
                  className={styles.isMe}
                  style={{
                    backgroundColor:
                      player.id === socket.id ? 'rgb(234 88 12)' : 'black',
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
            {gameState && gameState.started && gameState.subPhase && (
              <>
                <div className={styles.playerItemBtn}>{player.username}</div>
              </>
            )}
            {gameState &&
              gameState.subPhase &&
              gameState.subPhase === '投票环节' && (
                <div
                  className={styles.playerItemBtn}
                  onClick={() => vote(player.id)}
                >
                  投票
                </div>
              )}
          </div>
        ))}
      </div>

      {showAvatarSelector && (
        <div className={styles.avatarPickerOverlay}>
          <div className={styles.avatarPicker}>
            {avatars.map((avatar) => (
              <img
                key={avatar.name}
                src={avatar.img}
                alt={avatar.name}
                onClick={() => handleAvatarClick(avatar)}
                className={styles.avatarImage}
              />
            ))}
            <button
              onClick={() => setShowAvatarSelector(false)}
              className={styles.cancelButton}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {(!gameState || !gameState.started) && (
        <>
          <h5>
            角色列表（
            <span
              style={{
                color:
                  roles.reduce((sum, role) => sum + role.count, 0) >
                  players.length + 3
                    ? 'red'
                    : 'black',
              }}
            >
              {roles.reduce((sum, role) => sum + role.count, 0)}
            </span>
            /{players.length + 3}）
          </h5>
          <div className={styles.roleGrid}>
            {roles.map((role, index) => (
              <div
                key={index}
                className={styles.roleItem}
                onClick={() => handleRoleClick(index)}
              >
                <img
                  src={role_resources_base_url + role.img}
                  alt={role.name}
                  title={role.name}
                />
                <div
                  className={styles.infoIcon}
                  onClick={(e) => handleInfoClick(e, role.description)}
                  onMouseLeave={handleInfoLeave}
                >
                  ?
                </div>
                <div className={styles.roleCount}>
                  {role.name}: {role.count}
                </div>
              </div>
            ))}
            {tooltip.visible && (
              <div className={styles.tooltip}>{tooltip.content}</div>
            )}
          </div>
        </>
      )}

      {isHost && (
        <>
          {!gameState || !gameState.started ? (
            <div className={styles.operateBtnn} onClick={startGame}>
              开始游戏
            </div>
          ) : gameState.subPhase === '结算环节' ? (
            <div className={styles.operateBtnn} onClick={resetGame}>
              重新开始
            </div>
          ) : (
            <div className={styles.operateBtnn} onClick={nextPhase}>
              下一阶段
            </div>
          )}
        </>
      )}

      {gameState && gameState.started && (
        <>
          <div className={styles.ownCard}>
            {isVisible && (
              <img
                className={styles.ownCardImg}
                src={`${role_resources_base_url}${
                  gameState.players.find((p) => p.id === socket.id)?.initialRole
                    .img
                }`}
              />
            )}
            {!isVisible && (
              <img
                className={styles.ownCardback}
                src={`${role_resources_base_url}/cardback.png`}
              />
            )}
            <div className={styles.roleCount}>
              {isVisible
                ? gameState.players.find((p) => p.id === socket.id)?.role.name
                : ''}
            </div>
          </div>
          <div
            className={styles.hideCurrentRole}
            onClick={() => toggleVisibility()}
          >
            {isVisible ? '隐藏当前身份' : '显示当前身份'}
          </div>
          {isDivVisible && (
            <div
              className={`${styles.hiddenItem} ${
                isVisible ? styles.shown : styles.hidden
              }`}
            >
              <h5>
                当前阶段 {`${gameState.majorPhase} - ${gameState.subPhase}`}
              </h5>
              {gameState.subPhase === '讨论环节' &&
                gameState.discussionInfo && (
                  <div className={styles.currentPhase}>
                    <div className={styles.discussionInfo}>
                      <p>
                        从玩家{gameState.discussionInfo.index + 1}-
                        {gameState.discussionInfo.startingPlayer.username}{' '}
                        开始，按 {gameState.discussionInfo.direction} 顺序发言。
                      </p>
                    </div>
                  </div>
                )}
              <h5>游戏日志</h5>
              <div className={styles.logs}>
                <ul>
                  {gameState.subPhase !== '结算环节'
                    ? socket.id &&
                      logs[socket.id] &&
                      Object.keys(logs[socket.id]).map((key) =>
                        logs[socket.id || ''][key].map((log, idx) => (
                          <li key={`${key}-${idx}`}>
                            {getLogMessage(log, socket.id)}
                          </li>
                        )),
                      )
                    : Object.keys(logs).map(
                        (socketId) =>
                          logs[socketId]['2'] &&
                          logs[socketId]['2']?.map((log: string, idx) => (
                            <li key={`${socketId}-1-${idx}`}>
                              {getLogMessage(log, socketId)}
                            </li>
                          )),
                      )}
                </ul>
              </div>
            </div>
          )}
          {gameState.subPhase === '结算环节' && (
            <>
              <h5>投票结果</h5>
              <div className={styles.voteResults}>
                {gameState.winner && (
                  <p style={{ color: 'red', fontWeight: 'bold' }}>
                    {gameState.winner}
                  </p>
                )}
                {gameState.voteResults && gameState.voteResults.length > 0 && (
                  <ul>
                    {gameState.voteResults.map((vote, index) => (
                      <li key={index}>
                        {players.find((p) => p.id === vote.playerId) &&
                          players.find((p) => p.id === vote.playerId)
                            ?.username}{' '}
                        投票给{' '}
                        {players.find((p) => p.id === vote.targetId) &&
                          players.find((p) => p.id === vote.targetId)?.username}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </>
      )}

      {(!gameState || !gameState.started) && (
        <div className={styles.operateBtnn} onClick={leaveRoom}>
          离开房间
        </div>
      )}
    </div>
  );
}

export default Game;
