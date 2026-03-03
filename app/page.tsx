"use client";
import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { doc, setDoc, onSnapshot, collection, query } from "firebase/firestore";

const CARDS = [
  { key: "warm_leads", label: "Warm Leads" },
  { key: "walk_ins", label: "Walk-ins" },
  { key: "shortlistings", label: "Shortlistings" },
  { key: "applications", label: "Applications" },
  { key: "deposit", label: "Deposits" },
  { key: "visa_approvals", label: "Visa Approvals" },
];

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getMonthDates(year: number, month: number) {
  const dates = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    dates.push(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

export default function Home() {
  const [name, setName] = useState("");
  const [submittedName, setSubmittedName] = useState("");
  const [data, setData] = useState<any>({});
  const [saving, setSaving] = useState<any>({});
  const [view, setView] = useState<"daily" | "monthly" | "yearly">("daily");
  const [allEntries, setAllEntries] = useState<any[]>([]);
  const today = getToday();
  const now = new Date();

  useEffect(() => {
    const saved = localStorage.getItem("counselorName");
    if (saved) setSubmittedName(saved);
  }, []);

  useEffect(() => {
    if (!submittedName) return;
    const docRef = doc(db, "entries", `${submittedName}_${today}`);
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) setData(snap.data());
    });
    return () => unsub();
  }, [submittedName]);

  useEffect(() => {
    if (!submittedName) return;
    const q = query(collection(db, "entries"));
    const unsub = onSnapshot(q, (snap) => {
      const entries = snap.docs.map(d => d.data()).filter(d => d.counselor === submittedName);
      setAllEntries(entries);
    });
    return () => unsub();
  }, [submittedName]);

  const handleNameSubmit = () => {
    if (!name.trim()) return;
    localStorage.setItem("counselorName", name.trim());
    setSubmittedName(name.trim());
  };

  const handleUpdate = async (cardKey: string, field: string, value: string) => {
    const docId = `${submittedName}_${today}`;
    const updated = {
      ...data,
      counselor: submittedName,
      date: today,
      [cardKey]: { ...(data[cardKey] || {}), [field]: value },
    };
    setData(updated);
    setSaving((s: any) => ({ ...s, [cardKey]: true }));
    await setDoc(doc(db, "entries", docId), updated, { merge: true });
    setSaving((s: any) => ({ ...s, [cardKey]: false }));
  };

  const getSummary = (entries: any[]) => {
    const totals: any = {};
    CARDS.forEach(c => totals[c.key] = 0);
    entries.forEach(e => {
      CARDS.forEach(c => {
        totals[c.key] += parseInt(e[c.key]?.count || "0");
      });
    });
    return totals;
  };

  const monthEntries = allEntries.filter(e => e.date?.startsWith(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`));
  const yearEntries = allEntries.filter(e => e.date?.startsWith(`${now.getFullYear()}`));
  const monthlySummary = getSummary(monthEntries);
  const yearlySummary = getSummary(yearEntries);

  if (!submittedName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md border border-gray-100">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Welcome 👋</h1>
            <p className="text-gray-400 text-sm mt-1">Enter your name to start tracking</p>
          </div>
          <input
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-green-400 mb-4"
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
          />
          <button
            onClick={handleNameSubmit}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition"
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-800">{submittedName}</h1>
            <p className="text-xs text-gray-400">{today}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
              {(["daily", "monthly", "yearly"] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition capitalize ${view === v ? "bg-white shadow text-green-700" : "text-gray-500"}`}
                >
                  {v}
                </button>
              ))}
            </div>
            <button
              onClick={() => { localStorage.removeItem("counselorName"); setSubmittedName(""); }}
              className="text-xs text-gray-400 hover:text-red-400"
            >
              Change
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Daily View */}
        {view === "daily" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {CARDS.map((card) => (
              <div key={card.key} className="bg-white rounded-xl border border-gray-200 p-3">
                <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2">{card.label}</p>
                <input
                  type="number"
                  min="0"
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-gray-800 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-green-300 mb-2"
                  placeholder="0"
                  value={data[card.key]?.count || ""}
                  onChange={(e) => handleUpdate(card.key, "count", e.target.value)}
                />
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 text-xs focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
                  rows={2}
                  placeholder="Notes..."
                  value={data[card.key]?.notes || ""}
                  onChange={(e) => handleUpdate(card.key, "notes", e.target.value)}
                />
                {saving[card.key] && <p className="text-xs text-green-500 mt-1">Saving...</p>}
              </div>
            ))}
          </div>
        )}

        {/* Monthly View */}
        {view === "monthly" && (
          <div>
            <h2 className="text-base font-bold text-gray-700 mb-4">
              {now.toLocaleString("default", { month: "long" })} {now.getFullYear()} — Summary
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
              {CARDS.map(card => (
                <div key={card.key} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                  <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{monthlySummary[card.key]}</p>
                </div>
              ))}
            </div>
            <h3 className="text-sm font-bold text-gray-600 mb-3">Day by Day</h3>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-3 py-2 font-bold text-gray-600">Date</th>
                    {CARDS.map(c => <th key={c.key} className="text-center px-2 py-2 font-bold text-gray-600">{c.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {monthEntries.sort((a, b) => a.date > b.date ? -1 : 1).map(e => (
                    <tr key={e.date} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 font-semibold text-gray-700">{e.date}</td>
                      {CARDS.map(c => <td key={c.key} className="text-center px-2 py-2 font-bold text-gray-800">{e[c.key]?.count || 0}</td>)}
                    </tr>
                  ))}
                  {monthEntries.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-6 text-gray-400">No data this month</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Yearly View */}
        {view === "yearly" && (
          <div>
            <h2 className="text-base font-bold text-gray-700 mb-4">{now.getFullYear()} — Yearly Summary</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
              {CARDS.map(card => (
                <div key={card.key} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                  <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{yearlySummary[card.key]}</p>
                </div>
              ))}
            </div>
            <h3 className="text-sm font-bold text-gray-600 mb-3">Month by Month</h3>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-3 py-2 font-bold text-gray-600">Month</th>
                    {CARDS.map(c => <th key={c.key} className="text-center px-2 py-2 font-bold text-gray-600">{c.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({length: 12}, (_, i) => {
                    const monthStr = `${now.getFullYear()}-${String(i + 1).padStart(2, "0")}`;
                    const mEntries = yearEntries.filter(e => e.date?.startsWith(monthStr));
                    const mTotals = getSummary(mEntries);
                    const monthName = new Date(now.getFullYear(), i, 1).toLocaleString("default", { month: "short" });
                    return (
                      <tr key={monthStr} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2 font-semibold text-gray-700">{monthName}</td>
                        {CARDS.map(c => <td key={c.key} className="text-center px-2 py-2 font-bold text-gray-800">{mTotals[c.key] || 0}</td>)}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
