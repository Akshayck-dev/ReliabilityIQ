import React, { useState, useEffect, useCallback } from 'react';
import {
    Users, UserPlus, Search, AlertCircle, RefreshCw,
    X, UserCheck, Loader2, MoreVertical, Send, Ban, MailCheck
} from 'lucide-react';
import { taskService } from '../../services/taskService';
import { useAuth } from '../../features/auth/AuthContext';
import toast from 'react-hot-toast';
import { FullPageSpinner } from '../../components/ui/Spinner';
import { format } from 'date-fns';

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

    // Called when the success modal is dismissed — record the invite
    const recordInvite = useCallback((emp) => {
        if (!managerId) return;
        const existing = loadInvites(managerId);
        const already = existing.find(i => i.email === emp.email);
        if (already) return; // avoid duplicates
        const newInvite = {
            id: emp.id,
            email: emp.email,
            role: emp.designation || 'Software Engineer',
            permissions: 'Member',
            sentDate: new Date().toISOString()
        };
        const updated = [newInvite, ...existing];
        saveInvites(managerId, updated);
        setPendingInvites(updated);
    }, [managerId]);

    const handleResend = (invite) => {
        // Update sentDate
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
                    <RefreshCw size={16} /> Retry
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full max-w-[1200px] w-full pb-12">

            {/* Header */}
            <div className="mb-5 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                <div>
                    <p className="text-[13px] text-slate-400 dark:text-slate-500 font-medium mb-0.5">Team Management</p>
                    <h1 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight">Employees</h1>
                </div>
                <button
                    onClick={openAssignModal}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                >
                    <UserPlus size={16} />
                    + Add Employees
                </button>
            </div>

            {/* Tab Bar */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 mb-5">
                {[
                    { key: 'active', label: 'Active Employees' },
                    { key: 'pending', label: 'Pending Invitations', count: pendingInvites.length }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`relative px-5 py-3 text-[14px] font-semibold transition-colors focus:outline-none ${activeTab === tab.key
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                    >
                        {tab.label}
                        {tab.count > 0 && (
                            <span className="ml-2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                                {tab.count}
                            </span>
                        )}
                        {activeTab === tab.key && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* ── Active Employees Tab ── */}
            {activeTab === 'active' && (
                <>
                    {teamMembers.length > 0 && (
                        <div className="mb-4 relative w-full sm:w-80 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 flex items-center">
                            <Search className="absolute left-3 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-transparent text-sm text-slate-700 dark:text-slate-200 focus:outline-none"
                            />
                        </div>
                    )}

                    {teamMembers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                <Users size={26} className="text-slate-400" />
                            </div>
                            <p className="text-base font-bold text-slate-900 dark:text-white mb-1">No team members yet</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Assign employees to start managing your team.</p>
                            <button
                                onClick={openAssignModal}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
                            >
                                <UserPlus size={18} /> Add Employees
                            </button>
                        </div>
                    ) : (
                        <div className="w-full">
                            <div className="grid grid-cols-[2fr_2fr_1.5fr_1.5fr_1.5fr_1.5fr] gap-4 py-3 px-6 text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                <div>Employee Name</div>
                                <div>Role</div>
                                <div>Assigned Tasks</div>
                                <div>Completed Tasks</div>
                                <div>Reliability Score</div>
                                <div>Actions</div>
                            </div>
                            <div className="flex flex-col gap-3">
                                {filteredTeam.length === 0 ? (
                                    <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center shadow-sm border border-slate-200 dark:border-slate-800">
                                        <p className="text-base font-bold text-slate-900 dark:text-white">No employees found</p>
                                    </div>
                                ) : filteredTeam.map((emp) => (
                                    <div key={emp.id} className="grid grid-cols-[2fr_2fr_1.5fr_1.5fr_1.5fr_1.5fr] gap-4 items-center bg-white dark:bg-slate-800 rounded-xl p-4 px-6 border border-slate-100 dark:border-slate-700 transition hover:shadow-md shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                                <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">
                                                    {(emp.name || emp.email || '?').charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <span className="font-bold text-[14px] text-slate-900 dark:text-white">
                                                {emp.name || emp.email?.split('@')[0] || 'Unknown'}
                                            </span>
                                        </div>
                                        <div className="text-[13px] text-slate-600 dark:text-slate-300">{emp.designation || 'Software Engineer'}</div>
                                        <div className="text-[13px] font-medium text-slate-700 dark:text-slate-300 pl-4">{emp.stats?.assigned || 0}</div>
                                        <div className="text-[13px] font-medium text-slate-700 dark:text-slate-300 pl-4">{emp.stats?.completed || 0}</div>
                                        <div>{renderReliabilityBadge(emp.stats?.reliabilityScore || 0)}</div>
                                        <div className="flex items-center gap-2 text-[13px]">
                                            <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition-colors">
                                                View Profile
                                            </button>
                                            <span className="text-slate-300 dark:text-slate-600">|</span>
                                            <button className="flex items-center gap-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                                                <MoreVertical size={14} /><span>Manage</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ── Pending Invitations Tab ── */}
            {activeTab === 'pending' && (
                <PendingInvitationsTable
                    invites={pendingInvites}
                    onResend={handleResend}
                    onRevoke={handleRevoke}
                />
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

// ─── Reliability Badge ───────────────────────────────────────────────────────
const renderReliabilityBadge = (score) => {
    if (score >= 90) return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">{score}% (High)</span>;
    if (score >= 75) return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">{score}% (Medium)</span>;
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">{score}% (Needs Improvement)</span>;
};

// ─── Pending Invitations Table ───────────────────────────────────────────────
const PendingInvitationsTable = ({ invites, onResend, onRevoke }) => {
    if (invites.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <MailCheck size={26} className="text-slate-400" />
                </div>
                <p className="text-base font-bold text-slate-900 dark:text-white mb-1">No pending invitations</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Invitations you send will appear here.</p>
            </div>
        );
    }

    return (
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        {['Invited Email', 'Role', 'Permissions', 'Sent Date', 'Actions'].map(col => (
                            <th key={col} className="px-6 py-4 text-[12px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {invites.map((inv) => (
                        <tr key={inv.email} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 text-[14px] font-medium text-slate-800 dark:text-slate-200">{inv.email}</td>
                            <td className="px-6 py-4 text-[14px] text-slate-600 dark:text-slate-300">{inv.role}</td>
                            <td className="px-6 py-4 text-[14px] text-slate-600 dark:text-slate-300">{inv.permissions}</td>
                            <td className="px-6 py-4 text-[14px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                {format(new Date(inv.sentDate), 'MMM d, yyyy')}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => onResend(inv)}
                                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-[12px] font-bold transition-colors shadow-sm"
                                    >
                                        <Send size={12} /> Resend Invite
                                    </button>
                                    <button
                                        onClick={() => onRevoke(inv)}
                                        className="flex items-center gap-1.5 bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-900/20 text-slate-600 hover:text-red-600 dark:text-slate-300 dark:hover:text-red-400 px-3.5 py-1.5 rounded-lg text-[12px] font-bold transition-colors border border-slate-200 dark:border-slate-700"
                                    >
                                        <Ban size={12} /> Revoke
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
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

    /* ── Success State ── */
    if (successInfo) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                <div className="bg-white dark:bg-slate-900 w-full max-w-md mx-4 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="flex flex-col items-center px-8 py-10 text-center">
                        <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mb-5 shadow-lg shadow-green-200 dark:shadow-green-900/30">
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-[22px] font-bold text-slate-900 dark:text-white mb-2">Invitation Sent Successfully!</h2>
                        <p className="text-[14px] text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                            An invitation email has been sent to{' '}
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{successInfo.email}</span>.
                        </p>
                        <div className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-4 text-left mb-7 space-y-1.5">
                            <p className="text-[14px] text-slate-700 dark:text-slate-200">
                                <span className="font-semibold text-slate-900 dark:text-white">Role:</span> {successInfo.role}
                            </p>
                            <p className="text-[14px] text-slate-700 dark:text-slate-200">
                                <span className="font-semibold text-slate-900 dark:text-white">Permissions:</span> {successInfo.permissions}
                            </p>
                        </div>
                        <div className="flex items-center gap-4 w-full">
                            <button onClick={handleDone} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm">
                                Done
                            </button>
                            <button onClick={handleInviteAnother} className="flex-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 py-2.5 text-sm font-semibold transition-colors">
                                Invite Another
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Employee Select State ── */
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg mx-4 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add Employees</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Select employees to add to your team.</p>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search employees..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        />
                    </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 size={24} className="animate-spin text-blue-600" />
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
                                        <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[12px] shrink-0">
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
                                        onClick={() => handleAssignAndShowSuccess(emp)}
                                        disabled={assigningId === emp.id}
                                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        {assigningId === emp.id ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
                                        {assigningId === emp.id ? 'Adding...' : 'Add to Team'}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
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
