import React from 'react';
import { Avatar } from '../types/avatar';
import styles from '../App.module.css';

interface AvatarSelectorProps {
  avatars: Avatar[];
  onSelect: (avatar: Avatar) => void;
  onCancel: () => void;
}

const AvatarSelector: React.FC<AvatarSelectorProps> = ({ avatars, onSelect, onCancel }) => {
  return (
    <div className={styles.avatarPickerOverlay}>
      <div className={styles.avatarPicker}>
        {avatars.map((avatar) => (
          <img
            key={avatar.name}
            src={avatar.img}
            onClick={() => onSelect(avatar)}
            className={styles.avatarImage}
          />
        ))}
        <button onClick={onCancel} className={styles.cancelButton}>
          取消
        </button>
      </div>
    </div>
  );
};

export default AvatarSelector;