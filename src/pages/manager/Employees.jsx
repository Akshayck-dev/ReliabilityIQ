import React, { useState, useEffect, useCallback } from 'react';
import {
    Users, UserPlus, Search, AlertCircle, RefreshCw,
    X, UserCheck, Loader2, Send, Ban, MailCheck
} from 'lucide-react';
import { taskService } from '../../services/taskService';
import { useAuth } from '../../features/auth/AuthContext';
import toast from 'react-hot-toast';
import { FullPageSpinner } from '../../components/ui/Spinner';
import { format } from 'date-fns';
import EmployeeStats from '../../features/team/EmployeeStats';
import EmployeeCard from '../../features/team/EmployeeCard';

// ─── Invitation helpers (localStorage) ──────────────────────────────────────
const INVITE_KEY = (managerId) => `riq_pending_invites_${managerId}`;

const loadInvites = (managerId) => {
    try {
        return JSON.parse(localStorage.getItem(INVITE_KEY(managerId)) || '[]');
    } catch {
        return [];
    }
};

const saveInvites = (managerId, invites) => {
    localStorage.setItem(INVITE_KEY(managerId), JSON.stringify(invites));
};

// ─── Main Component ──────────────────────────────────────────────────────────
const Employees = () => {
    const { user } = useAuth();
    const managerId = user?.id;

    const [activeTab, setActiveTab] = useState('active'); // 'active' | 'pending'
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Pending invitations
    const [pendingInvites, setPendingInvites] = useState([]);

    // Modal state
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [unassignedEmployees, setUnassignedEmployees] = useState([]);
    const [loadingUnassigned, setLoadingUnassigned] = useState(false);
    const [assigningId, setAssigningId] = useState(null);

    const fetchMyTeam = useCallback(async () => {
        if (!managerId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await taskService.getTeamWithStats(managerId);
            setTeamMembers(data || []);
        } catch (err) {
            console.error('Failed to fetch team:', err);
            setError('Failed to load your team. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [managerId]);

    useEffect(() => {
        fetchMyTeam();
    }, [fetchMyTeam]);

    useEffect(() => {
        if (managerId) setPendingInvites(loadInvites(managerId));
    }, [managerId]);

    const openAssignModal = async () => {
        setShowAssignModal(true);
        setLoadingUnassigned(true);
        try {
            const data = await taskService.getUnassignedEmployees();
            setUnassignedEmployees(data || []);
        } catch (err) {
            console.error('Failed to fetch unassigned employees:', err);
            toast.error('Failed to load available employees.');
        } finally {
            setLoadingUnassigned(false);
        }
    };

    const handleAssign = async (employeeId) => {
        setAssigningId(employeeId);
        try {
            await taskService.assignEmployeeToManager(employeeId);
            toast.success('Employee added to your team!');
            setUnassignedEmployees(prev => prev.filter(e => e.id !== employeeId));
            await fetchMyTeam();
        } catch (err) {
            console.error('Failed to assign employee:', err);
            toast.error(err.message || 'Failed to assign employee.');
        } finally {
            setAssigningId(null);
        }
    };

    const recordInvite = useCallback((emp) => {
        if (!managerId) return;
        const existing = loadInvites(managerId);
        const already = existing.find(i => i.email === emp.email);
        if (already) return;
        const newInvite = {
            id: emp.id,
            email: emp.email,
            role: emp.designation || 'Specialist',
            permissions: 'Member',
            sentDate: new Date().toISOString()
        };
        const updated = [newInvite, ...existing];
        saveInvites(managerId, updated);
        setPendingInvites(updated);
    }, [managerId]);

    const handleResend = (invite) => {
        const updated = pendingInvites.map(i =>
            i.email === invite.email ? { ...i, sentDate: new Date().toISOString() } : i
        );
        saveInvites(managerId, updated);
        setPendingInvites(updated);
        toast.success(`Invite resent to ${invite.email}`);
    };

    const handleRevoke = (invite) => {
        const updated = pendingInvites.filter(i => i.email !== invite.email);
        saveInvites(managerId, updated);
        setPendingInvites(updated);
        toast.success(`Invitation revoked for ${invite.email}`);
    };

    const filteredTeam = teamMembers.filter(emp =>
        (emp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <FullPageSpinner message="Loading your team..." />;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 border border-red-100 dark:border-red-900 rounded-2xl max-w-lg mx-auto mt-12 shadow-sm text-center">
                <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Failed to load team</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-sm">{error}</p>
                <button
                    onClick={fetchMyTeam}
                    className="flex items-center gap-2 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                >
                    <RefreshCw size={16} /> Retry
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full max-w-[1400px] w-full pb-12 animate-fade-in">

            {/* Header Area */}
            <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6">
                <div>
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-[3px] mb-2">
                        <Users size={14} strokeWidth={3} />
                        Team Administration
                    </div>
                    <h1 className="text-[36px] font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                        Team Directory
                    </h1>
                </div>
                <button
                    onClick={openAssignModal}
                    className="group flex items-center gap-2.5 bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 px-6 py-3.5 rounded-2xl text-[14px] font-black transition-all shadow-xl shadow-slate-200 dark:shadow-none hover:-translate-y-1 active:scale-95"
                >
                    <UserPlus size={18} strokeWidth={3} />
                    Add Team Member
                </button>
            </div>

            {/* Team Stats */}
            <EmployeeStats teamMembers={teamMembers} />

            {/* Filter & Tab Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center p-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    {[
                        { key: 'active', label: 'Active Members', count: teamMembers.length },
                        { key: 'pending', label: 'Pending Invites', count: pendingInvites.length }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-[13px] font-black transition-all ${activeTab === tab.key
                                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${activeTab === tab.key ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {activeTab === 'active' && teamMembers.length > 0 && (
                    <div className="relative w-full lg:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, role or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-transparent border-none text-[14px] font-bold text-slate-700 dark:text-slate-200 focus:outline-none placeholder:text-slate-400"
                        />
                    </div>
                )}
            </div>

            {/* ── Active Members Tab ── */}
            {activeTab === 'active' && (
                <>
                    {teamMembers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                            <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6">
                                <Users size={36} className="text-slate-300 dark:text-slate-600" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Build Your Dream Team</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm text-center font-medium">No team members assigned yet. Start adding employees to monitor performance and assign tasks.</p>
                            <button
                                onClick={openAssignModal}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-[15px] font-black transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                            >
                                <UserPlus size={18} /> Add Your First Employee
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredTeam.length === 0 ? (
                                <div className="col-span-full py-20 text-center">
                                    <p className="text-[16px] font-black text-slate-400">No matching team members found</p>
                                </div>
                            ) : filteredTeam.map((emp) => (
                                <EmployeeCard 
                                    key={emp.id} 
                                    employee={emp} 
                                    onProfileClick={(e) => console.log('Profile click', e)} 
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ── Pending Invitations Tab ── */}
            {activeTab === 'pending' && (
                <div className="animate-fade-in-up">
                    <PendingInvitationsTable
                        invites={pendingInvites}
                        onResend={handleResend}
                        onRevoke={handleRevoke}
                    />
                </div>
            )}

            {/* Assign Modal */}
            {showAssignModal && (
                <AssignModal
                    employees={unassignedEmployees}
                    loading={loadingUnassigned}
                    assigningId={assigningId}
                    onAssign={handleAssign}
                    onClose={() => setShowAssignModal(false)}
                    onInviteRecorded={recordInvite}
                />
            )}
        </div>
    );
};

// ─── Pending Invitations Table ───────────────────────────────────────────────
const PendingInvitationsTable = ({ invites, onResend, onRevoke }) => {
    if (invites.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-5">
                    <MailCheck size={28} className="text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">Clean Inbox</h3>
                <p className="text-[14px] text-slate-500 dark:text-slate-400 font-medium tracking-tight">You don't have any pending team invitations.</p>
            </div>
        );
    }

    return (
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                            {['Invited Email', 'Target Role', 'Sent Date', 'Status', 'Actions'].map(col => (
                                <th key={col} className="px-6 py-4 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] whitespace-nowrap">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {invites.map((inv) => (
                            <tr key={inv.email} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                            <Send size={14} />
                                        </div>
                                        <span className="text-[14px] font-black text-slate-800 dark:text-slate-200">{inv.email}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-[13px] font-bold text-slate-600 dark:text-slate-400">{inv.role}</td>
                                <td className="px-6 py-4 text-[13px] font-bold text-slate-500 dark:text-slate-500 whitespace-nowrap">
                                    {format(new Date(inv.sentDate), 'MMM d, yyyy')}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40 uppercase">
                                        Awaiting Join
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2.5">
                                        <button
                                            onClick={() => onResend(inv)}
                                            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-[12px] font-black transition-all active:scale-95"
                                        >
                                            Resend
                                        </button>
                                        <button
                                            onClick={() => onRevoke(inv)}
                                            className="px-4 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20 text-[12px] font-black transition-all active:scale-95"
                                        >
                                            Revoke
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ─── Assign Modal ────────────────────────────────────────────────────────────
const AssignModal = ({ employees, loading, assigningId, onAssign, onClose, onInviteRecorded }) => {
    const [search, setSearch] = useState('');
    const [successInfo, setSuccessInfo] = useState(null);

    const filtered = employees.filter(emp =>
        (emp.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (emp.email || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleAssignAndShowSuccess = async (emp) => {
        await onAssign(emp.id);
        setSuccessInfo({
            ...emp,
            role: emp.designation || 'Software Engineer',
            permissions: 'Member'
        });
    };

    const handleDone = () => {
        if (successInfo) onInviteRecorded(successInfo);
        onClose();
    };

    const handleInviteAnother = () => {
        if (successInfo) onInviteRecorded(successInfo);
        setSuccessInfo(null);
        setSearch('');
    };

    if (successInfo) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-fade-in">
                <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden scale-in-center">
                    <div className="flex flex-col items-center px-10 py-12 text-center">
                        <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/30">
                            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-[24px] font-black text-slate-900 dark:text-white mb-3">Invite Sent!</h2>
                        <p className="text-[14px] text-slate-500 dark:text-slate-400 mb-8 leading-relaxed font-medium">
                            We've sent an invitation to <br/>
                            <span className="font-black text-slate-900 dark:text-white">{successInfo.email}</span>
                        </p>
                        
                        <div className="flex flex-col gap-3 w-full">
                            <button onClick={handleDone} className="w-full bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-900 py-4 rounded-2xl text-[15px] font-black transition-all shadow-xl active:scale-95">
                                Return to Dashboard
                            </button>
                            <button onClick={handleInviteAnother} className="w-full text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 py-4 rounded-2xl text-[14px] font-black transition-all">
                                Invite Another Member
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] scale-in-center">
                <div className="flex items-center justify-between p-8 border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <h2 className="text-[22px] font-black text-slate-900 dark:text-white">Add Team Member</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Select available personnel to join your team.</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-all active:scale-90">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Find employee by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-[14px] font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 size={32} className="animate-spin text-blue-600" />
                            <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Searching available staff...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-10">
                            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
                                <Users size={28} className="text-slate-400" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">No matches found</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
                                {search ? `We couldn't find anyone named "${search}".` : "All registered employees are currently assigned to other managers."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2 p-2">
                            {filtered.map((emp) => (
                                <div key={emp.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-[14px] shrink-0 shadow-sm">
                                            {(emp.name || emp.email || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-[15px] font-black text-slate-900 dark:text-white">
                                                {emp.name || emp.email?.split('@')[0]}
                                            </p>
                                            <p className="text-[12px] font-bold text-slate-500 dark:text-slate-500">{emp.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAssignAndShowSuccess(emp)}
                                        disabled={assigningId === emp.id}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-black bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20 active:scale-95 group-hover:-translate-x-1"
                                    >
                                        {assigningId === emp.id ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={16} />}
                                        Add to Team
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-center">
                    <p className="text-[11px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[2px]">
                        Showing {filtered.length} of {employees.length} available personnel
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Employees;
