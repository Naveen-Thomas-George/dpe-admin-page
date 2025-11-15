import { NextResponse } from "next/server";
import { ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "../../../lib/dynamoClient";

const USER_TABLE = "User-ao7ebzdnjvahrhfgmey6i6vzfu-NONE";
const EVENT_TABLE = "IndividualRegistration-ao7ebzdnjvahrhfgmey6i6vzfu-NONE";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, eventId, clearId, chestNumber, attendance, searchCriteria } = body;

    switch (action) {

      // ============================================================
      // 🔍 SEARCH USERS REGISTERED FOR AN EVENT
      // ============================================================
      case "search": {
        if (!eventId) {
          return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
        }

        // 1. Get all registrations for this event
        const regScan = new ScanCommand({
          TableName: EVENT_TABLE,
          FilterExpression: "eventId = :e",
          ExpressionAttributeValues: { ":e": eventId }
        });
        const regData = await ddbDocClient.send(regScan);
        const registrations = regData.Items || [];

        if (registrations.length === 0) {
          return NextResponse.json({ users: [] });
        }

        // 2. Extract all clearIds
        const clearIds = new Set(registrations.map(r => r.playerClearId));

        // 3. Scan users table once
        const userScan = new ScanCommand({
          TableName: USER_TABLE
        });
        const allUsers = (await ddbDocClient.send(userScan)).Items || [];

        // 4. Filter only users registered for this event
        let users = allUsers.filter(u => clearIds.has(u.clearId));

        // 5. Apply search criteria
        if (searchCriteria?.value) {
          const q = searchCriteria.value.toLowerCase();

          if (searchCriteria.type === "regNumber") {
            users = users.filter(u => u.regNumber?.toLowerCase().includes(q));
          }
          if (searchCriteria.type === "gmail") {
            users = users.filter(u => u.christGmail?.toLowerCase().includes(q));
          }
          if (searchCriteria.type === "name") {
            users = users.filter(u => u.fullName?.toLowerCase().includes(q));
          }
        }

        // 6. Merge attendance + chest (from USER TABLE)
        const finalUsers = users.map(user => {
          const reg = registrations.find(r => r.playerClearId === user.clearId);

          return {
            clearId: user.clearId,
            fullName: user.fullName,
            regNumber: user.regNumber,
            christGmail: user.christGmail,
            chestNo: user.chestNo ?? "",
            attendance: reg?.attendance ?? false,
            duplicates:
              registrations.filter(r => r.regNumber === user.regNumber).length - 1
          };
        });

        return NextResponse.json({ users: finalUsers });
      }

      // ============================================================
      // 🟢 MARK ATTENDANCE (FOR SPECIFIC EVENT, ALL CLEAR IDs OF USER)
      // ============================================================
      case "markAttendance": {
        if (!clearId || !eventId) {
          return NextResponse.json(
            { error: "clearId and eventId are required" },
            { status: 400 }
          );
        }

        // 1. Find the user by clearId
        const userScan = new ScanCommand({
          TableName: USER_TABLE,
          FilterExpression: "clearId = :c",
          ExpressionAttributeValues: { ":c": clearId }
        });
        const userData = await ddbDocClient.send(userScan);
        const user = userData.Items?.[0];

        if (!user) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }

        // 2. Find all registrations for this user in this specific event (by regNumber or christGmail)
        const regScan = new ScanCommand({
          TableName: EVENT_TABLE,
          FilterExpression: "(regNumber = :r OR christGmail = :e) AND eventId = :event",
          ExpressionAttributeValues: {
            ":r": user.regNumber,
            ":e": user.christGmail,
            ":event": eventId
          }
        });
        const regData = await ddbDocClient.send(regScan);
        const registrations = regData.Items || [];

        if (registrations.length === 0) {
          return NextResponse.json(
            { error: "No registrations found for this user in this event" },
            { status: 404 }
          );
        }

        // 3. Update attendance for all registrations of this user in this event
        const updatePromises = registrations.map(reg =>
          ddbDocClient.send(
            new UpdateCommand({
              TableName: EVENT_TABLE,
              Key: { eventId: reg.eventId, playerClearId: reg.playerClearId },
              UpdateExpression: "SET attendance = :a",
              ExpressionAttributeValues: { ":a": true } // Always mark as present
            })
          )
        );

        await Promise.all(updatePromises);

        return NextResponse.json({ success: true, updatedCount: registrations.length });
      }

      // ============================================================
      // 🟢 ASSIGN CHEST NUMBER (GLOBAL → ONLY USER TABLE)
      // ============================================================
      case "assignChestNumber": {
        if (!clearId || !chestNumber) {
          return NextResponse.json(
            { error: "clearId and chestNumber required" },
            { status: 400 }
          );
        }

        // Update user table only
        await ddbDocClient.send(
          new UpdateCommand({
            TableName: USER_TABLE,
            Key: { clearId },
            UpdateExpression: "SET chestNo = :c",
            ExpressionAttributeValues: { ":c": chestNumber }
          })
        );

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
