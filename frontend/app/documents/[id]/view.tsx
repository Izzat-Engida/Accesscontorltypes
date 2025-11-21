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

  if (loading) return <div className="p-6 text-sm text-slate-600">Loading document...</div>;
  if (!doc) return <div className="p-6 text-sm text-slate-600">Document not found or access denied.</div>;

  return (
    <article className="space-y-4 rounded-xl bg-white p-6 shadow">
      <header>
        <p className="text-xs uppercase tracking-widest text-slate-500">{doc.sensitivityLevel}</p>
        <h1 className="text-3xl font-semibold text-slate-900">{doc.title}</h1>
        <p className="text-sm text-slate-600">
          Owner: {doc.owner?.name || "System"} • Last updated {new Date(doc.updatedAt).toLocaleString()}
        </p>
      </header>
      <section className="prose max-w-none text-slate-800">
        <p>{doc.content}</p>
      </section>
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Sharing</h2>
        {doc.sharedWith?.length ? (
          <ul className="mt-2 text-sm text-slate-600">
            {doc.sharedWith.map((share, idx) => (
              <li key={`${share.user?.name}-${idx}`}>
                {share.user?.name || "Unknown"} — {share.permission}
                {share.grantedBy && (
                  <span className="text-xs text-slate-500">
                    {" "}
                    (granted by {share.grantedBy.name}
                    {share.grantedAt ? ` on ${new Date(share.grantedAt).toLocaleString()}` : ""})
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Not shared with anyone else.</p>
        )}
      </section>
    </article>
  );
}
