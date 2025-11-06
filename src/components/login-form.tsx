"use client"

import React, { useEffect } from "react"
import { GalleryVerticalEnd } from "lucide-react"
import { useRouter } from "next/navigation"
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react"
import { cn } from "@/lib/utils"

export function LoginForm({
 className,
 ...props
}: React.ComponentProps<"div">) {
 const router = useRouter()
 const { authStatus } = useAuthenticator(context => [context.authStatus])

 // Effect to handle redirection upon successful login
 useEffect(() => {
  // This check handles the case where the user is already authenticated
  if (authStatus === 'authenticated') {
   router.push('/admin') // Redirect to the protected admin page
  }
 }, [authStatus, router])

 // --- Custom Components for Authenticator UI ---
 const components = {
  Header() {
   return (
    <div className="flex flex-col items-center justify-center p-6 pb-2 border-b border-gray-100">
     <GalleryVerticalEnd className="h-10 w-10 text-blue-600 mb-2" />
     <h2 className="text-2xl font-bold text-gray-800">Admin Login</h2>
     <p className="text-sm text-gray-500 mt-1">
      Sign in to access the event management system.
     </p>
    </div>
   );
  },
  Footer() {
   return (
    <div className="text-center p-4 pt-2 text-xs text-gray-400 border-t border-gray-100 mt-4">
     © 2025 Event Check-in System
    </div>
   );
  },
 };
 // --- END Custom Components ---

 // Render the Authenticator
 return (
  <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
    <div className={cn("flex flex-col gap-6", className)} {...props}>
     <Authenticator
      initialState="signIn"
      hideSignUp={true}
      components={components}
     >
      {() => <></>}
     </Authenticator>
    </div>
  </div>
 )
}