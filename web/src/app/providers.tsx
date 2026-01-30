"use client";

import React from "react";
import { Amplify } from "aws-amplify";

const userPoolId = process.env.NEXT_PUBLIC_USER_POOL_ID;
const userPoolClientId = process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID;

if (!userPoolId || !userPoolClientId) {
  console.error("❌ Missing Amplify env vars", { userPoolId, userPoolClientId });
} else {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
        loginWith: {
          email: true,
        },
      },
    },
  });

  console.log("✅ Amplify configured", { userPoolId, userPoolClientId });
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
