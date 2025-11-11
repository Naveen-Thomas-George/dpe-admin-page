import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";

const client = new DynamoDBClient({
  region: "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const SCORE_TABLE = "Score-table";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventName, position, chestNo, studentName, schoolName } = body;

    // Validation
    if (!eventName || !position || !chestNo || !studentName || !schoolName) {
      return NextResponse.json(
        { error: "All fields are required: eventName, position, chestNo, studentName, schoolName" },
        { status: 400 }
      );
    }

    // Create EventID (same logic as save-score)
    const createEventID = (eventName: string): string => {
      const cleanName = eventName
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '')
        .replace(/\s+/g, '_');
      return `EVENT#${cleanName}`;
    };

    const eventId = createEventID(eventName);
    const positionId = `POS#${String(position).padStart(2, '0')}`;

    // First, query to find the exact item to delete (since we need to match all attributes)
    const { QueryCommand } = await import("@aws-sdk/lib-dynamodb");
    const queryCommand = new QueryCommand({
      TableName: SCORE_TABLE,
      KeyConditionExpression: "EventID = :eventId AND PositionID = :positionId",
      FilterExpression: "ChestNo = :chestNo AND StudentName = :studentName AND SchoolName = :schoolName",
      ExpressionAttributeValues: {
        ":eventId": eventId,
        ":positionId": positionId,
        ":chestNo": chestNo,
        ":studentName": studentName,
        ":schoolName": schoolName,
      },
    });

    const queryResponse = await docClient.send(queryCommand);
    const items = queryResponse.Items || [];

    if (items.length === 0) {
      return NextResponse.json(
        { error: "Winner record not found or details don't match. Please verify the information." },
        { status: 404 }
      );
    }

    // Delete the winner record using the exact key
    const deleteCommand = new DeleteCommand({
      TableName: SCORE_TABLE,
      Key: {
        EventID: eventId,
        PositionID: positionId,
      },
    });

    await docClient.send(deleteCommand);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted winner: ${studentName} (${chestNo}) from ${eventName}`
    });

  } catch (error) {
    console.error("Error deleting winner:", error);

    const errorMessage = error instanceof Error ? error.message : "Failed to delete winner";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
