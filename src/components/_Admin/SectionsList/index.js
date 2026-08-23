"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase/config";
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

export default function SectionsPage() {
  const [sections, setSections] = useState([]);
  const [projects, setProjects] = useState([]);
  const [pages, setPages] = useState([]);

  const [search, setSearch] = useState("");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [projectId, setProjectId] = useState("");
  const [pageId, setPageId] = useState("");
  const [bestWidth, setBestWidth] = useState("");
  const [bestDimension, setBestDimension] = useState("");
  const [isFixed, setIsFixed] = useState(false); // <-- NEW FIELD

  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  /* ---------------------------------------
      FETCH DATA
  ----------------------------------------*/
  const fetchSections = async () => {
    const snap = await getDocs(collection(db, "sections"));
    setSections(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const fetchProjects = async () => {
    const snap = await getDocs(collection(db, "projects"));
    setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const fetchPages = async () => {
    const snap = await getDocs(collection(db, "pages"));
    setPages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchSections();
    fetchProjects();
    fetchPages();
  }, []);

  /* ---------------------------------------
      SEARCH FILTER LOGIC
  ----------------------------------------*/
  const filteredSections = sections.filter((s) => {
    const searchTerm = search.toLowerCase();
    const projectTitle =
      projects.find((p) => p.id === s.project_id)?.title?.toLowerCase() || "";
    const pageTitle =
      pages.find((p) => p.id === s.page_id)?.title?.toLowerCase() || "";

    return (
      s.title?.toLowerCase().includes(searchTerm) ||
      projectTitle.includes(searchTerm) ||
      pageTitle.includes(searchTerm)
    );
  });

  /* ---------------------------------------
      OPEN ADD MODAL
  ----------------------------------------*/
  const openAddModal = () => {
    setTitle("");
    setUrl("");
    setProjectId("");
    setPageId("");
    setBestWidth("");
    setBestDimension("");
    setIsFixed(false);

    setShowAddModal(true);
  };

  /* ---------------------------------------
      OPEN EDIT MODAL
  ----------------------------------------*/
  const openEditModal = (s) => {
    setEditingId(s.id);
    setTitle(s.title);
    setUrl(s.url);
    setProjectId(s.project_id);
    setPageId(s.page_id);
    setBestWidth(s.best_width);
    setBestDimension(s.best_dimension);
    setIsFixed(s.is_fixed || false);

    setShowEditModal(true);
  };

  /* ---------------------------------------
      ADD SECTION
  ----------------------------------------*/
  const saveNewSection = async (e) => {
    e.preventDefault();
    setLoading(true);

    const newId = Date.now().toString();

    await setDoc(doc(db, "sections", newId), {
      title,
      url,
      project_id: projectId,
      page_id: pageId,
      best_width: bestWidth,
      best_dimension: bestDimension,
      is_fixed: isFixed,
      createdAt: serverTimestamp(),
    });

    setShowAddModal(false);
    setLoading(false);
    fetchSections();
  };

  /* ---------------------------------------
      SAVE EDITED SECTION
  ----------------------------------------*/
  const saveEditSection = async (e) => {
    e.preventDefault();
    setLoading(true);

    await updateDoc(doc(db, "sections", editingId), {
      title,
      url,
      project_id: projectId,
      page_id: pageId,
      best_width: bestWidth,
      best_dimension: bestDimension,
      is_fixed: isFixed,
    });

    setShowEditModal(false);
    setLoading(false);
    fetchSections();
  };

  /* ---------------------------------------
      DELETE SECTION
  ----------------------------------------*/
  const deleteSectionFn = async (id) => {
    if (!confirm("Delete this section?")) return;
    await deleteDoc(doc(db, "sections", id));
    fetchSections();
  };

  /* ---------------------------------------
      FILTER PAGES BY SELECTED PROJECT
  ----------------------------------------*/
  const filteredPagesByProject = pages.filter((p) => p.project_id === projectId);

  /* ---------------------------------------
      RENDER PAGE
  ----------------------------------------*/
  return (
    <div className="text-white">
      <div className="flex justify-between mb-6 items-center">
        <h1 className="text-2xl font-bold text-black">Sections</h1>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-indigo-600 rounded-xl hover:bg-indigo-700"
        >
          + Add Section
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by title, project, or page..."
        className="w-full px-4 py-3 mb-6 bg-[#0d1117] border border-gray-700 rounded-xl"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Sections List */}
      <div className="space-y-4">
        {filteredSections.length === 0 && (
          <p className="text-gray-400 text-center py-4">No sections found.</p>
        )}

        {filteredSections.map((s) => {
          const project = projects.find((p) => p.id === s.project_id);
          const page = pages.find((p) => p.id === s.page_id);

          return (
            <div
              key={s.id}
              className="p-4 bg-[#1f2937] rounded-xl flex items-center justify-between"
            >
              <div>
                <h2 className="text-lg font-semibold">{s.title}</h2>
                <p className="text-gray-500 text-sm">
                  Project: {project?.title || "—"} • Page: {page?.title || "—"}
                </p>
                <p className="text-gray-500 text-sm">
                  Best Size: {s.best_width || "?"} - Best aspect: {s.best_dimension || "?"}
                </p>
                <p className="text-gray-400 text-sm">
                  Fixed: {s.is_fixed ? "Yes" : "No"}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(s)}
                  className="px-3 py-2 bg-blue-600 rounded-lg"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteSectionFn(s.id)}
                  className="px-3 py-2 bg-red-600 rounded-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD MODAL */}
      {showAddModal && (
        <SectionModal
          title="Add Section"
          submitLabel="Create Section"
          loading={loading}
          onClose={() => setShowAddModal(false)}
          onSubmit={saveNewSection}
          fields={{
            title,
            url,
            projectId,
            pageId,
            bestWidth,
            bestDimension,
            isFixed,
            setIsFixed,
            setTitle,
            setUrl,
            setProjectId,
            setPageId,
            setBestWidth,
            setBestDimension,
            projects,
            pages: filteredPagesByProject,
          }}
        />
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <SectionModal
          title="Edit Section"
          submitLabel="Save Changes"
          loading={loading}
          onClose={() => setShowEditModal(false)}
          onSubmit={saveEditSection}
          fields={{
            title,
            url,
            projectId,
            pageId,
            bestWidth,
            bestDimension,
            isFixed,
            setIsFixed,
            setTitle,
            setUrl,
            setProjectId,
            setPageId,
            setBestWidth,
            setBestDimension,
            projects,
            pages: pages.filter((p) => p.project_id === projectId),
          }}
        />
      )}
    </div>
  );
}

/* ===========================================================
   MODAL COMPONENT
=========================================================== */
function SectionModal({
  title,
  submitLabel,
  loading,
  onClose,
  onSubmit,
  fields,
}) {
  const bestWidthOptions = ["original", "1920", "1440", "1024", "768", "370", "270", "225", "160"];
  const bestDimensionOptions = ["original", "16/9", "5/4", "1/1", "4/5", "9/16", "370/113", "270/113", "16/10"];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161b22] w-full max-w-lg p-6 rounded-xl border border-gray-700">
        <h2 className="text-xl font-bold mb-6">{title}</h2>

        <form onSubmit={onSubmit} className="space-y-5">
          {/* TITLE */}
          <div>
            <label className="block mb-1 text-gray-300">Title</label>
            <input
              className="w-full px-4 py-3 bg-[#0d1117] border border-gray-700 rounded-xl"
              value={fields.title}
              onChange={(e) => fields.setTitle(e.target.value)}
              required
            />
          </div>

          {/* PROJECT */}
          <div>
            <label className="block mb-1 text-gray-300">Project</label>
            <select
              className="w-full px-4 py-3 bg-[#0d1117] border border-gray-700 rounded-xl"
              value={fields.projectId}
              onChange={(e) => fields.setProjectId(e.target.value)}
              required
            >
              <option value="">Select Project</option>
              {fields.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* PAGE */}
          <div>
            <label className="block mb-1 text-gray-300">Page</label>
            <select
              className="w-full px-4 py-3 bg-[#0d1117] border border-gray-700 rounded-xl"
              value={fields.pageId}
              onChange={(e) => fields.setPageId(e.target.value)}
              required
              disabled={!fields.projectId}
            >
              <option value="">Select Page</option>
              {fields.pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* BEST WIDTH */}
          <div>
            <label className="block mb-1 text-gray-300">Best Width</label>
            <select
              className="w-full px-4 py-3 bg-[#0d1117] border border-gray-700 rounded-xl"
              value={fields.bestWidth}
              onChange={(e) => fields.setBestWidth(e.target.value)}
            >
              <option value="">Select Width</option>
              {bestWidthOptions.map((bw) => (
                <option key={bw} value={bw}>
                  {bw}px
                </option>
              ))}
            </select>
          </div>

          {/* BEST DIMENSION */}
          <div>
            <label className="block mb-1 text-gray-300">Best Dimension</label>
            <select
              className="w-full px-4 py-3 bg-[#0d1117] border border-gray-700 rounded-xl"
              value={fields.bestDimension}
              onChange={(e) => fields.setBestDimension(e.target.value)}
            >
              <option value="">Select Dimension</option>
              {bestDimensionOptions.map((ratio) => (
                <option key={ratio} value={ratio}>
                  {ratio}
                </option>
              ))}
            </select>
          </div>

          {/* IS FIXED CHECKBOX */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={fields.isFixed}
              onChange={(e) => fields.setIsFixed(e.target.checked)}
            />
            <label className="text-gray-300 select-none">Is Fixed?</label>
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
