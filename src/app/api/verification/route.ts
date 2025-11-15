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
      // 🟢 MARK ATTENDANCE (USE REG NO/GMAIL TO GET ALL CLEAR IDs, MARK FOR EVENT)
      // ============================================================
      case "markAttendance": {
        const { identifier, eventId } = body; // identifier is regNumber or gmail

        if (!identifier || !eventId) {
          return NextResponse.json(
            { error: "identifier and eventId are required" },
            { status: 400 }
          );
        }

        // 1. Find ALL users that match the identifier (regNumber or gmail) - handles duplicates
        let userScan;
        const isGmail = identifier.includes("@");

        if (isGmail) {
          userScan = new ScanCommand({
            TableName: USER_TABLE,
            FilterExpression: "christGmail = :i",
            ExpressionAttributeValues: { ":i": identifier }
          });
        } else {
          // Assume it's a regNumber
          userScan = new ScanCommand({
            TableName: USER_TABLE,
            FilterExpression: "regNumber = :i",
            ExpressionAttributeValues: { ":i": identifier }
          });
        }

        const userData = await ddbDocClient.send(userScan);
        const users = userData.Items || [];

        if (users.length === 0) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }

        // 2. Extract all CLEAR IDs from the matching users (including duplicates)
        const clearIds = users.map(u => u.clearId);

        // 3. Find all registrations for these CLEAR IDs in the specific event
        const regScan = new ScanCommand({
          TableName: EVENT_TABLE,
          FilterExpression: "eventId = :event AND playerClearId IN (:c1, :c2, :c3, :c4, :c5)",
          ExpressionAttributeValues: {
            ":event": eventId,
            ":c1": clearIds[0],
            ":c2": clearIds[1] || clearIds[0], // Fallback if less than 5
            ":c3": clearIds[2] || clearIds[0],
            ":c4": clearIds[3] || clearIds[0],
            ":c5": clearIds[4] || clearIds[0]
          }
        });

        // If more than 5 CLEAR IDs, we need multiple scans (but unlikely)
        let registrations = (await ddbDocClient.send(regScan)).Items || [];

        // Filter to only include registrations that actually match our CLEAR IDs
        registrations = registrations.filter(reg => clearIds.includes(reg.playerClearId));

        if (registrations.length === 0) {
          return NextResponse.json(
            { error: "No registrations found for this user in this event" },
            { status: 404 }
          );
        }

        // 4. Update attendance for all matching registrations
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

        return NextResponse.json({
          success: true,
          updatedCount: registrations.length,
          clearIds: clearIds,
          users: users.map(u => ({
            clearId: u.clearId,
            fullName: u.fullName,
            regNumber: u.regNumber
          }))
        });
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
