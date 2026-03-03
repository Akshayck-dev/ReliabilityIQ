import React, { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, Search, AlertCircle, RefreshCw, X, UserCheck, Loader2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import { taskService } from '../../services/taskService';
import { useAuth } from '../../features/auth/AuthContext';
import toast from 'react-hot-toast';
import { FullPageSpinner } from '../../components/ui/Spinner';

const Employees = () => {
    const { user } = useAuth();
    const managerId = user?.id;

    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Assign modal state
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [unassignedEmployees, setUnassignedEmployees] = useState([]);
    const [loadingUnassigned, setLoadingUnassigned] = useState(false);
    const [assigningId, setAssigningId] = useState(null);

    const fetchMyTeam = useCallback(async () => {
        if (!managerId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await taskService.getMyTeam(managerId);
            setTeamMembers(data || []);
        } catch (err) {
            console.error("Failed to fetch team:", err);
            setError("Failed to load your team. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [managerId]);

    useEffect(() => {
        fetchMyTeam();
    }, [fetchMyTeam]);

    const openAssignModal = async () => {
        setShowAssignModal(true);
        setLoadingUnassigned(true);
        try {
            const data = await taskService.getUnassignedEmployees();
            setUnassignedEmployees(data || []);
        } catch (err) {
            console.error("Failed to fetch unassigned employees:", err);
            toast.error("Failed to load available employees.");
        } finally {
            setLoadingUnassigned(false);
        }
    };

    const handleAssign = async (employeeId) => {
        setAssigningId(employeeId);
        try {
            await taskService.assignEmployeeToManager(employeeId);
            toast.success("Employee assigned to your team!");

            // Remove from unassigned list
            setUnassignedEmployees(prev => prev.filter(e => e.id !== employeeId));

            // Refresh team
            await fetchMyTeam();
        } catch (err) {
            console.error("Failed to assign employee:", err);
            toast.error(err.message || "Failed to assign employee.");
        } finally {
            setAssigningId(null);
        }
    };

    const handleInvite = () => {
        navigator.clipboard.writeText(window.location.origin + '/signup');
        toast.success("Invitation link copied to clipboard!");
    };

    const filteredTeam = teamMembers.filter(emp =>
        (emp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <FullPageSpinner message="Loading your team..." />;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 border border-red-100 dark:border-red-900 rounded-xl max-w-lg mx-auto mt-12 shadow-sm text-center">
                <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Failed to load data</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-sm">{error}</p>
                <button
                    onClick={fetchMyTeam}
                    className="flex items-center gap-2 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                >
                    <RefreshCw size={16} />
                    Retry
                </button>
            </div>
        );
    }

    // Empty state: no team members yet
    if (teamMembers.length === 0 && !searchTerm) {
        return (
            <div className="flex flex-col h-full max-w-[1200px] w-full animate-fade-in pb-12">
                <div className="mb-6">
                    <h1 className="text-[28px] font-bold text-[#0f172a] dark:text-white tracking-tight">Team Directory</h1>
                    <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-0.5">Manage your team members and view individual performance.</p>
                </div>

                <EmptyState
                    icon={Users}
                    title="No team members yet"
                    description="Assign employees to start managing your team."
                    action={
                        <button
                            onClick={openAssignModal}
                            className="flex items-center gap-2 bg-[#ea580c] hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
                        >
                            <UserPlus size={18} />
                            Assign Employees
                        </button>
                    }
                />

                {/* Assign Modal */}
                {showAssignModal && (
                    <AssignModal
                        employees={unassignedEmployees}
                        loading={loadingUnassigned}
                        assigningId={assigningId}
                        onAssign={handleAssign}
                        onClose={() => setShowAssignModal(false)}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full max-w-[1200px] w-full animate-fade-in pb-12">
            <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                <div>
                    <h1 className="text-[28px] font-bold text-[#0f172a] dark:text-white tracking-tight">My Employees</h1>
                    <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-0.5">Manage your team members and view individual performance.</p>
                </div>
                <div className="flex items-center gap-3 self-start sm:self-auto">
                    <button
                        onClick={openAssignModal}
                        className="flex items-center gap-2 bg-[#ea580c] hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
                    >
                        <UserPlus size={18} />
                        Assign Employees
                    </button>
                    <button
                        onClick={handleInvite}
                        className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors border border-slate-200 dark:border-slate-700"
                    >
                        Invite
                    </button>
                </div>
            </div>

            <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                {/* Table Header / Controls */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/50 focus:border-[#ea580c] transition-colors"
                        />
                    </div>
                    <span className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                        Total: <strong className="text-slate-900 dark:text-white">{filteredTeam.length}</strong>
                    </span>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap text-slate-700 dark:text-slate-300">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4">Employee</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                            {filteredTeam.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-16 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700">
                                                <Users size={28} className="text-slate-300 dark:text-slate-500" />
                                            </div>
                                            <p className="text-base font-bold text-slate-900 dark:text-white">No results found</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                                                No employees match &quot;{searchTerm}&quot;.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredTeam.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center font-bold text-[13px] shrink-0">
                                                {(emp.name || emp.email || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-[14px] font-bold text-slate-900 dark:text-white group-hover:text-[#ea580c] transition-colors">
                                                {emp.name || emp.email?.split('@')[0] || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-[13px] font-medium">{emp.email}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                                                Employee
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-green-600 dark:text-green-400">
                                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                Active
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Assign Modal */}
            {showAssignModal && (
                <AssignModal
                    employees={unassignedEmployees}
                    loading={loadingUnassigned}
                    assigningId={assigningId}
                    onAssign={handleAssign}
                    onClose={() => setShowAssignModal(false)}
                />
            )}
        </div>
    );
};

/**
 * Modal component for assigning unassigned employees
 */
const AssignModal = ({ employees, loading, assigningId, onAssign, onClose }) => {
    const [search, setSearch] = useState('');

    const filtered = employees.filter(emp =>
        (emp.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (emp.email || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg mx-4 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Assign Employees</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Select employees to add to your team.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search employees..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/50 transition-colors"
                        />
                    </div>
                </div>

                {/* Employee List */}
                <div className="max-h-80 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 size={24} className="animate-spin text-[#ea580c]" />
                            <span className="ml-3 text-sm text-slate-500">Loading employees...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                                <Users size={22} className="text-slate-400" />
                            </div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {search ? 'No matching employees' : 'No unassigned employees'}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {search ? 'Try a different search term.' : 'All employees are already assigned to managers.'}
                            </p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filtered.map((emp) => (
                                <li key={emp.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-[12px] shrink-0">
                                            {(emp.name || emp.email || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                {emp.name || emp.email?.split('@')[0] || 'Unknown'}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{emp.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onAssign(emp.id)}
                                        disabled={assigningId === emp.id}
                                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-bold bg-[#ea580c] hover:bg-orange-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        {assigningId === emp.id ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <UserCheck size={14} />
                                        )}
                                        {assigningId === emp.id ? 'Assigning...' : 'Assign to Me'}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                        {employees.length} unassigned employee{employees.length !== 1 ? 's' : ''} available
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Employees;
