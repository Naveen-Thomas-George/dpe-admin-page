import { NextResponse } from "next/server";
import {
  DynamoDBClient,
  UpdateItemCommand,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

interface UpdateChestNumberRequest {
  clearId: string;
  chestNumber: string;
}

export async function POST(req: Request) {
  try {
    const body: UpdateChestNumberRequest = await req.json();
    const { clearId, chestNumber } = body;

    if (!clearId || !chestNumber) {
      return NextResponse.json(
        { message: "Missing Clear ID or chest number" },
        { status: 400 }
      );
    }

    // Validate chest number format (3-4 digits)
    if (!/^\d{3,4}$/.test(chestNumber)) {
      return NextResponse.json(
        { message: "Chest number must be 3-4 digits only" },
        { status: 400 }
      );
    }

    // 1️⃣ Check if the Clear ID exists
    const getCmd = new GetItemCommand({
      TableName: "User-ao7ebzdnjvahrhfgmey6i6vzfu-NONE",
      Key: {
        clearId: { S: clearId },
      },
    });

    const existingItem = await client.send(getCmd);

    if (!existingItem.Item) {
      return NextResponse.json(
        { message: "Clear ID not found" },
        { status: 404 }
      );
    }

    // 2️⃣ Update the chestNo field
    const updateCmd = new UpdateItemCommand({
      TableName: "User-ao7ebzdnjvahrhfgmey6i6vzfu-NONE",
      Key: { clearId: { S: clearId } },
      UpdateExpression: "SET chestNo = :chest",
      ExpressionAttributeValues: {
        ":chest": { S: chestNumber },
      },
    });

    await client.send(updateCmd);

    return NextResponse.json(
      { message: "Chest number updated successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating chest number:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
