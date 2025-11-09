import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";

const client = new DynamoDBClient({
  region: "eu-north-1", // Use the correct region from amplify_outputs.json
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const SCHOOL_TABLE = "School-table";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { schoolName } = body;

    if (!schoolName || typeof schoolName !== 'string' || !schoolName.trim()) {
      return NextResponse.json({ error: "School name is required" }, { status: 400 });
    }

    const schoolId = `SCHOOL#${schoolName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;

    const command = new PutCommand({
      TableName: SCHOOL_TABLE,
      Item: {
        SchoolID: schoolId,
        SchoolName: schoolName.trim(),
        CreatedAt: new Date().toISOString(),
        TotalPoints: 0, // Initialize with 0 points
      },
      ConditionExpression: "attribute_not_exists(SchoolID)", // Prevent duplicates
    });

    await docClient.send(command);

    return NextResponse.json({
      success: true,
      message: "School added successfully",
      schoolId
    });

  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      return NextResponse.json({ error: "School already exists" }, { status: 409 });
    }

    console.error("Error adding school:", error);
    return NextResponse.json({ error: "Failed to add school" }, { status: 500 });
  }
}
