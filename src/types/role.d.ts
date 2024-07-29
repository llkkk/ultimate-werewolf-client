import { Ability } from './ability';
export interface Role {
  name: string;
  count: int;
  description: string;
  img: string;
  abilities: Ability[];
  phase: string;
}
