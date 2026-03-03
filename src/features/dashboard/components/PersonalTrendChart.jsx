import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { subDays, format, startOfDay } from 'date-fns';
import { Target } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-slate-200 shadow-md rounded-lg">
                <p className="text-xs font-bold text-slate-500 mb-1">{label}</p>
                <p className="text-sm font-bold text-[#ea580c]">
                    {payload[0].value} {payload[0].value === 1 ? 'task' : 'tasks'} completed
                </p>
            </div>
        );
    }
    return null;
};

const PersonalTrendChart = ({ tasks }) => {
    // Process data to show completed tasks over the last 7 days
    const chartData = useMemo(() => {
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const d = subDays(new Date(), 6 - i);
            return {
                date: startOfDay(d),
                dateStr: format(d, 'MMM dd'),
                completed: 0
            };
        });

        const completedTasks = tasks.filter(t => t.status === 'completed' && t.completed_at);

        completedTasks.forEach(task => {
            const taskDate = new Date(task.completed_at || task.updated_at || task.created_at);
            if (isNaN(taskDate.getTime())) return;
            const compDate = startOfDay(taskDate);
            const dayBucket = last7Days.find(d => d.date.getTime() === compDate.getTime());
            if (dayBucket) {
                dayBucket.completed += 1;
            }
        });

        return last7Days;
    }, [tasks]);

    // Check if there is absolutely no data
    const hasData = chartData.some(d => d.completed > 0);

    if (!hasData) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                    <Target size={28} className="text-slate-300" />
                </div>
                <h4 className="text-base font-bold text-slate-900">No completion activity</h4>
                <p className="text-sm text-slate-500 mt-1 max-w-[250px]">
                    Complete tasks to see your daily progress chart.
                </p>
            </div>
        );
    }

    // CustomTooltip moved outside to prevent recreation on render

    return (
        <div className="w-full h-[320px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={chartData}
                    margin={{
                        top: 20,
                        right: 20,
                        left: -20,
                        bottom: 0,
                    }}
                >
                    <defs>
                        <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ea580c" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                        dataKey="dateStr"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                        dy={10}
                    />
                    <YAxis
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area
                        type="monotone"
                        dataKey="completed"
                        stroke="#ea580c"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorCompleted)"
                        activeDot={{ r: 6, fill: '#ea580c', stroke: '#fff', strokeWidth: 2 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PersonalTrendChart;
