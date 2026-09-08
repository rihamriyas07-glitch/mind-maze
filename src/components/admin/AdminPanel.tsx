import React, { useCallback, useEffect, useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Users,
  Loader2,
} from 'lucide-react';
import {
  fetchAllProfiles,
  AdminProfileEntry,
  UserRole,
  CloudError,
} from '../../lib/cloudStore';

interface AdminPanelProps {
  /** Role the app resolved for the signed-in user (from profiles.role). */
  userRole: UserRole;
  username?: string | null;
  /** Null until the profile row has loaded; lets us distinguish "loading". */
  profileLoaded: boolean;
  onNavigateHome: () => void;
}

/**
 * Admin-only control panel. Rendered at /admin; non-admins see an
 * access-denied card instead of the user list.
 */
export const AdminPanel: React.FC<AdminPanelProps> = ({
  userRole,
  username,
  profileLoaded,
  onNavigateHome,
}) => {
  const isAdmin = userRole === 'admin';
  const [users, setUsers] = useState<AdminProfileEntry[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    setUsersError(null);
    try {
      setUsers(await fetchAllProfiles());
    } catch (err) {
      setUsersError(
        err instanceof CloudError
          ? err.userMessage
          : 'Could not load user list. Your account may not have admin access.'
      );
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (profileLoaded && isAdmin) {
      void loadUsers();
    }
  }, [profileLoaded, isAdmin, loadUsers]);

  if (!profileLoaded) {
    return (
      <div className="rounded-3xl border border-white/10 bg-[#161831]/60 p-10 text-center backdrop-blur-md">
        <Loader2 className="w-8 h-8 mx-auto text-cyan-400 animate-spin" />
        <p className="text-sm font-semibold text-slate-200 mt-3">Loading your profile…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto pb-8">
        <div className="rounded-3xl border border-rose-500/40 bg-rose-500/10 p-6 sm:p-8 backdrop-blur-xl text-center">
          <ShieldAlert className="w-12 h-12 mx-auto text-rose-400" />
          <h1 className="text-xl sm:text-2xl font-black text-white mt-3">Access denied</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
            This area is restricted to administrators. Your account is signed in as{' '}
            <strong className="text-white">@{username ?? 'unknown'}</strong> with role{' '}
            <code className="px-1.5 py-0.5 rounded bg-black/40 border border-white/15 text-cyan-300 font-bold">
              {userRole}
            </code>
            . If you should be an admin, ask the site owner to set your{' '}
            <code className="px-1 py-0.5 rounded bg-black/40 border border-white/15">profiles.role</code>{' '}
            to <code className="px-1 py-0.5 rounded bg-black/40 border border-white/15">admin</code> in
            the Supabase dashboard, then log out and back in.
          </p>
          <button
            onClick={onNavigateHome}
            className="mt-5 px-5 py-2.5 rounded-xl bg-[#6B4EFF] hover:bg-[#7C5DFA] text-white text-xs font-bold transition cursor-pointer min-h-[44px]"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const adminCount = users.filter((u) => u.role === 'admin').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      {/* Header */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#161831] via-[#12142B] to-[#0F1023] p-4 sm:p-6 backdrop-blur-xl shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Admin Panel • restricted</span>
        </div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
          Admin Control Panel
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1">
          Signed in as <strong className="text-white">@{username ?? 'unknown'}</strong> with role{' '}
          <code className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold">
            {userRole}
          </code>
        </p>
      </div>

      {/* Debug / status card (temporary visibility aid) */}
      <div className="rounded-3xl border border-cyan-500/30 bg-cyan-500/10 p-4 sm:p-5 text-xs">
        <h2 className="text-sm font-bold text-cyan-300 mb-2">Role debug (temporary)</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="rounded-xl bg-black/30 border border-white/10 p-3">
            <dt className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">App role</dt>
            <dd className="text-base font-black text-white mt-0.5">{userRole}</dd>
          </div>
          <div className="rounded-xl bg-black/30 border border-white/10 p-3">
            <dt className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Username</dt>
            <dd className="text-base font-black text-white mt-0.5">@{username ?? '—'}</dd>
          </div>
          <div className="rounded-xl bg-black/30 border border-white/10 p-3">
            <dt className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Users loaded</dt>
            <dd className="text-base font-black text-white mt-0.5">
              {users.length} <span className="text-[11px] font-semibold text-slate-400">({adminCount} admin)</span>
            </dd>
          </div>
        </dl>
      </div>

      {/* User list */}
      <div className="rounded-3xl border border-white/10 bg-[#161831]/80 backdrop-blur-xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>All users ({users.length})</span>
          </h2>
          <button
            onClick={() => void loadUsers()}
            disabled={loadingUsers}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition cursor-pointer min-h-[44px] disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loadingUsers ? 'animate-spin' : ''}`} />
            <span>{loadingUsers ? 'Loading…' : 'Refresh'}</span>
          </button>
        </div>

        {usersError && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold mb-3">
            {usersError} (Did you run the latest migration SQL? Admins need the
            profiles_admin_read_all policy.)
          </div>
        )}

        {!usersError && users.length === 0 && !loadingUsers && (
          <p className="text-xs text-slate-400 text-center py-6">No user rows found.</p>
        )}

        {users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400 border-b border-white/10">
                  <th className="py-2 pr-3 font-bold">Username</th>
                  <th className="py-2 pr-3 font-bold">Stream</th>
                  <th className="py-2 pr-3 font-bold">Role</th>
                  <th className="py-2 font-bold">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="py-2.5 pr-3 font-bold text-white">@{u.username ?? '—'}</td>
                    <td className="py-2.5 pr-3 text-slate-300">{u.stream ?? '—'}</td>
                    <td className="py-2.5 pr-3">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          u.role === 'admin'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                            : 'bg-white/5 text-slate-300 border-white/15'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-400">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
          Role changes are dashboard-only: edit <code className="text-slate-300">profiles.role</code> in the
          Supabase Table Editor. There is intentionally no in-app control that can modify roles.
        </p>
      </div>
    </div>
  );
};
