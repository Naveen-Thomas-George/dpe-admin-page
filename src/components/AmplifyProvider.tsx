'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import React from 'react';

/**
 * Wraps your app with Amplify Authenticator context.
 * Configuration happens in AmplifyClientConfig.tsx.
 */
export function AmplifyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Authenticator.Provider>{children}</Authenticator.Provider>;
}
