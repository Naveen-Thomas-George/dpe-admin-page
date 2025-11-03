"use client"

import { GalleryVerticalEnd } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
// ** Import Amplify components and hooks **
import { useAuthenticator, Authenticator } from "@aws-amplify/ui-react"
import "@aws-amplify/ui-react/styles.css"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { FieldDescription } from "@/components/ui/field"

// ⚠️ Note: You need to configure Amplify in your application root (e.g., in layout.tsx 
// or a client-side wrapper) like this:
//
// import { Amplify } from "aws-amplify";
// import outputs from "@/amplify_outputs.json";
// Amplify.configure(outputs);

/**
 * ⚠️ IMPORTANT: This file now acts as the wrapper for the Amplify Authenticator.
 * The Authenticator handles the entire login UI and state.
 * * Your original UI elements are preserved in a custom Header/Footer/Component 
 * when using the Authenticator, but for simplicity here, we'll use the default 
 * Authenticator and focus on the redirection after successful login.
 */
export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  // Use useAuthenticator hook to get the user state and status
  const { authStatus } = useAuthenticator(context => [context.authStatus])

  // Effect to handle redirection upon successful login
  useEffect(() => {
    // Check if the user is authenticated
    if (authStatus === 'authenticated') {
      router.push('/admin') // Redirect to the admin page
    }
  }, [authStatus, router])

  // Render a custom component that incorporates the Authenticator
  // We use the Authenticator here directly to take advantage of its built-in UI
  // which can be customized further if needed.
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Authenticator
        // Only show the sign in flow for the login page
        initialState="signIn"
        // ⬇️ ADD THIS PROP TO HIDE THE SIGN UP TAB
        hideSignUp={true} 
        // This is where you would place a custom UI component to match your design
        components={{
          // ... (existing Header and Footer components)
        }}
      >
        {() => null} 
      </Authenticator>
    </div>
  )
}