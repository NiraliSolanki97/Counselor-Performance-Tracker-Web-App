$newContent = @'
"use client";
import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { doc, setDoc, onSnapshot, collection, query } from "firebase/firestore";

const CARDS = [
  { key: "warm_leads", label: "Warm Leads" },
  { key: "applications", label: "Applications" },
  { key: "walk_ins", label: "Walk-ins" },
  { key: "deposit", label: "Deposits" },
  { key: "shortlistings", label: "Shortlistings" },
  { key: "visa_approvals", label: "Visa Approvals" },
];

function getToday() {
  return new Date().toISOString().split("T")[0];
}

export default function Home() {
  const [name, setName] = useState("");
  const [submittedName, setSubmittedName] = useState("");
  const [data, setData] = useState<any>({});
  const [saved, setSaved] = useState(false);
  const [view, setView] = useState<"daily" | "monthly" | "yearly">("daily");
  const [allEntries, setAllEntries] = useState<any[]>([]);
  const today = getToday();
  const now = new Date();

  useEffect(() => {
    const savedName = localStorage.getItem("counselorName");
    if (savedName) setSubmittedName(savedName);
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

  const handleUpdate = (cardKey: string, field: string, value: string) => {
    const updated = {
      ...data,
      counselor: submittedName,
      date: today,
      [cardKey]: { ...(data[cardKey] || {}), [field]: value },
    };
    setData(updated);
    setSaved(false);
  };

  const handleSave = async () => {
    const docId = `${submittedName}_${today}`;
    await setDoc(doc(db, "entries", docId), data, { merge: true });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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
  const fyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const yearEntries = allEntries.filter(e => {
    if (!e.date) return false;
    const entryDate = new Date(e.date);
    const entryMonth = entryDate.getMonth();
    const entryYear = entryDate.getFullYear();
    return (entryYear === fyStartYear && entryMonth >= 3) ||
           (entryYear === fyStartYear + 1 && entryMonth < 3);
  });

  const monthlySummary = getSummary(monthEntries);
  const yearlySummary = getSummary(yearEntries);

  if (!submittedName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-xs border border-green-500">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Leap GeeBee" className="h-16 object-contain" />
          </div>
          <h1 className="text-lg font-bold text-white mb-1 text-center">Welcome 👋</h1>
          <p className="text-gray-400 text-xs mb-4 text-center">Enter your name to start tracking</p>
          <input
            className="w-full border border-green-500 rounded-lg px-3 py-2 text-white bg-gray-800 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-green-400 mb-3"
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
          />
          <button
            onClick={handleNameSubmit}
            className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-2 rounded-lg transition text-sm"
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gray-900 border-b border-green-500 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Leap GeeBee" className="h-16 object-contain" />
            <div>
              <h1 className="text-base font-bold text-white">{submittedName}</h1>
              <p className="text-xs text-gray-400">{today}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-black rounded-lg p-1 gap-1 border border-gray-700">
              {(["daily", "monthly", "yearly"] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition capitalize ${view === v ? "bg-green-500 text-black" : "text-gray-400 hover:text-white"}`}
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

      <div className="max-w-5xl mx-auto px-6 py-5">

        {/* Daily View */}
        {view === "daily" && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {CARDS.map((card) => (
                <div key={card.key} className="bg-gray-900 rounded-xl border border-gray-700 p-3">
                  <p className="text-xs font-bold text-green-400 uppercase tracking-wide mb-2">{card.label}</p>
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-gray-700 rounded-lg px-2 py-1.5 text-white bg-black font-bold text-sm focus:outline-none focus:ring-2 focus:ring-green-400 mb-2"
                    placeholder="0"
                    value={data[card.key]?.count || ""}
                    onChange={(e) => handleUpdate(card.key, "count", e.target.value)}
                  />
                  <textarea
                    className="w-full border border-gray-700 rounded-lg px-2 py-1.5 text-gray-300 bg-black text-xs focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                    rows={2}
                    placeholder="Notes..."
                    value={data[card.key]?.notes || ""}
                    onChange={(e) => handleUpdate(card.key, "notes", e.target.value)}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                className="bg-green-500 hover:bg-green-600 text-black font-bold px-6 py-2 rounded-lg transition text-sm"
              >
                Save
              </button>
              {saved && <p className="text-green-400 text-sm font-semibold">✅ Saved!</p>}
            </div>
          </>
        )}

        {/* Monthly View */}
        {view === "monthly" && (
          <div>
            <h2 className="text-sm font-bold text-gray-300 mb-4">
              {now.toLocaleString("default", { month: "long" })} {now.getFullYear()} — My Summary
            </h2>
            <div className="bg-gray-900 rounded-2xl border border-gray-700 overflow-x-auto shadow-sm mb-6">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-black border-b-2 border-green-500">
                    {CARDS.map(c => (
                      <th key={c.key} className="text-center px-6 py-3 font-bold text-green-400 border-r border-gray-700 whitespace-nowrap">{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {CARDS.map(c => (
                      <td key={c.key} className="text-center px-6 py-3 font-bold text-white border-r border-gray-700">{monthlySummary[c.key]}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Day by Day</h3>
            <div className="bg-gray-900 rounded-2xl border border-gray-700 overflow-x-auto shadow-sm">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-black border-b-2 border-green-500">
                    <th className="text-left px-6 py-3 font-bold text-green-400">Date</th>
                    {CARDS.map(c => (
                      <th key={c.key} className="text-center px-6 py-3 font-bold text-green-400 border-l border-gray-700 whitespace-nowrap">{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthEntries.sort((a, b) => a.date > b.date ? -1 : 1).map((e, idx) => (
                    <tr key={e.date} className={`border-b border-gray-700 ${idx % 2 === 0 ? "bg-gray-900" : "bg-black"}`}>
                      <td className="px-6 py-3 font-semibold text-gray-300">{e.date}</td>
                      {CARDS.map(c => (
                        <td key={c.key} className="text-center px-6 py-3 font-bold text-white border-l border-gray-700">{e[c.key]?.count || 0}</td>
                      ))}
                    </tr>
                  ))}
                  {monthEntries.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-500">No data this month</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Yearly View */}
        {view === "yearly" && (
          <div>
            <h2 className="text-sm font-bold text-gray-300 mb-4">FY {fyStartYear}-{fyStartYear + 1} (Apr-Mar) — My Summary</h2>
            <div className="bg-gray-900 rounded-2xl border border-gray-700 overflow-x-auto shadow-sm mb-6">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-black border-b-2 border-green-500">
                    {CARDS.map(c => (
                      <th key={c.key} className="text-center px-6 py-3 font-bold text-green-400 border-r border-gray-700 whitespace-nowrap">{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {CARDS.map(c => (
                      <td key={c.key} className="text-center px-6 py-3 font-bold text-white border-r border-gray-700">{yearlySummary[c.key]}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Month by Month</h3>
            <div className="bg-gray-900 rounded-2xl border border-gray-700 overflow-x-auto shadow-sm">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-black border-b-2 border-green-500">
                    <th className="text-left px-6 py-3 font-bold text-green-400">Month</th>
                    {CARDS.map(c => (
                      <th key={c.key} className="text-center px-6 py-3 font-bold text-green-400 border-l border-gray-700 whitespace-nowrap">{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 12 }, (_, i) => {
                    const monthIndex = (i + 3) % 12;
                    const year = monthIndex < 3 ? fyStartYear + 1 : fyStartYear;
                    const monthStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
                    const mEntries = yearEntries.filter(e => e.date?.startsWith(monthStr));
                    const mTotals = getSummary(mEntries);
                    return (
                      <tr key={monthStr} className={`border-b border-gray-700 ${i % 2 === 0 ? "bg-gray-900" : "bg-black"}`}>
                        <td className="px-6 py-3 font-semibold text-gray-300">
                          {new Date(year, monthIndex, 1).toLocaleString("default", { month: "long", year: "numeric" })}
                        </td>
                        {CARDS.map(c => (
                          <td key={c.key} className="text-center px-6 py-3 font-bold text-white border-l border-gray-700">{mTotals[c.key] || 0}</td>
                        ))}
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
'@
Set-Content -Path "app/page.tsx" -Value $newContent -Encoding UTF8
