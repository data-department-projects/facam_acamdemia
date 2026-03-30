-- =============================================================================
-- FACAM ACADEMIA — Bucket Storage "avatars" + policies (à exécuter dans Supabase SQL)
-- =============================================================================
-- 1) Dashboard Supabase → Storage → Create bucket :
--    - Name: avatars
--    - Public bucket: ON (lecture publique des URLs /object/public/avatars/...)
--
-- 2) Ou créer le bucket par SQL (si extension storage disponible) :
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- -----------------------------------------------------------------------------
-- Policies : lecture publique ; écriture uniquement via clé service (API Nest).
-- Les uploads navigateur avec la clé anon sont refusés (défense en profondeur).
-- L’application utilise JWT Nest + SUPABASE_SERVICE_ROLE_KEY côté serveur, ce qui
-- contourne RLS : seule l’API peut créer/supprimer des objets de façon contrôlée.
-- -----------------------------------------------------------------------------

-- Lecture pour tous (URLs publiques du bucket)
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Refus explicite des INSERT pour les rôles anon / authenticated (sessions Supabase Auth).
-- Les appels avec service_role ne sont pas soumis à ces policies de la même façon.
DROP POLICY IF EXISTS "avatars_no_anon_insert" ON storage.objects;
CREATE POLICY "avatars_no_anon_insert"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (false);

DROP POLICY IF EXISTS "avatars_no_auth_insert" ON storage.objects;
CREATE POLICY "avatars_no_auth_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS "avatars_no_anon_update" ON storage.objects;
CREATE POLICY "avatars_no_anon_update"
ON storage.objects FOR UPDATE
TO anon
USING (false);

DROP POLICY IF EXISTS "avatars_no_auth_update" ON storage.objects;
CREATE POLICY "avatars_no_auth_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (false);

DROP POLICY IF EXISTS "avatars_no_anon_delete" ON storage.objects;
CREATE POLICY "avatars_no_anon_delete"
ON storage.objects FOR DELETE
TO anon
USING (false);

DROP POLICY IF EXISTS "avatars_no_auth_delete" ON storage.objects;
CREATE POLICY "avatars_no_auth_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (false);
