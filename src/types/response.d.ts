import { Player } from './player';
import { Role } from './role';
import { GameState } from './gameState';

export interface Response {
  status: string;
  players: Player[];
  roles: Role[];
  host: string;
  gameState: GameState;
  message: string;
}
