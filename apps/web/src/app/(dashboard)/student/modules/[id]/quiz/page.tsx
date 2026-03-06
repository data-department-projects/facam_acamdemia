/**
 * Quiz interactif : QCM, vrai/faux, affichage score à la fin.
 * Client component pour l'état des réponses.
 */

'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MOCK_QUIZ } from '@/data/mock';
import type { QuizQuestion } from '@/types';

function QuestionBlock({
  question,
  selected,
  onSelect,
  disabled,
}: {
  question: QuizQuestion;
  selected: string | null;
  onSelect: (value: string) => void;
  disabled?: boolean;
}) {
  const options = question.options ?? ['Vrai', 'Faux'];

  return (
    <div className="space-y-3">
      <p className="font-medium text-slate-900">{question.question}</p>
      <ul className="space-y-2" role="radiogroup" aria-label={question.question}>
        {options.map((opt) => (
          <li key={opt}>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50 has-[:checked]:border-facam-blue has-[:checked]:bg-facam-blue-tint">
              <input
                type="radio"
                name={`q-${question.id}`}
                value={opt}
                checked={selected === opt}
                onChange={() => onSelect(opt)}
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

export default function StudentModuleQuizPage() {
  const params = useParams();
  const moduleId = params.id as string;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const questions = MOCK_QUIZ.questions;
  const current = questions[currentIndex];
  const minScore = MOCK_QUIZ.minScoreToPass;

  const handleSelect = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setSubmitted(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const score = submitted
    ? Math.round(
        (questions.filter(
          (q) =>
            answers[q.id] ===
            (Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer)
        ).length /
          questions.length) *
          100
      )
    : 0;
  const passed = score >= minScore;

  if (submitted) {
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
                    setCurrentIndex(0);
                    setAnswers({});
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

  if (!current) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-bold text-slate-900">{MOCK_QUIZ.title}</h1>
      <p className="text-slate-600">
        Question {currentIndex + 1} / {questions.length}
      </p>
      <Card>
        <CardContent className="pt-6">
          <QuestionBlock
            question={current}
            selected={answers[current.id] ?? null}
            onSelect={(value) => handleSelect(current.id, value)}
          />
        </CardContent>
      </Card>
      <div className="flex justify-between">
        <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0}>
          Précédent
        </Button>
        <Button onClick={handleNext} disabled={!answers[current.id]}>
          {currentIndex === questions.length - 1 ? 'Terminer' : 'Suivant'}
        </Button>
      </div>
    </div>
  );
}
