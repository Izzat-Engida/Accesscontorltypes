"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import api from "../../api";
import { getSession } from "next-auth/react";

interface DocumentRecord {
  _id: string;
  title: string;
  content: string;
  sensitivityLevel: "Public" | "Internal" | "Confidential" | "TopSecret";
  owner?: { name: string; email: string };
  sharedWith?: Array<{
    user?: { name: string; email: string };
    permission: "read" | "write";
    grantedBy?: { name: string };
    grantedAt?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

const levels: DocumentRecord["sensitivityLevel"][] = ["Public", "Internal", "Confidential", "TopSecret"];

export default function DocumentView() {
  const params = useParams<{ id: string }>();
  const [doc, setDoc] = useState<DocumentRecord | null>(null);
  const [originalDoc, setOriginalDoc] = useState<DocumentRecord | null>(null); // for cancel
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const id = params?.id;
      if (!id) return;

      try {
        const [docRes, session] = await Promise.all([
          api.get(`/access/documents/${id}`),
          getSession(),
        ]);

        const loadedDoc = docRes.data.document;
        setDoc(loadedDoc);
        setOriginalDoc(loadedDoc);
        setCurrentUserEmail(session?.user?.email || null);

        // Check edit permission
        const isOwner = loadedDoc.owner?.email === session?.user?.email;
        const hasWrite = loadedDoc.sharedWith?.some(
          (s: any) => s.user?.email === session?.user?.email && s.permission === "write"
        );
        setCanEdit(isOwner || hasWrite);
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Unable to load document");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params?.id]);

  const handleSave = async () => {
    if (!doc || !originalDoc) return;

    try {
      setSaving(true);
      await api.put(`/access/documents/${doc._id}`, {
        title: doc.title,
        content: doc.content,
        sensitivityLevel: doc.sensitivityLevel,
      });
      toast.success("Document updated successfully");
      setOriginalDoc(doc); // update original after save
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDoc(originalDoc);
  };

  const hasChanges =
    doc &&
    originalDoc &&
    (doc.title !== originalDoc.title ||
      doc.content !== originalDoc.content ||
      doc.sensitivityLevel !== originalDoc.sensitivityLevel);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 text-sm text-slate-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-red-600">Document not found or access denied.</p>
      </div>
    );
  }

  return (
    <article className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <header className="mb-6 border-b border-slate-200 pb-6">
          <div className="mb-4 flex items-center gap-3">
            {canEdit ? (
              <select
                value={doc.sensitivityLevel}
                onChange={(e) =>
                  setDoc({ ...doc, sensitivityLevel: e.target.value as DocumentRecord["sensitivityLevel"] })
                }
                className="rounded-full bg-blue-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {levels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            ) : (
              <span className="inline-flex rounded-full bg-blue-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-800">
                {doc.sensitivityLevel}
              </span>
            )}
          </div>

          {canEdit ? (
            <input
              type="text"
              value={doc.title}
              onChange={(e) => setDoc({ ...doc, title: e.target.value })}
              className="mb-3 w-full text-4xl font-bold text-slate-900 bg-transparent border-b-2 border-transparent focus:border-blue-500 focus:outline-none"
            />
          ) : (
            <h1 className="mb-3 text-4xl font-bold text-slate-900">{doc.title}</h1>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Owner: {doc.owner?.name || "System"}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Updated {new Date(doc.updatedAt).toLocaleString()}</span>
            </div>
          </div>

          {/* Edit Controls */}
          {canEdit && (
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving || !hasChanges}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          )}
        </header>

        <section className="prose prose-slate max-w-none">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
            {canEdit ? (
              <textarea
                value={doc.content}
                onChange={(e) => setDoc({ ...doc, content: e.target.value })}
                rows={15}
                className="w-full resize-none rounded-lg border-0 bg-transparent p-0 text-slate-800 text-base leading-relaxed focus:outline-none focus:ring-0"
              />
            ) : (
              <p className="whitespace-pre-wrap text-slate-800 leading-relaxed">{doc.content}</p>
            )}
          </div>
        </section>
      </div>

      {/* Sharing Section (unchanged) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Sharing & Permissions</h2>
        {doc.sharedWith?.length ? (
          <div className="space-y-3">
            {doc.sharedWith.map((share, idx) => (
              <div key={`${share.user?.name}-${idx}`} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div>
                  <div className="font-medium text-slate-900">{share.user?.name || "Unknown"}</div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                    <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                      {share.permission}
                    </span>
                    {share.grantedBy && (
                      <span className="text-slate-500">
                        granted by {share.grantedBy.name}
                        {share.grantedAt && ` on ${new Date(share.grantedAt).toLocaleString()}`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="text-slate-500">This document is not shared with anyone else.</p>
          </div>
        )}
      </div>
    </article>
  );
}