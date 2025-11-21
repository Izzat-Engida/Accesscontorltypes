import Link from "next/link";

const tiles = [
  { title: "Register & Verify", body: "Create an account protected by CAPTCHA and email verification.", href: "/register" },
  { title: "Login + MFA", body: "Sign in with password policies, OTP-based MFA and rule-based checks.", href: "/login" },
  { title: "Profile & Security", body: "Update profile, enable MFA, change password, and logout securely.", href: "/profile" },
  { title: "Documents Workspace", body: "Create, classify, share and review documents with MAC + DAC enforcement.", href: "/documents" },
  { title: "Leave & Payroll", body: "Trigger RuBAC leave approvals and ABAC-guarded salary data.", href: "/leave" },
  { title: "Admin Dashboard", body: "Manage users, roles, MFA states and attributes with auditing.", href: "/admin/dashboard" },
  { title: "Verify Email", body: "Complete pending email verification tokens sent after registration.", href: "/verify-email" },
];

export default function Home() {
  return (
    <section className="space-y-8">
      <div className="rounded-xl bg-white p-8 shadow">
        <h1 className="text-3xl font-semibold text-slate-900">Secure Access Control Project</h1>
        <p className="mt-4 text-slate-600">
          End-to-end demonstration of MAC, DAC, RBAC, RuBAC, ABAC, MFA, token-based authentication, auditing, and automated backups
          for Addis Ababa Science and Technology University &mdash; Computer System Security, Project Two.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {tiles.map((tile) => (
          <Link
            key={tile.title}
            href={tile.href}
            className="rounded-xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-lg"
          >
            <h2 className="text-xl font-semibold text-slate-900">{tile.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{tile.body}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
