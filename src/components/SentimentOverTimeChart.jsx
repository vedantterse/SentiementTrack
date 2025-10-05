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
            stroke="#2563EB" 
            strokeWidth={3} 
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  if (containerless) return ChartCore;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 col-span-1 lg:col-span-2">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Over Time</h3>
      {ChartCore}
    </div>
  );
};

export default SentimentOverTimeChart;


