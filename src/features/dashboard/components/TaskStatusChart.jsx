import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import Card from '../../../components/ui/Card';

const TaskStatusChart = ({ tasks = [], loading = false }) => {
    // Process data for the chart
    const data = [
        { name: 'Completed', value: tasks.filter(t => t.status === 'completed').length, color: '#10b981' }, // Emerald
        { name: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, color: '#3b82f6' }, // Blue
        { name: 'Pending', value: tasks.filter(t => t.status === 'pending').length, color: '#f59e0b' }, // Amber
    ].filter(item => item.value > 0); // Only show categories with data

    // If no data is available
    if (!loading && data.length === 0) {
        return (
            <Card className="h-full min-h-[400px] flex flex-col pt-0 pr-0 pb-0 pl-0 border border-slate-200 shadow-sm" noPadding>
                <div className="p-5 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800 tracking-tight">Task Distribution</h2>
                </div>
                <div className="flex-1 flex items-center justify-center p-6 text-slate-500 font-medium">
                    No task data available for chart.
                </div>
            </Card>
        );
    }

    return (
        <Card className="h-full min-h-[400px] flex flex-col pt-0 pr-0 pb-0 pl-0 border border-slate-200 shadow-sm overflow-hidden" noPadding>
            <div className="p-5 border-b border-slate-200 shrink-0">
                <h2 className="text-lg font-semibold text-slate-800 tracking-tight">Task Distribution</h2>
                <p className="text-xs text-slate-500 mt-1">Current status breakdown across all tasks</p>
            </div>

            <div className="flex-1 p-6 relative min-h-[250px] flex items-center justify-center pb-2">
                {loading ? (
                    <div className="flex items-center justify-center w-full h-full text-sm text-slate-500">
                        Loading chart data...
                    </div>
                ) : (
                    <ResponsiveContainer width="99%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="45%"
                                innerRadius={70}
                                outerRadius={100}
                                paddingAngle={3}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value, name) => [`${value} Tasks`, name]}
                                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ fontWeight: 600 }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                wrapperStyle={{ fontSize: '12px', fontWeight: 500, color: '#64748b', paddingTop: '10px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                )}

                {/* Center text for Donut Chart showing total */}
                {!loading && data.length > 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-12">
                        <span className="text-3xl font-bold text-slate-800">{tasks.length}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total</span>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default TaskStatusChart;
