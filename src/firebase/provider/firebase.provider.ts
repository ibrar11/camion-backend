import * as admin from 'firebase-admin';

import { Provider } from '@nestjs/common';

export const FIREBASE_ADMIN = 'FIREBASE_ADMIN';

export const FirebaseAdminProvider: Provider = {
    provide: FIREBASE_ADMIN,
    useFactory: () => {
        const environment = process.env.NODE_ENV || '';
        const b64 = (environment === 'prod') ? process.env.FIREBASE_CREDENTIALS_BASE64
            : (environment === 'dev') ? process.env.FIREBASE_CREDENTIALS_BASE64_DEV
                : 'ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAiY2FtaW9uLTIxOTIxIiwKICAicHJpdmF0ZV9rZXlfaWQiOiAiNzA2MWZjYWY5YzJmMzg0MjZlYmU4MTVjNjQwY2U3YjE4ZDZmZjlhOCIsCiAgInByaXZhdGVfa2V5IjogIi0tLS0tQkVHSU4gUFJJVkFURSBLRVktLS0tLVxuTUlJRXZBSUJBREFOQmdrcWhraUc5dzBCQVFFRkFBU0NCS1l3Z2dTaUFnRUFBb0lCQVFERE80U2JsdHhCNzFwb1xuYkhFS2dBbEEzbThyNTVzcmdhdVhCSXdGTmtuQ24wY2dTK2tMR216WUkyRUpnSFY1L3g3R1F3QlhFYTUwK2xaVFxuOHROT2tFR3Vxdnp1VTdJMjBjUTMyaWc4U3g1OGprb0wwNFE4SW9NdHFDbUhCYUJNeUhUTVRSWEh5RExqcnhHWlxuckFiZVhJSDkrSG40TWUraHZiYkpva3dnNldKTmxqTjJHWFRLWW5sZjlnYU1wR1NFOGJQREVhUzh3WHFvY2laWFxuOGlGbHp2bG55L1FBbnRxd1YzNjZ2V2ZxK0tHOEphaVlLb0FxcTNabDc0elNUOGQ4V0xRR3IyaUEwcWovVENDb1xuaDg4WWRoN0RlcEZVMGZBdldvVWFuaTlaRllNNWNueExNbGxtbkpwVlFuTDdTRkE3WXNsK0J2UGcvaVloeDZJWFxuSVBnODhmeHpBZ01CQUFFQ2dnRUFIcjZ5dXJzejR5dWZDeTdOKzhuL1ZiaUhFckpJaDJqR1F1UUpGanUwWmZKN1xuV3ZvRUJkR2EyU0Z6Mkp2aTVERnBxKzN2NXh1aERrbVdGV1pQZHpjcDFpaVY2RnBFaUhRdStGOWgvV0lVWWxKdVxuRldxeE9sOGRBQVdwZElWTm9kODNpdGVMaElpM0t1VkRyNkJJVWZXSTFjYXU2VEp1cGE2Z3FIbVI1T1R4VnRKTVxuOC9SeWhKdHRxSGhPRkN0c3hzZlI2emNWMWpGSnI3ZHhxblZqZXNKSThnc1RWakRXeVpCT1ZrOVoyQThObEloTFxubUdvUlpyL0RvWXE4eGFRaTI5MjU2YUE5QURiUkFlWUNsN3RSa1ZNTzRmQWFEOURJZ0FtR3hKM2YrZGpYalFjQ1xuSTdpWDBrUm0wblo2ZlRDWDhERnNGMGorVXRIeUZlN1dJclMwM2I4ZDhRS0JnUUQ4VE5jQ1hyTG1DZS9SamVEUVxuRUpsRGNTREx1eC9iWkFOeFIyV3VRY3JDRDlOT2c3QjJobTVJdXlTaVYyVS90eVdudXdJcndkZ09JTkpSYU01VVxuNDgvZG04WTl0WGVOai9QSytPRW5HanM1SGxNOFFJejlxZVhiRkVjUzZTUkZFak0rbUNhcUdBM25RRUtqeXlYVFxuemVoZ1JJSG5KbEpyYUNQbk5aR0JNR3dxclFLQmdRREdHSEM4dFlXdXFCeWlINmFSY0pPd0Y0SmtPa3BMNGVXblxuQXRqTXc2b3FrY1AxMXd6Y01RTFVDYjNHdytPdEVtNC9sZHhtTHJBZ01FQ3RweGtHUDlHYWJGQUtoVWQyOW5TTVxuMTJnZHpJb0kvZVdJdFRhem9TdUphVlBucExrSXNjSXlaMHB2YkFVT2ZZYlNhN3oxS0N4bTIrV1ZGOHdSazh4R1xuaXRiVWlOUEhud0tCZ0M0UjNlVDU0OUxybDVYOVFVTGM5UStDbGNsOTF0aFp6K01jZFcyM1o4MjkxQWp2TlFhL1xuajEzS2htcjZhR3VWQnRRMDZyV1F4T0gzamsvOVFrZnYvV0hxOHUwTHVOUHBxRXUwM0hBbWN4QUFBSlRzK0pITlxuTjBLazFrR1d2dCs1N2crTSt1cHVVQU9kRVU0VlowZmd2b0R0b1liUzBaUDVSUzBQOUF6U0NiNVZBb0dBWDY2WVxuYloza0J6dXVNT1RHeU1NdW9zU0lONjhzQ2NELzh3NWQ5M0dlOU5iWlp4cExYT1BUY09XUG83MGtjSWxSZFNjR1xuZ05pV084WHl4NjNKV1lwanpJbjZrMHBTL1hRSFVhd04zeTdYa1laSll5SGNYU0ZBN1N0UjJyWm1wWHR1eUhlNVxuclYzb2gxbzhUOUM0UVZYNU5HbU1WOXBadURmQ1dHUmhaZUQ5SWhNQ2dZQTFFRGpDWnNna0tmR2EvT3pzODlxVFxuaHdqam9oTCt2NkpYdG8xT1dIYkdYOHlFMWsyMTJUMkY0U2E1N2RNamJqRWMvZnFRL0Z4ODlpMXNtK3o3UjcwMFxuclZWMlVNaDJiMHBWTzcvVGJuaUMvQlNZZ1dRL2F3NlIyNG1tME5GMlcwRkFCN01hTVB2dFZiZ0I2UTczQlJuR1xuMHBiQXNheTNyVVFUaS8zWGF4Z2l4dz09XG4tLS0tLUVORCBQUklWQVRFIEtFWS0tLS0tXG4iLAogICJjbGllbnRfZW1haWwiOiAiZmlyZWJhc2UtYWRtaW5zZGstZmJzdmNAY2FtaW9uLTIxOTIxLmlhbS5nc2VydmljZWFjY291bnQuY29tIiwKICAiY2xpZW50X2lkIjogIjExNjkxNzc1NTI2NDM5NjMyODczNSIsCiAgImF1dGhfdXJpIjogImh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbS9vL29hdXRoMi9hdXRoIiwKICAidG9rZW5fdXJpIjogImh0dHBzOi8vb2F1dGgyLmdvb2dsZWFwaXMuY29tL3Rva2VuIiwKICAiYXV0aF9wcm92aWRlcl94NTA5X2NlcnRfdXJsIjogImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL29hdXRoMi92MS9jZXJ0cyIsCiAgImNsaWVudF94NTA5X2NlcnRfdXJsIjogImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL3JvYm90L3YxL21ldGFkYXRhL3g1MDkvZmlyZWJhc2UtYWRtaW5zZGstZmJzdmMlNDBjYW1pb24tMjE5MjEuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJ1bml2ZXJzZV9kb21haW4iOiAiZ29vZ2xlYXBpcy5jb20iCn0K';

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
