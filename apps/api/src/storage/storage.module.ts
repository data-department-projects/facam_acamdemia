/**
 * Module global : client Supabase Storage partagé (uploads sécurisés via service role).
 */

import { Global, Module } from '@nestjs/common';
import { AppStorageService } from './app-storage.service';

@Global()
@Module({
  providers: [AppStorageService],
  exports: [AppStorageService],
})
export class StorageModule {}
