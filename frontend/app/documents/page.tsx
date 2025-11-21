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
    <div className="space-y-8 p-6">
      <section className="rounded-xl bg-white p-6 shadow">
        <h1 className="text-2xl font-semibold text-slate-900">Documents workspace</h1>
        <p className="mt-2 text-sm text-slate-600">
          Demonstrates MAC classification, DAC sharing, and end-to-end auditing for every action.
        </p>
      </section>

      <section className="rounded-xl bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-slate-900">Create classified document</h2>
        <form onSubmit={handleCreate} className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Title
            <input
              value={newDoc.title}
              onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
              className="mt-1 w-full rounded border border-slate-300 p-2"
              required
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Classification
            <select
              value={newDoc.sensitivityLevel}
              onChange={(e) =>
                setNewDoc({ ...newDoc, sensitivityLevel: e.target.value as DocumentRecord["sensitivityLevel"] })
              }
              className="mt-1 w-full rounded border border-slate-300 p-2"
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
              className="mt-1 w-full rounded border border-slate-300 p-2"
              rows={4}
              required
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {creating ? "Classifying..." : "Create document"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-slate-900">Accessible documents</h2>
        {loading ? (
          <p className="mt-4 text-sm text-slate-600">Loading documents...</p>
        ) : docs.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No documents matched your clearance.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full table-auto border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 text-left">
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Classification</th>
                  <th className="px-4 py-2">Owner</th>
                  <th className="px-4 py-2">Shared with</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((doc) => (
                  <tr key={doc._id} className="border-t">
                    <td className="px-4 py-2 font-semibold text-slate-900">{doc.title}</td>
                    <td className="px-4 py-2">
                      <span className="rounded bg-slate-900/10 px-2 py-1 text-xs font-semibold uppercase text-slate-900">
                        {doc.sensitivityLevel}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-600">{doc.owner?.name || "System"}</td>
                    <td className="px-4 py-2 text-slate-600">
                      {doc.sharedWith?.length
                        ? doc.sharedWith.map((share) => (
                            <div key={`${share.user?._id}-${share.permission}`} className="flex items-center justify-between">
                              <span className="text-xs">
                                {share.user?.name || "Unknown"} ({share.permission})
                                {share.grantedBy && (
                                  <span className="text-slate-400"> via {share.grantedBy.name}</span>
                                )}
                              </span>
                              <button
                                className="text-xs text-red-600 hover:underline"
                                onClick={() => share.user?.email && handleRevoke(doc._id, share.user.email)}
                              >
                                revoke
                              </button>
                            </div>
                          ))
                        : "—"}
                    </td>
                    <td className="space-y-2 px-4 py-2">
                      <Link href={`/documents/${doc._id}/view`} className="text-blue-600 underline">
                        View
                      </Link>
                      <div className="rounded border border-slate-200 p-2">
                        <input
                          type="email"
                          placeholder="Email"
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
                          className="mb-2 w-full rounded border border-slate-200 p-1 text-xs"
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
                          className="mb-2 w-full rounded border border-slate-200 p-1 text-xs"
                        >
                          <option value="read">Read</option>
                          <option value="write">Write</option>
                        </select>
                        <button
                          onClick={() => handleShare(doc._id)}
                          className="w-full rounded bg-slate-900 px-2 py-1 text-xs font-semibold text-white"
                        >
                          Share
                        </button>
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
