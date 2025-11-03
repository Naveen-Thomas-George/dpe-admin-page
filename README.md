This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) and integrated with AWS Amplify for authentication and data management.

## Getting Started

### Prerequisites
- Node.js (version 18 or higher)
- npm, yarn, pnpm, or bun

### Installation
1. Clone the repository or download the project files.
2. Navigate to the project directory.
3. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### Amplify Setup (Required for Authentication and Data)
This project uses AWS Amplify for authentication and data management. To set up Amplify:

1. Install the Amplify CLI globally (if not already installed):
```bash
npm install -g @aws-amplify/cli
```

2. Initialize Amplify in the project:
```bash
npx ampx sandbox
```

This command will:
- Create AWS resources (Cognito User Pool, AppSync GraphQL API, etc.)
- Generate `amplify_outputs.json` with your specific configuration
- Start a local sandbox environment

**Note:** The `amplify_outputs.json` file contains your personal AWS resource IDs and should not be shared. If you receive this project from someone else, you must run `npx ampx sandbox` to generate your own configuration file.

### Running the Development Server
After installing dependencies and setting up Amplify, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
