import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const SCORE_TABLE = "Score-ao7ebzdnjvahrhfgmey6i6vzfu-NONE";
const SCHOOL_TABLE = "School-ao7ebzdnjvahrhfgmey6i6vzfu-NONE";

export async function GET() {
  try {
    // Fetch all scores from Score table
    const scoreCommand = new ScanCommand({
      TableName: SCORE_TABLE,
    });
    const scoreResponse = await docClient.send(scoreCommand);
    const scores = scoreResponse.Items || [];

    // Fetch all schools from School table
    const schoolCommand = new ScanCommand({
      TableName: SCHOOL_TABLE,
    });
    const schoolResponse = await docClient.send(schoolCommand);
    const schools = schoolResponse.Items || [];

    // Calculate overall scores and event wins
    const schoolScores: { [key: string]: { totalPoints: number; wins: { [event: string]: number } } } = {};
    const eventWins: { [event: string]: { [school: string]: number } } = {};

    scores.forEach((score) => {
      const school = score.SchoolName;
      const event = score.EventName;
      const position = score.Position;

      if (!schoolScores[school]) {
        schoolScores[school] = { totalPoints: 0, wins: {} };
      }

      // Points based on position (1st: 5, 2nd: 3, 3rd: 1)
      let points = 0;
      if (position === 1) points = 5;
      else if (position === 2) points = 3;
      else if (position === 3) points = 1;

      schoolScores[school].totalPoints += points;

      if (!schoolScores[school].wins[event]) {
        schoolScores[school].wins[event] = 0;
      }
      schoolScores[school].wins[event] += 1;

      if (!eventWins[event]) {
        eventWins[event] = {};
      }
      if (!eventWins[event][school]) {
        eventWins[event][school] = 0;
      }
      eventWins[event][school] += 1;
    });

    // Get top 5 schools
    const topSchools = Object.entries(schoolScores)
      .sort(([, a], [, b]) => b.totalPoints - a.totalPoints)
      .slice(0, 5)
      .map(([school, data]) => ({ school, totalPoints: data.totalPoints }));

    // Get recent winners for carousel (last 10 events)
    const recentWinners = scores
      .sort((a, b) => new Date(b.RecordedAt).getTime() - new Date(a.RecordedAt).getTime())
      .slice(0, 10)
      .map(score => ({
        prize: score.Position === 1 ? '🥇 1st Place' : score.Position === 2 ? '🥈 2nd Place' : '🥉 3rd Place',
        name: score.StudentName,
        event: score.EventName,
        school: score.SchoolName,
      }));

    return NextResponse.json({
      overallScore: schoolScores,
      topSchools,
      recentWinners,
      eventWins,
    });
  } catch (error) {
    console.error("Error fetching school scores:", error);
    return NextResponse.json({ error: "Failed to fetch school scores" }, { status: 500 });
  }
}
