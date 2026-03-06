/**
 * Écran certificat : affichage du certificat et bouton de téléchargement (PDF).
 * Côté backend : génération PDF via PDFKit ; ici mock avec message + lien.
 */

import Link from 'next/link';
import { Award, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MOCK_MODULES } from '@/data/mock';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentCertificatPage({ params }: PageProps) {
  const { id } = await params;
  const module_ = MOCK_MODULES.find((m) => m.id === id);

  if (!module_) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        Module introuvable.
        <Link href="/student/modules" className="ml-2 underline">
          Retour au catalogue
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
              <p className="text-sm text-slate-500">{module_.title}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-600">
            Félicitations ! Vous avez validé le module <strong>{module_.title}</strong>. Téléchargez
            votre certificat au format PDF (génération côté backend avec PDFKit).
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
        </CardContent>
      </Card>
      <Link href="/student">
        <Button variant="outline">Retour au tableau de bord</Button>
      </Link>
    </div>
  );
}
