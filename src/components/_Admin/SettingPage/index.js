"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updatePassword, signOut, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function AdminSettings() {
  const router = useRouter();

  const [userData, setUserData] = useState(null);
  const [uid, setUid] = useState(null);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");

  // Change password fields
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [loading, setLoading] = useState(false);

  /* --------------------------------------------------------
     FETCH LOGGED-IN USER DATA
  --------------------------------------------------------- */
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      router.push("/login");
      return;
    }

    setUid(user.uid);

    const loadUser = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      const data = snap.data();

      setUserData(data);
      setFullName(data.fullName);
      setCompany(data.company || "");
      setEmail(data.email);
    };

    loadUser();
  }, []);

  if (!userData) return <p className="text-white">Loading...</p>;

  /* --------------------------------------------------------
     SAVE PROFILE INFO
  --------------------------------------------------------- */
  const saveProfile = async () => {
    setLoading(true);

    await updateDoc(doc(db, "users", uid), {
      fullName,
      company,
    });

    setLoading(false);
    alert("Profile updated.");
  };

  /* --------------------------------------------------------
     CHANGE PASSWORD
  --------------------------------------------------------- */
  const changePassword = async () => {
    setLoading(true);

    try {
      // Re-auth required
      const credential = EmailAuthProvider.credential(email, currentPass);
      await reauthenticateWithCredential(auth.currentUser, credential);

      await updatePassword(auth.currentUser, newPass);

      alert("Password updated successfully.");
      setCurrentPass("");
      setNewPass("");
    } catch (err) {
      alert(err.message);
    }

    setLoading(false);
  };

  /* --------------------------------------------------------
     LOGOUT
  --------------------------------------------------------- */
  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  /* --------------------------------------------------------
     RENDER PAGE
  --------------------------------------------------------- */
  return (
    <div className="text-white p-6">
      <h1 className="text-2xl font-bold mb-8">Admin Settings</h1>

      {/* ---------------- PROFILE INFO ---------------- */}
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

        {/* EMAIL (READ-ONLY) */}
        <div className="mb-4">
          <label className="block text-gray-300 mb-1">Email</label>
          <input
            className="w-full px-4 py-3 bg-[#0d1117] text-gray-500 border border-gray-700 rounded-xl"
            value={email}
            readOnly
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
