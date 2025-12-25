"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../api";
import { getSession } from "next-auth/react";

type Permission = "read" | "write";

interface DocumentRecord {
  _id: string;
  title: string;
  content: string;
  sensitivityLevel: "Public" | "Internal" | "Confidential" | "TopSecret";
  owner?: { _id: string; name: string; email: string };
  sharedWith: Array<{
    user?: { _id: string; name: string; email: string };
    permission: Permission;
    grantedAt?: string;
    grantedBy?: { _id: string; name: string };
  }>;
  createdAt: string;
}

const levels: DocumentRecord["sensitivityLevel"][] = ["Public", "Internal", "Confidential", "TopSecret"];

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newDoc, setNewDoc] = useState({
    title: "",
    content: "",
    sensitivityLevel: "Internal" as DocumentRecord["sensitivityLevel"],
  });
  const [shareForms, setShareForms] = useState<Record<string, { email: string; permission: Permission }>>({});

  const fetchDocs = async () => {
    try {
      const session = await getSession();
      const token = session?.accessToken;
      const headers: Record<string, string> = {};
      
      // Only add Authorization header if token exists
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const res = await api.get<{ documents: DocumentRecord[] }>("/access/documents", {
        headers,
      });
      setDocs(res.data.documents || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const res = await api.post("/access/documents", newDoc);
      toast.success(res.data.message || "Document created");
      setNewDoc({ title: "", content: "", sensitivityLevel: "Internal" });
      fetchDocs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create document");
    } finally {
      setCreating(false);
    }
  };

  const handleShare = async (docId: string) => {
    const form = shareForms[docId];
    if (!form?.email) {
      toast.error("Email required to share");
      return;
    }
    try {
      const res = await api.post(`/access/documents/${docId}/share`, form);
      toast.success(res.data.message || "Access granted");
      fetchDocs();
      setShareForms((prev) => ({ ...prev, [docId]: { email: "", permission: "read" } }));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Share failed");
    }
  };

  const handleRevoke = async (docId: string, email: string) => {
    try {
      const res = await api.post(`/access/documents/${docId}/revoke`, { email });
      toast.success(res.data.message || "Access revoked");
      fetchDocs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Revoke failed");
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Document Management</h1>
            <p className="mt-1 text-sm text-slate-600">
              Create, classify, and share documents with advanced access controls
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold text-slate-900">Create New Document</h2>
        <form onSubmit={handleCreate} className="grid gap-6 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Document Title
            <input
              value={newDoc.title}
              onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Enter document title"
              required
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Classification Level
            <select
              value={newDoc.sensitivityLevel}
              onChange={(e) =>
                setNewDoc({ ...newDoc, sensitivityLevel: e.target.value as DocumentRecord["sensitivityLevel"] })
              }
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {levels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>
          <label className="md:col-span-2 text-sm font-medium text-slate-700">
            Content
            <textarea
              value={newDoc.content}
              onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={6}
              placeholder="Enter document content..."
              required
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:opacity-60 disabled:hover:scale-100"
            >
              {creating ? "Creating..." : "Create Document"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold text-slate-900">Your Documents</h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
              <p className="mt-4 text-sm text-slate-600">Loading documents...</p>
            </div>
          </div>
        ) : docs.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
            <p className="text-slate-600">No documents available. Create your first document above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Classification</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Owner</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Shared With</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {docs.map((doc) => (
                  <tr key={doc._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-900">{doc.title}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase text-blue-800">
                        {doc.sensitivityLevel}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">{doc.owner?.name || "System"}</td>
                    <td className="px-4 py-4">
                      {doc.sharedWith?.length ? (
                        <div className="space-y-1">
                          {doc.sharedWith.map((share) => (
                            <div key={`${share.user?._id}-${share.permission}`} className="flex items-center justify-between gap-2">
                              <span className="text-xs text-slate-600">
                                {share.user?.name || "Unknown"} <span className="text-slate-400">({share.permission})</span>
                              </span>
                              <button
                                className="rounded px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                                onClick={() => share.user?.email && handleRevoke(doc._id, share.user.email)}
                              >
                                Revoke
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Not shared</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-2">
                        <Link
                          href={`/documents/${doc._id}`}
                          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                        >
                          View
                        </Link>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                          <input
                            type="email"
                            placeholder="Enter email"
                            value={shareForms[doc._id]?.email || ""}
                            onChange={(e) =>
                              setShareForms((prev) => ({
                                ...prev,
                                [doc._id]: {
                                  ...(prev[doc._id] || { permission: "read" }),
                                  email: e.target.value,
                                },
                              }))
                            }
                            className="mb-2 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                          />
                          <select
                            value={shareForms[doc._id]?.permission || "read"}
                            onChange={(e) =>
                              setShareForms((prev) => ({
                                ...prev,
                                [doc._id]: {
                                  ...(prev[doc._id] || { email: "" }),
                                  permission: e.target.value as Permission,
                                },
                              }))
                            }
                            className="mb-2 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                          >
                            <option value="read">Read</option>
                            <option value="write">Write</option>
                          </select>
                          <button
                            onClick={() => handleShare(doc._id)}
                            className="w-full rounded bg-slate-900 px-2 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
                          >
                            Share
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
