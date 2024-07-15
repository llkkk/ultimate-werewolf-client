import { Player } from './player';
import { Role } from './role';
import { Discussion } from './discussion';
import { Vote } from './vote';

export interface GameState {
  curActionTime: number;
  logs: string;
  players: Player[];
  preRoles: Role[];
  majorPhase: string;
  subPhase: string;
  started: boolean;
  leftoverCards: Role[];
  discussionInfo: Discussion;
  voteResults: Vote[];
  winner: string;
}
