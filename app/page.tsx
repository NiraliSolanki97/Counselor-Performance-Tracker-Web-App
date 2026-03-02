"use client";
import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

const CARDS = [
  { key: "warm_leads", label: "Warm Leads" },
  { key: "walk_ins", label: "Walk-ins" },
  { key: "shortlistings", label: "Shortlistings" },
  { key: "applications", label: "Applications" },
  { key: "deposit", label: "Deposit" },
  { key: "visa_approvals", label: "Visa Approvals" },
];

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export default function Home() {
  const [name, setName] = useState("");
  const [submittedName, setSubmittedName] = useState("");
  const [data, setData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const saved = localStorage.getItem("counselorName");
    if (saved) setSubmittedName(saved);
  }, []);

  useEffect(() => {
    if (!submittedName) return;
    const today = getToday();
    const docRef = doc(db, "entries", `${submittedName}_${today}`);
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) setData(snap.data());
    });
    return () => unsub();
  }, [submittedName]);

  const handleNameSubmit = () => {
    if (!name.trim()) return;
    localStorage.setItem("counselorName", name.trim());
    setSubmittedName(name.trim());
  };

  const handleUpdate = async (cardKey: string, field: string, value: string) => {
    const today = getToday();
    const docId = `${submittedName}_${today}`;
    const updated = {
      ...data,
      counselor: submittedName,
      date: today,
      [cardKey]: {
        ...(data[cardKey] || {}),
        [field]: value,
      },
    };
    setData(updated);
    setSaving((s) => ({ ...s, [cardKey]: true }));
    await setDoc(doc(db, "entries", docId), updated, { merge: true });
    setSaving((s) => ({ ...s, [cardKey]: false }));
  };

  if (!submittedName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f5f0]">
        <div className="bg-white rounded-2xl shadow-md p-10 w-full max-w-md">
          <h1 className="text-2xl font-bold text-[#1b4332] mb-2">Welcome 👋</h1>
          <p className="text-gray-500 mb-6">Please enter your name to continue</p>
          <input
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#74c69d] mb-4"
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
          />
          <button
            onClick={handleNameSubmit}
            className="w-full bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold py-3 rounded-lg transition"
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f5f0] p-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-[#1b4332]">Hello, {submittedName} 👋</h1>
            <p className="text-gray-400 text-xs mt-1">Today: {getToday()}</p>
          </div>
          <button
            onClick={() => { localStorage.removeItem("counselorName"); setSubmittedName(""); }}
            className="text-xs text-gray-400 hover:text-red-400 underline"
          >
            Change Name
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CARDS.map((card, i) => (
            <div key={card.key} className="bg-white rounded-xl border border-[#d8ead8] p-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-[#1b4332] text-xs">{card.label}</h2>
                <span className="text-xs bg-[#d8f3dc] text-[#1b4332] px-1.5 py-0.5 rounded-full">#{i + 1}</span>
              </div>
              <input
                type="number"
                min="0"
                className="w-full border border-gray-200 rounded px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#74c69d] mb-2"
                placeholder="0"
                value={data[card.key]?.count || ""}
                onChange={(e) => handleUpdate(card.key, "count", e.target.value)}
              />
              <textarea
                className="w-full border border-gray-200 rounded px-2 py-1 text-gray-700 text-xs focus:outline-none focus:ring-1 focus:ring-[#74c69d] resize-none"
                rows={2}
                placeholder="Notes..."
                value={data[card.key]?.notes || ""}
                onChange={(e) => handleUpdate(card.key, "notes", e.target.value)}
              />
              {saving[card.key] && <p className="text-xs text-[#52b788] mt-1">Saving...</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
