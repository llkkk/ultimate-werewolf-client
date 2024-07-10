// components/GlobalTip.tsx
import React, { useState, useContext, createContext } from 'react';
import styles from './App.module.css'; // 确保导入了 CSS Modules 文件

interface TipContextValue {
  showTip: (content: string) => void;
}

const TipContext = createContext<TipContextValue>({
  showTip: () => {},
});

export const useTip = () => useContext(TipContext);

interface TipProviderProps {
  children: React.ReactNode;
}

export function TipProvider({ children }: TipProviderProps) {
  const [tip, setTip] = useState({ content: '', visible: false });

  const showTip = (content: string) => {
    setTip({ content, visible: true });
    setTimeout(() => {
      setTip({ content: '', visible: false });
    }, 3000); // 3秒后自动清除通知
  };

  return (
    <TipContext.Provider value={{ showTip }}>
      {tip.visible && <div className={styles.tooltip}>{tip.content}</div>}
      {children}
    </TipContext.Provider>
  );
}
