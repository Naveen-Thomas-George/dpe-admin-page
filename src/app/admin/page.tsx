"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { ScanTool } from "@/components/admin/scan-tool"
import { NewsSection } from "@/components/admin/news-section"
import { ScoreboardControl } from "@/components/admin/scoreboard-control"
import { FixturesControl } from "@/components/admin/fixtures-control"

type AdminSection = "scan" | "news" | "scoreboard" | "fixtures" | "graphs"

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState<AdminSection>("scan")

  return (
    <AdminLayout activeSection={activeSection} onSectionChange={setActiveSection}>
      {activeSection === "scan" && <ScanTool />}
      {activeSection === "news" && <NewsSection />}
      {activeSection === "scoreboard" && <ScoreboardControl />}
      {activeSection === "fixtures" && <FixturesControl />}
    </AdminLayout>
  )
}
