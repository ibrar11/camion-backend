import { Module } from '@nestjs/common';

import { FirebaseAdminProvider } from './provider/firebase.provider';

@Module({
	providers: [
		FirebaseAdminProvider,
	],
	exports: [FirebaseAdminProvider],
})
export class FirebaseModule {}
