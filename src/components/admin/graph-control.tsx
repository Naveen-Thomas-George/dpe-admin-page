"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BarChart3, LineChartIcon, PieChart, Settings, X, Check } from "lucide-react"

interface GraphConfig {
  refreshInterval: number
  dataSource: string
  chartType: string
}

interface GraphSettings {
  scoreboard: GraphConfig
  comparison: GraphConfig
  fixtures: GraphConfig
}

interface GraphCardProps {
  title: string
  icon: React.ComponentType<{ className?: string }>
  graphName: string
  description: string
}

// TODO: Backend Dev - Integrate AWS DynamoDB for Graph Configuration and Data
// Steps:
// 1. Store graph configurations in DynamoDB table 'graph_configs'
//    Example: const dynamodb = new DynamoDBClient({ region: 'your-region' })
//             const getConfigCommand = new GetItemCommand({
//               TableName: 'graph_configs',
//               Key: { id: { S: 'global_settings' } }
//             })
//             const configResponse = await dynamodb.send(getConfigCommand)
//             const configs = unmarshall(configResponse.Item)
// 2. Fetch actual graph data from DynamoDB tables like 'scores', 'fixtures', etc.
//    Example: const dataCommand = new ScanCommand({ TableName: 'scores' })
//             const dataResponse = await dynamodb.send(dataCommand)
//             const graphData = dataResponse.Items.map(item => unmarshall(item))
// 3. Save configuration changes back to DynamoDB using PutItemCommand
// 4. Implement real-time data updates for live graphs
// 5. Add error handling for database connectivity issues

export function GraphControl() {
  const [settings, setSettings] = useState<GraphSettings>({
    scoreboard: {
      refreshInterval: 5,
      dataSource: "AWS DynamoDB",
      chartType: "bar",
    },
    comparison: {
      refreshInterval: 5,
      dataSource: "AWS DynamoDB",
      chartType: "radar",
    },
    fixtures: {
      refreshInterval: 10,
      dataSource: "AWS DynamoDB",
      chartType: "timeline",
    },
  })

  const [globalSettings, setGlobalSettings] = useState({
    autoRefresh: 5,
    dataSource: "AWS DynamoDB",
  })

  const [editingGraph, setEditingGraph] = useState<string | null>(null)
  const [tempSettings, setTempSettings] = useState<GraphConfig | null>(null)
  const [savedMessage, setSavedMessage] = useState(false)

  const handleEditGraph = (graphName: string) => {
    setEditingGraph(graphName)
    setTempSettings(settings[graphName as keyof GraphSettings])
  }

  const handleSaveGraphConfig = () => {
    if (editingGraph && tempSettings) {
      setSettings({
        ...settings,
        [editingGraph]: tempSettings,
      })
      setEditingGraph(null)
      setTempSettings(null)
      setSavedMessage(true)
      setTimeout(() => setSavedMessage(false), 2000)
    }
  }

  const handleCancel = () => {
    setEditingGraph(null)
    setTempSettings(null)
  }

  const handleSaveGlobalSettings = () => {
    setSavedMessage(true)
    setTimeout(() => setSavedMessage(false), 2000)
  }

  const GraphCard = ({ title, icon: Icon, graphName, description }: any) => {
    const config = settings[graphName as keyof GraphSettings]
    const isEditing = editingGraph === graphName

    return (
      <Card className={`hover:border-primary transition-colors ${isEditing ? "border-primary" : ""}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-primary" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing && tempSettings ? (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <div>
                <label className="text-sm font-medium">Refresh Interval (seconds)</label>
                <Input
                  type="number"
                  min="1"
                  max="60"
                  value={tempSettings.refreshInterval}
                  onChange={(e) =>
                    setTempSettings({
                      ...tempSettings,
                      refreshInterval: Number.parseInt(e.target.value),
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Chart Type</label>
                <select
                  value={tempSettings.chartType}
                  onChange={(e) =>
                    setTempSettings({
                      ...tempSettings,
                      chartType: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-input rounded-md mt-1 bg-background text-foreground"
                >
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="radar">Radar Chart</option>
                  <option value="pie">Pie Chart</option>
                  <option value="timeline">Timeline</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveGraphConfig} size="sm" className="flex-1">
                  <Check className="w-4 h-4 mr-1" />
                  Save
                </Button>
                <Button onClick={handleCancel} variant="outline" size="sm" className="flex-1 bg-transparent">
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Refresh:</span>
                  <span className="font-medium">{config.refreshInterval}s</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Chart Type:</span>
                  <span className="font-medium capitalize">{config.chartType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Data Source:</span>
                  <span className="font-medium">{config.dataSource}</span>
                </div>
              </div>
              <Button variant="outline" className="w-full bg-transparent" onClick={() => handleEditGraph(graphName)}>
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Graph Control</h2>
        <p className="text-muted-foreground mt-2">Manage and configure graphs displayed on the website</p>
      </div>

      {savedMessage && (
        <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg flex gap-2">
          <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-primary">Settings saved successfully!</p>
        </div>
      )}

      {/* Graph Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <GraphCard
          title="Scoreboard"
          icon={BarChart3}
          graphName="scoreboard"
          description="School performance metrics"
        />
        <GraphCard
          title="Comparison"
          icon={LineChartIcon}
          graphName="comparison"
          description="School comparison analytics"
        />
        <GraphCard title="Fixtures" icon={PieChart} graphName="fixtures" description="Event schedule management" />
      </div>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Global Graph Settings</CardTitle>
          <CardDescription>Configure settings that apply to all graphs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Auto-refresh Interval (seconds)</label>
              <Input
                type="number"
                min="1"
                max="60"
                value={globalSettings.autoRefresh}
                onChange={(e) =>
                  setGlobalSettings({
                    ...globalSettings,
                    autoRefresh: Number.parseInt(e.target.value),
                  })
                }
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Data Source</label>
              <select
                value={globalSettings.dataSource}
                onChange={(e) =>
                  setGlobalSettings({
                    ...globalSettings,
                    dataSource: e.target.value,
                  })
                }
                className="w-full p-2 border border-input rounded-md mt-1 bg-background text-foreground"
              >
                <option>AWS DynamoDB</option>
                <option>AWS RDS</option>
                <option>AWS S3</option>
                <option>REST API</option>
              </select>
            </div>
          </div>
          <Button onClick={handleSaveGlobalSettings}>
            <Check className="w-4 h-4 mr-2" />
            Save Global Settings
          </Button>
        </CardContent>
      </Card>

      {/* Configuration Info */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">Configuration Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-medium">Active Graphs:</span> 3 (Scoreboard, Comparison, Fixtures)
          </p>
          <p>
            <span className="font-medium">Global Refresh:</span> {globalSettings.autoRefresh}s
          </p>
          <p>
            <span className="font-medium">Data Source:</span> {globalSettings.dataSource}
          </p>
          <p className="text-muted-foreground text-xs mt-4">
            All graph configurations are stored locally. Connect to AWS services to persist changes.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}