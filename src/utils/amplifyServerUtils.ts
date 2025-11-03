import { cookies } from 'next/headers';
import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import { generateServerClientUsingCookies } from '@aws-amplify/adapter-nextjs/api';
import { getCurrentUser } from 'aws-amplify/auth/server';

// Assuming your backend defines its schema in this location
// You will need to create this file after deploying your backend for the first time
import { type Schema } from '@/amplify/data/resource'; 

// Use the generated configuration file
import outputs from '@/amplify_outputs.json'; 

// 1. Setup the Server Runner
export const { runWithAmplifyServerContext } = createServerRunner({
  config: outputs,
});

// 2. Setup a cookie-based client for Server Components and Server Actions
// This client securely reads the necessary session cookies.
export const cookieBasedClient = generateServerClientUsingCookies<Schema>({
  config: outputs,
  cookies,
});

// 3. Utility function to get the current user in a Server Context
export async function AuthGetCurrentUserServer() {
  try {
    const currentUser = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => getCurrentUser(contextSpec),
    });
    return currentUser;
  } catch (error) {
    console.error(error);
    return null;
  }
}