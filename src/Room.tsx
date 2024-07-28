import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import styles from './App.module.css';
import saveRoomToLocalStorage from './utils';
import { Role } from './types/role';
import { Player } from './types/player';
import { Response } from './types/response';
import { GameState } from './types/gameState';
import { useTip } from './globalTip';
import { Avatar } from './types/avatar';
import AvatarSelector from './room/AvatarSelector';
import RoleConfig from './room/RoleConfig';
import PlayerList from './room/PlayerList';
import GameControls from './room/GameControls';
import GameLogs from './room/GameLogs';
import GamePhaseDisplay from './room/GamePhaseDisplay';
import DeckDisplay from './room/DeckDisplay';

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
  const [, setUserAvatar] = useState<Avatar | null>(null);

  const [players, setPlayers] = useState<Player[]>([]);
  const [roles, setRoles] = useState<Role[]>(
    JSON.parse(localStorage.getItem('roles') || '[]'),
  );
  const [gameState, setGameState] = useState<GameState | null>(null);

  const [avatars, setAvatars] = useState<Avatar[]>(
    localStorage.getItem('avatars')
      ? JSON.parse(localStorage.getItem('avatars')!)
      : [],
  );
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const role_resources_base_url =
    'https://cdn.jsdelivr.net/gh/uchihasasuka/ultimate-werewolf-resource@master/images/roles';
  const avatar_resources_list_url =
    'https://api.github.com/repos/UchihaSasuka/ultimate-werewolf-resource/contents/images/avatars';
  const avatar_resources_base_url =
    'https://cdn.jsdelivr.net/gh/uchihasasuka/ultimate-werewolf-resource@master/images/avatars/';

  const nightSubPhases = [
    '爪牙',
    '狼人',
    '冲锋狼',
    '狼先知',
    '阿尔法狼',
    '守夜人',
    '诅咒者',
    '预言家',
    '见习预言家',
    '哨兵',
    '强盗',
    '女巫',
    '捣蛋鬼',
    '小精灵',
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

    if (avatars.length === 0) {
      const fetchAvatars = async () => {
        const response = await fetch(avatar_resources_list_url);
        const data = await response.json();
        const avatarsData = data.map((avatar: Avatar, index: number) => ({
          name: avatar.name,
          sha: index,
          img: avatar_resources_base_url + avatar.name,
        }));
        setAvatars(avatarsData);
        localStorage.setItem('avatars', JSON.stringify(avatarsData));
      };
      fetchAvatars();
    }

    const storedAvatar = localStorage.getItem('userAvatar');
    if (storedAvatar) {
      try {
        const parsedAvatar: Avatar = JSON.parse(storedAvatar);
        setUserAvatar(parsedAvatar);
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
  const [tempTargets, setTempTargets] = useState<object[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isDivVisible, setIsDivVisible] = useState(true);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
    const timer = setTimeout(() => {
      setIsDivVisible(!isDivVisible);
    }, 1000);
    return () => clearTimeout(timer);
  };

  const generateRandomPlayerName = () => {
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    let randomLetters = '';
    for (let i = 0; i < 2; i++) {
      randomLetters += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    let randomNumbers = '';
    for (let i = 0; i < 2; i++) {
      randomNumbers += numbers.charAt(
        Math.floor(Math.random() * numbers.length),
      );
    }
    const randomPlayerName = `玩家${randomLetters}${randomNumbers}`;
    return randomPlayerName;
  };

  const pickAvatar = (avatar: Avatar) => {
    if (selectedPlayer) {
      const currentPlayer = gameState?.players.find((p) => p.id === socket.id);
      if (currentPlayer) {
        currentPlayer.avatar = avatar;
      }
      selectedPlayer.avatar = avatar;
      setShowAvatarSelector(false);
      setSelectedPlayer(null);
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
            localStorage.setItem('roles', JSON.stringify(response.roles));
            localStorage.setItem('players', JSON.stringify(response.players));
            localStorage.setItem('host', response.host);
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
    });

    socket.on('updateRoles', (roles) => {
      setRoles(roles || []);
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
      if (gameState.majorPhase == '夜晚') {
        setInitialCount(gameState.curActionTime);
      }
    });

    socket.on('updateGameState', (gameState) => {
      setGameState(gameState);
      setLogs(gameState.logs);
      setPlayers(gameState.players);
      console.log(gameState)
      if (gameState.majorPhase == '夜晚') {
        setInitialCount(gameState.curActionTime);
      }
      if (
        gameState.majorPhase == '夜晚' &&
        gameState.subPhase ==
          gameState.players.find(
            (player: { id: string | undefined }) => socket.id === player.id,
          )?.initialRole?.name
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
      setPlayers(gameState.players);
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

  const handleInfoClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    description: string,
  ) => {
    e.stopPropagation();
    showTip(description);
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
        removePlayer(index);
      } else if (gameState.majorPhase === '夜晚') {
        handleCardClick(player);
      } else if (gameState.subPhase === '投票环节') {
        vote(player.id);
      }
    }
  };

  const removePlayer = (index: number) => {
    if (socket.id == players[index].id) {
      const player = players[index];
      setSelectedPlayer(player);
      setShowAvatarSelector(true);
    } else if (isHost) {
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
        localStorage.setItem('roles', JSON.stringify(response.roles));
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
      showTip('你已经投过票了,请查看下方游戏日志，并等待其他玩家投票完成');
      return;
    }
    socket.emit('vote', { room: roomID, targetId }, (response: Response) => {
      if (response.status === 'error') {
        showTip(response.message);
      }
    });
  };

  const canPerformAction = () => {
    const currentPlayer = gameState?.players.find((p) => p.id === socket.id);
    return (
      currentPlayer &&
      currentPlayer.initialRole &&
      currentPlayer.initialRole.name === gameState?.subPhase &&
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
          const idx = ability.opType.indexOf(typeName);
          if (idx != -1 && tempTargets.length == idx) {
            if (idx == 0) {
              tempTargets.push({
                type: typeName,
                name: index === -1 ? playerName : index,
              });
            } else {
              tempTargets.push({
                type: typeName,
                name: index === -1 ? playerName : index,
              });
            }
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
          <div className={styles.gameRole}>
            {roles
              .filter((role) => role.count > 0)
              .map((role, index) => (
                <div key={index} className={styles.gameRoleItem}>
                  <img src={role.img} />
                  <div
                    className={styles.gameInfoIcon}
                    onClick={(e) => handleInfoClick(e, role.description)}
                    onMouseLeave={() => {}}
                  >
                    ?
                  </div>
                  <div className={styles.gameInfoName}>
                    {role.name}:{role.count}
                  </div>
                </div>
              ))}
          </div>
          <h6>行动顺序</h6>
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
          <DeckDisplay
            leftoverCards={gameState.leftoverCards}
            subPhase={gameState.subPhase}
            onDeckClick={handleDeckClick}
          />
        </>
      )}
      <h6>玩家列表</h6>
      <PlayerList
        players={players}
        host={host}
        onPlayerClick={handleAvatarClick}
        onJoinGame={joinGame}
        isHost={isHost}
        socketId={socket.id}
      />
      {showAvatarSelector && (
        <AvatarSelector
          avatars={avatars}
          onSelect={pickAvatar}
          onCancel={() => setShowAvatarSelector(false)}
        />
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
          <RoleConfig
            roles={roles}
            onRoleClick={handleRoleClick}
            onInfoClick={handleInfoClick}
          />
        </>
      )}
      <GameControls
        isHost={isHost}
        gameStarted={gameState?.started || false}
        majorPhase={gameState?.majorPhase || ''}
        subPhase={gameState?.subPhase || ''}
        onStartGame={startGame}
        onResetGame={resetGame}
        onNextPhase={nextPhase}
      />
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
              <GamePhaseDisplay
                majorPhase={gameState.majorPhase}
                subPhase={gameState.subPhase}
                discussionInfo={gameState.discussionInfo}
                initialCount={initialCount}
              />
              <h6>游戏日志</h6>
              <GameLogs
                socketId={socket.id}
                logs={logs}
                players={gameState.players}
                subPhase={gameState.subPhase}
              />
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