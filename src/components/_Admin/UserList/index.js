"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/firebase/config";
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);

  // Search Text
  const [search, setSearch] = useState("");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [userProjects, setUserProjects] = useState([]);
  const [role, setRole] = useState("user");
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState(null);

  /* =============================
     FETCH USERS + PROJECTS
  ============================== */
  const fetchUsers = async () => {
    const snap = await getDocs(collection(db, "users"));
    setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const fetchProjects = async () => {
    const snap = await getDocs(collection(db, "projects"));
    setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchUsers();
    fetchProjects();
  }, []);

  /* =============================
     SEARCH FILTER
  ============================== */
  const filteredUsers = users.filter((u) => {
    const s = search.toLowerCase();
    return (
      u.fullName?.toLowerCase().includes(s) ||
      u.email?.toLowerCase().includes(s) ||
      u.company?.toLowerCase().includes(s)
    );
  });

  /* =============================
     CHECKBOX SELECTOR
  ============================== */
  const toggleProject = (id) => {
    setUserProjects((curr) =>
      curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id]
    );
  };

  /* =============================
     OPEN / CLOSE MODALS
  ============================== */
  const openAddModal = () => {
    setFullName("");
    setEmail("");
    setCompany("");
    setUserProjects([]);
    setRole("user");
    setEnabled(true);
    setShowAddModal(true);
  };

  const openEditModal = (u) => {
    setEditingId(u.id);
    setFullName(u.fullName);
    setEmail(u.email);
    setCompany(u.company);
    setUserProjects(u.projects || []);
    setRole(u.role || "user");
    setEnabled(u.enabled !== false);
    setShowEditModal(true);
  };

  /* =============================
     ADD USER
  ============================== */
  const saveNewUser = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Create Auth User
    const acc = await createUserWithEmailAndPassword(auth, email, "Default123!");

    // Save Firestore User
    await setDoc(doc(db, "users", acc.user.uid), {
      fullName,
      email,
      company,
      projects: userProjects,
      role,
      enabled,
      createdAt: serverTimestamp(),
    });

    setLoading(false);
    setShowAddModal(false);
    fetchUsers();
  };

  /* =============================
     EDIT USER
  ============================== */
  const saveEditUser = async (e) => {
    e.preventDefault();
    setLoading(true);

    await updateDoc(doc(db, "users", editingId), {
      fullName,
      company,
      projects: userProjects,
      role,
      enabled,
    });

    setLoading(false);
    setShowEditModal(false);
    fetchUsers();
  };

  /* =============================
     DELETE USER
  ============================== */
  const deleteUserFn = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    await deleteDoc(doc(db, "users", id));
    fetchUsers();
  };

  /* =============================
     RESET PASSWORD
  ============================== */
  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
    alert("Password reset email sent.");
  };

  /* =============================
     ENABLE / DISABLE USER
  ============================== */
  const toggleEnable = async (u) => {
    await updateDoc(doc(db, "users", u.id), {
      enabled: !u.enabled,
    });
    fetchUsers();
  };

  /* ===========================================================
     📌 RENDER PAGE
  ============================================================ */
  return (
    <div className="text-white">
      {/* Header */}
      <div className="flex justify-between mb-6 items-center">
        <h1 className="text-2xl font-bold text-black">Users</h1>

        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-indigo-600 rounded-xl hover:bg-indigo-700"
        >
          + Add User
        </button>
      </div>

      {/* Search Input */}
      <input
        type="text"
        placeholder="Search by name, email, or company..."
        className="w-full px-4 py-3 mb-6 bg-[#0d1117] border border-gray-700 rounded-xl"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Users Table (SEARCH APPLIED HERE) */}
      <div className="space-y-4">
        {filteredUsers.length === 0 && (
          <p className="text-gray-400 text-center py-4">No users found.</p>
        )}

        {filteredUsers.map((u) => (
          <div
            key={u.id}
            className="p-4 bg-[#1f2937] rounded-xl flex items-center justify-between"
          >
            <div>
              <h2 className="text-lg font-semibold">{u.fullName}</h2>
              <p className="text-gray-400">{u.email}</p>
              <p className="text-gray-500 text-sm">
                {u.company} • {u.role} • {u.enabled ? "Enabled" : "Disabled"}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => openEditModal(u)}
                className="px-3 py-2 bg-blue-600 rounded-lg"
              >
                Edit
              </button>

              <button
                onClick={() => resetPassword(u.email)}
                className="px-3 py-2 bg-yellow-600 rounded-lg"
              >
                Reset Password
              </button>

              <button
                onClick={() => toggleEnable(u)}
                className="px-3 py-2 bg-gray-600 rounded-lg"
              >
                {u.enabled ? "Disable" : "Enable"}
              </button>

              <button
                onClick={() => deleteUserFn(u.id)}
                className="px-3 py-2 bg-red-600 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODALS */}
      {showAddModal && (
        <UserModal
          title="Add User"
          submitLabel="Create User"
          loading={loading}
          onClose={() => setShowAddModal(false)}
          onSubmit={saveNewUser}
          fields={{
            fullName,
            email,
            company,
            userProjects,
            role,
            enabled,
            setFullName,
            setEmail,
            setCompany,
            setUserProjects,
            setRole,
            setEnabled,
            projects,
            toggleProject,
          }}
        />
      )}

      {showEditModal && (
        <UserModal
          title="Edit User"
          submitLabel="Save Changes"
          loading={loading}
          onClose={() => setShowEditModal(false)}
          onSubmit={saveEditUser}
          fields={{
            fullName,
            email,
            company,
            userProjects,
            role,
            enabled,
            setFullName,
            setEmail,
            setCompany,
            setUserProjects,
            setRole,
            setEnabled,
            projects,
            toggleProject,
            disableEmail: true,
          }}
        />
      )}
    </div>
  );
}

/* ===========================================================
   📌 MODAL COMPONENT
=========================================================== */
function UserModal({ title, submitLabel, loading, onClose, onSubmit, fields }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161b22] w-full max-w-lg p-6 rounded-xl border border-gray-700">
        <h2 className="text-xl font-bold mb-6">{title}</h2>

        <form onSubmit={onSubmit} className="space-y-5">
          {/* FULL NAME */}
          <div>
            <label className="block mb-1 text-gray-300">Full Name</label>
            <input
              className="w-full px-4 py-3 bg-[#0d1117] border border-gray-700 rounded-xl"
              value={fields.fullName}
              onChange={(e) => fields.setFullName(e.target.value)}
              required
            />
          </div>

          {/* EMAIL */}
          {!fields.disableEmail && (
            <div>
              <label className="block mb-1 text-gray-300">Email</label>
              <input
                type="email"
                className="w-full px-4 py-3 bg-[#0d1117] border border-gray-700 rounded-xl"
                value={fields.email}
                onChange={(e) => fields.setEmail(e.target.value)}
                required
              />
            </div>
          )}

          {/* COMPANY */}
          <div>
            <label className="block mb-1 text-gray-300">Company</label>
            <input
              className="w-full px-4 py-3 bg-[#0d1117] border border-gray-700 rounded-xl"
              value={fields.company}
              onChange={(e) => fields.setCompany(e.target.value)}
            />
          </div>

          {/* PROJECTS */}
          <div>
            <label className="block mb-1 text-gray-300">Projects</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-[#0d1117] border border-gray-700 rounded-xl">
              {fields.projects.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={fields.userProjects.includes(p.id)}
                    onChange={() => fields.toggleProject(p.id)}
                  />
                  {p.title}
                </label>
              ))}
            </div>
          </div>

          {/* ROLE */}
          <div>
            <label className="block mb-1 text-gray-300">Role</label>
            <select
              className="w-full px-4 py-3 bg-[#0d1117] border border-gray-700 rounded-xl"
              value={fields.role}
              onChange={(e) => fields.setRole(e.target.value)}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* ENABLE */}
          <div>
            <label className="block mb-1 text-gray-300">Enabled</label>
            <select
              className="w-full px-4 py-3 bg-[#0d1117] border border-gray-700 rounded-xl"
              value={fields.enabled ? "1" : "0"}
              onChange={(e) => fields.setEnabled(e.target.value === "1")}
            >
              <option value="1">Enabled</option>
              <option value="0">Disabled</option>
            </select>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 rounded-xl"
            >
              {loading ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
