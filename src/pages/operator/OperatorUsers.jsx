import { useEffect, useState, useCallback } from "react";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { supabase } from "@/lib/supabaseClient";
import { useRole } from "@/hooks/useRole";

import {
  User,
  Search,
  MoreHorizontal,
  ArrowUpDown,
  X,
  Shield,
  Mail,
} from "lucide-react";

import { logEvent } from "@/utils/logger"; // ✅ NEW LOGGER

export default function OperatorUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");

  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [actionLoading, setActionLoading] = useState(null);

  const role = useRole();
  const isAdmin = role === "admin";

  // --------------------------------------------------------------------
  // LOAD USERS FROM 4 TABLES
  // --------------------------------------------------------------------
  const loadALL = useCallback(async () => {
    setLoading(true);

    try {
      const [
        { data: uUsers },
        { data: uOwners },
        { data: uOperators },
        { data: adminIds },
      ] = await Promise.all([
        supabase.from("users").select("*"),
        supabase.from("owners").select("*"),
        supabase.from("operators").select("*"),
        supabase.from("admin_users").select("user_id"),
      ]);

      let adminList = [];

      for (const a of adminIds || []) {
        const uid = a.user_id;

        const adminProfile =
          uUsers?.find((u) => u.id === uid) ||
          uOwners?.find((u) => u.id === uid) ||
          uOperators?.find((u) => u.user_id === uid);

        if (adminProfile) {
          adminList.push({
            id: uid,
            full_name: adminProfile.full_name,
            email: adminProfile.email,
            role: "admin",
            created_at: adminProfile.created_at,
          });
        } else {
          adminList.push({
            id: uid,
            full_name: "Admin User",
            email: "unknown",
            role: "admin",
            created_at: new Date().toISOString(),
          });
        }
      }

      const list = [
        ...(uUsers || []).map((u) => ({
          id: u.id,
          full_name: u.full_name,
          email: u.email,
          role: "user",
          created_at: u.created_at,
        })),
        ...(uOwners || []).map((u) => ({
          id: u.id,
          full_name: u.full_name,
          email: u.email,
          role: "owner",
          created_at: u.created_at,
        })),
        ...(uOperators || []).map((u) => ({
          id: u.user_id,
          full_name: u.full_name,
          email: u.email,
          role: "operator",
          created_at: u.created_at,
        })),
        ...adminList,
      ];

      setUsers(list);
    } catch (err) {
      console.error("Failed to load users:", err);
      logEvent({
        level: "error",
        service: "operator-users",
        message: "User list failed to load",
        meta: { error: err.message },
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadALL();
  }, [loadALL]);

  // --------------------------------------------------------------------
  // REALTIME SUBSCRIPTIONS
  // --------------------------------------------------------------------
  useEffect(() => {
    const channel = supabase
      .channel("operator-users-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        loadALL
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "owners" },
        loadALL
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "operators" },
        loadALL
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_users" },
        loadALL
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [loadALL]);

  // --------------------------------------------------------------------
  // ROLE CHANGE (Option A + Logging)
  // --------------------------------------------------------------------
  async function removeFromCurrentRole(user) {
    if (user.role === "user")
      await supabase.from("users").delete().eq("id", user.id);
    else if (user.role === "owner")
      await supabase.from("owners").delete().eq("id", user.id);
    else if (user.role === "operator")
      await supabase.from("operators").delete().eq("user_id", user.id);
    else if (user.role === "admin")
      await supabase.from("admin_users").delete().eq("user_id", user.id);
  }

  async function addToTargetRole(user, targetRole) {
    if (targetRole === "user") {
      await supabase.from("users").insert({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
      });
    } else if (targetRole === "owner") {
      await supabase.from("owners").insert({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
      });
    } else if (targetRole === "operator") {
      await supabase.from("operators").insert({
        user_id: user.id,
        email: user.email,
        full_name: user.full_name,
      });
    } else if (targetRole === "admin") {
      await supabase.from("admin_users").insert({ user_id: user.id });
    }
  }

  async function changeRole(user, targetRole) {
    if (user.role === targetRole) return;

    if ((user.role === "admin" || targetRole === "admin") && !isAdmin) {
      alert("Only admins can modify admin roles.");
      return;
    }

    setActionLoading({ id: user.id, type: "role" });

    try {
      await removeFromCurrentRole(user);
      await addToTargetRole(user, targetRole);

      logEvent({
        level: "info",
        service: "operator-users",
        message: "Role changed",
        meta: { userId: user.id, from: user.role, to: targetRole },
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: targetRole } : u))
      );
    } catch (err) {
      console.error("Role change failed:", err);
      logEvent({
        level: "error",
        service: "operator-users",
        message: "Role change failed",
        meta: { userId: user.id, error: err.message },
      });
      alert("Failed to change role.");
    } finally {
      setActionLoading(null);
    }
  }

  // --------------------------------------------------------------------
  // SUSPEND USER (logged)
  // --------------------------------------------------------------------
  async function handleSuspend(user) {
    setActionLoading({ id: user.id, type: "suspend" });

    logEvent({
      level: "warning",
      service: "operator-users",
      message: "Suspend user requested",
      meta: { userId: user.id, email: user.email },
    });

    alert("Suspend user not implemented yet (but logged).");

    setActionLoading(null);
  }

  // --------------------------------------------------------------------
  // RESET PASSWORD
  // --------------------------------------------------------------------
  async function handleResetPassword(user) {
    setActionLoading({ id: user.id, type: "reset" });

    try {
      await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      logEvent({
        level: "info",
        service: "operator-users",
        message: "Password reset initiated",
        meta: { userId: user.id, email: user.email },
      });

      alert(`Password reset link sent to ${user.email}`);
    } catch (err) {
      logEvent({
        level: "error",
        service: "operator-users",
        message: "Password reset failed",
        meta: { userId: user.id, error: err.message },
      });
      alert("Failed to send reset email.");
    } finally {
      setActionLoading(null);
    }
  }

  // --------------------------------------------------------------------
  // SORT, FILTER, PAGINATE
  // --------------------------------------------------------------------
  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)) &&
      (roleFilter === "all" || u.role === roleFilter)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;

    if (sortBy === "created_at") {
      return (
        (new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()) * dir
      );
    }

    return a[sortBy].localeCompare(b[sortBy]) * dir;
  });

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const safePage = Math.min(currentPage, totalPages || 1);

  const paginated = sorted.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  function toggleSort(column) {
    setCurrentPage(1);
    if (sortBy === column) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDir(column === "created_at" ? "desc" : "asc");
    }
  }

  // --------------------------------------------------------------------
  // MODAL OPEN/CLOSE (with logging)
  // --------------------------------------------------------------------
  function openModal(user) {
    setSelectedUser(user);
    setModalOpen(true);

    logEvent({
      level: "info",
      service: "operator-users",
      message: "Opened profile modal",
      meta: { userId: user.id },
    });
  }

  function closeModal() {
    logEvent({
      level: "info",
      service: "operator-users",
      message: "Closed profile modal",
      meta: { userId: selectedUser?.id },
    });

    setModalOpen(false);
    setSelectedUser(null);
  }

  const isActionLoading = (id, type) =>
    actionLoading && actionLoading.id === id && actionLoading.type === type;

  // --------------------------------------------------------------------
  // UI
  // --------------------------------------------------------------------
  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Users"
        subtitle="Manage users, owners, operators, and admins."
      />

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 bg-slate-900/40 border border-slate-800 px-3 py-2 rounded-lg w-full md:w-64">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search users..."
            className="bg-transparent outline-none text-slate-200 w-full"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <select
          className="bg-slate-900/40 border border-slate-800 px-3 py-2 rounded-lg text-slate-200"
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="all">All Roles</option>
          <option value="user">User</option>
          <option value="owner">Owner</option>
          <option value="operator">Operator</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/60 border-b border-slate-800">
            <tr>
              <SortableHeader
                label="Name"
                column="full_name"
                sortBy={sortBy}
                sortDir={sortDir}
                onClick={toggleSort}
              />
              <SortableHeader
                label="Email"
                column="email"
                sortBy={sortBy}
                sortDir={sortDir}
                onClick={toggleSort}
              />
              <SortableHeader
                label="Role"
                column="role"
                sortBy={sortBy}
                sortDir={sortDir}
                onClick={toggleSort}
              />
              <SortableHeader
                label="Created"
                column="created_at"
                sortBy={sortBy}
                sortDir={sortDir}
                onClick={toggleSort}
              />
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="px-4 py-6 text-slate-400">
                  Loading users...
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-6 text-slate-400">
                  No users found.
                </td>
              </tr>
            ) : (
              paginated.map((u) => {
                const isAdminRow = u.role === "admin";
                const canManageAdmin = isAdmin;

                return (
                  <tr
                    key={`${u.id}-${u.role}`}
                    className="border-b border-slate-800 hover:bg-slate-800/40 transition"
                  >
                    <td className="px-4 py-3 flex items-center gap-2">
                      <User size={16} className="text-slate-500" />
                      {u.full_name || "Unnamed"}
                    </td>

                    <td className="px-4 py-3">{u.email}</td>

                    <td className="px-4 py-3 capitalize">
                      <span
                        className={`px-2 py-1 rounded text-xs inline-flex items-center gap-1 ${
                          u.role === "owner"
                            ? "bg-purple-600/30 text-purple-300"
                            : u.role === "operator"
                            ? "bg-amber-600/30 text-amber-300"
                            : u.role === "admin"
                            ? "bg-rose-600/40 text-rose-100"
                            : "bg-sky-600/30 text-sky-300"
                        }`}
                      >
                        {u.role === "admin" && <Shield size={12} />}
                        {u.role}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openModal(u)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs border border-slate-700 text-slate-300 hover:bg-slate-800"
                      >
                        <MoreHorizontal size={14} />
                        <span className="hidden sm:inline">Manage</span>
                      </button>

                      {isAdminRow && !canManageAdmin && (
                        <p className="mt-1 text-[10px] text-slate-500">
                          Admin protected
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-end gap-2">
        <button
          disabled={safePage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
          className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg disabled:opacity-30"
        >
          Prev
        </button>
        <button
          disabled={safePage === totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}
          className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg disabled:opacity-30"
        >
          Next
        </button>
      </div>

      {/* PROFILE MODAL */}
      {modalOpen && selectedUser && (
        <ProfileModal
          user={selectedUser}
          isAdminViewer={isAdmin}
          onClose={closeModal}
          onChangeRole={changeRole}
          onSuspend={handleSuspend}
          onResetPassword={handleResetPassword}
          isActionLoading={isActionLoading}
        />
      )}
    </div>
  );
}

/* ================================================================
   SORTABLE HEADER COMPONENT
================================================================ */
function SortableHeader({ label, column, sortBy, sortDir, onClick }) {
  const active = sortBy === column;
  const directionIcon =
    active && sortDir === "asc"
      ? "↑"
      : active && sortDir === "desc"
      ? "↓"
      : "";

  return (
    <th
      className="text-left px-4 py-3 cursor-pointer select-none text-slate-300"
      onClick={() => onClick(column)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown size={12} className={active ? "text-sky-400" : "text-slate-500"} />
        <span className="text-[10px] text-slate-500">{directionIcon}</span>
      </span>
    </th>
  );
}

/* ================================================================
   PROFILE MODAL
================================================================ */
function ProfileModal({
  user,
  isAdminViewer,
  onClose,
  onChangeRole,
  onSuspend,
  onResetPassword,
  isActionLoading,
}) {
  const roleOptions = [
    { value: "user", label: "User" },
    { value: "owner", label: "Owner" },
    { value: "operator", label: "Operator" },
  ];

  if (isAdminViewer) {
    roleOptions.push({ value: "admin", label: "Admin" });
  }

  const canEditRole = !(user.role === "admin") || isAdminViewer;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="w-full max-w-lg bg-slate-950 border border-slate-800 p-6 rounded-2xl shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-500 hover:text-slate-200"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-sky-600/40 flex items-center justify-center">
            <User size={20} className="text-sky-200" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-50">
              {user.full_name || "Unnamed"}
            </h2>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Role</span>
            <span className="capitalize text-slate-200 flex items-center gap-1">
              {user.role === "admin" && <Shield size={12} />}
              {user.role}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Created</span>
            <span className="text-slate-200">
              {user.created_at
                ? new Date(user.created_at).toLocaleString()
                : "—"}
            </span>
          </div>
        </div>

        {/* Role Change */}
        <div className="mt-5 border-t border-slate-800 pt-4 space-y-3">
          <p className="text-xs text-slate-400">Change Role</p>

          <div className="flex gap-3 items-center">
            <select
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 flex-1"
              value={user.role}
              disabled={!canEditRole || isActionLoading(user.id, "role")}
              onChange={(e) => onChangeRole(user, e.target.value)}
            >
              {roleOptions.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>

            {!canEditRole && (
              <span className="text-[11px] text-slate-500">
                Only admins can modify admin role
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 border-t border-slate-800 pt-4 flex flex-wrap gap-3">
          <button
            onClick={() => onResetPassword(user)}
            disabled={isActionLoading(user.id, "reset")}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs disabled:opacity-40"
          >
            <Mail size={14} />
            {isActionLoading(user.id, "reset") ? "Sending..." : "Reset Password"}
          </button>

          <button
            onClick={() => onSuspend(user)}
            disabled={isActionLoading(user.id, "suspend")}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-700/80 hover:bg-rose-700 text-white text-xs disabled:opacity-40"
          >
            {isActionLoading(user.id, "suspend")
              ? "Suspending..."
              : "Suspend User"}
          </button>

          <button
            onClick={onClose}
            className="ml-auto inline-flex items-center px-3 py-2 rounded-lg border border-slate-700 text-slate-200 text-xs hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
