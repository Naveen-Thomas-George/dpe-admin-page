import { NextResponse } from "next/server";
import { DynamoDBClient, GetItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({ region: "eu-north-1" });

export async function POST(req: Request) {
  try {
    const { clearId } = await req.json();

    if (!clearId) {
      return NextResponse.json({ error: "Missing CLEAR ID" }, { status: 400 });
    }

    // --- 1️⃣ Fetch user info ---
    const userCmd = new GetItemCommand({
      TableName: "User-ao7ebzdnjvahrhfgmey6i6vzfu-NONE",
      Key: { CLEAR_ID: { S: clearId } },
    });

    const userData = await client.send(userCmd);
    if (!userData.Item) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const user = unmarshall(userData.Item);

    // --- 2️⃣ Fetch event registrations ---
    const eventCmd = new QueryCommand({
      TableName: "IndividualRegistration-ao7ebzdnjvahrhfgmey6i6vzfu-NONE",
      KeyConditionExpression: "CLEAR_ID = :id",
      ExpressionAttributeValues: {
        ":id": { S: clearId },
      },
    });

    const eventData = await client.send(eventCmd);
    const events = eventData.Items ? eventData.Items.map((i) => unmarshall(i)) : [];

    // --- 3️⃣ Map events with IDs to full event info ---
    const eventList = [
      { name: "100m", id: "SIDI01", category: "track" },
      { name: "200m", id: "SIDI02", category: "track" },
      { name: "400m", id: "SIDI03", category: "track" },
      { name: "800m", id: "SIDI04", category: "track" },
      { name: "1500m", id: "SIDI05", category: "track" },
      { name: "3000m", id: "SIDI06", category: "track" },
      { name: "Shot Put", id: "SIDI07", category: "throw" },
      { name: "Discus Throw", id: "SIDI08", category: "throw" },
      { name: "Javelin Throw", id: "SIDI09", category: "throw" },
      { name: "Long Jump", id: "SIDI010", category: "jump" },
    ];

    const userEvents = events.map((reg) => {
      const match = eventList.find((e) => e.id === reg.eventId);
      return match || { id: reg.eventId, name: "Unknown Event", category: "unknown" };
    });

    // --- 4️⃣ Final Response ---
    return NextResponse.json({
      user,
      registeredEvents: userEvents,
    });
  } catch (error) {
    console.error("Fetch user failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
