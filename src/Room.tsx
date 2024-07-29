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
import { Avatar } from './types/avatar';
import PlayerAvatar from './components/PlayerAvatar'
import Countdown from './Countdown';

interface GameProps {
  socket: Socket;
}

function Game({ socket }: GameProps) {
  const navigate = useNavigate();
  const { roomID } = useParams();
  const { showTip } = useTip();
  const [initialCount, setInitialCount] = useState(10);

  const [username, setUsername] = useState(
    localStorage.getItem('username') || '',
  );
  const [players, setPlayers] = useState<Player[]>([]);
  const [roles, setRoles] = useState<Role[]>(
    JSON.parse(localStorage.getItem('roles') || '[]'),
  );
  const [gameState, setGameState] = useState<GameState | null>(null);

  // 用户头像相关
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // 角色图片基础地址
  const role_resources_base_url =
    'https://cdn.jsdelivr.net/gh/uchihasasuka/ultimate-werewolf-resource@master/images/roles';

  // 获取头像图片列表地址
  const avatar_resources_list_url =
    'https://game.gtimg.cn/images/lol/act/img/js/heroList/hero_list.js';

  // 头像图片基础地址
  const avatar_resources_base_url =
    'https://game.gtimg.cn/images/lol/act/img/champion/';

  const [existingRoles, setExistingRoles] = useState<string[]>([]);

  useEffect(() => {
    if (avatars.length === 0) {
      // 初始化头像图片
      const fetchAvatars = async () => {
        const response = await fetch(avatar_resources_list_url);
        const data = await response.json();
        if (data) {
          const heroList = data.hero
          const avatarsData = heroList.map((hero: any, index: number) => ({
            name: hero.alias,
            sha: index,
            img: avatar_resources_base_url + hero.alias + '.png',
          }));
          setAvatars(avatarsData);
        }
      };
      fetchAvatars();
    }
  }, [roles]);

  const [isHost, setIsHost] = useState(
    localStorage.getItem('host') === socket.id,
  );
  const [host, setHost] = useState<string>(localStorage.getItem('host') || '');
  const [logs, setLogs] = useState<{
    [socketId: string]: { [type: string]: string[] };
  }>({});
  //const [swapTargets, setSwapTargets] = useState<string[]>([]);
  const [tempTargets, setTempTargets] = useState<object[]>([]);
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
  const pickAvatar = (avatar: Avatar) => {
    if (selectedPlayer) {
      selectedPlayer.avatar = avatar;
      setShowAvatarSelector(false);
      setSelectedPlayer(null);
      localStorage.setItem('userAvatar', JSON.stringify(avatar));
      updateAvatar(avatar)
    }
  };

  // 向服务器更新用户头像
  const updateAvatar = (avatar: Avatar) => {
    const currentPlayer = gameState?.players.find((p) => p.id === socket.id);
    if (currentPlayer) {
      currentPlayer.avatar = avatar;
      socket.emit('updatePlayer', {
        room: roomID,
        player: currentPlayer,
      });
    }
  }

  useEffect(() => {
    if (!username) {
      const newUserName = generateRandomPlayerName();
      localStorage.setItem('username', newUserName);
      setUsername(newUserName);
    }
    //获取缓存的用户头像
    const storedAvatar = localStorage.getItem('userAvatar');
    let parsedAvatar: Avatar | undefined = undefined

    if (storedAvatar) {
      try {
        parsedAvatar = JSON.parse(storedAvatar);
        console.log(parsedAvatar);
      } catch (error) {
        console.error('Failed to parse userAvatar from localStorage', error);
      }
    }
    if (roomID) {
      localStorage.setItem('roomID', roomID);
      socket.emit(
        'joinRoom',
        { room: roomID, username, avatar: parsedAvatar },
        (response: Response) => {
          if (response.status === 'ok') {
            localStorage.setItem('roles', JSON.stringify(response.roles)); // 保存角色配置
            localStorage.setItem('players', JSON.stringify(response.players)); // 保存玩家信息
            localStorage.setItem('host', response.host); // 保存房主信息
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
      setExistingRoles(gameState.nightSubPhases);
      setLogs(gameState.logs);
      if (gameState.majorPhase == '夜晚') {
        setInitialCount(gameState.curActionTime);
      }
      console.log('Game started', gameState);
    });

    socket.on('updateGameState', (gameState) => {
      setGameState(gameState);
      setLogs(gameState.logs);
      setPlayers(gameState.players); // 确保玩家状态更新
      console.log('Game state updated', gameState);
      if (gameState.majorPhase == '夜晚') {
        setInitialCount(gameState.curActionTime);
      }
      if (
        gameState.started &&
        gameState.majorPhase == '夜晚' &&
        gameState.subPhase ==
          gameState.players.find(
            (player: { id: string | undefined }) => socket.id === player.id,
          )?.initialRole.name
      ) {
        showTip('您可以开始行动了', 2, 'top');
      }
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

  const handleAvatarClick = (player: Player, index: number) => {
    if (gameState) {
      if (!gameState.started) {
        // 游戏未开始，换头像或踢人
        removePlayer(index);
      } else if (gameState.majorPhase === '夜晚') {
        // 夜晚发动能力
        handleCardClick(player);
      } else if (gameState.subPhase === '投票环节') {
        // 投票阶段投票
        vote(player.id);
      }
    } else {
      console.log('game state is undefined')
      // 刚开局的情况，直接走换头像的逻辑
      if (socket.id == players[index].id) {
        const player = players[index];
        setSelectedPlayer(player);
        setShowAvatarSelector(true);
      }
    }
  };

  const removePlayer = (index: number) => {
    // 先判断是否是自己 是自己统一走换头像的逻辑
    if (socket.id == players[index].id) {
      const player = players[index];
      setSelectedPlayer(player);
      setShowAvatarSelector(true);
    } else if (isHost) {
      // 房主踢人
      socket.emit('removePlayer', { room: roomID, index });
    }
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
      } else {
        localStorage.setItem('roles', JSON.stringify(response.roles)); // 更新角色配置到本地
      }
    });
  };

  const nightAction = (action: string, data: object) => {
    socket.emit(
      'nightAction',
      { room: roomID, action, data },
      (response: Response) => {
        if (response.status === 'error') {
          showTip(response.message);
        } else {
          showTip('操作成功');
        }
      },
    );
  };

  const nextPhase = () => {
    if (!isHost) return;
    socket.emit('nextPhase', { room: roomID });
  };

  const vote = (targetId: string) => {
    if (gameState?.players.find((p) => p.id === socket.id)?.hasVoted) {
      // 玩家已经投过票了
      showTip('你已经投过票了,请查看下方游戏日志，并等待其他玩家投票完成');
      return;
    }
    socket.emit('vote', { room: roomID, targetId }, (response: Response) => {
      if (response) {
        showTip(response.message);
      }
    });
  };

  const canPerformAction = () => {
    const currentPlayer = gameState?.players.find((p) => p.id === socket.id);
    return (
      currentPlayer &&
      currentPlayer.initialRole &&
      currentPlayer.initialRole.phase === gameState?.subPhase &&
      currentPlayer.initialRole.abilities.some((a) => a.max > 0 && a.opType)
    );
  };

  const handleNightAcntionClick = (
    typeName: string,
    index: number,
    playerName: string,
  ) => {
    const currentPlayer = gameState?.players.find((p) => p.id === socket.id);
    if (currentPlayer) {
      currentPlayer.initialRole.abilities.some((ability) => {
        if (ability.opType) {
          const opType = ability.opType[tempTargets.length];
          if (opType != typeName) return false;
          tempTargets.push({
            type: typeName,
            name: index === -1 ? playerName : index,
          });
          if (tempTargets.length == ability.opType.length) {
            const data = {
              target1: tempTargets[0],
              target2: tempTargets.length > 1 ? tempTargets[1] : null,
            };
            nightAction(ability.name, data);
            setTempTargets([]);
            return true;
          }
        }
      });
    }
  };

  const handleCardClick = (player: Player) => {
    if (player.id === socket.id) return;
    if (canPerformAction()) {
      handleNightAcntionClick('player', -1, player.username);
    }
  };

  const handleDeckClick = (index: number) => {
    if (canPerformAction()) {
      handleNightAcntionClick('deck', index, '');
    }
  };

  const getLogMessage = (log: string, username: string | undefined) => {
    const index = gameState
      ? gameState.players.findIndex((p) => p.username === username) + 1
      : 0;
    const currentPlayer = gameState?.players.find(
      (p) => p.username === username,
    );
    return currentPlayer && currentPlayer.initialRole
      ? `玩家${index}-${currentPlayer.username}(${currentPlayer.initialRole.name})：${log}`
      : `未知角色：${log}`;
  };

  const renderGameConfig = () => {
    return (
      roles &&
      roles
        .filter((role) => role.count > 0)
        .map((role, index) => (
          <div key={index} className={styles.gameRoleItem}>
            <img src={role_resources_base_url + role.img} />
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
        ))
    );
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
      <h5>
        房间号:
        <span
          onClick={() => handleCopy()}
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          {roomID}
        </span>
      </h5>
      {gameState && gameState.started && (
        <>
          <h6>本局游戏配置</h6>
          <div className={styles.gameRole}>{renderGameConfig()}</div>
          <h6>夜晚行动顺序</h6>
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
          <h6>底牌</h6>
          <div className={styles.deckGrid}>
            {gameState.leftoverCards.map((role, index) => (
              <>
                {gameState.subPhase !== '结算环节' && (
                  <img
                    key={index}
                    src={role_resources_base_url + '/cardback.png'}
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
      <h6>玩家列表</h6>
      <div className={styles.playerGrid}>
        {players.map((player, index) => (
          <div key={index}>
            <div
              className={styles.playerItem}
              onClick={
                player.username === null
                  ? () => joinGame(index)
                  : () => handleAvatarClick(player, index)
              }
            >
              <PlayerAvatar
                gameState={gameState}
                player={player}
                role_resources_base_url={role_resources_base_url}
              ></PlayerAvatar>
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

            <span
              className={styles.username}
              style={{ color: '#666', fontWeight: 'bold' }}
            >
              {player.username}
            </span>
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
                onClick={() => pickAvatar(avatar)}
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
          <h6>
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
          </h6>
          <div className={styles.roleGrid}>
            {roles.map((role, index) => (
              <div
                key={index}
                className={styles.roleItem}
                onClick={() => handleRoleClick(index)}
              >
                <img src={role_resources_base_url + role.img} />
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
          ) : gameState.majorPhase === '白天' ? (
            <div className={styles.operateBtnn} onClick={nextPhase}>
              下一阶段
            </div>
          ) : (
            <></>
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
                ? gameState.players.find((p) => p.id === socket.id)?.initialRole
                    .name
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
              <h6>
                当前阶段 {`${gameState.majorPhase} - ${gameState.subPhase}`}{' '}
                {gameState.majorPhase && gameState.majorPhase == '夜晚' && (
                  <Countdown initialCount={initialCount} />
                )}
              </h6>
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
              <h6>游戏日志</h6>
              <div className={styles.logs}>
                <div>
                  {gameState.subPhase !== '结算环节'
                    ? socket.id &&
                      (() => {
                        const player = gameState.players.find(
                          (p) => p.id === socket.id,
                        );
                        if (!player) return null;
                        const username = player.username;
                        if (logs[username]) {
                          return Object.keys(logs[username]).map((key) =>
                            logs[username][key].map((log, idx) => (
                              <p key={`${key}-${idx}`}>
                                {getLogMessage(log, username)}
                              </p>
                            )),
                          );
                        }
                      })()
                    : Object.keys(logs).map(
                        (username) =>
                          logs[username]['2'] &&
                          logs[username]['2'].map((log, idx) => (
                            <p key={`${username}-1-${idx}`}>
                              {getLogMessage(log, username)}
                            </p>
                          )),
                      )}
                </div>
              </div>
            </div>
          )}
          {gameState.subPhase === '结算环节' && (
            <>
              <h6>投票结果</h6>
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
                        玩家
                        {players.findIndex(
                          (p) => p.username === vote.playerName,
                        ) + 1}
                        -
                        {players.find((p) => p.username === vote.playerName) &&
                          players.find((p) => p.username === vote.playerName)
                            ?.username}{' '}
                        （
                        {(() => {
                          const player = gameState.players.find(
                            (p) => p.username === vote.playerName,
                          );
                          if (!player) return null;
                          return (
                            <span>
                              {player.initialRole.name} -&gt; {player.role.name}
                            </span>
                          );
                        })()}
                        ） 投票给 玩家
                        {players.findIndex(
                          (p) => p.username === vote.targetName,
                        ) + 1}
                        -
                        {players.find((p) => p.username === vote.targetName) &&
                          players.find((p) => p.username === vote.targetName)
                            ?.username}
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
