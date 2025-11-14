import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";

const client = new DynamoDBClient({
  region: "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const USER_TABLE = "User-ao7ebzdnjvahrhfgmey6i6vzfu-NONE";
const REGISTRATION_TABLE = "IndividualRegistration-ao7ebzdnjvahrhfgmey6i6vzfu-NONE";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, eventId, searchCriteria } = body;

    if (action === 'search') {
      // Search users by event and criteria
      const { type, value } = searchCriteria || {};

      // First get all registrations for the event
      const registrationScan = new ScanCommand({
        TableName: REGISTRATION_TABLE,
        FilterExpression: 'EventID = :eventId',
        ExpressionAttributeValues: {
          ':eventId': eventId,
        },
      });

      const registrations = await docClient.send(registrationScan);
      const clearIds = registrations.Items?.map(item => item.PlayerClearID) || [];

      if (clearIds.length === 0) {
        return NextResponse.json({ users: [] });
      }

      // Get user details for these clearIds
      const userPromises = clearIds.map(async (clearId) => {
        const userScan = new ScanCommand({
          TableName: USER_TABLE,
          FilterExpression: 'ClearID = :clearId',
          ExpressionAttributeValues: {
            ':clearId': clearId,
          },
        });
        return await docClient.send(userScan);
      });

      const userResults = await Promise.all(userPromises);
      let users = userResults.flatMap(result => result.Items || []);

      // Apply search filter if searchCriteria is provided
      if (searchCriteria && type && value) {
        if (type === 'regNumber') {
          users = users.filter(user => user.RegNumber?.toLowerCase().includes(value.toLowerCase()));
        } else if (type === 'gmail') {
          users = users.filter(user => user.ChristGmail?.toLowerCase().includes(value.toLowerCase()));
        } else if (type === 'name') {
          users = users.filter(user => user.FullName?.toLowerCase().includes(value.toLowerCase()));
        }
      }

      // Group by ClearID to handle duplicates
      const groupedUsers = users.reduce((acc, user) => {
        const clearId = user.ClearID;
        if (!acc[clearId]) {
          acc[clearId] = {
            clearId,
            fullName: user.FullName,
            schoolShort: user.SchoolShort,
            regNumber: user.RegNumber,
            christGmail: user.ChristGmail,
            educationLevel: user.EducationLevel,
            classSection: user.ClassSection,
            deptShort: user.DeptShort,
            gender: user.Gender,
            chestNo: user.ChestNo,
            attendance: user.Attendance || false,
            duplicates: 1
          };
        } else {
          acc[clearId].duplicates += 1;
        }
        return acc;
      }, {} as Record<string, any>);

      return NextResponse.json({ users: Object.values(groupedUsers) });

    } else if (action === 'markAttendance') {
      const { clearId, eventId, attendance } = body;

      // Update attendance in registration table
      const registrationScan = new ScanCommand({
        TableName: REGISTRATION_TABLE,
        FilterExpression: 'PlayerClearID = :clearId AND EventID = :eventId',
        ExpressionAttributeValues: {
          ':clearId': clearId,
          ':eventId': eventId,
        },
      });

      const registrationResult = await docClient.send(registrationScan);
      const registrations = registrationResult.Items || [];

      // Update attendance for all matching registrations
      const updatePromises = registrations.map(registration =>
        docClient.send(new UpdateCommand({
          TableName: REGISTRATION_TABLE,
          Key: {
            id: registration.id, // Assuming 'id' is the primary key
          },
          UpdateExpression: 'SET Attendance = :attendance, AttendanceUpdatedAt = :timestamp',
          ExpressionAttributeValues: {
            ':attendance': attendance,
            ':timestamp': new Date().toISOString(),
          },
        }))
      );

      await Promise.all(updatePromises);

      return NextResponse.json({ success: true, updatedCount: registrations.length });

    } else if (action === 'assignChestNumber') {
      const { clearId, chestNumber } = body;

      // Update chest number for all duplicate entries in user table
      const userScan = new ScanCommand({
        TableName: USER_TABLE,
        FilterExpression: 'ClearID = :clearId',
        ExpressionAttributeValues: {
          ':clearId': clearId,
        },
      });

      const userResult = await docClient.send(userScan);
      const users = userResult.Items || [];

      const updatePromises = users.map(user =>
        docClient.send(new UpdateCommand({
          TableName: USER_TABLE,
          Key: {
            ClearID: user.ClearID,
          },
          UpdateExpression: 'SET ChestNo = :chestNo, ChestNoUpdatedAt = :timestamp',
          ExpressionAttributeValues: {
            ':chestNo': chestNumber,
            ':timestamp': new Date().toISOString(),
          },
        }))
      );

      await Promise.all(updatePromises);

      return NextResponse.json({ success: true, updatedCount: users.length });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error: any) {
    console.error("Verification API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
