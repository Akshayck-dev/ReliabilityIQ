import React from 'react';
import Card from '../../../components/ui/Card';
import { TableTaskRowSkeleton } from '../../../components/ui/Skeleton';
import EmptyState from '../../../components/ui/EmptyState';
import { Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TaskTable = ({ employees = [], loading = false }) => {
    const navigate = useNavigate();

    const renderStatusBadge = (status) => {
        const isGood = status === 'Good';
        const styles = isGood
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800'
            : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800';

        return (
            <span className={`px-3 py-0.5 rounded-full text-xs font-medium border ${styles}`}>
                {status}
            </span>
        );
    };

    const renderReliability = (value) => {
        const num = parseFloat(value) || 0;
        const barColor = num >= 80
            ? 'bg-green-500'
            : num >= 60
                ? 'bg-amber-500'
                : 'bg-red-500';
        const textColor = num >= 80
            ? 'text-green-700 dark:text-green-400'
            : num >= 60
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-red-600 dark:text-red-400';

        return (
            <div className="flex items-center gap-2.5">
                <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden shrink-0">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${Math.min(num, 100)}%` }}
                    />
                </div>
                <span className={`text-sm font-bold tabular-nums ${textColor}`}>{value}</span>
            </div>
        );
    };

    return (
        <Card noPadding className="mt-6 mb-24">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white tracking-tight">Employee Performance</h2>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-800 font-medium text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-5 py-3.5">Employee Name</th>
                            <th className="px-5 py-3.5">Assigned Tasks</th>
                            <th className="px-5 py-3.5">Completed Tasks</th>
                            <th className="px-5 py-3.5">Reliability %</th>
                            <th className="px-5 py-3.5 w-32">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loading ? (
                            <>
                                <TableTaskRowSkeleton />
                                <TableTaskRowSkeleton />
                                <TableTaskRowSkeleton />
                                <TableTaskRowSkeleton />
                            </>
                        ) : employees.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="p-8">
                                    <EmptyState
                                        icon={Users}
                                        title="No Employee Data"
                                        description="There are currently no tasks assigned to any employees. Assign tasks to start tracking team reliability."
                                    />
                                </td>
                            </tr>
                        ) : (
                            employees.map((emp) => (
                                <tr
                                    key={emp.id}
                                    onClick={() => navigate(`/employees/${emp.id}`)}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                                >
                                    <td className="px-5 py-4 font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {emp.name}
                                    </td>
                                    <td className="px-5 py-4">{emp.assigned}</td>
                                    <td className="px-5 py-4">{emp.completed}</td>
                                    <td className="px-5 py-4">{renderReliability(emp.reliability)}</td>
                                    <td className="px-5 py-4">
                                        {renderStatusBadge(emp.status)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default TaskTable;
