"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/firebase/config";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

export default function UserDashboard() {
  const router = useRouter();

  const [userData, setUserData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ---------------------------------------
        LOAD USER DATA
  --------------------------------------- */
  useEffect(() => {
  const unsub = onAuthStateChanged(auth, async (user) => {

    const uid = user.uid;
    const snap = await getDoc(doc(db, "users", uid));

    const userInfo = snap.data();
    setUserData(userInfo);

    // Load only assigned projects
    await loadProjects(userInfo.projects || []);
    setLoading(false);
  });

  return () => unsub();
}, []);


  /* ---------------------------------------
        LOAD PROJECTS ASSIGNED TO USER
  --------------------------------------- */
  const loadProjects = async (projectIds) => {
    if (projectIds.length === 0) {
      setProjects([]);
      return;
    }

    // Firestore allows max 10 items per "in" query
    const chunks = [];
    for (let i = 0; i < projectIds.length; i += 10) {
      chunks.push(projectIds.slice(i, i + 10));
    }

    let results = [];

    for (const chunk of chunks) {
      const q = query(
        collection(db, "projects"),
        where("__name__", "in", chunk)
      );

      const snap = await getDocs(q);
      snap.forEach((doc) => {
        results.push({ id: doc.id, ...doc.data() });
      });
    }

    setProjects(results);
  };

  if (loading)
    return (
      <div className="text-white p-10 text-center text-xl text-black">
        Loading your dashboard...
      </div>
    );

  return (
    <div className="p-6 text-slate-800">
      <h1 className="text-2xl font-bold mb-6">
        Welcome, {userData?.fullName}
      </h1>

      <h2 className="text-base mb-4 text-slate-500">
        Your Assigned Projects
      </h2>

      {/* NO PROJECTS */}
      {projects.length === 0 && (
        <div className="bg-[#1f2937] p-6 rounded-xl border border-[#2e3d55] text-center">
          <p className="text-gray-400">
            No projects have been assigned to you yet.
          </p>
        </div>
      )}

      {/* PROJECT GRID */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-[#1f2937] p-6 rounded-xl border border-[#2e3d55] hover:border-indigo-600 transition shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <img
                src={project.logo || "https://placehold.co/60x60"}
                className="w-12 h-12 rounded-lg bg-[#0d1117] border border-[#2e3d55] object-cover"
                alt="Logo"
              />
              <h3 className="text-lg font-semibold">{project.title}</h3>
            </div>

            <p className="text-gray-400 text-sm mb-3 truncate">
              {project.url}
            </p>

            <a
              href={`/user/project/${project.id}`}
              className="text-indigo-400 hover:text-indigo-300 text-sm"
            >
              Visit project →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
