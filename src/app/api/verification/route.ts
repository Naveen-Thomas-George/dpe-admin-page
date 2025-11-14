import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";

const client = new DynamoDBClient({
  region: "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const USER_TABLE = "User-3q2hnhg4gnhg7jhx7qgk4x4ge-NONE"; // User table
const EVENT_TABLE = "IndividualRegistration-3q2hnhg4gnhg7jhx7qgk4x4ge-NONE"; // Event registration table

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, eventId, clearId, chestNumber, attendance, searchCriteria } = body;

    switch (action) {
      case 'search': {
        if (!eventId) {
          return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
        }

        // Query users registered for the event from EVENT_TABLE
        const eventQuery = new ScanCommand({
          TableName: EVENT_TABLE,
          FilterExpression: 'eventId = :eventId',
          ExpressionAttributeValues: {
            ':eventId': eventId,
          },
        });

        const eventResult = await docClient.send(eventQuery);
        const registrations = eventResult.Items || [];

        // Get unique registration numbers and emails to find users
        const uniqueIdentifiers = new Set();
        registrations.forEach(reg => {
          if (reg.regNumber) uniqueIdentifiers.add(`reg:${reg.regNumber}`);
          if (reg.christGmail) uniqueIdentifiers.add(`email:${reg.christGmail}`);
        });

        // Get all users that match the identifiers
        const users = [];
        for (const identifier of uniqueIdentifiers) {
          const identifierStr = identifier as string;
          const [type, value] = identifierStr.split(':');
          let queryCommand;

          if (type === 'reg') {
            queryCommand = new ScanCommand({
              TableName: USER_TABLE,
              FilterExpression: 'regNumber = :value',
              ExpressionAttributeValues: {
                ':value': value,
              },
            });
          } else {
            queryCommand = new ScanCommand({
              TableName: USER_TABLE,
              FilterExpression: 'christGmail = :value',
              ExpressionAttributeValues: {
                ':value': value,
              },
            });
          }

          const userResult = await docClient.send(queryCommand);
          users.push(...(userResult.Items || []));
        }

        // Remove duplicates based on ClearID
        const uniqueUsers = users.reduce((acc: any[], user: any) => {
          if (!acc.find((u: any) => u.clearId === user.clearId)) {
            acc.push(user);
          }
          return acc;
        }, []);

        // Get attendance and chest number for each user from EVENT_TABLE
        const usersWithDetails = uniqueUsers.map((user: any) => {
          // Check if user is registered for this specific event
          const userRegistration = registrations.find((reg: any) =>
            reg.playerClearId === user.clearId ||
            (reg.regNumber === user.regNumber && reg.christGmail === user.christGmail)
          );

          return {
            clearId: user.clearId,
            fullName: user.fullName,
            regNumber: user.regNumber,
            christGmail: user.christGmail,
            attendance: userRegistration?.attendance || false,
            chestNo: userRegistration?.chestNo || '',
            duplicates: user.duplicates || 0,
            isRegistered: !!userRegistration, // Only show if registered for this event
          };
        }).filter((user: any) => user.isRegistered); // Only return users registered for this event

        return NextResponse.json({ users: usersWithDetails });
      }

      case 'markAttendance': {
        if (!clearId || !eventId || attendance == null) {
          return NextResponse.json({ error: "ClearID, EventID, and attendance are required" }, { status: 400 });
        }

        // Update attendance in EVENT_TABLE
        const updateCommand = new UpdateCommand({
          TableName: EVENT_TABLE,
          Key: {
            eventId: eventId,
            playerClearId: clearId,
          },
          UpdateExpression: 'SET attendance = :attendance, RecordedAt = :recordedAt',
          ExpressionAttributeValues: {
            ':attendance': attendance,
            ':recordedAt': new Date().toISOString(),
          },
          ReturnValues: 'ALL_NEW',
        });

        await docClient.send(updateCommand);

        // Also update attendance for duplicates
        // Find all users with same reg number or email
        const userQuery = new ScanCommand({
          TableName: USER_TABLE,
          FilterExpression: 'clearId = :clearId',
          ExpressionAttributeValues: {
            ':clearId': clearId,
          },
        });

        const userResult = await docClient.send(userQuery);
        const user = userResult.Items?.[0];

        if (user) {
          // Find all registrations for this user across all events
          const allRegistrationsQuery = new ScanCommand({
            TableName: EVENT_TABLE,
            FilterExpression: 'regNumber = :regNumber OR christGmail = :email',
            ExpressionAttributeValues: {
              ':regNumber': user.regNumber,
              ':email': user.christGmail,
            },
          });

          const allRegistrations = await docClient.send(allRegistrationsQuery);
          const duplicateRegistrations = allRegistrations.Items?.filter(reg => reg.playerClearId !== clearId) || [];

          // Update attendance for all duplicates
          for (const reg of duplicateRegistrations) {
            const duplicateUpdateCommand = new UpdateCommand({
              TableName: EVENT_TABLE,
              Key: {
                eventId: reg.eventId,
                playerClearId: reg.playerClearId,
              },
              UpdateExpression: 'SET attendance = :attendance, RecordedAt = :recordedAt',
              ExpressionAttributeValues: {
                ':attendance': attendance,
                ':recordedAt': new Date().toISOString(),
              },
            });

            await docClient.send(duplicateUpdateCommand);
          }
        }

        return NextResponse.json({ success: true });
      }

      case 'assignChestNumber': {
        if (!chestNumber) {
          return NextResponse.json({ error: "Chest number is required" }, { status: 400 });
        }

        // Find user by reg number or gmail (since chest number is global)
        let userQuery;
        if (clearId) {
          // If clearId provided, use it directly
          userQuery = new ScanCommand({
            TableName: USER_TABLE,
            FilterExpression: 'clearId = :clearId',
            ExpressionAttributeValues: {
              ':clearId': clearId,
            },
          });
        } else {
          return NextResponse.json({ error: "ClearID is required for chest number assignment" }, { status: 400 });
        }

        const userResult = await docClient.send(userQuery);
        const user = userResult.Items?.[0];

        if (!user) {
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Update chest number for all registrations of this user (by reg number or email)
        const allRegistrationsQuery = new ScanCommand({
          TableName: EVENT_TABLE,
          FilterExpression: 'regNumber = :regNumber OR christGmail = :email',
          ExpressionAttributeValues: {
            ':regNumber': user.regNumber,
            ':email': user.christGmail,
          },
        });

        const allRegistrations = await docClient.send(allRegistrationsQuery);
        const userRegistrations = allRegistrations.Items || [];

        // Update chest number for all registrations
        for (const reg of userRegistrations) {
          const updateCommand = new UpdateCommand({
            TableName: EVENT_TABLE,
            Key: {
              eventId: reg.eventId,
              playerClearId: reg.playerClearId,
            },
            UpdateExpression: 'SET chestNo = :chestNo, RecordedAt = :recordedAt',
            ExpressionAttributeValues: {
              ':chestNo': chestNumber,
              ':recordedAt': new Date().toISOString(),
            },
          });

          await docClient.send(updateCommand);
        }

        return NextResponse.json({ success: true, updatedCount: userRegistrations.length });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Verification API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
