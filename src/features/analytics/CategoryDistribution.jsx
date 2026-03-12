import React from 'react';
import { 
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, 
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import Card from '../../components/ui/Card';
import { Target, BarChart3, AlertCircle } from 'lucide-react';

const CategoryDistribution = ({ catData }) => {
    if (!catData || !catData.distribution) {
        return (
            <Card className="h-full flex flex-col items-center justify-center p-12 text-center border-dashed border-2 border-slate-200 dark:border-slate-800">
                <AlertCircle size={32} className="text-slate-300 mb-2" />
                <p className="text-slate-500 font-medium">No distribution data available</p>
            </Card>
        );
    }

    const sortedByReliability = [...catData.Categories].sort((a, b) => b.reliabilityScore - a.reliabilityScore);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Task Type Distribution */}
            <Card className="p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                            <BarChart3 size={18} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-[16px] font-bold text-slate-800 dark:text-white">Task Distribution</h2>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-8 flex-1">
                    <div className="w-full md:w-1/2 h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={catData.distribution} 
                                    cx="50%" 
                                    cy="50%" 
                                    innerRadius={65} 
                                    outerRadius={95} 
                                    paddingAngle={4} 
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {catData.distribution.map((entry, i) => (
                                        <Cell 
                                            key={i} 
                                            fill={entry.color} 
                                            className="transition-all duration-300 hover:opacity-80"
                                        />
                                    ))}
                                </Pie>
                                <RechartsTooltip 
                                    contentStyle={{ 
                                        borderRadius: '12px', 
                                        border: 'none', 
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                        background: 'rgba(15, 23, 42, 0.9)',
                                        color: '#fff',
                                        fontSize: '12px'
                                    }} 
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(val, name) => [`${val} tasks`, name]} 
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="flex flex-col gap-3 w-full md:w-1/2">
                        {catData.distribution.map(item => (
                            <div key={item.name} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ background: item.color }} />
                                    <span className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[13px] font-bold text-slate-900 dark:text-white">{item.pct}%</span>
                                    <span className="text-[11px] text-slate-400 font-medium">({item.value})</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Reliability Scores */}
            <Card className="p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                            <Target size={18} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h2 className="text-[16px] font-bold text-slate-800 dark:text-white">Reliability scores</h2>
                    </div>
                </div>

                <div className="flex flex-col gap-5 flex-1 justify-center">
                    {sortedByReliability.map(cat => (
                        <div key={cat.name} className="space-y-1.5">
                            <div className="flex justify-between items-center px-0.5">
                                <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">{cat.name}</span>
                                <span className="text-[13px] font-black text-slate-900 dark:text-white">{cat.reliabilityScore}%</span>
                            </div>
                            <div className="relative h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                    className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out" 
                                    style={{ 
                                        width: `${cat.reliabilityScore}%`, 
                                        background: `linear-gradient(to right, ${cat.color}BF, ${cat.color})`,
                                        boxShadow: `0 0 10px ${cat.color}40`
                                    }} 
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default CategoryDistribution;
