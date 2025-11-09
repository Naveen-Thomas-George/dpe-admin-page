import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchWriteCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";

// --- DynamoDB Client Initialization ---
// Ensure your AWS credentials are set in environment variables
// (AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)

const client = new DynamoDBClient({
    region: "eu-north-1", // Use the correct region from amplify_outputs.json
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    }
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "Score-ao7ebzdnjvahrhfgmey6i6vzfu-NONE"; // Score table

// --- Helper Types ---
type WinnerEntry = {
  position: number;
  chestNo: string;
  name: string;
  school: string;
};

/**
 * Generates a clean, consistent Partition Key (PK) for the event.
 * Example: "100m Sprint (Boys)" -> "EVENT#100M_SPRINT_BOYS"
 * @param eventName The raw event name from the user.
 * @returns A formatted string for the Partition Key.
 */
const createEventID = (eventName: string): string => {
  const cleanName = eventName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_');        // Replace spaces with underscores
  return `EVENT#${cleanName}`;
};

/**
 * API Route Handler (POST)
 * Receives the score sheet data and saves it to DynamoDB.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { eventName, winners } = body as { eventName: string, winners: WinnerEntry[] };

        // --- Validation ---
        if (!eventName || !winners || !Array.isArray(winners) || winners.length === 0) {
            return NextResponse.json({ error: "Invalid data: Event name and winners array are required." }, { status: 400 });
        }

        const eventId = createEventID(eventName);
        const timestamp = new Date().toISOString();

        // --- Prepare DynamoDB Batch Write ---
        // We will write one item for each winner, plus one "METADATA" item for the event itself.

        // 1. Create PutRequest for each winner
        const winnerPutRequests = winners.map(winner => ({
            PutRequest: {
                Item: {
                    EventID: eventId,                             // PK: Partition Key
                    PositionID: `POS#${String(winner.position).padStart(2, '0')}`, // SK: Sort Key (e.g., POS#01, POS#02)
                    EventName: eventName.trim(),                  // Raw event name for display
                    Position: winner.position,
                    ChestNo: winner.chestNo.trim(),
                    StudentName: winner.name.trim(),
                    SchoolName: winner.school.trim(),
                    RecordedAt: timestamp,
                }
            }
        }));

        // 2. Create PutRequest for the event metadata
        const metadataPutRequest = {
             PutRequest: {
                 Item: {
                     EventID: eventId,        // PK
                     PositionID: "METADATA",  // SK
                     EventName: eventName.trim(),
                     RecordedAt: timestamp,
                     TotalWinnersRecorded: winners.length,
                     // You could add more metadata here, like the judge's name if passed from the client
                 }
             }
        };

        const allPutRequests = [metadataPutRequest, ...winnerPutRequests];

        // DynamoDB BatchWriteCommand has a limit of 25 items.
        // If you might have more than 24 winners (e.g., team event), you'd need to loop.
        // For 3 positions, we are well within the limit.
        if (allPutRequests.length > 25) {
            // Handle chunking if necessary, though unlikely for this use case
            console.warn("More than 25 items, chunking logic would be needed.");
            // For now, just error if it's too large
             return NextResponse.json({ error: "Cannot save: Too many entries at once." }, { status: 413 });
        }

        // --- Execute the Command ---
        const command = new BatchWriteCommand({
            RequestItems: {
                [TABLE_NAME]: allPutRequests
            }
        });

        const response = await docClient.send(command);

        // Check for unprocessed items (e.g., if DynamoDB throttles the request)
        if (response.UnprocessedItems && response.UnprocessedItems[TABLE_NAME] && response.UnprocessedItems[TABLE_NAME].length > 0) {
            console.warn("DynamoDB unprocessed items:", response.UnprocessedItems[TABLE_NAME]);
            // Here you would typically implement a retry logic for the unprocessed items
            return NextResponse.json({ error: "Partial failure: Some items were not saved. Please try again." }, { status: 500 });
        }

        // --- Success ---
        return NextResponse.json({ success: true, eventId, itemsSaved: allPutRequests.length });

    } catch (error) {
        console.error("DynamoDB Error:", error);
        let errorMessage = "Failed to save data to DynamoDB.";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
