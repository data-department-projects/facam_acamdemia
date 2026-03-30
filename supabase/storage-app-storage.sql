-- =============================================================================
-- FACAM ACADEMIA — Bucket unique `app-storage` (images modules, cours, profils)
-- Exécuter dans Supabase SQL Editor après création du bucket (public, lecture).
-- Structure logique des chemins (appliquée par l’API Nest + service role) :
--   profils/{userId}/...
--   images/modules/{moduleId}/...
--   cours/{moduleId}/{chapterId}/...
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'app-storage',
  'app-storage',
  true,
  52428800,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

-- Lecture publique (URLs /object/public/app-storage/...)
DROP POLICY IF EXISTS "app_storage_public_read" ON storage.objects;
CREATE POLICY "app_storage_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'app-storage');

-- Pas d’upload direct navigateur : tout passe par l’API (service_role).
DROP POLICY IF EXISTS "app_storage_no_anon_insert" ON storage.objects;
CREATE POLICY "app_storage_no_anon_insert"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (false);

DROP POLICY IF EXISTS "app_storage_no_auth_insert" ON storage.objects;
CREATE POLICY "app_storage_no_auth_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS "app_storage_no_anon_update" ON storage.objects;
CREATE POLICY "app_storage_no_anon_update"
ON storage.objects FOR UPDATE
TO anon
USING (false);

DROP POLICY IF EXISTS "app_storage_no_auth_update" ON storage.objects;
CREATE POLICY "app_storage_no_auth_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (false);

DROP POLICY IF EXISTS "app_storage_no_anon_delete" ON storage.objects;
CREATE POLICY "app_storage_no_anon_delete"
ON storage.objects FOR DELETE
TO anon
USING (false);

DROP POLICY IF EXISTS "app_storage_no_auth_delete" ON storage.objects;
CREATE POLICY "app_storage_no_auth_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (false);

-- Note : l’ancien bucket `avatars` peut rester pour les URLs déjà en production ;
-- les nouveaux profils utilisent `app-storage/profils/`. Migrer ou supprimer `avatars`
-- quand plus aucune URL n’y pointe.
