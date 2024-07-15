import React, { useState, useEffect } from 'react';

interface CountdownProps {
  initialCount: number;
}

const Countdown: React.FC<CountdownProps> = ({ initialCount }) => {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    if (count > 0) {
      const timerId = setTimeout(() => {
        setCount(count - 1);
      }, 1000);

      return () => {clearTimeout(timerId)
      };
    }else{
      setCount(initialCount)
    }
  }, [count]);

  return (
        <span >[<span style={{color:'red'}}>{count}秒</span>]</span>
  );
};

export default Countdown;