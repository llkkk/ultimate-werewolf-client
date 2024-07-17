import React, { useState, useEffect } from 'react';

interface CountdownProps {
  initialCount: number;
}

const Countdown: React.FC<CountdownProps> = ({ initialCount }) => {
  const [count, setCount] = useState(initialCount);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);
  useEffect(() => {
    if (count > 0) {
      const newTimerId = setTimeout(() => {
        setCount(count - 1);
      }, 1000);
      setTimerId(newTimerId);
    } else {
      setCount(initialCount);
    }

    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [count,initialCount]);

  return (
        <span >[<span style={{color:'red'}}>{count}秒</span>]</span>
  );
};

export default Countdown;