import Role from './role';

export interface Player {
  id: string;
  username: string;
  offline: boolean;
  role: Role;
  hasVoted: boolean;
  initialRole: Role;
}
