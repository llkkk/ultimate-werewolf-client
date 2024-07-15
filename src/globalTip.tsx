// components/GlobalTip.tsx
import React, { useState, useContext, createContext } from 'react';
import styles from './App.module.css'; // 确保导入了 CSS Modules 文件

interface TipContextValue {
  showTip: (content: string,time?:number | undefined,where?:string | undefined) => void;
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
  const [isTop, setIsTop] = useState(false);

  const showTip = (content: string,time?:number,where?:string) => {
    setTip({ content, visible: true });
    let timeoutTime=3000
    if(time)
    timeoutTime=time*1000
    if(where == 'top')
      setIsTop(true)
      
    setTimeout(() => {
      setTip({ content: '', visible: false });
    }, timeoutTime); // 3秒后自动清除通知
  };

  return (
    <TipContext.Provider value={{ showTip }}>
      {tip.visible && <div className={isTop?styles.tooltipTop:styles.tooltip}>{tip.content}</div>}
      {children}
    </TipContext.Provider>
  );
}
