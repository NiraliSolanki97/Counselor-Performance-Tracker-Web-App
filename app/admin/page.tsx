"use client";
import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

const CARDS = [
  { key: "warm_leads", label: "Warm Leads" },
  { key: "walk_ins", label: "Walk-ins" },
  { key: "shortlistings", label: "Shortlistings" },
  { key: "applications", label: "Applications" },
  { key: "deposit", label: "Deposits" },
  { key: "visa_approvals", label: "Visa Approvals" },
];

const ADMIN_PASSWORD = "admin123";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState("");
  const [entries, setEntries] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState("");
  const [filterName, setFilterName] = useState("");
  const [view, setView] = useState<"daily" | "monthly" | "yearly">("daily");
  const now = new Date();

  useEffect(() => {
    if (!loggedIn) return;
    const unsub = onSnapshot(collection(db, "entries"), (snap) => {
      setEntries(snap.docs.map((d) => d.data()));
    });
    return () => unsub();
  }, [loggedIn]);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) setLoggedIn(true);
    else setError("Wrong password.");
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm border border-gray-100">
          <h1 className="text-xl font-bold text-gray-800 mb-1">Admin Login 🔐</h1>
          <p className="text-gray-400 text-sm mb-6">Enter password to continue</p>
          <input
            type="password"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-3 font-medium focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
          <button onClick={handleLogin} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition">
            Login →
          </button>
        </div>
      </div>
    );
  }

  const getSummary = (entries: any[]) => {
    const totals: any = {};
    CARDS.forEach(c => totals[c.key] = 0);
    entries.forEach(e => CARDS.forEach(c => { totals[c.key] += parseInt(e[c.key]?.count || "0"); }));
    return totals;
  };

  const filtered = entries.filter(e => {
    const matchDate = filterDate ? e.date === filterDate : true;
    const matchName = filterName ? e.counselor?.toLowerCase().includes(filterName.toLowerCase()) : true;
    return matchDate && matchName;
  });

  const grouped: Record<string, any[]> = {};
  filtered.forEach(e => {
    const key = e.date || "Unknown";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  });
  const sortedDates = Object.keys(grouped).sort((a, b) => a > b ? -1 : 1);

  // Monthly data
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthEntries = entries.filter(e => e.date?.startsWith(monthStr));
  const counselorNames = [...new Set(entries.map(e => e.counselor))].filter(Boolean);

  const getMonthlyCounselorSummary = (name: string) => {
    return getSummary(monthEntries.filter(e => e.counselor === name));
  };

  const getYearlyCounselorSummary = (name: string) => {
    const yearEntries = entries.filter(e => e.date?.startsWith(`${now.getFullYear()}`) && e.counselor === name);
    return getSummary(yearEntries);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-800">Admin Dashboard</h1>
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
              {(["daily", "monthly", "yearly"] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition capitalize ${view === v ? "bg-white shadow text-green-700" : "text-gray-500"}`}>
                  {v}
                </button>
              ))}
            </div>
            <button onClick={() => setLoggedIn(false)} className="text-xs text-gray-400 hover:text-red-400">Logout</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Daily View */}
        {view === "daily" && (
          <>
            <div className="flex gap-3 mb-5 flex-wrap">
              <input type="date" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
              <input type="text" placeholder="Search counselor..." className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" value={filterName} onChange={(e) => setFilterName(e.target.value)} />
              {(filterDate || filterName) && <button onClick={() => { setFilterDate(""); setFilterName(""); }} className="text-xs text-gray-400 hover:text-red-400">Clear</button>}
            </div>

            {sortedDates.length === 0 && <p className="text-gray-400 text-center mt-20">No entries found.</p>}

            {sortedDates.map(date => (
              <div key={date} className="mb-6">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">📅 {date}</p>
                <div className="space-y-2">
                  {grouped[date].map(entry => (
                    <div key={entry.counselor + entry.date} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                      <div className="flex items-center gap-6">
                        <p className="text-sm font-bold text-gray-800 w-28 shrink-0">👤 {entry.counselor}</p>
                        <div className="flex gap-4 flex-wrap">
                          {CARDS.map(card => (
                            <div key={card.key} className="text-center min-w-[60px]">
                              <p className="text-xs text-gray-400 font-medium">{card.label}</p>
                              <p className="text-base font-bold text-gray-800">{entry[card.key]?.count || 0}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Monthly View */}
        {view === "monthly" && (
          <div>
            <h2 className="text-base font-bold text-gray-700 mb-4">
              {now.toLocaleString("default", { month: "long" })} {now.getFullYear()} — All Counselors
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-bold text-gray-600">Counselor</th>
                    {CARDS.map(c => <th key={c.key} className="text-center px-3 py-3 font-bold text-gray-600">{c.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {counselorNames.map(name => {
                    const s = getMonthlyCounselorSummary(name);
                    return (
                      <tr key={name} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-bold text-gray-800">{name}</td>
                        {CARDS.map(c => <td key={c.key} className="text-center px-3 py-3 font-bold text-gray-800">{s[c.key]}</td>)}
                      </tr>
                    );
                  })}
                  {counselorNames.length === 0 && <tr><td colSpan={7} className="text-center py-6 text-gray-400">No data</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Yearly View */}
        {view === "yearly" && (
          <div>
            <h2 className="text-base font-bold text-gray-700 mb-4">{now.getFullYear()} — Yearly Summary</h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-bold text-gray-600">Counselor</th>
                    {CARDS.map(c => <th key={c.key} className="text-center px-3 py-3 font-bold text-gray-600">{c.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {counselorNames.map(name => {
                    const s = getYearlyCounselorSummary(name);
                    return (
                      <tr key={name} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-bold text-gray-800">{name}</td>
                        {CARDS.map(c => <td key={c.key} className="text-center px-3 py-3 font-bold text-gray-800">{s[c.key]}</td>)}
                      </tr>
                    );
                  })}
                  {counselorNames.length === 0 && <tr><td colSpan={7} className="text-center py-6 text-gray-400">No data</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
