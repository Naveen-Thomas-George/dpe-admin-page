import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";

const client = new DynamoDBClient({
  region: "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const SCHOOL_TABLE = "School-table";
const SCORE_TABLE = "Score-table";

export async function POST(request: Request) {``
  try {
    const body = await request.json();
    const { schoolName } = body;

    if (!schoolName) {
      return NextResponse.json({ error: "School name is required" }, { status: 400 });
    }

    // Check if school has any scores before deleting
    const scanCommand = new ScanCommand({
      TableName: SCORE_TABLE,
      FilterExpression: "SchoolName = :schoolName",
      ExpressionAttributeValues: {
        ":schoolName": schoolName,
      },
    });

    const scanResponse = await docClient.send(scanCommand);

    if (scanResponse.Items && scanResponse.Items.length > 0) {
      return NextResponse.json({
        error: `Cannot delete school "${schoolName}" because it has ${scanResponse.Items.length} associated score records. Please delete all scores for this school first.`
      }, { status: 400 });
    }

    // Create SchoolID (same logic as add-school)
    const createSchoolID = (schoolName: string): string => {
      const cleanName = schoolName
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '')
        .replace(/\s+/g, '_');
      return `SCHOOL#${cleanName}`;
    };

    const schoolId = createSchoolID(schoolName);

    // Delete the school
    const deleteCommand = new DeleteCommand({
      TableName: SCHOOL_TABLE,
      Key: {
        SchoolID: schoolId,
      },
    });

    await docClient.send(deleteCommand);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted school: ${schoolName}`
    });

  } catch (error) {
    console.error("Error deleting school:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete school";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
