"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { ScanTool } from "@/components/admin/scan-tool"
import { NewsSection } from "@/components/admin/news-section"
import { FixturesControl } from "@/components/admin/fixtures-control"
import { ScoreboardDashboard } from "@/components/admin/scoreboard-dashboard"

type AdminSection = "scan" | "news" | "scoreboard" | "fixtures";

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState<AdminSection>("scan")

  return (
    <AdminLayout activeSection={activeSection} onSectionChange={setActiveSection}>
      {activeSection === "scan" && <ScanTool />}
      {activeSection === "news" && <NewsSection />}
      {activeSection === "scoreboard" && <ScoreboardDashboard />}
      {activeSection === "fixtures" && <FixturesControl />}
    </AdminLayout>
  )
}
