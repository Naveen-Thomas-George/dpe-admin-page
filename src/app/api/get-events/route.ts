import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";

const client = new DynamoDBClient({
  region: "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const REGISTRATION_TABLE = "IndividualRegistration-ao7ebzdnjvahrhfgmey6i6vzfu-NONE";

export async function GET() {
  try {
    // Get all unique events from registrations
    const scanCommand = new ScanCommand({
      TableName: REGISTRATION_TABLE,
      ProjectionExpression: 'EventID, EventName, Category',
    });

    const result = await docClient.send(scanCommand);
    const items = result.Items || [];

    // Group by EventID to get unique events
    const eventsMap = new Map();

    items.forEach(item => {
      if (!eventsMap.has(item.EventID)) {
        eventsMap.set(item.EventID, {
          id: item.EventID,
          name: item.EventName,
          category: item.Category,
        });
      }
    });

    const events = Array.from(eventsMap.values());

    return NextResponse.json({ events });

  } catch (error: any) {
    console.error("Get events error:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}
