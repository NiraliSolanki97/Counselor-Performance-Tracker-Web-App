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
  const [view, setView] = useState<"monthly" | "daily">("monthly");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
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
    entries.forEach(e => CARDS.forEach(c => {
      totals[c.key] += parseInt(e[c.key]?.count || "0");
    }));
    return totals;
  };

  const counselorNames = [...new Set(entries.map(e => e.counselor))].filter(Boolean) as string[];

  const monthEntries = entries.filter(e => e.date?.startsWith(selectedMonth));
  const dailyEntries = entries.filter(e => e.date === selectedDate);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-800">Admin Dashboard</h1>
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
              <button
                onClick={() => setView("monthly")}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${view === "monthly" ? "bg-white shadow text-green-700" : "text-gray-500"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setView("daily")}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${view === "daily" ? "bg-white shadow text-green-700" : "text-gray-500"}`}
              >
                Daily
              </button>
            </div>
            <button onClick={() => setLoggedIn(false)} className="text-xs text-gray-400 hover:text-red-400">Logout</button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">

        {/* MONTHLY VIEW — Default */}
        {view === "monthly" && (
          <div>
            {/* Month Picker */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-gray-600">
                {new Date(selectedMonth + "-01").toLocaleString("default", { month: "long", year: "numeric" })} — Counselor Summary
              </h2>
              <input
                type="month"
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-green-50 border-b-2 border-green-100">
                    <th className="text-left px-5 py-3 font-bold text-gray-700 w-40">Counselor</th>
                    {CARDS.map(c => (
                      <th key={c.key} className="text-center px-4 py-3 font-bold text-gray-700 border-l border-gray-100">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {counselorNames.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-gray-400">No data available</td>
                    </tr>
                  )}
                  {counselorNames.map((name, idx) => {
                    const s = getSummary(monthEntries.filter(e => e.counselor === name));
                    return (
                      <tr key={name} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                        <td className="px-5 py-3 font-bold text-gray-800">{name}</td>
                        {CARDS.map(c => (
                          <td key={c.key} className="text-center px-4 py-3 font-bold text-gray-800 border-l border-gray-100">
                            {s[c.key]}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                  {/* Total Row */}
                  {counselorNames.length > 0 && (() => {
                    const total = getSummary(monthEntries);
                    return (
                      <tr className="bg-green-50 border-t-2 border-green-200">
                        <td className="px-5 py-3 font-bold text-green-800">Total</td>
                        {CARDS.map(c => (
                          <td key={c.key} className="text-center px-4 py-3 font-bold text-green-800 border-l border-green-100">
                            {total[c.key]}
                          </td>
                        ))}
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DAILY VIEW */}
        {view === "daily" && (
          <div>
            {/* Date Picker */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-gray-600">
                {selectedDate} — Daily Report
              </h2>
              <input
                type="date"
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-green-50 border-b-2 border-green-100">
                    <th className="text-left px-5 py-3 font-bold text-gray-700 w-40">Counselor</th>
                    {CARDS.map(c => (
                      <th key={c.key} className="text-center px-4 py-3 font-bold text-gray-700 border-l border-gray-100">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dailyEntries.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-gray-400">No entries for this date</td>
                    </tr>
                  )}
                  {dailyEntries.map((entry, idx) => (
                    <tr key={entry.counselor} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                      <td className="px-5 py-3 font-bold text-gray-800">{entry.counselor}</td>
                      {CARDS.map(c => (
                        <td key={c.key} className="text-center px-4 py-3 font-bold text-gray-800 border-l border-gray-100">
                          {entry[c.key]?.count || 0}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {/* Total Row */}
                  {dailyEntries.length > 0 && (() => {
                    const total = getSummary(dailyEntries);
                    return (
                      <tr className="bg-green-50 border-t-2 border-green-200">
                        <td className="px-5 py-3 font-bold text-green-800">Total</td>
                        {CARDS.map(c => (
                          <td key={c.key} className="text-center px-4 py-3 font-bold text-green-800 border-l border-green-100">
                            {total[c.key]}
                          </td>
                        ))}
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
