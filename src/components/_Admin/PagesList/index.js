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

export default function PagesPage() {
  const [pages, setPages] = useState([]);
  const [projects, setProjects] = useState([]);

  const [search, setSearch] = useState("");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [projectId, setProjectId] = useState("");

  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  /* ================================
     FETCH DATA
  ================================== */
  const fetchPages = async () => {
    const snap = await getDocs(collection(db, "pages"));
    setPages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const fetchProjects = async () => {
    const snap = await getDocs(collection(db, "projects"));
    setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchPages();
    fetchProjects();
  }, []);

  /* ================================
     SEARCH
  ================================== */
  const filteredPages = pages.filter((p) =>
    p.title?.toLowerCase().includes(search.toLowerCase())
  );

  /* ================================
     OPEN MODALS
  ================================== */
  const openAddModal = () => {
    setTitle("");
    setUrl("");
    setProjectId("");
    setShowAddModal(true);
  };

  const openEditModal = (p) => {
    setEditingId(p.id);
    setTitle(p.title);
    setUrl(p.url);
    setProjectId(p.project_id);
    setShowEditModal(true);
  };

  /* ================================
     ADD PAGE
  ================================== */
  const saveNewPage = async (e) => {
    e.preventDefault();
    setLoading(true);

    const newId = Date.now().toString();

    await setDoc(doc(db, "pages", newId), {
      title,
      url,
      project_id: projectId,
      createdAt: serverTimestamp(),
    });

    setLoading(false);
    setShowAddModal(false);
    fetchPages();
  };

  /* ================================
     EDIT PAGE
  ================================== */
  const saveEditPage = async (e) => {
    e.preventDefault();
    setLoading(true);

    await updateDoc(doc(db, "pages", editingId), {
      title,
      url,
      project_id: projectId,
    });

    setLoading(false);
    setShowEditModal(false);
    fetchPages();
  };

  /* ================================
     DELETE PAGE
  ================================== */
  const deletePageFn = async (id) => {
    if (!confirm("Delete this page?")) return;
    await deleteDoc(doc(db, "pages", id));
    fetchPages();
  };

  /* ================================
     RENDER
  ================================== */
  return (
    <div className="text-white">
      <div className="flex justify-between mb-6 items-center">
        <h1 className="text-2xl font-bold text-black">Pages</h1>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-indigo-600 rounded-xl hover:bg-indigo-700"
        >
          + Add Page
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by title..."
        className="w-full px-4 py-3 mb-6 bg-[#0d1117] border border-gray-700 rounded-xl"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Pages List */}
      <div className="space-y-4">
        {filteredPages.length === 0 && (
          <p className="text-gray-400 text-center py-4">No pages found.</p>
        )}

        {filteredPages.map((p) => {
          const project = projects.find((proj) => proj.id === p.project_id);
          return (
            <div
              key={p.id}
              className="p-4 bg-[#1f2937] rounded-xl flex items-center justify-between"
            >
              <div>
                <h2 className="text-lg font-semibold">{p.title}</h2>
                <p className="text-gray-400">{p.url}</p>
                <p className="text-gray-500 text-sm">
                  Project: {project?.title || "—"}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(p)}
                  className="px-3 py-2 bg-blue-600 rounded-lg"
                >
                  Edit
                </button>
                <button
                  onClick={() => deletePageFn(p.id)}
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
        <PageModal
          title="Add Page"
          submitLabel="Create Page"
          loading={loading}
          onClose={() => setShowAddModal(false)}
          onSubmit={saveNewPage}
          fields={{
            title,
            url,
            projectId,
            setTitle,
            setUrl,
            setProjectId,
            projects,
          }}
        />
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <PageModal
          title="Edit Page"
          submitLabel="Save Changes"
          loading={loading}
          onClose={() => setShowEditModal(false)}
          onSubmit={saveEditPage}
          fields={{
            title,
            url,
            projectId,
            setTitle,
            setUrl,
            setProjectId,
            projects,
          }}
        />
      )}
    </div>
  );
}

/* ===========================================================
   MODAL COMPONENT
=========================================================== */
function PageModal({ title, submitLabel, loading, onClose, onSubmit, fields }) {
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

          {/* URL */}
          <div>
            <label className="block mb-1 text-gray-300">URL Example</label>
            <input
              className="w-full px-4 py-3 bg-[#0d1117] border border-gray-700 rounded-xl"
              value={fields.url}
              onChange={(e) => fields.setUrl(e.target.value)}
              placeholder="/example-page"
              required
            />
          </div>

          {/* PROJECT SELECT */}
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

          {/* ACTION BUTTONS */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 rounded-xl"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 rounded-xl">
              {loading ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
