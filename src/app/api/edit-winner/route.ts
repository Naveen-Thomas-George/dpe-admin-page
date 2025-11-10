import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";

const client = new DynamoDBClient({
  region: "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const SCORE_TABLE = "Score-ao7ebzdnjvahrhfgmey6i6vzfu-NONE";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      eventId,
      positionId,
      newChestNo,
      newStudentName,
      newSchoolName,
      newEventName,
      newPosition
    } = body;

    // Validation
    if (!eventId || !positionId) {
      return NextResponse.json({ error: "Event ID and Position ID are required" }, { status: 400 });
    }

    if (!newChestNo?.trim() || !newStudentName?.trim() || !newSchoolName?.trim() || !newEventName?.trim() || !newPosition) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Create new EventID if event name changed
    const createEventID = (eventName: string): string => {
      const cleanName = eventName
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '')
        .replace(/\s+/g, '_');
      return `EVENT#${cleanName}`;
    };

    const newEventId = createEventID(newEventName);
    const newPositionId = `POS#${String(newPosition).padStart(2, '0')}`;

    // Update the item
    const updateCommand = new UpdateCommand({
      TableName: SCORE_TABLE,
      Key: {
        EventID: eventId,
        PositionID: positionId,
      },
      UpdateExpression: `
        SET
          ChestNo = :chestNo,
          StudentName = :studentName,
          SchoolName = :schoolName,
          EventName = :eventName,
          Position = :position,
          #eventId = :eventId,
          #positionId = :positionId,
          RecordedAt = :recordedAt
      `,
      ExpressionAttributeNames: {
        '#eventId': 'EventID',
        '#positionId': 'PositionID',
      },
      ExpressionAttributeValues: {
        ':chestNo': newChestNo.trim(),
        ':studentName': newStudentName.trim(),
        ':schoolName': newSchoolName.trim(),
        ':eventName': newEventName.trim(),
        ':position': newPosition,
        ':eventId': newEventId,
        ':positionId': newPositionId,
        ':recordedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
      ConditionExpression: 'attribute_exists(EventID) AND attribute_exists(PositionID)',
    });

    const result = await docClient.send(updateCommand);

    return NextResponse.json({
      success: true,
      message: "Winner updated successfully",
      updatedItem: result.Attributes,
    });

  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      return NextResponse.json({ error: "Winner record not found" }, { status: 404 });
    }

    console.error("Error updating winner:", error);
    return NextResponse.json({ error: "Failed to update winner" }, { status: 500 });
  }
}
