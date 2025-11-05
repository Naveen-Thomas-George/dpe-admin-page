"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Plus, Edit2, Trash2, Save, Clock, MapPin } from "lucide-react"

interface Fixture {
  id: string
  date: string
  event: string
  venue: string
  time: string
}

export function FixturesControl() {
  // ============================================================================
  // AWS INTEGRATION NOTES FOR BACKEND DEVELOPERS
  // ============================================================================
  // This component manages event fixtures that should be stored in AWS DynamoDB
  //
  // TABLE STRUCTURE (DynamoDB):
  // Table Name: "event_fixtures"
  // Primary Key: "fixtureId" (String)
  // Sort Key: "date" (String) - For efficient date-based queries
  // Attributes:
  //   - fixtureId (String) - Unique identifier for fixture
  //   - date (String) - Event date (ISO 8601 format: YYYY-MM-DD)
  //   - event (String) - Event name/title
  //   - venue (String) - Location of the event
  //   - time (String) - Event time (HH:MM format)
  //   - status (String) - Event status (upcoming, ongoing, completed)
  //   - updatedAt (Number) - Timestamp of last update
  //   - createdAt (Number) - Timestamp of creation
  //
  // API ENDPOINTS NEEDED:
  // 1. GET /api/admin/fixtures - Fetch all fixtures (sorted by date)
  // 2. POST /api/admin/fixtures - Create new fixture
  // 3. PUT /api/admin/fixtures/{fixtureId} - Update fixture details
  // 4. DELETE /api/admin/fixtures/{fixtureId} - Delete fixture
  // 5. GET /api/admin/fixtures?date={YYYY-MM-DD} - Get fixtures for specific date
  //
  // EXAMPLE AWS SDK USAGE (Node.js/Lambda):
  // const { DynamoDBClient, QueryCommand, PutCommand, UpdateCommand, DeleteCommand } = require("@aws-sdk/client-dynamodb");
  // const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
  // const client = new DynamoDBClient({ region: process.env.AWS_REGION });
  //
  // // Fetch all fixtures sorted by date
  // const queryCommand = new QueryCommand({
  //   TableName: "event_fixtures",
  //   IndexName: "dateIndex", // Create GSI on date for efficient queries
  //   ScanIndexForward: true // Sort ascending by date
  // });
  // const response = await client.send(queryCommand);
  // const fixtures = response.Items.map(item => unmarshall(item));
  //
  // // Create new fixture
  // const putCommand = new PutCommand({
  //   TableName: "event_fixtures",
  //   Item: marshall({
  //     fixtureId: generateUUID(),
  //     date: "2025-12-12",
  //     event: "100m Sprint Heats",
  //     venue: "Track Field A",
  //     time: "09:00",
  //     status: "upcoming",
  //     createdAt: Date.now(),
  //     updatedAt: Date.now()
  //   })
  // });
  // ============================================================================

  const [fixtures, setFixtures] = useState<Fixture[]>([
    {
      id: "1",
      date: "Dec 12, 2025",
      event: "100m Sprint Heats",
      venue: "Track Field A",
      time: "9:00 AM",
    },
    {
      id: "2",
      date: "Dec 13, 2025",
      event: "Basketball Semi-Finals",
      venue: "Indoor Stadium",
      time: "11:30 AM",
    },
    {
      id: "3",
      date: "Dec 14, 2025",
      event: "Closing Ceremony & Prize Distribution",
      venue: "Main Ground",
      time: "5:00 PM",
    },
  ])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Fixture | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newFixture, setNewFixture] = useState<Partial<Fixture>>({
    date: "",
    event: "",
    venue: "",
    time: "",
  })

  const handleEdit = (fixture: Fixture) => {
    setEditingId(fixture.id)
    setEditForm({ ...fixture })
  }

  const handleSave = () => {
    if (editForm) {
      setFixtures(fixtures.map((f) => (f.id === editForm.id ? editForm : f)))
      setEditingId(null)
      setEditForm(null)
      // TODO: AWS Integration - Call PUT /api/admin/fixtures/{fixtureId} to update DynamoDB
      console.log("[AWS] Update fixture:", editForm)
    }
  }

  const handleDelete = (id: string) => {
    setFixtures(fixtures.filter((f) => f.id !== id))
    // TODO: AWS Integration - Call DELETE /api/admin/fixtures/{fixtureId} to remove from DynamoDB
    console.log("[AWS] Delete fixture:", id)
  }

  const handleAddFixture = () => {
    if (newFixture.date && newFixture.event && newFixture.venue && newFixture.time) {
      const fixture: Fixture = {
        id: Date.now().toString(),
        date: newFixture.date || "",
        event: newFixture.event || "",
        venue: newFixture.venue || "",
        time: newFixture.time || "",
      }
      setFixtures([...fixtures, fixture])
      setNewFixture({ date: "", event: "", venue: "", time: "" })
      setShowAddForm(false)
      // TODO: AWS Integration - Call POST /api/admin/fixtures to create new entry in DynamoDB
      console.log("[AWS] Create new fixture:", fixture)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Calendar className="text-orange-500" />
          Fixtures Control
        </h1>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Fixture
        </Button>
      </div>

      {/* Add Fixture Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
              <CardHeader>
                <CardTitle>Add New Fixture</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newFixture.date || ""}
                    onChange={(e) => setNewFixture({ ...newFixture, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Event Name</Label>
                  <Input
                    value={newFixture.event || ""}
                    onChange={(e) => setNewFixture({ ...newFixture, event: e.target.value })}
                    placeholder="e.g., 100m Sprint Heats"
                  />
                </div>
                <div>
                  <Label>Venue</Label>
                  <Input
                    value={newFixture.venue || ""}
                    onChange={(e) => setNewFixture({ ...newFixture, venue: e.target.value })}
                    placeholder="e.g., Track Field A"
                  />
                </div>
                <div>
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={newFixture.time || ""}
                    onChange={(e) => setNewFixture({ ...newFixture, time: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddFixture} className="gap-2">
                    <Save className="w-4 h-4" />
                    Create
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixtures Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-800 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Event</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Venue</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Time</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fixtures.map((fixture) => (
                  <tr key={fixture.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900">
                    {editingId === fixture.id && editForm ? (
                      <>
                        <td className="px-6 py-4">
                          <Input
                            type="date"
                            value={editForm.date}
                            onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                            className="w-full"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <Input
                            value={editForm.event}
                            onChange={(e) => setEditForm({ ...editForm, event: e.target.value })}
                            className="w-full"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <Input
                            value={editForm.venue}
                            onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })}
                            className="w-full"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <Input
                            type="time"
                            value={editForm.time}
                            onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                            className="w-full"
                          />
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          <Button size="sm" onClick={handleSave} className="gap-2">
                            <Save className="w-4 h-4" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 text-sm">{fixture.date}</td>
                        <td className="px-6 py-4 text-sm font-medium">{fixture.event}</td>
                        <td className="px-6 py-4 text-sm flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-red-500" />
                          {fixture.venue}
                        </td>
                        <td className="px-6 py-4 text-sm flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-500" />
                          {fixture.time}
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(fixture)} className="gap-2">
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(fixture.id)}
                            className="gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </Button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}