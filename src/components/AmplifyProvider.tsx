'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import React from 'react';

// Conditionally configure Amplify only if amplify_outputs.json exists
try {
  const { Amplify } = require('aws-amplify');
  const outputs = require('../../amplify_outputs.json');
  Amplify.configure(outputs);
} catch (error) {
  console.warn('Amplify configuration skipped: amplify_outputs.json not found or invalid. Please run `npx ampx sandbox` to set up Amplify.');
}

/**
 * Wraps the application with the Amplify Authenticator Provider.
 */
export function AmplifyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Authenticator.Provider>{children}</Authenticator.Provider>;
}
