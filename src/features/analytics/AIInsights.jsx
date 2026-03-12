import React, { useMemo } from 'react';
import { 
    Zap, 
    TrendingUp, 
    AlertTriangle, 
    Target,
    BrainCircuit,
    ArrowRight
} from 'lucide-react';
import Card from '../../components/ui/Card';

const AIInsights = ({ data }) => {
    const insights = useMemo(() => {
        if (!data || !data.categories || !data.team.length) return [];

        const list = [];
        const { categories, team, heatmap } = data;

        // 1. Positive Trend (Velocity/Reliability)
        const avgReliability = Math.round((team.reduce((acc, curr) => acc + curr.onTime, 0) / 
                               team.reduce((acc, curr) => acc + curr.totalAssigned, 0)) * 100) || 0;
        
        if (avgReliability > 85) {
            list.push({
                type: 'success',
                icon: TrendingUp,
                title: 'High Velocity Detected',
                message: `Team reliability is at ${avgReliability}%. Your collective efficiency is currently 15% above the quarterly baseline.`,
                color: 'emerald'
            });
        }

        // 2. Risk Mitigation (Overload/Consistency)
        const overloadedMembers = team.filter(t => t.totalAssigned > 8 && t.reliability < 90);
        if (overloadedMembers.length > 0) {
            list.push({
                type: 'warning',
                icon: AlertTriangle,
                title: 'Burnout Risk Alert',
                message: `${overloadedMembers[0].name} has high task density with declining reliability. Consider redistributing 1-2 'High' priority tasks.`,
                color: 'amber'
            });
        } else if (categories.Categories.some(c => c.completionRate < 70)) {
            const lowCat = categories.Categories.find(c => c.completionRate < 70);
            list.push({
                type: 'warning',
                icon: AlertTriangle,
                title: 'Bottleneck Identified',
                message: `The '${lowCat.name}' category has a completion rate of ${lowCat.completionRate}%. This is impacting overall pipeline throughput.`,
                color: 'rose'
            });
        }

        // 3. Talent Matching (Talent Tip)
        const topPerformer = [...team].sort((a, b) => b.reliability - a.reliability)[0];
        const mostReliableCat = categories.mostReliable;
        
        list.push({
            type: 'info',
            icon: Target,
            title: 'Strategic Talent Match',
            message: `${topPerformer.name} excels in high-precision work. Assign the upcoming '${mostReliableCat}' audits to them for maximum reliability.`,
            color: 'blue'
        });

        return list.slice(0, 3);
    }, [data]);

    if (!insights.length) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2 animate-slide-up">
            {insights.map((insight, idx) => (
                <Card 
                    key={idx} 
                    className={`relative overflow-hidden group border-none shadow-sm dark:shadow-blue-900/5 bg-white dark:bg-slate-900/50 hover:shadow-md transition-all duration-500`}
                >
                    {/* Status Glow Background */}
                    <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 group-hover:opacity-20 transition-opacity bg-${insight.color}-500 -mr-8 -mt-8`} />
                    
                    <div className="p-5 flex flex-col h-full relative z-10">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-2 rounded-xl bg-${insight.color}-50 dark:bg-${insight.color}-900/20 text-${insight.color}-600 dark:text-${insight.color}-400 ring-1 ring-${insight.color}-100 dark:ring-${insight.color}-800/50`}>
                                <insight.icon size={18} />
                            </div>
                            <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700`}>
                                Insight 0{idx + 1}
                            </div>
                        </div>

                        <div className="flex-1">
                            <h3 className="text-[14px] font-black text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                                {insight.title}
                            </h3>
                            <p className="text-[12.5px] leading-relaxed font-medium text-slate-500 dark:text-slate-400 italic">
                                "{insight.message}"
                            </p>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                            <button className={`text-[11px] font-black uppercase italic tracking-widest text-${insight.color}-600 dark:text-${insight.color}-400 flex items-center gap-1.5 group/btn`}>
                                View Analysis
                                <ArrowRight size={12} className="transition-transform group-hover/btn:translate-x-1" />
                            </button>
                            <BrainCircuit size={14} className="text-slate-200 dark:text-slate-700" />
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
};

export default AIInsights;
