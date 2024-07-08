// components/GlobalTip.js
import React, { useState, useContext, createContext,useEffect } from 'react';
import styles from './App.module.css';  // 确保导入了 CSS Modules 文件

const TipContext = createContext();

export const useTip = () => useContext(TipContext);

export const TipProvider = ({ children }) => {
  const [tip, setTip] = useState({ content: '', visible: false });

  const showTip = (content) => {
    setTip({ content, visible:true });
    setTimeout(() => {
      setTip({ content:'',visible:false});
    }, 3000); // 3秒后自动清除通知
  };

  return (
    <TipContext.Provider value={{ showTip }}>
      {tip.visible && (
              <div className={styles.tooltip}>
                {tip.content}
              </div>
              
            )}
            { children }
    </TipContext.Provider>
  );
};