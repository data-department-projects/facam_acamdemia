/**
 * Quiz — Redirection vers la gestion des quiz par module.
 * Les quiz sont gérés dans le contexte de chaque module (Module > Gérer les quiz).
 */

'use client';

import Link from 'next/link';
import { FileQuestion, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MOCK_MODULES } from '@/data/mock';

export default function ModuleManagerQuizPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-facam-dark">Quiz</h1>
      <p className="text-gray-600">
        Les quiz sont rattachés à un module et à un chapitre (ou au quiz final). Sélectionnez un
        module pour gérer ses quiz.
      </p>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Modules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {MOCK_MODULES.map((mod) => (
            <Link
              key={mod.id}
              href={`/module-manager/modules/${mod.id}/quiz`}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-facam-blue-tint p-2">
                  <FileQuestion className="size-5 text-facam-blue" />
                </div>
                <div>
                  <p className="font-medium text-facam-dark">{mod.title}</p>
                  <p className="text-sm text-gray-500">Quiz par chapitre + quiz final</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Gérer les quiz
                <ArrowRight className="ml-1 size-4" />
              </Button>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
