"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function UserSettings() {
  const router = useRouter();

  const [userData, setUserData] = useState(null);
  const [uid, setUid] = useState(null);

  // Fields
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");

  // Change password
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  /* ------------------------------------
        LOAD CURRENT USER DATA
  ------------------------------------ */
  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      router.push("/login");
      return;
    }

    setUid(user.uid);

    const loadData = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      const data = snap.data();

      setUserData(data);
      setFullName(data.fullName);
      setCompany(data.company || "");
      setEmail(data.email);
    };

    loadData();
  }, []);

  if (!userData) return <p className="text-white">Loading...</p>;

  /* ------------------------------------
        SAVE PROFILE INFORMATION
  ------------------------------------ */
  const saveProfile = async () => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await updateDoc(doc(db, "users", uid), {
        fullName,
        company,
      });

      setSuccessMsg("Profile updated successfully.");
    } catch (err) {
      setErrorMsg(err.message);
    }

    setLoading(false);
  };

  /* ------------------------------------
        CHANGE PASSWORD
  ------------------------------------ */
  const changePassword = async () => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const credential = EmailAuthProvider.credential(email, currentPass);
      await reauthenticateWithCredential(auth.currentUser, credential);

      await updatePassword(auth.currentUser, newPass);
      setSuccessMsg("Password updated successfully.");

      setCurrentPass("");
      setNewPass("");
    } catch (err) {
      setErrorMsg(err.message);
    }

    setLoading(false);
  };

  /* ------------------------------------
        LOGOUT
  ------------------------------------ */
  const handleLogout = async () => {
    await signOut(auth);
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  };

  /* ------------------------------------
        RENDER UI
  ------------------------------------ */
  return (
    <div className="text-white p-6">
      <h1 className="text-2xl font-bold mb-8">User Settings</h1>

      {/* ERROR & SUCCESS MESSAGES */}
      {errorMsg && (
        <div className="mb-5 p-3 bg-red-900/40 border border-red-700 text-red-300 rounded-lg text-sm">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="mb-5 p-3 bg-green-900/40 border border-green-700 text-green-300 rounded-lg text-sm">
          {successMsg}
        </div>
      )}

      {/* ---------------- PROFILE ---------------- */}
      <div className="bg-[#1f2937] p-6 rounded-xl border border-[#2e3d55] mb-8">
        <h2 className="text-xl font-semibold mb-4">Profile Information</h2>

        {/* FULL NAME */}
        <div className="mb-4">
          <label className="block text-gray-300 mb-1">Full Name</label>
          <input
            className="w-full px-4 py-3 bg-[#0d1117] border border-gray-700 rounded-xl"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        {/* COMPANY */}
        <div className="mb-4">
          <label className="block text-gray-300 mb-1">Company</label>
          <input
            className="w-full px-4 py-3 bg-[#0d1117] border border-gray-700 rounded-xl"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>

        {/* EMAIL (READ-ONLY) */}
        <div className="mb-4">
          <label className="block text-gray-300 mb-1">Email (read-only)</label>
          <input
            className="w-full px-4 py-3 bg-[#0d1117] text-gray-500 border border-gray-700 rounded-xl"
            value={email}
            readOnly
          />
        </div>

        <button
          onClick={saveProfile}
          disabled={loading}
          className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* ---------------- CHANGE PASSWORD ---------------- */}
      <div className="bg-[#1f2937] p-6 rounded-xl border border-[#2e3d55] mb-8">
        <h2 className="text-xl font-semibold mb-4">Change Password</h2>

        {/* CURRENT PASSWORD */}
        <div className="mb-4">
          <label className="block text-gray-300 mb-1">Current Password</label>
          <input
            type="password"
            className="w-full px-4 py-3 bg-[#0d1117] border border-gray-700 rounded-xl"
            value={currentPass}
            onChange={(e) => setCurrentPass(e.target.value)}
          />
        </div>

        {/* NEW PASSWORD */}
        <div className="mb-4">
          <label className="block text-gray-300 mb-1">New Password</label>
          <input
            type="password"
            className="w-full px-4 py-3 bg-[#0d1117] border border-gray-700 rounded-xl"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
          />
        </div>

        <button
          onClick={changePassword}
          disabled={loading}
          className="px-4 py-3 bg-blue-600 rounded-xl hover:bg-blue-700"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </div>

      {/* ---------------- LOGOUT ---------------- */}
      <button
        onClick={handleLogout}
        className="px-4 py-3 bg-red-600 rounded-xl hover:bg-red-700"
      >
        Logout
      </button>
    </div>
  );
}
