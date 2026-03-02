"use client";
import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

const CARDS = [
  { key: "warm_leads", label: "Warm Leads" },
  { key: "walk_ins", label: "Walk-ins" },
  { key: "shortlistings", label: "Shortlistings" },
  { key: "applications", label: "Applications" },
  { key: "deposit", label: "Deposit" },
  { key: "visa_approvals", label: "Visa Approvals" },
];

const ADMIN_PASSWORD = "admin123";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState("");
  const [entries, setEntries] = useState([]);
  const [filterName, setFilterName] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [expandedCounselor, setExpandedCounselor] = useState(null);

  const years = Array.from({length: 3}, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    if (!loggedIn) return;
    const unsub = onSnapshot(collection(db, "entries"), (snap) => {
      setEntries(snap.docs.map((d) => d.data()));
    });
    return () => unsub();
  }, [loggedIn]);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) setLoggedIn(true);
    else setError("Wrong password. Try again.");
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f5f0]">
        <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm">
          <h1 className="text-xl font-bold text-[#1b4332] mb-1">Admin Login 🔐</h1>
          <p className="text-gray-400 text-xs mb-5">Enter password to continue</p>
          <input
            type="password"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#74c69d]"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
          <button onClick={handleLogin} className="w-full bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold py-2 rounded-lg text-sm transition">
            Login →
          </button>
        </div>
      </div>
    );
  }

  // Filter by month and year
  const filtered = entries.filter((e) => {
    if (!e.date) return false;
    const d = new Date(e.date);
    const matchMonth = d.getMonth() === selectedMonth;
    const matchYear = d.getFullYear() === selectedYear;
    const matchName = filterName ? e.counselor?.toLowerCase().includes(filterName.toLowerCase()) : true;
    return matchMonth && matchYear && matchName;
  });

  // Group by counselor and sum up monthly totals
  const counselorMap = {};
  filtered.forEach((e) => {
    if (!counselorMap[e.counselor]) {
      counselorMap[e.counselor] = { dates: {}, totals: {} };
      CARDS.forEach(c => counselorMap[e.counselor].totals[c.key] = 0);
    }
    counselorMap[e.counselor].dates[e.date] = e;
    CARDS.forEach(c => {
      const val = parseInt(e[c.key]?.count || 0);
      counselorMap[e.counselor].totals[c.key] += val;
    });
  });

  const counselors = Object.keys(counselorMap).sort();

  return (
    <div className="min-h-screen bg-[#f0f5f0]">
      {/* Header */}
      <div className="bg-white border-b border-[#d8ead8] px-4 py-3 flex items-center justify-between">
        <h1 className="text-base font-bold text-[#1b4332]">📊 Counselor Performance</h1>
        <button onClick={() => setLoggedIn(false)} className="text-xs text-gray-400 hover:text-red-400 underline">Logout</button>
      </div>

      <div className="p-4 max-w-7xl mx-auto">
        {/* Filters Row */}
        <div className="flex gap-2 mb-4 flex-wrap items-center">
          <select
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-[#1b4332] font-semibold focus:outline-none focus:ring-2 focus:ring-[#74c69d] bg-white"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>

          <select
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-[#1b4332] font-semibold focus:outline-none focus:ring-2 focus:ring-[#74c69d] bg-white"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <input
            type="text"
            placeholder="Search counselor..."
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#74c69d] bg-white"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
          />

          <span className="text-xs text-gray-400 ml-auto">{counselors.length} counselor(s) found</span>
        </div>

        {/* Column Headers */}
        {counselors.length > 0 && (
          <div className="grid grid-cols-8 gap-1 mb-1 px-2">
            <div className="col-span-2 text-xs font-bold text-[#1b4332]">Counselor</div>
            {CARDS.map(c => (
              <div key={c.key} className="text-xs font-bold text-[#1b4332] text-center">{c.label}</div>
            ))}
          </div>
        )}

        {/* Counselor Rows */}
        {counselors.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-20">No data for {MONTHS[selectedMonth]} {selectedYear}</div>
        )}

        <div className="space-y-1">
          {counselors.map((name) => {
            const { totals, dates } = counselorMap[name];
            const isExpanded = expandedCounselor === name;
            const sortedDates = Object.keys(dates).sort((a,b) => a > b ? -1 : 1);

            return (
              <div key={name} className="bg-white rounded-xl border border-[#d8ead8] overflow-hidden">
                {/* Summary Row */}
                <div
                  className="grid grid-cols-8 gap-1 px-2 py-2 cursor-pointer hover:bg-[#f0f5f0] items-center"
                  onClick={() => setExpandedCounselor(isExpanded ? null : name)}
                >
                  <div className="col-span-2 flex items-center gap-1">
                    <span className="text-xs font-bold text-[#1b4332]">👤 {name}</span>
                    <span className="text-xs text-gray-400">{isExpanded ? "▲" : "▼"}</span>
                  </div>
                  {CARDS.map(c => (
                    <div key={c.key} className="text-center">
                      <span className="text-sm font-bold text-[#2d6a4f]">{totals[c.key] || 0}</span>
                    </div>
                  ))}
                </div>

                {/* Expanded Daily Breakdown */}
                {isExpanded && (
                  <div className="border-t border-[#d8ead8] bg-[#f9fdf9]">
                    {sortedDates.map(date => (
                      <div key={date} className="grid grid-cols-8 gap-1 px-2 py-1.5 border-b border-[#eaf3ea] items-center">
                        <div className="col-span-2 text-xs text-gray-500 pl-4">📅 {date}</div>
                        {CARDS.map(c => (
                          <div key={c.key} className="text-center">
                            <span className="text-xs text-gray-600">{dates[date][c.key]?.count || 0}</span>
                            {dates[date][c.key]?.notes && (
                              <p className="text-xs text-gray-400 truncate max-w-full">{dates[date][c.key].notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
