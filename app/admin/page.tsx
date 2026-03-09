"use client";
import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

const CARDS = [
  { key: "warm_leads", label: "Warm Leads" },
  { key: "applications", label: "Applications" },
  { key: "walk_ins", label: "Walk-ins" },
  { key: "deposit", label: "Deposits" },
  { key: "shortlistings", label: "Shortlistings" },
  { key: "visa_approvals", label: "Visa Approvals" },
];

const ADMIN_PASSWORD = "admin123";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState("");
  const [entries, setEntries] = useState<any[]>([]);
  const [view, setView] = useState<"monthly" | "daily" | "yearly">("monthly");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedYear, setSelectedYear] = useState(() => {
    const now = new Date();
    return now.getMonth() >= 3 ? String(now.getFullYear()) : String(now.getFullYear() - 1);
  });

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
        <div className="bg-white rounded-xl shadow-md p-5 w-full max-w-xs border border-gray-100">
          <h1 className="text-lg font-bold text-gray-800 mb-1">Admin Login</h1>
          <p className="text-gray-400 text-xs mb-4">Enter password to continue</p>
          <input
            type="password"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-3 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
          <button onClick={handleLogin} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition text-sm">
            Login
          </button>
        </div>
      </div>
    );
  }

  const getSummary = (list: any[]) => {
    const totals: any = {};
    CARDS.forEach(c => totals[c.key] = 0);
    list.forEach(e => CARDS.forEach(c => {
      totals[c.key] += parseInt(e[c.key]?.count || "0");
    }));
    return totals;
  };

  const counselorNames = [...new Set(entries.map(e => e.counselor))].filter(Boolean) as string[];
  const monthEntries = entries.filter(e => e.date?.startsWith(selectedMonth));
  const dailyEntries = entries.filter(e => e.date === selectedDate);

  const fyStartYear = Number(selectedYear);
  const yearEntries = entries.filter(e => {
    if (!e.date) return false;
    const entryDate = new Date(e.date);
    const entryMonth = entryDate.getMonth();
    const entryYear = entryDate.getFullYear();
    return (entryYear === fyStartYear && entryMonth >= 3) ||
           (entryYear === fyStartYear + 1 && entryMonth < 3);
  });

  const CleanTable = ({ rows, showTotal, totalEntries }: { rows: { label: string; data: any }[]; showTotal: boolean; totalEntries: any[] }) => {
    const total = getSummary(totalEntries);
    return (
      <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto shadow-sm">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-green-50 border-b-2 border-green-100">
              <th className="text-left px-6 py-4 font-bold text-gray-700 w-48 whitespace-nowrap">
                {view === "yearly" ? "Month" : "Counselor"}
              </th>
              {CARDS.map(c => (
                <th key={c.key} className="text-center px-6 py-4 font-bold text-gray-700 border-l border-gray-100 whitespace-nowrap">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">No data available</td>
              </tr>
            )}
            {rows.map((row, idx) => (
              <tr key={row.label} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                <td className="px-6 py-4 font-bold text-gray-800 whitespace-nowrap">{row.label}</td>
                {CARDS.map(c => (
                  <td key={c.key} className="text-center px-6 py-4 font-bold text-gray-700 border-l border-gray-100">
                    {row.data[c.key] ?? 0}
                  </td>
                ))}
              </tr>
            ))}
            {showTotal && rows.length > 0 && (
              <tr className="bg-green-50 border-t-2 border-green-200">
                <td className="px-6 py-4 font-bold text-green-800">Total</td>
                {CARDS.map(c => (
                  <td key={c.key} className="text-center px-6 py-4 font-bold text-green-800 border-l border-green-100">
                    {total[c.key]}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const dailyRows = dailyEntries.map(e => ({ label: e.counselor, data: getSummary([e]) }));
  const monthlyRows = counselorNames.map(name => ({ label: name, data: getSummary(monthEntries.filter(e => e.counselor === name)) }));

  const yearlyRows = Array.from({ length: 12 }, (_, i) => {
    const monthIndex = (i + 3) % 12;
    const year = monthIndex < 3 ? fyStartYear + 1 : fyStartYear;
    const monthStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
    const mEntries = yearEntries.filter(e => e.date?.startsWith(monthStr));
    return {
      label: new Date(year, monthIndex, 1).toLocaleString("default", { month: "long", year: "numeric" }),
      data: getSummary(mEntries),
    };
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-800">Admin Dashboard</h1>
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
              {(["monthly", "daily", "yearly"] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition capitalize ${view === v ? "bg-white shadow text-green-700" : "text-gray-500"}`}>
                  {v}
                </button>
              ))}
            </div>
            <button onClick={() => setLoggedIn(false)} className="text-xs text-gray-400 hover:text-red-400">Logout</button>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-gray-600">
            {view === "monthly" && new Date(selectedMonth + "-01").toLocaleString("default", { month: "long", year: "numeric" })}
            {view === "daily" && selectedDate}
            {view === "yearly" && `FY ${fyStartYear}-${fyStartYear + 1} (Apr-Mar)`}
            {" "}- {view.charAt(0).toUpperCase() + view.slice(1)} Report
          </h2>
          {view === "monthly" && <input type="month" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />}
          {view === "daily" && <input type="date" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />}
          {view === "yearly" && (
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              {[2023, 2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={String(y)}>FY {y}-{y + 1}</option>
              ))}
            </select>
          )}
        </div>
        {view === "daily" && <CleanTable rows={dailyRows} showTotal={true} totalEntries={dailyEntries} />}
        {view === "monthly" && <CleanTable rows={monthlyRows} showTotal={true} totalEntries={monthEntries} />}
        {view === "yearly" && <CleanTable rows={yearlyRows} showTotal={true} totalEntries={yearEntries} />}
      </div>
    </div>
  );
}
