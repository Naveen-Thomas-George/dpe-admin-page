"use client"

import { GalleryVerticalEnd } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // TODO: Backend Dev - Integrate AWS Cognito login here
    // Steps:
    // 1. Import AWS SDK or use API route (e.g., Next.js API route at /api/auth)
    // 2. Use the email from state to authenticate with AWS Cognito
    //    Example: const cognito = new CognitoIdentityProviderClient({ region: 'your-region' })
    //             const command = new InitiateAuthCommand({
    //               ClientId: 'your-client-id',
    //               AuthFlow: 'USER_PASSWORD_AUTH',
    //               AuthParameters: { USERNAME: email, PASSWORD: 'password-if-needed' }
    //             })
    //             const response = await cognito.send(command)
    // 3. If authentication succeeds (check response for tokens), redirect to /admin
    // 4. If fails, set error state with message
    // 5. Handle loading state and any additional validation

    try {
      // Placeholder: Replace with actual AWS integration
      // const response = await fetch('/api/auth', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email })
      // })
      // const data = await response.json()
      // if (data.success) {
      //   router.push('/admin')
      // } else {
      //   setError(data.message || 'Login failed')
      // }

      // For now, simulate success and redirect
      setTimeout(() => {
        router.push('/admin')
      }, 1000) // Simulate API call delay
    } catch (err) {
      setError('An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <a
              href="@/app/admin"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-8 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-6" />
              </div>
              <span className="sr-only">Acme Inc.</span>
            </a>
            <h1 className="text-xl font-bold">Welcome to Admin Overwatch</h1>
            <FieldDescription>
              Please Contact a systmem administrator for any login issues.
            </FieldDescription>
          </div>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder=".chirstuniversity.in"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          {error && (
            <FieldDescription className="text-red-500">
              {error}
            </FieldDescription>
          )}
          <Field>
            <Button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}
