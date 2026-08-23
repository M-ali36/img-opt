"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/firebase/config";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter, useParams } from "next/navigation";
import BatchWebpConverter from "./BatchWebpConverter";

export default function ProjectPage() {
  const router = useRouter();

  const params = useParams();
  const { id: projectId } = params; // Access the 'id' parameter directly

  const [project, setProject] = useState(null);
  const [pages, setPages] = useState([]);
  const [sections, setSections] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);

  const [selectedPage, setSelectedPage] = useState("");
  const [selectedSection, setSelectedSection] = useState(null);

  const [loading, setLoading] = useState(true);

  /* ---------------------------------------------------
        FIX: Wait for Firebase Auth before redirecting
  --------------------------------------------------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      // Load everything once user is ready
      await loadProjectData();
      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* ---------------------------------------------------
        Load project + pages + sections
  --------------------------------------------------- */
  const loadProjectData = async () => {
    // Project
    const projSnap = await getDoc(doc(db, "projects", projectId));
    if (!projSnap.exists()) {
      router.push("/user");
      return;
    }
    setProject({ id: projectId, ...projSnap.data() });

    // Pages
    const pagesQ = query(
      collection(db, "pages"),
      where("project_id", "==", projectId)
    );
    const pagesSnap = await getDocs(pagesQ);
    setPages(pagesSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

    // Sections
    const secQ = query(
      collection(db, "sections"),
      where("project_id", "==", projectId)
    );
    const secSnap = await getDocs(secQ);
    setSections(secSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  /* ---------------------------------------------------
        Filter sections by selected page
  --------------------------------------------------- */
  useEffect(() => {
    if (!selectedPage) {
      setFilteredSections([]);
      setSelectedSection(null);
      return;
    }

    setFilteredSections(
      sections.filter((sec) => sec.page_id === selectedPage)
    );
  }, [selectedPage]);

  if (loading)
    return (
      <div className="text-white p-10 text-center text-xl">
        Loading Project...
      </div>
    );

  return (
    <div className="p-6 text-black">
      <h1 className="text-2xl font-bold mb-6 text-black">Project: {project?.title}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* PAGE SELECT */}
        <div className="">
          <label className="block mb-2 text-gray-500 text-sm">Select Page</label>
          <select
            className="w-full px-4 py-3 border rounded-xl"
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
          >
            <option value="">-- Select Page --</option>
            {pages.map((page) => (
              <option key={page.id} value={page.id}>
                {page.title}
              </option>
            ))}
          </select>
        </div>

        {/* SECTION SELECT */}
        <div className="">
          <label className="block mb-2 text-gray-500 text-sm">Select Section</label>
          <select
            className="w-full px-4 py-3 border rounded-xl"
            value={selectedSection?.id || ""}
            onChange={(e) => {
              setSelectedSection(
                filteredSections.find((s) => s.id === e.target.value)
              );
            }}
            disabled={!selectedPage}
          >
            <option value="">-- Select Section --</option>
            {filteredSections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.title}
              </option>
            ))}
          </select>
        </div>
      </div>


      {/* SELECTED SECTION DISPLAY */}
      <BatchWebpConverter
        defaultAspect={selectedSection?.best_dimension}
        defaultScale={selectedSection?.best_width}
        isFixed={selectedSection?.is_fixed}
      />
    </div>
  );
}
