/**
 * Client pour la page Quiz du module — Données depuis l’API (formations/:id, chapitres/module/:id).
 * Liste des quiz par chapitre + quiz final.
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileQuestion, Plus, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { QuizBuilder, type QuizQuestionForm } from '@/components/module-manager/QuizBuilder';
import { api } from '@/lib/api-client';

interface ApiModule {
  id: string;
  title: string;
}

interface ModuleQuizClientProps {
  moduleId: string;
  /** Module déjà connu (ex. depuis la liste) : évite un second GET et l’erreur « Module introuvable ». */
  initialModule?: { id: string; title: string };
  /** Quand true, la page Quiz affiche ce contenu sans lien « Retour » (on reste sur /module-manager/quiz). */
  embedded?: boolean;
}

export function ModuleQuizClient({
  moduleId,
  initialModule,
  embedded = false,
}: ModuleQuizClientProps) {
  const [mod, setMod] = useState<ApiModule | null>(initialModule ?? null);
  const [loading, setLoading] = useState(!initialModule);

  const load = useCallback(async () => {
    if (initialModule && initialModule.id === moduleId) {
      setMod(initialModule);
      setLoading(false);
      return;
    }
    try {
      const moduleRes = await api.get<ApiModule>(`/formations/${moduleId}`);
      setMod(moduleRes);
    } catch {
      setMod(null);
    } finally {
      setLoading(false);
    }
  }, [moduleId, initialModule]);

  useEffect(() => {
    load();
  }, [load]);

  const [quizModal, setQuizModal] = useState<'final' | null>(null);
  const [questions, setQuestions] = useState<QuizQuestionForm[]>([]);
  const [minScoreToPass, setMinScoreToPass] = useState(70);

  const [savingFinal, setSavingFinal] = useState(false);
  const [finalQuizError, setFinalQuizError] = useState<string | null>(null);
  const [finalSummary, setFinalSummary] = useState<{
    questionCount: number;
    minScoreToPass: number;
    questionsPreview: string[];
  } | null>(null);

  const loadFinalSummary = useCallback(async () => {
    try {
      const data = await api.get<{
        id: string;
        minScoreToPass: number;
        questions: {
          id: string;
          questionText: string;
          options: string[];
          correctIndex: number;
          correctIndexes?: number[];
          order: number;
        }[];
      } | null>(`/quiz/final?moduleId=${encodeURIComponent(moduleId)}`);

      const qs = data?.questions ?? [];
      setFinalSummary({
        questionCount: qs.length,
        minScoreToPass: data?.minScoreToPass ?? 80,
        questionsPreview: qs
          .slice()
          .sort((a, b) => a.order - b.order)
          .slice(0, 4)
          .map((q) => q.questionText)
          .filter(Boolean),
      });
    } catch {
      setFinalSummary({ questionCount: 0, minScoreToPass: 80, questionsPreview: [] });
    }
  }, [moduleId]);

  const openQuizFinal = useCallback(async () => {
    setQuizModal('final');
    setFinalQuizError(null);
    setQuestions([]);
    setMinScoreToPass(80);
    try {
      const data = await api.get<{
        id: string;
        minScoreToPass: number;
        questions: {
          id: string;
          questionText: string;
          options: string[];
          correctIndex: number;
          correctIndexes?: number[];
          order: number;
        }[];
      } | null>(`/quiz/final?moduleId=${encodeURIComponent(moduleId)}`);
      if (data?.questions?.length) {
        setQuestions(
          data.questions.map((q, i) => ({
            id: `q-${q.id}-${i}`,
            questionText: q.questionText,
            options: q.options,
            correctIndex: q.correctIndex,
            correctIndexes:
              Array.isArray(q.correctIndexes) && q.correctIndexes.length > 0
                ? q.correctIndexes
                : [q.correctIndex],
          }))
        );
        setMinScoreToPass(data.minScoreToPass);
      }
    } catch {
      setQuestions([]);
      setMinScoreToPass(80);
    }
  }, [moduleId]);

  const saveQuizFinal = async () => {
    setFinalQuizError(null);
    setSavingFinal(true);
    try {
      const payload = {
        moduleId,
        minScoreToPass: minScoreToPass,
        questions: questions
          .filter((q) => q.questionText.trim() && q.options.some((o) => o.trim()))
          .map((q) => ({
            questionText: q.questionText,
            options: q.options,
            correctIndex: q.correctIndex,
            correctIndexes: q.correctIndexes,
          })),
      };
      await api.put('/quiz/final', payload);
      setQuizModal(null);
      await loadFinalSummary();
    } catch (e) {
      setFinalQuizError(e instanceof Error ? e.message : 'Erreur enregistrement');
    } finally {
      setSavingFinal(false);
    }
  };

  useEffect(() => {
    loadFinalSummary();
  }, [loadFinalSummary]);

  const finalConfigured = (finalSummary?.questionCount ?? 0) > 0;
  const finalChip = useMemo(() => {
    if (!finalSummary) return null;
    if (finalConfigured) {
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
          <CheckCircle2 className="size-4" aria-hidden />
          Configuré · {finalSummary.questionCount} question(s) · seuil {finalSummary.minScoreToPass}
          %
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
        <AlertTriangle className="size-4" aria-hidden />
        Non configuré · Ajoutez des questions
      </span>
    );
  }, [finalConfigured, finalSummary]);

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-gray-500">Chargement du module…</p>
      </div>
    );
  }
  if (!mod) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        Module introuvable.
        {!embedded && (
          <Link href="/module-manager/quiz" className="ml-2 underline">
            Retour à la liste des modules
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!embedded && (
        <div className="flex items-center gap-4">
          <Link href="/module-manager/quiz">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1 size-4" />
              Retour à la liste des modules
            </Button>
          </Link>
        </div>
      )}

      <div className="rounded-lg border border-facam-blue/20 bg-facam-blue-tint/30 p-4">
        <h1 className="text-xl font-bold text-facam-dark">Quiz final du module : {mod.title}</h1>
        <p className="mt-1 text-sm text-gray-600">
          Cette page est dédiée au <strong>quiz final</strong> du module. Créez les questions,
          définissez les réponses possibles et la ou les bonnes réponses pour chaque question.
          L&apos;étudiant devra valider ce quiz (score minimum requis) avant de pouvoir obtenir son
          certificat téléchargeable. Les quiz de chapitre (parcours) se gèrent dans « Cours &
          Contenu » lors de l&apos;ajout d&apos;un chapitre.
        </p>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileQuestion className="size-5 text-facam-blue" />
            Quiz final du module
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Quiz obligatoire à la fin du module. Définissez le score minimum (par défaut 80 %) pour
            que l&apos;étudiant puisse obtenir son certificat. Créez ou modifiez les questions
            ci-dessous.
          </p>

          {finalChip && <div className="mb-4">{finalChip}</div>}

          {finalConfigured && finalSummary?.questionsPreview?.length ? (
            <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50/50 p-4">
              <p className="text-sm font-semibold text-facam-dark">Aperçu des questions</p>
              <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 space-y-1">
                {finalSummary.questionsPreview.map((t) => (
                  <li key={t}>{t.length > 80 ? `${t.slice(0, 80)}…` : t}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <Button variant="accent" onClick={openQuizFinal}>
            <Plus className="mr-2 size-4" />
            {finalConfigured
              ? `Modifier le quiz final (${finalSummary?.questionCount ?? 0} question${
                  (finalSummary?.questionCount ?? 0) > 1 ? 's' : ''
                })`
              : 'Créer le quiz final'}
          </Button>
        </CardContent>
      </Card>

      <Modal
        open={quizModal !== null}
        onClose={() => setQuizModal(null)}
        title={`Quiz final — ${mod.title}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Définissez les questions du quiz final, les choix possibles et la ou les bonnes réponses
            pour chaque question. L&apos;étudiant doit obtenir le score minimum pour valider le
            module et pouvoir télécharger son certificat.
          </p>
          {finalQuizError && (
            <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{finalQuizError}</p>
          )}
          <QuizBuilder
            title=""
            questions={questions}
            onChange={setQuestions}
            minScoreToPass={minScoreToPass}
            onMinScoreChange={setMinScoreToPass}
            submitLabel={savingFinal ? 'Enregistrement…' : 'Enregistrer le quiz'}
            onSubmit={saveQuizFinal}
            submitDisabled={savingFinal}
          />
        </div>
      </Modal>
    </div>
  );
}
