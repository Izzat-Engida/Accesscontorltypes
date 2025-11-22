"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import api from "../../api";

interface DocumentRecord {
  _id: string;
  title: string;
  content: string;
  sensitivityLevel: string;
  owner?: { name: string; email: string };
  sharedWith?: Array<{ user?: { name: string }; permission: string; grantedBy?: { name: string }; grantedAt?: string }>;
  createdAt: string;
  updatedAt: string;
}

export default function DocumentView() {
  const params = useParams<{ id: string }>();
  const [doc, setDoc] = useState<DocumentRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params?.id;
    if (!id) return;
    api
      .get(`/access/documents/${id}`)
      .then((res) => setDoc(res.data.document))
      .catch((err) => toast.error(err.response?.data?.message || "Unable to load document"))
      .finally(() => setLoading(false));
  }, [params?.id]);

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
            <span className="inline-flex rounded-full bg-blue-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-800">
              {doc.sensitivityLevel}
            </span>
          </div>
          <h1 className="mb-3 text-4xl font-bold text-slate-900">{doc.title}</h1>
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
        </header>
        
        <section className="prose prose-slate max-w-none">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
            <p className="whitespace-pre-wrap text-slate-800 leading-relaxed">{doc.content}</p>
          </div>
        </section>
      </div>

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
