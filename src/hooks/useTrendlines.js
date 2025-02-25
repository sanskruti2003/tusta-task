import { useState, useEffect } from 'react';

export function useTrendlines() {
  const [trendlines, setTrendlines] = useState(() => {
    const saved = localStorage.getItem('trendlines');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('trendlines', JSON.stringify(trendlines));
  }, [trendlines]);

  const addTrendline = (trendline) => {
    setTrendlines([...trendlines, { ...trendline, id: Date.now() }]);
  };

  const updateTrendline = (updatedTrendline) => {
    setTrendlines(trendlines.map(t => 
      t.id === updatedTrendline.id ? updatedTrendline : t
    ));
  };

  const deleteTrendline = (id) => {
    setTrendlines(trendlines.filter(t => t.id !== id));
  };

  return { trendlines, addTrendline, updateTrendline, deleteTrendline };
}