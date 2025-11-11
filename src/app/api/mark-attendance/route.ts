import { NextResponse } from "next/server";
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

interface MarkAttendanceRequest {
  clearId: string;
  eventId: string;
}

export async function POST(req: Request) {
  try {
    const body: MarkAttendanceRequest = await req.json();
    const { clearId, eventId } = body;

    if (!clearId || !eventId) {
      return NextResponse.json(
        { message: "Missing Clear ID or event ID" },
        { status: 400 }
      );
    }

    // 1️⃣ Check if the user exists
    const getUserCmd = new GetItemCommand({
      TableName: "User-ao7ebzdnjvahrhfgmey6i6vzfu-NONE",
      Key: {
        clearId: { S: clearId },
      },
    });

    const userItem = await client.send(getUserCmd);

    if (!userItem.Item) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // 2️⃣ Check if attendance already exists
    const getAttendanceCmd = new GetItemCommand({
      TableName: "IndividualRegistration-ao7ebzdnjvahrhfgmey6i6vzfu-NONE",
      Key: {
        playerClearId: { S: clearId },
        eventId: { S: eventId },
      },
    });

    const existingAttendance = await client.send(getAttendanceCmd);

    if (existingAttendance.Item) {
      return NextResponse.json(
        { message: "Attendance already marked for this event" },
        { status: 409 }
      );
    }

    // 3️⃣ Mark attendance by adding to IndividualRegistration table
    const putCmd = new PutItemCommand({
      TableName: "IndividualRegistration-ao7ebzdnjvahrhfgmey6i6vzfu-NONE",
      Item: {
        playerClearId: { S: clearId },
        eventId: { S: eventId },
        attendance: { S: "present" },
        markedAt: { S: new Date().toISOString() },
      },
    });

    await client.send(putCmd);

    return NextResponse.json(
      { message: "Attendance marked successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error marking attendance:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
