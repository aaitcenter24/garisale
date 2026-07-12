import React from 'react';

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-slate-900 to-slate-950 text-slate-100 p-8 text-center font-sans">
      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-12 rounded-3xl max-w-xl shadow-2xl">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent mb-4 font-outfit tracking-tight">
          Garisale OS Admin Panel
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed mb-8">
          Admin Control Hub. Manage dealer accounts, monitor vehicle inventory, and orchestrate automation rules.
        </p>
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 text-xs">
          Control Center Initialized
        </div>
      </div>
    </div>
  );
}
