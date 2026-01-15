"use client"

import { useRouter } from "next/navigation"
import LoginForm from "@/components/login-form"

export default function LoginPage() {
  const router = useRouter()

  const handleLoginSuccess = (user: { username: string }) => {
    // Redirect to admin page after successful login
    router.push('/admin')
  }

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      </div>
    </div>
  )
}
