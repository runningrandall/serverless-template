'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import { Amplify } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';

Amplify.configure({
    Auth: {
        Cognito: {
            userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID!,
            userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID!,
        },
    },
});

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <Authenticator.Provider>
            {children}
        </Authenticator.Provider>
    );
}
