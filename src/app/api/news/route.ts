import { NextResponse } from "next/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const ddbDocClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME!;

// 🟢 Fetch all news
export async function GET() {
  try {
    const result = await ddbDocClient.send(new ScanCommand({ TableName: TABLE_NAME }));
    return NextResponse.json({ items: result.Items || [] });
  } catch (err) {
    console.error("❌ Error fetching:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// 🟠 Add news
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newItem = {
      id: crypto.randomUUID(),
      title: body.title,
      description: body.description,
      createdAt: new Date().toISOString(),
    };

    await ddbDocClient.send(new PutCommand({ TableName: TABLE_NAME, Item: newItem }));
    return NextResponse.json({ message: "News added", item: newItem });
  } catch (err) {
    console.error("❌ Error adding news:", err);
    return NextResponse.json({ error: "Failed to add news" }, { status: 500 });
  }
}

// 🔵 Update news
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, title, description } = body;

    await ddbDocClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id },
        UpdateExpression: "set #t = :t, #d = :d",
        ExpressionAttributeNames: { "#t": "title", "#d": "description" },
        ExpressionAttributeValues: { ":t": title, ":d": description },
      })
    );

    return NextResponse.json({ message: "News updated" });
  } catch (err) {
    console.error("❌ Error updating:", err);
    return NextResponse.json({ error: "Failed to update news" }, { status: 500 });
  }
}

// 🔴 Delete news
