"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";

interface Event {
  name: string;
  id: string;
  category: string;
}

export default function VerificationPage() {
  const [eventId, setEventId] = useState("");
  const [events, setEvents] = useState<Event[]>([]);

  const [searchType, setSearchType] = useState("regNumber");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);

  // Load events on component mount
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await fetch("/api/get-events");
        const data = await res.json();
        if (res.ok) {
          setEvents(data.events || []);
        }
      } catch (error) {
        console.error("Failed to load events:", error);
      }
    };
    loadEvents();
  }, []);

  // ============================================================
  // 🔍 SEARCH API CALL
  // ============================================================
  const searchParticipants = async (loadAll = false) => {
    setLoading(true);

    const bodyPayload = {
      action: "search",
      eventId,
      searchCriteria: loadAll
        ? null
        : {
            type: searchType,
            value: searchInput,
          },
    };

    try {
      const res = await fetch("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to load participants");
        setParticipants([]);
      } else {
        setParticipants(data.users || []);
      }
    } catch (err) {
      console.error("Search error:", err);
      alert("Error fetching participants");
    }

    setLoading(false);
  };

  // ============================================================
  // 🟢 UPDATE ATTENDANCE
  // ============================================================
  const updateAttendance = async (clearId: string, attendance: boolean) => {
    try {
      const res = await fetch("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "markAttendance",
          eventId,
          clearId,
          attendance,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update attendance");
        return;
      }

      // Update row UI
      setParticipants((prev) =>
        prev.map((p) =>
          p.clearId === clearId ? { ...p, attendance } : p
        )
      );
      toast.success(`Attendance ${attendance ? 'marked' : 'unmarked'} successfully`);
    } catch (err) {
      console.error("Attendance error:", err);
      toast.error("Failed to update attendance");
    }
  };

  // ============================================================
  // 🟢 UPDATE CHEST NUMBER (USER TABLE)
  // ============================================================
  const updateChestNumber = async (clearId: string, chestNo: string) => {
    try {
      const res = await fetch("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assignChestNumber",
          clearId,
          chestNumber: chestNo,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update chest number");
        return;
      }

      // Update UI
      setParticipants((prev) =>
        prev.map((p) =>
          p.clearId === clearId ? { ...p, chestNo } : p
        )
      );
      toast.success(`Chest number updated to ${chestNo}`);
    } catch (err) {
      console.error("Chest number error:", err);
      toast.error("Failed to update chest number");
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      {/* TITLE */}
      <h1 className="text-2xl font-bold text-center mb-6">Verify Participants</h1>

      {/* EVENT ID DROPDOWN */}
      <div className="mb-4 p-4 bg-white shadow rounded">
        <label className="block text-sm font-medium mb-2">Select Event</label>
        <select
          className="border p-2 rounded w-full"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
        >
          <option value="">Select an event...</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name} ({event.id}) - {event.category}
            </option>
          ))}
        </select>
      </div>

      {/* SEARCH BOX */}
      <div className="mb-4 p-4 bg-white shadow rounded">
        <div className="flex items-center gap-4">
          <select
            className="border p-2 rounded"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
          >
            <option value="regNumber">Reg Number</option>
            <option value="gmail">Gmail</option>
            <option value="name">Name</option>
          </select>

          <input
            type="text"
            placeholder="Search value…"
            className="border p-2 rounded flex-1"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />

          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            disabled={loading || !eventId}
            onClick={() => searchParticipants(false)}
          >
            Search
          </button>

          <button
            className="bg-gray-700 text-white px-4 py-2 rounded"
            disabled={loading || !eventId}
            onClick={() => searchParticipants(true)}
          >
            Load All Participants
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white shadow rounded p-4 overflow-auto">
        {loading ? (
          <p className="text-center py-6">Loading...</p>
        ) : participants.length === 0 ? (
          <p className="text-center py-6 text-gray-500">
            No participants found.
          </p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="p-2">Name</th>
                <th className="p-2">Reg Number</th>
                <th className="p-2">Gmail</th>
                <th className="p-2">Chest No</th>
                <th className="p-2">Attendance</th>
                <th className="p-2">Duplicates</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => (
                <tr key={p.clearId} className="border-t">
                  <td className="p-2">{p.fullName}</td>
                  <td className="p-2">{p.regNumber}</td>
                  <td className="p-2">{p.christGmail}</td>

                  {/* CHEST NUMBER INPUT */}
                  <td className="p-2">
                    <input
                      type="number"
                      className="border p-1 rounded w-24"
                      value={p.chestNo || ""}
                      onChange={(e) =>
                        updateChestNumber(p.clearId, e.target.value)
                      }
                    />
                  </td>

                  {/* ATTENDANCE TOGGLE */}
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={p.attendance}
                      onChange={(e) =>
                        updateAttendance(p.clearId, e.target.checked)
                      }
                    />
                  </td>

                  <td className="p-2 text-red-600 font-bold">
                    {p.duplicates > 0 ? p.duplicates : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
