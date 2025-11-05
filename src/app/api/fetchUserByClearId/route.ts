import { NextResponse } from "next/server";
import { DynamoDBClient, GetItemCommand, QueryCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({ region: "eu-north-1" });

export async function POST(req: Request) {
  try {
    const { identifier } = await req.json();

    if (!identifier) {
      return NextResponse.json({ error: "Missing identifier (CLEAR ID or Gmail)" }, { status: 400 });
    }

    let user;
    const isGmail = identifier.includes('@');

    if (isGmail) {
      // --- Gmail lookup: Scan table for matching christGmail ---
      // Note: Scanning is expensive, consider adding GSI for christGmail in production
      const scanCmd = new ScanCommand({
        TableName: "User-ao7ebzdnjvahrhfgmey6i6vzfu-NONE",
        FilterExpression: "christGmail = :gmail",
        ExpressionAttributeValues: {
          ":gmail": { S: identifier },
        },
      });

      const scanResult = await client.send(scanCmd);
      if (!scanResult.Items || scanResult.Items.length === 0) {
        return NextResponse.json({ error: "User not found with this Gmail" }, { status: 404 });
      }

      // Check for duplicates
      const duplicateCount = scanResult.Items.length;
      user = unmarshall(scanResult.Items[0]); // Use first match

      // Add duplicate warning to response
      if (duplicateCount > 1) {
        user.duplicateWarning = `Found ${duplicateCount} users with this Gmail. Showing first match.`;
      }
    } else {
      // --- CLEAR ID lookup ---
      const userCmd = new GetItemCommand({
        TableName: "User-ao7ebzdnjvahrhfgmey6i6vzfu-NONE",
        Key: { clearId: { S: identifier } },
      });

      const userData = await client.send(userCmd);
      if (!userData.Item) {
        return NextResponse.json({ error: "User not found with this CLEAR ID" }, { status: 404 });
      }
      user = unmarshall(userData.Item);
    }

    // --- 2️⃣ Fetch event registrations (FIXED: Added IndexName for GSI) ---
    const eventCmd = new QueryCommand({
      TableName: "IndividualRegistration-ao7ebzdnjvahrhfgmey6i6vzfu-NONE",
      // IMPORTANT: You must use a GSI to query on a non-primary key attribute.
      // Replace "clearId-index" with the actual name of your GSI if it is different.
      IndexName: "gsi-User.individualRegistrations",
      KeyConditionExpression: "playerClearId  = :id",
      ExpressionAttributeValues: {
        ":id": { S: user.clearId },
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

    // Remove duplicates and show only unique events
    const uniqueEvents = events
      .map((reg) => {
        const match = eventList.find((e) => e.id === reg.eventId);
        return match || { id: reg.eventId, name: "Unknown Event", category: "unknown" };
      })
      .filter((event, index, self) =>
        index === self.findIndex((e) => e.id === event.id)
      );

    // --- 4️⃣ Final Response ---
    return NextResponse.json({
      user,
      registeredEvents: uniqueEvents,
    });
  } catch (error) {
    console.error("Fetch user failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}