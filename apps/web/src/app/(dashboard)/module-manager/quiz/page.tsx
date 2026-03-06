/**
 * Création et gestion des quiz : par chapitre, seuils de validation.
 * Liste des quiz existants et formulaire d'édition (mock).
 */

import { FileQuestion, Edit, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MOCK_QUIZ } from '@/data/mock';

export default function ModuleManagerQuizPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Quiz</h1>
        <Button>
          <FileQuestion className="mr-2 size-4" />
          Nouveau quiz
        </Button>
      </div>
      <p className="text-slate-600">
        Configurez les quiz par chapitre (QCM, vrai/faux, questions ouvertes) et le score minimum
        pour valider.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Quiz existants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-facam-blue-tint p-2">
                <FileQuestion className="size-5 text-facam-blue" />
              </div>
              <div>
                <p className="font-medium text-slate-900">{MOCK_QUIZ.title}</p>
                <p className="text-sm text-slate-500">
                  {MOCK_QUIZ.questions.length} questions · Seuil : {MOCK_QUIZ.minScoreToPass} %
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Edit className="mr-1 size-4" /> Éditer
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="size-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-slate-500">
            Création de questions (QCM, vrai/faux, ouvert) et liaison chapitre → quiz à implémenter
            avec le backend.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
