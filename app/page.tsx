"use client";
import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import {
  doc, setDoc, onSnapshot, collection
} from "firebase/firestore";

const CARDS = [
  { key: "shortlistings", label: "Shortlistings" },
  { key: "applications", label: "Applications" },
  { key: "deposit", label: "Deposit" },
  { key: "visa_approvals", label: "Visa Approvals" },
  { key: "warm_leads", label: "Warm Leads" },
  { key: "walk_ins", label: "Walk-ins" },
];

function getToday() {
  return new Date().toISOString().split("T")[0];
}

export default function Home() {
  const [name, setName] = useState("");
  const [submittedName, setSubmittedName] = useState("");
  const [data, setData] = useState({});
  const [saving, setSaving] = useState({});

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

  const handleUpdate = async (cardKey, field, value) => {
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
          <h1 className="text-2xl font-bold text-[#2d6a4f] mb-2">Welcome 👋</h1>
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
            className="w-full bg-[#52b788] hover:bg-[#40916c] text-white font-semibold py-3 rounded-lg transition"
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f5f0] p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#2d6a4f]">Hello, {submittedName} 👋</h1>
            <p className="text-gray-400 text-sm mt-1">Today: {getToday()}</p>
          </div>
          <button
            onClick={() => { localStorage.removeItem("counselorName"); setSubmittedName(""); }}
            className="text-sm text-gray-400 hover:text-red-400 underline"
          >
            Change Name
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CARDS.map((card, i) => (
            <div
              key={card.key}
              className="bg-white rounded-2xl shadow-sm border border-[#d8ead8] p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-[#2d6a4f] text-lg">{card.label}</h2>
                <span className="text-xs bg-[#d8f3dc] text-[#2d6a4f] px-2 py-1 rounded-full">
                  #{i + 1}
                </span>
              </div>

              <label className="text-xs text-gray-400 uppercase tracking-wide">Count</label>
              <input
                type="number"
                min="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 mb-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#74c69d]"
                placeholder="0"
                value={data[card.key]?.count || ""}
                onChange={(e) => handleUpdate(card.key, "count", e.target.value)}
              />

              <label className="text-xs text-gray-400 uppercase tracking-wide">Notes / Details</label>
              <textarea
                className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#74c69d] resize-none"
                rows={3}
                placeholder="Add details here..."
                value={data[card.key]?.notes || ""}
                onChange={(e) => handleUpdate(card.key, "notes", e.target.value)}
              />

              {saving[card.key] && (
                <p className="text-xs text-[#52b788] mt-1">Saving...</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}     