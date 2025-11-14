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
const TABLE_NAME = "Score-table"; // Score table

// --- Helper Types ---
type WinnerEntry = {
  position: number;
  chestNo: string;
  name: string;
  school: string;
  points?: number;
};

type TeamEntry = {
  teamName: string;
  school: string;
  points: number;
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
        const { eventType, eventName, winners, teamEntry } = body as {
            eventType: 'individual' | 'team';
            eventName: string;
            winners?: WinnerEntry[];
            teamEntry?: TeamEntry;
        };

        // --- Validation ---
        if (!eventType || !eventName) {
            return NextResponse.json({ error: "Invalid data: Event type and event name are required." }, { status: 400 });
        }

        const eventId = createEventID(eventName);
        const timestamp = new Date().toISOString();

        let allPutRequests: any[] = [];

        if (eventType === 'individual') {
            if (!winners || !Array.isArray(winners) || winners.length === 0) {
                return NextResponse.json({ error: "Invalid data: Winners array is required for individual events." }, { status: 400 });
            }

            // Group winners by position to handle multiples (e.g., doubles)
            const groupedWinners = winners.reduce((acc, winner) => {
                if (!acc[winner.position]) acc[winner.position] = [];
                acc[winner.position].push(winner);
                return acc;
            }, {} as Record<number, WinnerEntry[]>);

            // 1. Create PutRequest for each winner, adding suffix for multiples
            const winnerPutRequests = Object.entries(groupedWinners).flatMap(([posStr, wins]) =>
                wins.map((winner, index) => {
                    const suffix = wins.length > 1 ? `_${index + 1}` : '';
                    return {
                        PutRequest: {
                            Item: {
                                EventID: eventId,                             // PK: Partition Key
                                PositionID: `POS#${String(winner.position).padStart(2, '0')}${suffix}`, // SK: Sort Key (e.g., POS#01, POS#01_1, POS#01_2)
                                EventName: eventName.trim(),                  // Raw event name for display
                                EventType: 'individual',
                                Position: winner.position,
                                ChestNo: winner.chestNo.trim(),
                                StudentName: winner.name.trim(),
                                SchoolName: winner.school.trim(),
                                Points: winner.points !== undefined ? winner.points : (winner.position === 1 ? 5 : winner.position === 2 ? 3 : winner.position === 3 ? 1 : 0), // Auto points for positions 1-3, manual if provided
                                RecordedAt: timestamp,
                            }
                        }
                    };
                })
            );

            // 2. Create PutRequest for the event metadata
            const metadataPutRequest = {
                 PutRequest: {
                     Item: {
                         EventID: eventId,        // PK
                         PositionID: "METADATA",  // SK
                         EventName: eventName.trim(),
                         EventType: 'individual',
                         RecordedAt: timestamp,
                         TotalWinnersRecorded: winners.length,
                     }
                 }
            };

            allPutRequests = [metadataPutRequest, ...winnerPutRequests];
        } else if (eventType === 'team') {
            if (!teamEntry) {
                return NextResponse.json({ error: "Invalid data: Team entry is required for team events." }, { status: 400 });
            }

            // Create PutRequest for team entry
            const teamPutRequest = {
                PutRequest: {
                    Item: {
                        EventID: eventId,                             // PK: Partition Key
                        PositionID: "TEAM#01",                        // SK: Sort Key for team
                        EventName: eventName.trim(),                  // Raw event name for display
                        EventType: 'team',
                        TeamName: teamEntry.teamName.trim(),
                        SchoolName: teamEntry.school.trim(),
                        Points: teamEntry.points,
                        RecordedAt: timestamp,
                    }
                }
            };

            // Metadata for team event
            const metadataPutRequest = {
                 PutRequest: {
                     Item: {
                         EventID: eventId,        // PK
                         PositionID: "METADATA",  // SK
                         EventName: eventName.trim(),
                         EventType: 'team',
                         RecordedAt: timestamp,
                         TotalTeamsRecorded: 1,
                     }
                 }
            };

            allPutRequests = [metadataPutRequest, teamPutRequest];
        } else {
            return NextResponse.json({ error: "Invalid event type." }, { status: 400 });
        }

        // DynamoDB BatchWriteCommand has a limit of 25 items.
        if (allPutRequests.length > 25) {
            return NextResponse.json({ error: "Cannot save: Too many entries at once." }, { status: 413 });
        }

        // --- Execute the Command ---
        const command = new BatchWriteCommand({
            RequestItems: {
                [TABLE_NAME]: allPutRequests
            }
        });

        const response = await docClient.send(command);

        // Check for unprocessed items
        if (response.UnprocessedItems && response.UnprocessedItems[TABLE_NAME] && response.UnprocessedItems[TABLE_NAME].length > 0) {
            console.warn("DynamoDB unprocessed items:", response.UnprocessedItems[TABLE_NAME]);
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
