import React from 'react';
import { Role } from '../types/role';
import styles from '../App.module.css';

interface RoleConfigProps {
  roles: Role[];
  onRoleClick: (index: number) => void;
  onInfoClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, description: string) => void;
}

const RoleConfig: React.FC<RoleConfigProps> = ({ roles, onRoleClick, onInfoClick }) => {
  return (
    <div className={styles.roleGrid}>
      {roles.map((role, index) => (
        <div key={index} className={styles.roleItem} onClick={() => onRoleClick(index)}>
          <img src={role.img} />
          <div
            className={styles.infoIcon}
            onClick={(e) => onInfoClick(e, role.description)}
            onMouseLeave={() => {}}
          >
            ?
          </div>
          <div className={styles.roleCount}>
            {role.name}: {role.count}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RoleConfig;