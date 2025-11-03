'use client';

import { Amplify } from 'aws-amplify';
// The outputs file is generated in the root of your project 
// when you run `npx ampx sandbox` or deploy your backend.
import outputs from '../../amplify_outputs.json';

// Note: You may need to create a global CSS file for Amplify UI styles
// if you plan to use the built-in Authenticator component.
import '@aws-amplify/ui-react/styles.css'; 

// Configure Amplify once on the client side
// The { ssr: true } option is important for Next.js to use cookies for token storage.
Amplify.configure(outputs, { ssr: true });

// This component is purely for configuration and does not render any UI.
export default function AmplifyClientConfig() {
  return null;
}