// src/components/MetricsChart.tsx
import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import axios from "axios";

type MetricPoint = {
  time: string;
  reward: number;
};

export default function MetricsChart() {
  const [data, setData] = useState<MetricPoint[]>([]);

  // Pull metrics each 10 s (simple polling)
  useEffect(() => {
    const fetch = async () => {
      const txt = await (await fetch("http://localhost:8000/metrics")).text();
      // Parse Prometheus text: buscamos la línea "gbsb_rl_reward_total"
      const lines = txt.split("\n");
      const rewardLines = lines.filter(l => l.startsWith("gbsb_rl_reward_total"));
      const total = rewardLines.reduce((sum, l) => {
        const parts = l.split(" ");
        return sum + parseFloat(parts[parts.length - 1] || "0");
      }, 0);
      setData((prev) => [...prev, { time: new Date().toLocaleTimeString(), reward: total }].slice(-30));
    };
    fetch();
    const id = setInterval(fetch, 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="reward" stroke="#34D399" name="Reward acumulado"/>
      </LineChart>
    </ResponsiveContainer>
  );
}


