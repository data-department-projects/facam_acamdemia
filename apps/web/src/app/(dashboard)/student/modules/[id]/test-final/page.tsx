/**
 * Test final du module — Données depuis GET /formations/:id (finalQuizId) puis GET /quiz/:id.
 * Soumission via POST /quiz/:id/submit. Après succès : lien vers certificat.
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api-client';
import { Modal } from '@/components/ui/Modal';

interface ApiQuestion {
  id: string;
  questionText: string;
  options: string[];
  order: number;
}

interface ApiQuiz {
  id: string;
  title: string;
  isFinal?: boolean;
  minScoreToPass: number;
  questions: ApiQuestion[];
}

interface ApiModule {
  id: string;
  title: string;
  finalQuizId?: string | null;
  chapters?: {
    id: string;
    title: string;
    order: number;
    items?: {
      id: string;
      type: string;
      quizId?: string | null;
    }[];
  }[];
}

interface ApiCertificate {
  finalGrade: number;
}

function QuestionBlock({
  question,
  selectedIndices,
  onToggle,
}: {
  question: ApiQuestion;
  selectedIndices: number[];
  onToggle: (index: number) => void;
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
                type="checkbox"
                name={`q-${question.id}-${idx}`}
                value={idx}
                checked={selectedIndices.includes(idx)}
                onChange={() => onToggle(idx)}
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

const MIN_SCORE_FINAL = 70;

export default function StudentTestFinalPage() {
  const params = useParams();
  const moduleId = params.id as string;
  const router = useRouter();

  const [module_, setModule_] = useState<ApiModule | null>(null);
  const [quiz, setQuiz] = useState<ApiQuiz | null>(null);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [blockedChapterOrder, setBlockedChapterOrder] = useState<number | null>(null);
  const [blockedModalOpen, setBlockedModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[][]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    scorePercent: number | null;
    passed: boolean | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setBlockedModalOpen(false);
    setBlockedChapterOrder(null);

    api
      .get<ApiModule>(`/formations/${moduleId}`)
      .then(async (mod) => {
        if (cancelled) return;
        setModule_(mod);

        const finalQuizId = mod.finalQuizId;
        if (!finalQuizId) {
          setLoading(false);
          return;
        }

        // EnrollmentId côté apprenant :
        const list = await api.get<{ id: string; moduleId: string }[]>('/enrollments');
        const arr = Array.isArray(list) ? list : [];
        const enId = arr.find((e) => e.moduleId === moduleId)?.id ?? null;
        if (!cancelled) setEnrollmentId(enId);

        // Si un certificat existe déjà, le test final est déjà validé :
        // on évite de repasser le test.
        if (enId) {
          try {
            const cert = await api.get<ApiCertificate>(`/certificates/enrollment/${enId}`);
            if (cancelled) return;
            const scorePercent = Math.max(
              0,
              Math.min(100, Math.round((cert.finalGrade / 20) * 100))
            );
            setResult({ scorePercent, passed: true });
            setSubmitted(true);
            setLoading(false);
            return;
          } catch {
            // Pas de certificat : l'étudiant doit compléter le contenu requis avant d'accéder au test final.
          }
        }

        // Blocage certification si du contenu a été ajouté pendant la progression :
        if (enId) {
          const progress = await api.get<{ chapterItemIds: string[] }>(
            `/enrollments/${enId}/progress-items`
          );
          const ids = Array.isArray(progress.chapterItemIds) ? progress.chapterItemIds : [];
          const completedSet = new Set(ids);

          const chaptersSorted = (mod.chapters ?? []).slice().sort((a, b) => a.order - b.order);
          let firstIncomplete: number | null = null;

          for (const ch of chaptersSorted) {
            const items = ch.items ?? [];
            const quizItems = items.filter((it) => it.type === 'quiz');
            const required =
              quizItems.length > 0
                ? quizItems
                : items.filter((it) => it.type === 'video' || it.type === 'quiz');

            if (required.length === 0) continue;

            const ok = required.every((it) => completedSet.has(it.id));
            if (!ok) {
              firstIncomplete = ch.order;
              break;
            }
          }

          if (firstIncomplete != null) {
            if (cancelled) return;
            setBlockedChapterOrder(firstIncomplete);
            setBlockedModalOpen(true);
            setLoading(false);
            return;
          }
        }

        const [q] = await Promise.all([api.get<ApiQuiz>(`/quiz/${finalQuizId}`)]);
        if (cancelled) return;

        setQuiz(q);
        setAnswers(new Array((q.questions ?? []).length).fill(null).map(() => []));
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setQuiz(null);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [moduleId]);

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
      api
        .post<{ attemptId: string; scorePercent: number | null; passed: boolean | null }>(
          `/quiz/${quiz.id}/submit`,
          {
            answers: quiz.questions.map((_, i) => answers[i] ?? []),
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

  if (loading && !quiz) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <p className="text-slate-600">Chargement du test final…</p>
      </div>
    );
  }

  if (blockedModalOpen && blockedChapterOrder != null) {
    return (
      <Modal
        open={blockedModalOpen}
        onClose={() => setBlockedModalOpen(false)}
        title="Contenu ajouté pendant votre progression"
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-700">
            Un nouveau chapitre a été ajouté. Avant d'obtenir votre certification, complétez le
            chapitre correspondant.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => {
                setBlockedModalOpen(false);
                router.replace(`/student/modules/${moduleId}/chapitre/${blockedChapterOrder}`);
              }}
            >
              Aller au chapitre
            </Button>
            <Button variant="outline" onClick={() => setBlockedModalOpen(false)}>
              Fermer
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  if (!module_?.finalQuizId || (!quiz && !submitted)) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <p className="text-slate-600">Aucun test final pour ce module.</p>
        <Link href={`/student/modules/${moduleId}`}>
          <Button variant="outline">Retour au module</Button>
        </Link>
      </div>
    );
  }

  if (submitted && result !== null) {
    const score = result.scorePercent ?? 0;
    const passed = result.passed ?? false;
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Résultat du test final</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">Score : {score} %</p>
            <p className={passed ? 'text-green-600 font-medium' : 'text-red-600'}>
              {passed
                ? 'Module validé. Votre certificat est disponible.'
                : `Seuil requis : ${MIN_SCORE_FINAL} %. Réessayez le test.`}
            </p>
            <div className="mt-4 flex gap-4">
              <Link href={`/student/modules/${moduleId}`}>
                <Button variant="outline">Retour au module</Button>
              </Link>
              {passed && (
                <Link href={`/student/modules/${moduleId}/certificat`}>
                  <Button>Télécharger le certificat</Button>
                </Link>
              )}
              {!passed && (
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
        <p className="text-slate-600">Test final introuvable ou sans questions.</p>
        <Link href={`/student/modules/${moduleId}`}>
          <Button variant="outline">Retour au module</Button>
        </Link>
      </div>
    );
  }

  const current = quiz.questions[currentIndex];
  const currentAnswers = answers[currentIndex] ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-bold text-slate-900">
        Test final {module_ ? `— ${module_.title}` : ''}
      </h1>
      <p className="text-slate-600">
        Question {currentIndex + 1} / {quiz.questions.length}
      </p>
      <Card>
        <CardContent className="pt-6">
          <QuestionBlock
            question={current}
            selectedIndices={currentAnswers}
            onToggle={(idx) => handleToggleAnswer(currentIndex, idx)}
          />
        </CardContent>
      </Card>
      <div className="flex justify-between">
        <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0}>
          Précédent
        </Button>
        <Button onClick={handleNext} disabled={currentAnswers.length === 0 || submitting}>
          {currentIndex === quiz.questions.length - 1 ? 'Terminer le test' : 'Suivant'}
        </Button>
      </div>
    </div>
  );
}
