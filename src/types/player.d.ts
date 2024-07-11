import { Role } from './role';
import { Avatar } from './avatar';

export interface Player {
  id: string;
  username: string;
  offline: boolean;
  role: Role;
  hasVoted: boolean;
  initialRole: Role;
  avatar: Avatar;
}
