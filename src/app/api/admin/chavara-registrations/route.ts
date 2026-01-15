import { ddbDocClient } from "@/lib/dynamoClient";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  try {
    const command = new ScanCommand({
      TableName: "ChavaraCupRegistrations",
    });

    const result = await ddbDocClient.send(command);

    let items = result.Items || [];

    if (q) {
      const lowerQ = q.toLowerCase();
      items = items.filter((item: any) =>
        (item.TeamName && item.TeamName.toLowerCase().includes(lowerQ)) ||
        (item.CollegeName && item.CollegeName.toLowerCase().includes(lowerQ))
      );
    }

    return Response.json({ data: items });
  } catch (error) {
    console.error("Error fetching registrations:", error);
    return Response.json({ error: "Failed to fetch registrations" }, { status: 500 });
  }
}