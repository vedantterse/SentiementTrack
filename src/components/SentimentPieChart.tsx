import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { CommentData } from '@/types';

interface SentimentPieChartProps {
  comments?: CommentData[];
  pieChartSentiment?: { positive: number; negative: number; neutral: number; total: number };
  className?: string;
}

const SentimentPieChart: React.FC<SentimentPieChartProps> = ({ comments, pieChartSentiment, className }) => {
  // Use pieChartSentiment if available, otherwise calculate from comments
  const sentimentCounts = pieChartSentiment ? {
    positive: pieChartSentiment.positive,
    neutral: pieChartSentiment.neutral,
    negative: pieChartSentiment.negative
  } : (comments || []).reduce(
    (acc, comment) => {
      if (comment.sentiment) {
        acc[comment.sentiment]++;
      }
      return acc;
    },
    { positive: 0, neutral: 0, negative: 0 }
  );

  // Prepare data for Recharts
  const data = [
    {
      name: 'Positive',
      value: sentimentCounts.positive,
      color: '#C8FF3D'
    },
    {
      name: 'Neutral',
      value: sentimentCounts.neutral,
      color: '#94a3b8'
    },
    {
      name: 'Negative',
      value: sentimentCounts.negative,
      color: '#FF6A4D'
    }
  ].filter(item => item.value > 0); // Only show segments with data

  const total = pieChartSentiment ? pieChartSentiment.total : (sentimentCounts.positive + sentimentCounts.neutral + sentimentCounts.negative);

  // Custom label function
  const renderLabel = (entry: any) => {
    const percentage = ((entry.value / total) * 100).toFixed(0);
    return `${percentage}%`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0];
      const percentage = ((data.value / total) * 100).toFixed(1);
      
      return (
        <div className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3 font-bold">
          <p className="text-black">{data.name}: {data.value} comments</p>
          <p className="text-gray-600">{percentage}% of total</p>
        </div>
      );
    }
    return null;
  };

  // Custom legend
  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-4 h-4 border-2 border-black"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm font-bold text-black">
              {entry.value} ({((data.find(d => d.name === entry.value)?.value || 0) / total * 100).toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (total === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-gray-600 font-medium">No sentiment data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="relative">
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={data}
              cx="50.4%"
              cy="58.2%"
              innerRadius={45}
              outerRadius={95}
              strokeWidth={4}
              stroke="#000000"
              dataKey="value"
              label={renderLabel}
              labelLine={false}
              startAngle={90}
              endAngle={450}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center Total Display - Properly Positioned */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: '10px' }}>
          <div className="text-center bg-white border-4 border-black rounded-full w-20 h-20 flex flex-col items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-2xl font-bold text-black">{total}</div>
            <div className="text-xs font-bold text-gray-600">TOTAL</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentimentPieChart;