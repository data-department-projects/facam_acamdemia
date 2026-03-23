/**
 * Quiz interactif — Données depuis GET /quiz/:id, soumission via POST /quiz/:id/submit.
 * quizId passé en query (?quizId=xxx) depuis la page chapitre.
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api-client';

interface ApiQuestion {
  id: string;
  questionText: string;
  options: string[];
  order: number;
}

interface ApiQuiz {
  id: string;
  title: string;
  minScoreToPass: number;
  questions: ApiQuestion[];
  maxAttempts?: number;
  attemptsUsed?: number;
  attemptsRemaining?: number;
  alreadyPassed?: boolean;
}

function getOptionLabel(index: number): string {
  return String.fromCharCode(65 + index);
}

function QuestionBlock({
  question,
  selectedIndices,
  onToggle,
  disabled,
}: {
  question: ApiQuestion;
  selectedIndices: number[];
  onToggle: (index: number) => void;
  disabled?: boolean;
}) {
  const options = question.options ?? [];

  return (
    <div className="space-y-3">
      <p className="font-medium text-slate-900 leading-relaxed">{question.questionText}</p>
      <ul className="space-y-2" aria-label={question.questionText}>
        {options.map((opt, idx) => (
          <li key={`${question.id}-${idx}`}>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50 has-[:checked]:border-facam-blue has-[:checked]:bg-facam-blue-tint">
              <input
                type="checkbox"
                name={`q-${question.id}-${idx}`}
                value={idx}
                checked={selectedIndices.includes(idx)}
                onChange={() => onToggle(idx)}
                disabled={disabled}
                className="size-4 text-facam-blue"
                aria-label={opt}
              />
              <span className="inline-flex size-6 items-center justify-center rounded-full border border-slate-300 text-xs font-semibold text-slate-700">
                {getOptionLabel(idx)}
              </span>
              <span className="text-slate-900">{opt}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StudentModuleQuizContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const moduleId = params.id as string;
  const quizId = searchParams.get('quizId');
  const nextHref = searchParams.get('next');
  const chapterId = searchParams.get('chapterId');
  const chapterOrder = searchParams.get('chapterOrder');
  const quizItemId = searchParams.get('quizItemId');
  const parsedChapterOrder = Number(chapterOrder);
  const chapterOrderIsValid = Number.isInteger(parsedChapterOrder) && parsedChapterOrder > 0;
  const nextChapterMatch = nextHref?.match(/\/chapitre\/(\d+)/);
  const derivedFromNext = nextChapterMatch ? Math.max(1, Number(nextChapterMatch[1]) - 1) : null;
  const reviewChapterOrder = chapterOrderIsValid ? parsedChapterOrder : (derivedFromNext ?? 1);
  const reviewHref = `/student/modules/${moduleId}/chapitre/${reviewChapterOrder}`;

  const [quiz, setQuiz] = useState<ApiQuiz | null>(null);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!quizId);
  const [submitting, setSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[][]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    scorePercent: number | null;
    passed: boolean | null;
  } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!quizId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    Promise.all([
      api.get<ApiQuiz>(`/quiz/${quizId}`),
      api.get<{ id: string; moduleId: string }[]>('/enrollments').then((list) => {
        const arr = Array.isArray(list) ? list : [];
        const en = arr.find((e) => e.moduleId === moduleId);
        return en?.id ?? null;
      }),
    ])
      .then(([q, enId]) => {
        if (!cancelled) {
          setQuiz(q);
          setEnrollmentId(enId);
          setAnswers(new Array((q.questions ?? []).length).fill(null).map(() => []));
          setSubmitError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setQuiz(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [quizId, moduleId]);

  useEffect(() => {
    if (!submitted || !result || !nextHref) return;
    const passed = result.passed ?? false;
    if (passed) {
      router.push(nextHref);
    }
  }, [submitted, result, nextHref, router]);

  const handleToggleAnswer = (questionIndex: number, value: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      const current = Array.isArray(next[questionIndex]) ? next[questionIndex] : [];
      next[questionIndex] = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value].sort((a, b) => a - b);
      return next;
    });
  };

  const handleNext = () => {
    if (!quiz) return;
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setSubmitting(true);
      setSubmitError(null);
      api
        .post<{
          attemptId: string;
          scorePercent: number | null;
          passed: boolean | null;
          maxAttempts?: number;
          attemptsUsed?: number;
          attemptsRemaining?: number;
        }>(`/quiz/${quiz.id}/submit`, {
          answers: quiz.questions.map((_, i) => answers[i] ?? []),
          ...(enrollmentId ? { enrollmentId } : {}),
        })
        .then((res) => {
          setQuiz((prev) =>
            prev
              ? {
                  ...prev,
                  ...(res.maxAttempts != null ? { maxAttempts: res.maxAttempts } : {}),
                  ...(res.attemptsUsed != null ? { attemptsUsed: res.attemptsUsed } : {}),
                  ...(res.attemptsRemaining != null
                    ? { attemptsRemaining: res.attemptsRemaining }
                    : {}),
                }
              : prev
          );
          setResult(res);
          setSubmitted(true);
          // Persistance "reprise" : si échec -> rester sur le quiz (item), si réussite -> marquer l'item complété
          const passed = res.passed ?? false;
          if (enrollmentId) {
            const ops: Promise<unknown>[] = [];
            if (passed && quizItemId) {
              ops.push(
                api.post(`/enrollments/${enrollmentId}/complete-item`, {
                  chapterItemId: quizItemId,
                })
              );
            }
            ops.push(
              api.patch(`/enrollments/${enrollmentId}/progression`, {
                ...(chapterId ? { lastViewedChapterId: chapterId } : {}),
                ...(quizItemId ? { lastViewedItemId: quizItemId } : {}),
              })
            );
            void Promise.allSettled(ops);
          }
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : "Impossible d'envoyer le quiz.";
          setSubmitError(msg);
        })
        .finally(() => setSubmitting(false));
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  if (!quizId) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <p className="text-slate-600">Aucun quiz sélectionné.</p>
        <Link href={`/student/modules/${moduleId}`}>
          <Button variant="outline">Retour au module</Button>
        </Link>
      </div>
    );
  }

  if (loading || (!quiz && !submitted)) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <p className="text-slate-600">Chargement du quiz…</p>
      </div>
    );
  }

  if (submitted && result !== null) {
    const score = result.scorePercent ?? 0;
    const passed = result.passed ?? false;
    const minScore = quiz?.minScoreToPass ?? 70;
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Résultat du quiz</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">Score : {score} %</p>
            <p className={passed ? 'text-green-600 font-medium' : 'text-red-600'}>
              {passed
                ? `Félicitations, vous avez réussi (seuil ${minScore} %).`
                : `Seuil requis : ${minScore} %. Vous pouvez réessayer.`}
            </p>
            {!passed && (
              <div className="mt-4 flex gap-4">
                <Link href={reviewHref}>
                  <Button variant="outline">Revoir les ressources</Button>
                </Link>
                <Button
                  onClick={() => {
                    setSubmitted(false);
                    setResult(null);
                    setCurrentIndex(0);
                    setAnswers(new Array(quiz?.questions.length ?? 0).fill(null).map(() => []));
                  }}
                >
                  Réessayer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (quiz?.alreadyPassed) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Quiz déjà validé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-green-700 font-medium">
              Vous avez déjà réussi ce quiz de chapitre. Aucun nouveau passage n&apos;est
              nécessaire.
            </p>
            <div className="flex gap-3">
              {nextHref ? (
                <Link href={nextHref}>
                  <Button>Continuer</Button>
                </Link>
              ) : null}
              <Link href={`/student/modules/${moduleId}`}>
                <Button variant="outline">Retour au module</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <p className="text-slate-600">Quiz introuvable ou sans questions.</p>
        <Link href={`/student/modules/${moduleId}`}>
          <Button variant="outline">Retour au module</Button>
        </Link>
      </div>
    );
  }

  const current = quiz.questions[currentIndex];
  const currentAnswers = answers[currentIndex] ?? [];
  const canNext = currentAnswers.length > 0;
  const attemptsUsed = quiz.attemptsUsed ?? 0;
  const attemptsRemaining = quiz.attemptsRemaining ?? 0;
  const maxAttempts = quiz.maxAttempts ?? 3;
  const attemptsLimitReached = attemptsRemaining <= 0;
  const questionProgressPercent = Math.round(((currentIndex + 1) / quiz.questions.length) * 100);
  const attemptsUsagePercent = Math.min(100, Math.round((attemptsUsed / maxAttempts) * 100));
  const isLastAttempt = attemptsRemaining === 1;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">{quiz.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-facam-blue-tint px-3 py-1 font-medium text-facam-dark">
            Question {currentIndex + 1} / {quiz.questions.length}
          </span>
          <span
            className={`rounded-full px-3 py-1 font-medium ${
              attemptsLimitReached
                ? 'bg-red-100 text-red-700'
                : isLastAttempt
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            Tentatives restantes : {attemptsRemaining}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
            Seuil de réussite : {quiz.minScoreToPass}%
          </span>
        </div>
        <div className="mt-6 space-y-4 border-t border-slate-100 pt-4">
          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
              <span>Progression du quiz</span>
              <span>{questionProgressPercent}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-facam-blue transition-all"
                style={{ width: `${questionProgressPercent}%` }}
              />
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
              <span>Tentatives utilisées</span>
              <span>
                {attemptsUsed}/{maxAttempts}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div
                className={`h-2 rounded-full transition-all ${
                  attemptsUsagePercent >= 100
                    ? 'bg-red-500'
                    : attemptsUsagePercent >= 67
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                }`}
                style={{ width: `${attemptsUsagePercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      {submitError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {submitError}
        </p>
      ) : null}
      {attemptsLimitReached ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <p>
            Limite de tentatives atteinte pour ce quiz. Revoyez les ressources et contactez votre
            formateur si vous avez besoin d&apos;un déblocage.
          </p>
          <div className="mt-3">
            <Link href={reviewHref}>
              <Button variant="outline" size="sm">
                Revoir les ressources du chapitre
              </Button>
            </Link>
          </div>
        </div>
      ) : null}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-slate-800">Question {currentIndex + 1}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <QuestionBlock
            question={current}
            selectedIndices={currentAnswers}
            onToggle={(idx) => handleToggleAnswer(currentIndex, idx)}
          />
        </CardContent>
      </Card>
      <div className="flex justify-between gap-3">
        <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0}>
          Précédent
        </Button>
        <Button onClick={handleNext} disabled={!canNext || submitting || attemptsLimitReached}>
          {submitting
            ? 'Envoi...'
            : currentIndex === quiz.questions.length - 1
              ? 'Terminer'
              : 'Suivant'}
        </Button>
      </div>
    </div>
  );
}

export default function StudentModuleQuizPage() {
  return (
    <Suspense fallback={<p className="text-slate-600">Chargement…</p>}>
      <StudentModuleQuizContent />
    </Suspense>
  );
}
