import { NextResponse } from "next/server";
import { DynamoDBClient, GetItemCommand, QueryCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

/**
 * DynamoDB Client Setup
 * Automatically reads credentials from environment variables.
 * Make sure these are defined in your .env.local (for local) and Vercel dashboard (for production):
 * 
 * AWS_REGION=eu-north-1
 * AWS_ACCESS_KEY_ID=your_access_key
 * AWS_SECRET_ACCESS_KEY=your_secret_key
 */
const client = new DynamoDBClient({
  region: "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request) {
  try {
    const { identifier } = await req.json();

    if (!identifier) {
      return NextResponse.json({ error: "Missing identifier (CLEAR ID or Gmail)" }, { status: 400 });
    }

    let user;
    const isGmail = identifier.includes("@");

    // --- 1️⃣ Gmail Lookup ---
    if (isGmail) {
      const scanCmd = new ScanCommand({
        TableName: process.env.DYNAMODB_USER_TABLE || "User-ao7ebzdnjvahrhfgmey6i6vzfu-NONE",
        FilterExpression: "christGmail = :gmail",
        ExpressionAttributeValues: {
          ":gmail": { S: identifier },
        },
      });

      const scanResult = await client.send(scanCmd);

      if (!scanResult.Items || scanResult.Items.length === 0) {
        return NextResponse.json({ error: "User not found with this Gmail" }, { status: 404 });
      }

      const duplicateCount = scanResult.Items.length;
      user = unmarshall(scanResult.Items[0]);

      if (duplicateCount > 1) {
        user.duplicateWarning = `Found ${duplicateCount} users with this Gmail. Showing first match.`;
      }

    // --- 2️⃣ CLEAR ID Lookup ---
    } else {
      const userCmd = new GetItemCommand({
        TableName: process.env.DYNAMODB_USER_TABLE || "User-ao7ebzdnjvahrhfgmey6i6vzfu-NONE",
        Key: { clearId: { S: identifier } },
      });

      const userData = await client.send(userCmd);
      if (!userData.Item) {
        return NextResponse.json({ error: "User not found with this CLEAR ID" }, { status: 404 });
      }

      user = unmarshall(userData.Item);
    }

    // --- 3️⃣ Fetch Event Registrations ---
    // For now, let's scan the table instead of using GSI since we don't know the exact GSI name
    const eventCmd = new ScanCommand({
      TableName: process.env.DYNAMODB_EVENT_TABLE || "IndividualRegistration-ao7ebzdnjvahrhfgmey6i6vzfu-NONE",
      FilterExpression: "playerClearId = :id",
      ExpressionAttributeValues: {
        ":id": { S: user.clearId },
      },
    });

    const eventData = await client.send(eventCmd);
    const events = eventData.Items ? eventData.Items.map((i) => unmarshall(i)) : [];

    console.log("Fetched events for user", user.clearId, ":", events); // Debug log

    // --- 4️⃣ Map Events with Names & IDs ---
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

    const uniqueEvents = events
      .map((reg) => {
        const match = eventList.find((e) => e.id === reg.eventId);
        return match || { id: reg.eventId, name: "Unknown Event", category: "unknown" };
      })
      .filter(
        (event, index, self) => index === self.findIndex((e) => e.id === event.id)
      );

    // --- ✅ Return Final Response ---
    return NextResponse.json({
      user,
      registeredEvents: uniqueEvents,
    });
  } catch (error) {
    console.error("Fetch user failed:", error);

    // Return detailed error message for debugging (visible only in logs)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
