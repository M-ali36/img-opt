"use client";

import { useState } from "react";
import { auth, db } from "@/firebase/config";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading, setLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");

    const register = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        if (!fullName || !company || !email || !password) {
            setErrorMsg("Please fill in all fields.");
            setLoading(false);
            return;
        }

        if (password !== confirmPass) {
            setErrorMsg("Passwords do not match.");
            setLoading(false);
            return;
        }

        try {
            // Create Firebase Auth account
            const userCred = await createUserWithEmailAndPassword(auth, email, password);

            const uid = userCred.user.uid;

            // Create Firestore user document
            await setDoc(doc(db, "users", uid), {
            fullName,
            company,
            email,
            role: "user",
            enabled: true,
            projects: [],
            createdAt: serverTimestamp(),
            });

            // 🔥 NEW: Create session cookie same as login
            const token = await userCred.user.getIdToken();
            await fetch("/api/session", {
            method: "POST",
            body: JSON.stringify({
                token,
                role: "user",
            }),
            });

            // 🔥 Redirect now works
            router.push("/user");

        } catch (err) {
            console.error(err);
            setErrorMsg(err.message);
        }

        setLoading(false);
    };


  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117] px-4 py-10">
      <div className="w-full max-w-md bg-[#161b22] border border-[#2e3555] p-8 rounded-2xl shadow-xl">

        <h2 className="text-3xl font-extrabold text-white text-center mb-6">
          Create Your Account
        </h2>

        <p className="text-gray-400 text-center mb-8 text-sm">
          Please enter your information to register
        </p>

        {/* ERROR BOX */}
        {errorMsg && (
          <div className="mb-5 p-3 bg-red-900/40 border border-red-700 text-red-300 rounded-lg text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={register} className="space-y-5">

          {/* FULL NAME */}
          <div>
            <label className="block text-gray-300 mb-1 text-sm">Full Name</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl bg-[#0d1117] border border-[#2e3555] text-gray-200 
                        focus:border-indigo-500 focus:ring-indigo-500 transition"
              placeholder="Your Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          {/* COMPANY */}
          <div>
            <label className="block text-gray-300 mb-1 text-sm">Company</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl bg-[#0d1117] border border-[#2e3555] text-gray-200 
                        focus:border-indigo-500 focus:ring-indigo-500 transition"
              placeholder="Company Name"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>

          {/* EMAIL */}
          <div>
            <label className="block text-gray-300 mb-1 text-sm">Email</label>
            <input
              type="email"
              className="w-full px-4 py-3 rounded-xl bg-[#0d1117] border border-[#2e3555] text-gray-200 
                        focus:border-indigo-500 focus:ring-indigo-500 transition"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-gray-300 mb-1 text-sm">Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-xl bg-[#0d1117] border border-[#2e3555] text-gray-200 
                        focus:border-indigo-500 focus:ring-indigo-500 transition"
              placeholder="•••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* CONFIRM PASSWORD */}
          <div>
            <label className="block text-gray-300 mb-1 text-sm">Confirm Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-xl bg-[#0d1117] border border-[#2e3555] text-gray-200 
                        focus:border-indigo-500 focus:ring-indigo-500 transition"
              placeholder="•••••••••"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
            />
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 transition text-white 
                       font-semibold shadow-md"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-indigo-500 hover:underline">Log In</a>
        </p>
      </div>
    </div>
  );
}
