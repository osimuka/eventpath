import React, { PureComponent } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface FunnelChartProps {
  data: Array<{
    step: number;
    eventName: string;
    count: number;
    dropOff: number;
  }>;
}

export const FunnelChart: React.FC<FunnelChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="eventName" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="count" stroke="#8884d8" />
        <Line type="monotone" dataKey="dropOff" stroke="#82ca9d" />
      </LineChart>
    </ResponsiveContainer>
  );
};
