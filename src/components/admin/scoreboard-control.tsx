"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trophy, Plus, Edit2, Trash2, Save } from "lucide-react"

interface School {
  id: string
  school: string
  color: string
  totalPoints: number
  sports: Record<string, number>
}

export function ScoreboardControl() {
  // ============================================================================
  // AWS INTEGRATION NOTES FOR BACKEND DEVELOPERS
  // ============================================================================
  // This component manages scoreboard data that should be stored in AWS DynamoDB
  //
  // TABLE STRUCTURE (DynamoDB):
  // Table Name: "sports_scores"
  // Primary Key: "schoolId" (String)
  // Attributes:
  //   - schoolId (String) - Unique identifier for school
  //   - schoolName (String) - Name of the school
  //   - color (String) - Hex color code for UI representation
  //   - totalPoints (Number) - Total points accumulated
  //   - sports (Map) - Object containing sport names as keys and points as values
  //   - updatedAt (Number) - Timestamp of last update
  //   - createdAt (Number) - Timestamp of creation
  //
  // API ENDPOINTS NEEDED:
  // 1. GET /api/admin/scores - Fetch all school scores
  // 2. POST /api/admin/scores - Create new school score entry
  // 3. PUT /api/admin/scores/{schoolId} - Update school score
  // 4. DELETE /api/admin/scores/{schoolId} - Delete school score
  // 5. PUT /api/admin/scores/{schoolId}/sports/{sportName} - Update specific sport points
  //
  // EXAMPLE AWS SDK USAGE (Node.js/Lambda):
  // const { DynamoDBClient, ScanCommand, PutCommand, UpdateCommand } = require("@aws-sdk/client-dynamodb");
  // const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
  // const client = new DynamoDBClient({ region: process.env.AWS_REGION });
  //
  // // Fetch all scores
  // const scanCommand = new ScanCommand({ TableName: "sports_scores" });
  // const response = await client.send(scanCommand);
  // const scores = response.Items.map(item => unmarshall(item));
  //
  // // Update score
  // const updateCommand = new UpdateCommand({
  //   TableName: "sports_scores",
  //   Key: marshall({ schoolId: schoolId }),
  //   UpdateExpression: "SET totalPoints = :points, updatedAt = :timestamp",
  //   ExpressionAttributeValues: marshall({
  //     ":points": newPoints,
  //     ":timestamp": Date.now()
  //   })
  // });
  // ============================================================================

  const [schools, setSchools] = useState<School[]>([
    {
      id: "1",
      school: "School of Commerce, Finance and Accountancy",
      color: "#3b82f6",
      totalPoints: 120,
      sports: { "100m": 8, "200m": 6, Football: 10, Basketball: 4, Volleyball: 7 },
    },
    {
      id: "2",
      school: "School of Business Management",
      color: "#8b5cf6",
      totalPoints: 100,
      sports: { "100m": 6, "200m": 8, Football: 9, "Table Tennis": 4, Badminton: 5 },
    },
  ])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<School | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newSchool, setNewSchool] = useState<Partial<School>>({
    school: "",
    color: "#3b82f6",
    totalPoints: 0,
    sports: {},
  })

  const handleEdit = (school: School) => {
    setEditingId(school.id)
    setEditForm({ ...school })
  }

  const handleSave = () => {
    if (editForm) {
      setSchools(schools.map((s) => (s.id === editForm.id ? editForm : s)))
      setEditingId(null)
      setEditForm(null)
      // TODO: AWS Integration - Call PUT /api/admin/scores/{schoolId} to update DynamoDB
      console.log("[AWS] Update school score:", editForm)
    }
  }

  const handleDelete = (id: string) => {
    setSchools(schools.filter((s) => s.id !== id))
    // TODO: AWS Integration - Call DELETE /api/admin/scores/{schoolId} to remove from DynamoDB
    console.log("[AWS] Delete school score:", id)
  }

  const handleAddSchool = () => {
    if (newSchool.school) {
      const school: School = {
        id: Date.now().toString(),
        school: newSchool.school || "",
        color: newSchool.color || "#3b82f6",
        totalPoints: newSchool.totalPoints || 0,
        sports: newSchool.sports || {},
      }
      setSchools([...schools, school])
      setNewSchool({ school: "", color: "#3b82f6", totalPoints: 0, sports: {} })
      setShowAddForm(false)
      // TODO: AWS Integration - Call POST /api/admin/scores to create new entry in DynamoDB
      console.log("[AWS] Create new school score:", school)
    }
  }

  const handleUpdateSportPoints = (schoolId: string, sport: string, points: number) => {
    setSchools(schools.map((s) => (s.id === schoolId ? { ...s, sports: { ...s.sports, [sport]: points } } : s)))
    // TODO: AWS Integration - Call PUT /api/admin/scores/{schoolId}/sports/{sport} to update specific sport
    console.log("[AWS] Update sport points:", { schoolId, sport, points })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Trophy className="text-yellow-500" />
          Scoreboard Control
        </h1>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add School
        </Button>
      </div>

      {/* Add School Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle>Add New School</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>School Name</Label>
                  <Input
                    value={newSchool.school || ""}
                    onChange={(e) => setNewSchool({ ...newSchool, school: e.target.value })}
                    placeholder="Enter school name"
                  />
                </div>
                <div>
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={newSchool.color || "#3b82f6"}
                      onChange={(e) => setNewSchool({ ...newSchool, color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={newSchool.color || "#3b82f6"}
                      onChange={(e) => setNewSchool({ ...newSchool, color: e.target.value })}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
                <div>
                  <Label>Initial Points</Label>
                  <Input
                    type="number"
                    value={newSchool.totalPoints || 0}
                    onChange={(e) => setNewSchool({ ...newSchool, totalPoints: Number.parseInt(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddSchool} className="gap-2">
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

      {/* Schools List */}
      <div className="space-y-4">
        {schools.map((school) => (
          <Card key={school.id} className="overflow-hidden">
            <CardHeader className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: school.color }} />
                <div>
                  <CardTitle className="text-lg">{school.school}</CardTitle>
                  <p className="text-sm text-gray-500">Total Points: {school.totalPoints}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {editingId === school.id ? (
                  <>
                    <Button size="sm" onClick={handleSave} className="gap-2">
                      <Save className="w-4 h-4" />
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(school)} className="gap-2">
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(school.id)} className="gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>

            {/* Edit Form or Sports Display */}
            <CardContent className="space-y-4">
              {editingId === school.id && editForm ? (
                <div className="space-y-4">
                  <div>
                    <Label>School Name</Label>
                    <Input
                      value={editForm.school}
                      onChange={(e) => setEditForm({ ...editForm, school: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Total Points</Label>
                    <Input
                      type="number"
                      value={editForm.totalPoints}
                      onChange={(e) => setEditForm({ ...editForm, totalPoints: Number.parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Sports Points</Label>
                    <div className="space-y-2">
                      {Object.entries(editForm.sports).map(([sport, points]) => (
                        <div key={sport} className="flex gap-2 items-center">
                          <span className="w-32">{sport}</span>
                          <Input
                            type="number"
                            value={points}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                sports: {
                                  ...editForm.sports,
                                  [sport]: Number.parseInt(e.target.value),
                                },
                              })
                            }
                            className="w-20"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(school.sports).map(([sport, points]) => (
                    <div key={sport} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
                      <p className="text-sm font-medium">{sport}</p>
                      <p className="text-lg font-bold text-blue-600">{points}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}