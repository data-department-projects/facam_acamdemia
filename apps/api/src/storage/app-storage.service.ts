/**
 * Point d’accès unique à Supabase Storage (bucket `app-storage`) : profils, images modules, documents cours.
 * Tous les uploads passent par la clé service côté API ; le JWT Nest contrôle les droits métier.
 */

import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import {
  APP_STORAGE_BUCKET,
  CHAPTER_DOC_MAX_BYTES,
  CHAPTER_DOC_MIME,
  LEGACY_AVATARS_BUCKET,
  MODULE_IMAGE_MAX_BYTES,
  MODULE_IMAGE_MIME,
  PROFILE_IMAGE_MAX_BYTES,
  STORAGE_PREFIX,
} from './app-storage.constants';

export interface ParsedStorageRef {
  bucket: string;
  path: string;
}

@Injectable()
export class AppStorageService {
  private readonly logger = new Logger(AppStorageService.name);
  private readonly client: SupabaseClient | null;

  constructor(private readonly config: ConfigService) {
    const url =
      this.config.get<string>('SUPABASE_URL') ??
      this.config.get<string>('NEXT_PUBLIC_SUPABASE_URL');
    const key = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (url && key) {
      this.client = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    } else {
      this.logger.warn(
        'Supabase Storage indisponible (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY). Uploads fichiers désactivés.'
      );
      this.client = null;
    }
  }

  isReady(): boolean {
    return this.client !== null;
  }

  assertReady(): void {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'Stockage de fichiers indisponible. Vérifiez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.'
      );
    }
  }

  parsePublicUrl(publicUrl: string): ParsedStorageRef | null {
    const markers: { bucket: string; prefix: string }[] = [
      { bucket: APP_STORAGE_BUCKET, prefix: `/object/public/${APP_STORAGE_BUCKET}/` },
      { bucket: LEGACY_AVATARS_BUCKET, prefix: `/object/public/${LEGACY_AVATARS_BUCKET}/` },
    ];
    for (const { bucket, prefix } of markers) {
      const idx = publicUrl.indexOf(prefix);
      if (idx === -1) continue;
      const path = publicUrl.slice(idx + prefix.length).split('?')[0];
      if (path.length > 0) return { bucket, path: decodeURIComponent(path) };
    }
    return null;
  }

  private async removePath(bucket: string, path: string): Promise<void> {
    this.assertReady();
    const { error } = await this.client!.storage.from(bucket).remove([path]);
    if (error) {
      this.logger.warn(`Suppression Storage [${bucket}] ${path} : ${error.message}`);
    }
  }

  /** Avatar : nouveau chemin `profils/{userId}/…` ; suppression ancien `avatars/` ou `profils/`. */
  extForProfileMime(mime: string | undefined): string | null {
    if (!mime) return null;
    return MODULE_IMAGE_MIME[mime.toLowerCase()] ?? null;
  }

  async removeUserProfileImageByUrlIfOwned(publicUrl: string, userId: string): Promise<void> {
    const ref = this.parsePublicUrl(publicUrl);
    if (!ref) return;
    const { bucket, path } = ref;
    const okProfils = path.startsWith(`${STORAGE_PREFIX.profils}/${userId}/`);
    const okLegacy = bucket === LEGACY_AVATARS_BUCKET && path.startsWith(`${userId}/`);
    if (!okProfils && !okLegacy) {
      this.logger.warn(`Refus suppression profil : chemin non autorisé (${path})`);
      return;
    }
    await this.removePath(bucket, path);
  }

  async uploadUserProfileImage(
    userId: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<{ publicUrl: string }> {
    this.assertReady();
    const ext = this.extForProfileMime(mimeType);
    if (!ext) throw new Error('MIME image profil non autorisé');
    if (buffer.length > PROFILE_IMAGE_MAX_BYTES) throw new Error('Image profil trop volumineuse');
    const objectPath = `${STORAGE_PREFIX.profils}/${userId}/${Date.now()}-${randomBytes(8).toString('hex')}.${ext}`;
    return this.putObject(objectPath, buffer, mimeType);
  }

  extForModuleImageMime(mime: string | undefined): string | null {
    return this.extForProfileMime(mime);
  }

  async removeModuleCoverImageByUrlIfOwned(publicUrl: string, moduleId: string): Promise<void> {
    const ref = this.parsePublicUrl(publicUrl);
    if (!ref || ref.bucket !== APP_STORAGE_BUCKET) return;
    const prefix = `${STORAGE_PREFIX.moduleImages}/${moduleId}/`;
    if (!ref.path.startsWith(prefix)) {
      this.logger.warn(`Refus suppression couverture module : préfixe invalide (${ref.path})`);
      return;
    }
    await this.removePath(APP_STORAGE_BUCKET, ref.path);
  }

  async uploadModuleCoverImage(
    moduleId: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<{ publicUrl: string }> {
    this.assertReady();
    const ext = this.extForModuleImageMime(mimeType);
    if (!ext) throw new Error('MIME image module non autorisé');
    if (buffer.length > MODULE_IMAGE_MAX_BYTES) throw new Error('Image module trop volumineuse');
    const objectPath = `${STORAGE_PREFIX.moduleImages}/${moduleId}/${Date.now()}-${randomBytes(6).toString('hex')}.${ext}`;
    return this.putObject(objectPath, buffer, mimeType);
  }

  extForChapterDocMime(mime: string | undefined): string | null {
    if (!mime) return null;
    return CHAPTER_DOC_MIME[mime.toLowerCase()] ?? null;
  }

  async removeChapterDocumentByUrlIfOwned(
    publicUrl: string,
    moduleId: string,
    chapterId: string
  ): Promise<void> {
    const ref = this.parsePublicUrl(publicUrl);
    if (!ref || ref.bucket !== APP_STORAGE_BUCKET) return;
    const prefix = `${STORAGE_PREFIX.cours}/${moduleId}/${chapterId}/`;
    if (!ref.path.startsWith(prefix)) {
      this.logger.warn(`Refus suppression document : préfixe invalide (${ref.path})`);
      return;
    }
    await this.removePath(APP_STORAGE_BUCKET, ref.path);
  }

  async uploadChapterDocument(
    moduleId: string,
    chapterId: string,
    buffer: Buffer,
    mimeType: string,
    originalName?: string
  ): Promise<{ publicUrl: string }> {
    this.assertReady();
    const ext = this.extForChapterDocMime(mimeType);
    if (!ext) throw new Error('Type de document non autorisé (PDF, PPTX, DOCX, DOC, PPT)');
    if (buffer.length > CHAPTER_DOC_MAX_BYTES)
      throw new Error('Document trop volumineux (max 50 Mo)');
    const stamp = `${Date.now()}-${randomBytes(6).toString('hex')}`;
    const safeBase = (originalName ?? 'document').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80);
    const objectPath = `${STORAGE_PREFIX.cours}/${moduleId}/${chapterId}/${stamp}-${safeBase}.${ext}`;
    return this.putObject(objectPath, buffer, mimeType, '86400');
  }

  /**
   * Génère une URL signée (temporaire) à partir d’une URL publique Supabase Storage.
   * Utile si le bucket/policies changent (privé) ou pour garder un contrôle d’accès côté API.
   */
  async createSignedUrlFromPublicUrl(
    publicUrl: string,
    expiresInSeconds = 60 * 10
  ): Promise<{ signedUrl: string }> {
    this.assertReady();
    const ref = this.parsePublicUrl(publicUrl);
    if (!ref) {
      throw new Error('URL Storage invalide ou non supportée.');
    }
    const { bucket, path } = ref;
    const { data, error } = await this.client!.storage.from(bucket).createSignedUrl(
      path,
      expiresInSeconds
    );
    if (error || !data?.signedUrl) {
      throw new Error(error?.message ?? 'Impossible de générer une URL signée.');
    }
    return { signedUrl: data.signedUrl };
  }

  private async putObject(
    path: string,
    buffer: Buffer,
    contentType: string,
    cacheControl = '3600'
  ): Promise<{ publicUrl: string }> {
    const { error } = await this.client!.storage.from(APP_STORAGE_BUCKET).upload(path, buffer, {
      contentType,
      upsert: false,
      cacheControl,
    });
    if (error) {
      this.logger.error(`Upload ${path} : ${error.message}`);
      throw new Error(error.message);
    }
    const { data } = this.client!.storage.from(APP_STORAGE_BUCKET).getPublicUrl(path);
    return { publicUrl: data.publicUrl };
  }
}
