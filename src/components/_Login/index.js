"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/firebase/config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

    useEffect(() => {
        const emailField = document.querySelector('input[type="email"]');
        const passField = document.querySelector('input[type="password"]');

        if (emailField?.value) setEmail(emailField.value);
        if (passField?.value) setPassword(passField.value);
    }, []);

  const login = async (e) => {
    e.preventDefault(); // ✔ FIX: prevents empty submits
    setLoading(true);

    try {
      if (!email || !password) {
        alert("Please enter email and password");
        return;
      }

      // Firebase login
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      // Fetch role from Firestore
      const snap = await getDoc(doc(db, "users", uid));
      const role = snap.data()?.role;

      // Set session cookies
      await fetch("/api/session", {
        method: "POST",
        body: JSON.stringify({
          token: await userCred.user.getIdToken(),
          role,
          uid: userCred.user.uid,
        }),
      });


      // Redirect by role
      if (role === "admin") router.push("/admin");
      else if (role === "user") router.push("/user");
      else router.push("/");

    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117] px-4 py-10">
      <div className="w-full max-w-md bg-[#161b22] border border-[#2e3555] p-8 rounded-2xl shadow-xl">

        <h2 className="text-3xl font-extrabold text-white text-center mb-6">
          Welcome Back
        </h2>

        <p className="text-gray-400 text-center mb-8 text-sm">
          Please enter your credentials to continue
        </p>

        <form onSubmit={login} className="space-y-5">

          {/* EMAIL */}
          <div>
            <label className="block text-gray-300 mb-1 text-sm">Email</label>
            <input
              type="email"
              className="w-full px-4 py-3 rounded-xl bg-[#0d1117] border border-[#2e3555] text-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onInput={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-gray-300 mb-1 text-sm">Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-xl bg-[#0d1117] border border-[#2e3555] text-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition"
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onInput={(e) => setPassword(e.target.value)} 
            />
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 transition text-white font-semibold shadow-md"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Don’t have an account?{" "}
          <a href="/register" className="text-indigo-500 hover:underline">
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}
