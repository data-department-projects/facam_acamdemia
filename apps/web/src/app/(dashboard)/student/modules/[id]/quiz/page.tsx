/**
 * Quiz interactif — Données depuis GET /quiz/:id, soumission via POST /quiz/:id/submit.
 * quizId passé en query (?quizId=xxx) depuis la page chapitre.
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
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
}

function QuestionBlock({
  question,
  selectedIndex,
  onSelect,
  disabled,
}: {
  question: ApiQuestion;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  disabled?: boolean;
}) {
  const options = question.options ?? [];

  return (
    <div className="space-y-3">
      <p className="font-medium text-slate-900">{question.questionText}</p>
      <ul className="space-y-2" role="radiogroup" aria-label={question.questionText}>
        {options.map((opt, idx) => (
          <li key={idx}>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50 has-[:checked]:border-facam-blue has-[:checked]:bg-facam-blue-tint">
              <input
                type="radio"
                name={`q-${question.id}`}
                value={idx}
                checked={selectedIndex === idx}
                onChange={() => onSelect(idx)}
                disabled={disabled}
                className="size-4 text-facam-blue"
                aria-label={opt}
              />
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
  const moduleId = params.id as string;
  const quizId = searchParams.get('quizId');

  const [quiz, setQuiz] = useState<ApiQuiz | null>(null);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!quizId);
  const [submitting, setSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    scorePercent: number | null;
    passed: boolean | null;
  } | null>(null);

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
          setAnswers(new Array((q.questions ?? []).length).fill(-1));
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

  const handleSelect = (questionIndex: number, value: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = value;
      return next;
    });
  };

  const handleNext = () => {
    if (!quiz) return;
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setSubmitting(true);
      api
        .post<{ attemptId: string; scorePercent: number | null; passed: boolean | null }>(
          `/quiz/${quiz.id}/submit`,
          {
            answers: quiz.questions.map((_, i) => answers[i] ?? -1),
            ...(enrollmentId ? { enrollmentId } : {}),
          }
        )
        .then((res) => {
          setResult(res);
          setSubmitted(true);
        })
        .catch(() => setSubmitting(false))
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
            <div className="mt-4 flex gap-4">
              <Link href={`/student/modules/${moduleId}`}>
                <Button variant="outline">Retour au module</Button>
              </Link>
              {!passed && (
                <Button
                  onClick={() => {
                    setSubmitted(false);
                    setResult(null);
                    setCurrentIndex(0);
                    setAnswers(new Array(quiz?.questions.length ?? 0).fill(-1));
                  }}
                >
                  Réessayer
                </Button>
              )}
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
  const currentAnswer = answers[currentIndex] ?? -1;
  const canNext = currentAnswer >= 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-bold text-slate-900">{quiz.title}</h1>
      <p className="text-slate-600">
        Question {currentIndex + 1} / {quiz.questions.length}
      </p>
      <Card>
        <CardContent className="pt-6">
          <QuestionBlock
            question={current}
            selectedIndex={currentAnswer === -1 ? null : currentAnswer}
            onSelect={(idx) => handleSelect(currentIndex, idx)}
          />
        </CardContent>
      </Card>
      <div className="flex justify-between">
        <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0}>
          Précédent
        </Button>
        <Button onClick={handleNext} disabled={!canNext || submitting}>
          {currentIndex === quiz.questions.length - 1 ? 'Terminer' : 'Suivant'}
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
