import * as admin from 'firebase-admin';

import { Provider } from '@nestjs/common';

export const FIREBASE_ADMIN = 'FIREBASE_ADMIN';

export const FirebaseAdminProvider: Provider = {
    provide: FIREBASE_ADMIN,
    useFactory: () => {
        const b64 = process.env.FIREBASE_CREDENTIALS_BASE64 || '';

        // Skip Firebase initialization if credentials are not provided
        if (!b64 || b64 === 'BASE64_OF_SERVICE_ACCOUNT_JSON') {
            console.warn('[Firebase] No valid credentials provided. Firebase features will be disabled.');
            return null;
        }

        try {
            const jsonStr = Buffer.from(b64, 'base64').toString('utf8');
            const credential = JSON.parse(jsonStr);

            if (!admin.apps.length) {
                admin.initializeApp({
                    credential: admin.credential.cert(credential),
                });
            }
            return admin;
        } catch (error: any) {
            console.error('[Firebase] Failed to initialize:', error.message);
            return null;
        }
    },
};
