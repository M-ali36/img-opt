"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase/config";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [logo, setLogo] = useState("");

  // For editing
  const [editingId, setEditingId] = useState(null);

  // Load all projects
  const fetchProjects = async () => {
    const snap = await getDocs(collection(db, "projects"));
    const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setProjects(list);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Open Edit Modal
  const openEditModal = async (id) => {
    setEditingId(id);

    const snap = await getDoc(doc(db, "projects", id));
    const data = snap.data();

    if (!data) return;

    setTitle(data.title);
    setUrl(data.url);
    setLogo(data.logo);

    setShowEditModal(true);
  };

  // Add Project
  const addProject = async (e) => {
    e.preventDefault();
    setLoading(true);

    await addDoc(collection(db, "projects"), {
      title,
      url,
      logo,
      createdAt: serverTimestamp(),
    });

    setLoading(false);
    setShowAddModal(false);
    setTitle("");
    setUrl("");
    setLogo("");
    fetchProjects();
  };

  // Save Project
  const saveEditProject = async (e) => {
    e.preventDefault();
    setLoading(true);

    await updateDoc(doc(db, "projects", editingId), {
      title,
      url,
      logo,
    });

    setLoading(false);
    setShowEditModal(false);
    setTitle("");
    setUrl("");
    setLogo("");
    fetchProjects();
  };

  // Delete Project
  const deleteProject = async (id) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    await deleteDoc(doc(db, "projects", id));
    fetchProjects();
  };

  return (
    <div className="text-white">
      {/* Header */}
      <div className="flex justify-between mb-6 items-center">
        <h1 className="text-2xl font-bold text-black">Projects</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-indigo-600 rounded-xl hover:bg-indigo-700"
        >
          + Add Project
        </button>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="p-4 bg-[#1f2937] rounded-xl flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <img
                src={project.logo}
                className="w-12 h-12 rounded-lg object-cover"
                alt=""
              />
              <div>
                <h2 className="text-lg font-semibold">{project.title}</h2>
                <p className="text-gray-400">{project.url}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => openEditModal(project.id)}
                className="px-3 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Edit
              </button>

              <button
                onClick={() => deleteProject(project.id)}
                className="px-3 py-2 bg-red-600 rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ADD MODAL */}
      {showAddModal && (
        <Modal
          title="Add Project"
          submitLabel="Save"
          loading={loading}
          onClose={() => setShowAddModal(false)}
          onSubmit={addProject}
          fields={{ title, url, logo, setTitle, setUrl, setLogo }}
        />
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <Modal
          title="Edit Project"
          submitLabel="Save Changes"
          loading={loading}
          onClose={() => setShowEditModal(false)}
          onSubmit={saveEditProject}
          fields={{ title, url, logo, setTitle, setUrl, setLogo }}
        />
      )}
    </div>
  );
}

// ----------------------
// Modal Component
// ----------------------
function Modal({ title, submitLabel, loading, onClose, onSubmit, fields }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#161b22] w-full max-w-lg p-6 rounded-xl border border-gray-700 shadow-lg">
        <h2 className="text-xl font-bold mb-6">{title}</h2>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block mb-1 text-gray-300">Title</label>
            <input
              className="w-full px-4 py-3 bg-[#0d1117] border border-gray-700 rounded-xl"
              value={fields.title}
              onChange={(e) => fields.setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-300">URL</label>
            <input
              className="w-full px-4 py-3 bg-[#0d1117] border border-gray-700 rounded-xl"
              value={fields.url}
              onChange={(e) => fields.setUrl(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-300">Logo URL</label>
            <input
              className="w-full px-4 py-3 bg-[#0d1117] border border-gray-700 rounded-xl"
              value={fields.logo}
              onChange={(e) => fields.setLogo(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 rounded-xl hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 rounded-xl hover:bg-indigo-700"
            >
              {loading ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
