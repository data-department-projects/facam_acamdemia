/**
 * Client pour la page Quiz du module — Données depuis l’API (formations/:id, chapitres/module/:id).
 * Liste des quiz par chapitre + quiz final.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileQuestion, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { QuizBuilder, type QuizQuestionForm } from '@/components/module-manager/QuizBuilder';
import { api } from '@/lib/api-client';

interface ApiModule {
  id: string;
  title: string;
}

interface ApiChapter {
  id: string;
  title: string;
  order: number;
  quizzes?: { id: string }[];
}

export function ModuleQuizClient({ moduleId }: { moduleId: string }) {
  const [mod, setMod] = useState<ApiModule | null>(null);
  const [modChapters, setModChapters] = useState<ApiChapter[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [moduleRes, chaptersRes] = await Promise.all([
        api.get<ApiModule>(`/formations/${moduleId}`),
        api.get<ApiChapter[]>(`/chapitres/module/${moduleId}`),
      ]);
      setMod(moduleRes);
      setModChapters(
        Array.isArray(chaptersRes) ? chaptersRes.sort((a, b) => a.order - b.order) : []
      );
    } catch {
      setMod(null);
      setModChapters([]);
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    load();
  }, [load]);

  const [quizModal, setQuizModal] = useState<'chapter' | 'final' | null>(null);
  const [quizTargetChapterTitle, setQuizTargetChapterTitle] = useState('');
  const [questions, setQuestions] = useState<QuizQuestionForm[]>([]);
  const [minScoreToPass, setMinScoreToPass] = useState(70);

  const openQuizForChapter = (ch: { id: string; title: string }) => {
    setQuizTargetChapterTitle(ch.title);
    setQuizModal('chapter');
    setQuestions([]);
    setMinScoreToPass(70);
  };

  const openQuizFinal = () => {
    setQuizTargetChapterTitle('');
    setQuizModal('final');
    setQuestions([]);
    setMinScoreToPass(80);
  };

  const saveQuiz = () => {
    setQuizModal(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-gray-500">Chargement du module et des chapitres…</p>
      </div>
    );
  }
  if (!mod) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        Module introuvable.
        <Link href="/module-manager/modules" className="ml-2 underline">
          Retour aux modules
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/module-manager/modules">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 size-4" />
            Retour
          </Button>
        </Link>
      </div>

      <div className="rounded-lg border border-facam-blue/20 bg-facam-blue-tint/30 p-4">
        <h1 className="text-xl font-bold text-facam-dark">Quiz du module : {mod.title}</h1>
        <p className="mt-1 text-sm text-gray-600">
          Créez ou modifiez les quiz par chapitre et le quiz final. Chaque quiz est clairement
          rattaché à un chapitre ou au quiz final du module.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Quiz par chapitre</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {modChapters.length === 0 ? (
              <p className="text-sm text-gray-500">
                Aucun chapitre. Ajoutez d&apos;abord des chapitres au module.
              </p>
            ) : (
              modChapters.map((ch) => (
                <div
                  key={ch.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
                >
                  <div>
                    <p className="font-medium text-facam-dark">
                      Chapitre {ch.order} : {ch.title}
                    </p>
                    <p className="text-xs text-gray-500">Quiz affiché après la vidéo du chapitre</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openQuizForChapter(ch)}>
                    <FileQuestion className="mr-1 size-4" />
                    {(ch.quizzes?.length ?? 0) > 0 ? 'Modifier' : 'Créer'}
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Quiz final</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Quiz à la fin du module. Score ≥ 80 % requis pour le certificat.
            </p>
            <Button variant="accent" onClick={openQuizFinal}>
              <Plus className="mr-2 size-4" />
              Créer ou modifier le quiz final
            </Button>
          </CardContent>
        </Card>
      </div>

      <Modal
        open={quizModal !== null}
        onClose={() => setQuizModal(null)}
        title={
          quizModal === 'final'
            ? `Quiz final — ${mod.title}`
            : `Quiz — Chapitre : ${quizTargetChapterTitle}`
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {quizModal === 'final'
              ? "Ce quiz apparaît à la fin du module. L'étudiant doit obtenir ≥ 80 % pour télécharger le certificat."
              : `Ce quiz apparaît après la vidéo du chapitre « ${quizTargetChapterTitle} ».`}
          </p>
          <QuizBuilder
            title=""
            questions={questions}
            onChange={setQuestions}
            minScoreToPass={minScoreToPass}
            onMinScoreChange={setMinScoreToPass}
            submitLabel="Enregistrer le quiz"
            onSubmit={saveQuiz}
          />
        </div>
      </Modal>
    </div>
  );
}
