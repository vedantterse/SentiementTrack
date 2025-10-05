import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const getEmojiForScore = (score) => {
  if (score >= 0.25) return '😊';
  if (score <= -0.25) return '😠';
  return '😐';
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const point = payload[0].payload;
    const emoji = getEmojiForScore(point.sentiment_score);
    return (
      <div className="bg-white p-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="text-2xl text-center">{emoji}</div>
        <div className="text-sm font-bold text-black">{label}</div>
        <div className="text-xs text-gray-600">Score: {point.sentiment_score.toFixed(2)}</div>
      </div>
    );
  }
  return null;
};

const SentimentOverTimeChart = ({ data, containerless = false, heightClass = 'h-64' }) => {
  const ChartCore = (
    <div className={heightClass}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={[-1, 1]} />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="sentiment_score" 
            stroke="#7A3BFF" 
            strokeWidth={3} 
            activeDot={{ r: 6, stroke: '#000000', strokeWidth: 2, fill: '#C8FF3D' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  if (containerless) return ChartCore;

  return (
    <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl col-span-1 lg:col-span-2">
      <div className="bg-gradient-to-r from-[#F3E8FF] to-[#E8F4FD] border-b-4 border-black p-4 rounded-t-xl">
        <h3 className="text-lg font-bold text-black">Sentiment Over Time</h3>
      </div>
      <div className="p-6 rounded-b-xl">
        {ChartCore}
      </div>
    </div>
  );
};

export default SentimentOverTimeChart;