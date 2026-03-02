"use client";
import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

const CARDS = [
  { key: "shortlistings", label: "Shortlistings" },
  { key: "applications", label: "Applications" },
  { key: "deposit", label: "Deposit" },
  { key: "visa_approvals", label: "Visa Approvals" },
  { key: "warm_leads", label: "Warm Leads" },
  { key: "walk_ins", label: "Walk-ins" },
];

const ADMIN_PASSWORD = "admin123";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState("");
  const [entries, setEntries] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState("");
  const [filterName, setFilterName] = useState("");

  useEffect(() => {
    if (!loggedIn) return;
    const q = collection(db, "entries");
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => d.data());
      setEntries(data);
    });
    return () => unsub();
  }, [loggedIn]);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setLoggedIn(true);
    } else {
      setError("Wrong password. Try again.");
    }
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f5f0]">
        <div className="bg-white rounded-2xl shadow-md p-10 w-full max-w-sm">
          <h1 className="text-2xl font-bold text-[#2d6a4f] mb-2">Admin Login 🔐</h1>
          <p className="text-gray-400 text-sm mb-6">Enter admin password to continue</p>
          <input
            type="password"
            className="w-full border border-gray-200 rounded-lg px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-[#74c69d]"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
          <button
            onClick={handleLogin}
            className="w-full bg-[#52b788] hover:bg-[#40916c] text-white font-semibold py-3 rounded-lg transition"
          >
            Login →
          </button>
        </div>
      </div>
    );
  }

  const filtered = entries.filter((e) => {
    const matchDate = filterDate ? e.date === filterDate : true;
    const matchName = filterName ? e.counselor?.toLowerCase().includes(filterName.toLowerCase()) : true;
    return matchDate && matchName;
  });

  const grouped: Record<string, any[]> = {};
  filtered.forEach((e) => {
    const key = e.date || "Unknown";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  });

  const sortedDates = Object.keys(grouped).sort((a, b) => (a > b ? -1 : 1));

  return (
    <div className="min-h-screen bg-[#f0f5f0] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#2d6a4f]">Admin Dashboard 📊</h1>
          <button onClick={() => setLoggedIn(false)} className="text-sm text-gray-400 hover:text-red-400 underline">Logout</button>
        </div>
        <div className="flex gap-4 mb-8 flex-wrap">
          <input type="date" className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#74c69d]" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
          <input type="text" placeholder="Filter by counselor name" className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#74c69d]" value={filterName} onChange={(e) => setFilterName(e.target.value)} />
          {(filterDate || filterName) && (
            <button onClick={() => { setFilterDate(""); setFilterName(""); }} className="text-sm text-gray-400 hover:text-red-400 underline">Clear Filters</button>
          )}
        </div>
        {sortedDates.length === 0 && <p className="text-gray-400 text-center mt-20">No entries found.</p>}
        {sortedDates.map((date) => (
          <div key={date} className="mb-10">
            <h2 className="text-lg font-semibold text-[#40916c] mb-4 border-b border-[#d8ead8] pb-2">📅 {date}</h2>
            <div className="space-y-6">
              {grouped[date].map((entry) => (
                <div key={entry.counselor + entry.date} className="bg-white rounded-2xl shadow-sm border border-[#d8ead8] p-5">
                  <h3 className="text-base font-bold text-[#2d6a4f] mb-4">👤 {entry.counselor}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {CARDS.map((card) => (
                      <div key={card.key} className="bg-[#f0f5f0] rounded-xl p-3">
                        <p className="text-xs font-semibold text-[#52b788] uppercase mb-1">{card.label}</p>
                        <p className="text-lg font-bold text-gray-700">{entry[card.key]?.count || 0}</p>
                        {entry[card.key]?.notes && <p className="text-xs text-gray-400 mt-1 break-words">{entry[card.key].notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
