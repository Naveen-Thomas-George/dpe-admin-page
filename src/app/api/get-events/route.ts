import { NextResponse } from "next/server";

// Static events list as provided
const events = [
  { name: "100m", id: "SIDI01", category: "track" },
  { name: "200m", id: "SIDI02", category: "track" },
  { name: "400m", id: "SIDI03", category: "track" },
  { name: "800m", id: "SIDI04", category: "track" },
  { name: "1500m", id: "SIDI05", category: "track" },
  { name: "Shot Put", id: "SIDI07", category: "throw" },
  { name: "Discus Throw", id: "SIDI08", category: "throw" },
  { name: "Javelin Throw", id: "SIDI09", category: "throw" },
  { name: "Long Jump", id: "SIDI010", category: "jump" },
];

export async function GET() {
  try {
    return NextResponse.json({ events });
  } catch (error: any) {
    console.error("Get events error:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}
