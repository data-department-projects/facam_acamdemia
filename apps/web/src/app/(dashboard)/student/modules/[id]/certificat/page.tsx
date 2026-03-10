/**
 * Écran certificat — Données depuis GET /certificates/enrollment/:enrollmentId.
 * Récupère l’enrollment du module puis les infos du certificat (nom, module, note, mention).
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Award, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api-client';

interface CertificateData {
  id: string;
  fullName: string;
  moduleTitle: string;
  finalGrade: number;
  mention: string;
  issuedAt: string;
}

export default function StudentCertificatPage() {
  const params = useParams();
  const moduleId = params.id as string;

  const [cert, setCert] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ id: string; moduleId: string }[]>('/enrollments')
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        const en = arr.find((e) => e.moduleId === moduleId);
        return en?.id ?? null;
      })
      .then((enrollmentId) => {
        if (cancelled || !enrollmentId) {
          if (!cancelled) {
            setError('Inscription ou certificat introuvable.');
            setLoading(false);
          }
          return;
        }
        return api.get<CertificateData>(`/certificates/enrollment/${enrollmentId}`);
      })
      .then((data) => {
        if (!cancelled && data) setCert(data);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Certificat introuvable.');
          setCert(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [moduleId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <p className="text-slate-600">Chargement du certificat…</p>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          {error ?? 'Module ou certificat introuvable.'}
        </div>
        <Link href="/student/modules">
          <Button variant="outline">Retour au catalogue</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Certificat</h1>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-facam-blue-tint p-3">
              <Award className="size-8 text-facam-blue" />
            </div>
            <div>
              <CardTitle>Certificat de réussite</CardTitle>
              <p className="text-sm text-slate-500">{cert.moduleTitle}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-600">
            Félicitations <strong>{cert.fullName}</strong> ! Vous avez validé le module{' '}
            <strong>{cert.moduleTitle}</strong>. Note : {cert.finalGrade}/20 — {cert.mention}.
          </p>
          <p className="text-xs text-slate-500">
            Délivré le {new Date(cert.issuedAt).toLocaleDateString('fr-FR')}.
          </p>
          <a
            href="#"
            download
            aria-label="Télécharger le certificat PDF"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-facam-blue px-4 text-sm font-medium text-white hover:bg-facam-dark"
          >
            <Download className="mr-2 size-4" />
            Télécharger le certificat (PDF)
          </a>
          <p className="text-xs text-slate-500">
            La génération PDF peut être ajoutée côté backend (endpoint dédié).
          </p>
        </CardContent>
      </Card>
      <Link href="/student">
        <Button variant="outline">Retour au tableau de bord</Button>
      </Link>
    </div>
  );
}
