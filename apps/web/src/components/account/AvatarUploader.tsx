/**
 * Zone de téléversement d’avatar : prévisualisation locale, validation client,
 * envoi multipart vers POST /auth/me/avatar puis mise à jour session + événement global.
 */

'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { apiRequest, getAccessToken } from '@/lib/api-client';
import { setAuthSession, type StoredUser } from '@/lib/auth';
import { AVATAR_ACCEPT_INPUT, AVATAR_MAX_BYTES, validateAvatarFile } from '@/lib/avatar-validation';
import { emitProfileUpdated } from '@/lib/profile-events';
import { UserAvatar } from '@/components/account/UserAvatar';

interface AvatarUploaderProps {
  user: StoredUser;
  onUserUpdate: (u: StoredUser) => void;
}

export function AvatarUploader({ user, onUserUpdate }: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  /** Fichier en attente d’envoi : l’input est réinitialisé après choix pour permettre de reprendre le même fichier. */
  const pendingFileRef = useRef<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const revokePreview = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
  }, [preview]);

  const onFileChosen = (file: File | null) => {
    setError('');
    setSuccess(false);
    pendingFileRef.current = null;
    revokePreview();
    if (!file) return;
    const check = validateAvatarFile(file);
    if (!check.ok) {
      setError(check.message);
      return;
    }
    pendingFileRef.current = file;
    setPreview(URL.createObjectURL(file));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onFileChosen(file);
    e.target.value = '';
  };

  const handleUpload = async () => {
    setError('');
    setSuccess(false);
    const token = getAccessToken();
    if (!token) {
      setError('Session expirée. Reconnectez-vous pour modifier votre photo.');
      return;
    }
    const file = pendingFileRef.current;
    if (!file) {
      setError('Choisissez une image à envoyer.');
      return;
    }
    const check = validateAvatarFile(file);
    if (!check.ok) {
      setError(check.message);
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await apiRequest<{ avatarUrl: string }>('/auth/me/avatar', {
        method: 'POST',
        body: form,
        token,
      });
      const next: StoredUser = { ...user, avatarUrl: res.avatarUrl };
      setAuthSession(next, token);
      onUserUpdate(next);
      emitProfileUpdated();
      pendingFileRef.current = null;
      revokePreview();
      if (inputRef.current) inputRef.current.value = '';
      setSuccess(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Échec du téléversement.';
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const displayUrl = preview ?? user.avatarUrl ?? null;
  const hasExistingPhoto = Boolean(user.avatarUrl);
  const chooseLabel = hasExistingPhoto ? 'Choisir une autre image' : 'Choisir une image';
  const saveLabel = hasExistingPhoto ? 'Enregistrer la nouvelle photo' : 'Enregistrer la photo';

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="flex-shrink-0">
          {displayUrl ? (
            <span className="block rounded-full ring-2 ring-facam-blue/20 overflow-hidden size-24">
              <Image
                src={displayUrl}
                alt=""
                width={96}
                height={96}
                className="size-24 object-cover"
                unoptimized
              />
            </span>
          ) : (
            <UserAvatar fullName={user.fullName} size="lg" />
          )}
        </div>
        <div className="flex-1 space-y-3 min-w-0">
          <div>
            <p className="text-sm font-semibold text-facam-dark">Photo de profil</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {hasExistingPhoto
                ? 'Vous pouvez changer votre photo à tout moment : la nouvelle image remplace l’ancienne (fichier et lien mis à jour). '
                : 'Ajoutez une photo visible sur votre compte et dans l’en-tête. '}
              Formats : JPG, PNG ou WebP — max. {Math.round(AVATAR_MAX_BYTES / (1024 * 1024))} Mo.
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={AVATAR_ACCEPT_INPUT}
            className="sr-only"
            id="avatar-file-input"
            onChange={handleInputChange}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              <Camera className="size-4" />
              {chooseLabel}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => void handleUpload()}
              disabled={uploading || !preview}
            >
              {uploading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2 inline" />
                  Envoi…
                </>
              ) : (
                saveLabel
              )}
            </Button>
          </div>
        </div>
      </div>
      {success && (
        <p className="text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          Photo mise à jour avec succès.
        </p>
      )}
      {error && (
        <p className="text-sm font-medium text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
