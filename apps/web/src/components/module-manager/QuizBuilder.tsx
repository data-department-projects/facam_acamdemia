/**
 * QuizBuilder — Formulaire de création/édition de quiz à choix multiple.
 * Permet d'ajouter des questions, plusieurs choix par question, et de définir la bonne réponse.
 * Rôle : interface responsable de module pour créer les quiz par chapitre et quiz final.
 */

'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export interface QuizQuestionForm {
  id: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  correctIndexes: number[];
}

interface QuizBuilderProps {
  title: string;
  questions: QuizQuestionForm[];
  onChange: (questions: QuizQuestionForm[]) => void;
  minScoreToPass?: number;
  onMinScoreChange?: (value: number) => void;
  submitLabel?: string;
  onSubmit?: () => void;
  submitDisabled?: boolean;
}

function generateId(): string {
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function QuizBuilder({
  title,
  questions,
  onChange,
  minScoreToPass = 70,
  onMinScoreChange,
  submitLabel = 'Enregistrer le quiz',
  onSubmit,
  submitDisabled = false,
}: QuizBuilderProps) {
  const [expandedId, setExpandedId] = useState<string | null>(questions[0]?.id ?? null);

  const addQuestion = () => {
    const newQ: QuizQuestionForm = {
      id: generateId(),
      questionText: '',
      options: ['', ''],
      correctIndex: 0,
      correctIndexes: [0],
    };
    onChange([...questions, newQ]);
    setExpandedId(newQ.id);
  };

  const updateQuestion = (id: string, patch: Partial<QuizQuestionForm>) => {
    onChange(questions.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const removeQuestion = (id: string) => {
    onChange(questions.filter((q) => q.id !== id));
    if (expandedId === id) setExpandedId(questions[0]?.id ?? null);
  };

  const addOption = (questionId: string) => {
    const q = questions.find((qu) => qu.id === questionId);
    if (!q) return;
    updateQuestion(questionId, { options: [...q.options, ''] });
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const q = questions.find((qu) => qu.id === questionId);
    if (!q) return;
    const next = [...q.options];
    next[optionIndex] = value;
    updateQuestion(questionId, { options: next });
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    const q = questions.find((qu) => qu.id === questionId);
    if (!q || q.options.length <= 2) return;
    const next = q.options.filter((_, i) => i !== optionIndex);
    const nextCorrectIndexes = q.correctIndexes
      .filter((idx) => idx !== optionIndex)
      .map((idx) => (idx > optionIndex ? idx - 1 : idx));
    const fallbackCorrectIndex = nextCorrectIndexes[0] ?? 0;
    updateQuestion(questionId, {
      options: next,
      correctIndexes: nextCorrectIndexes.length > 0 ? nextCorrectIndexes : [fallbackCorrectIndex],
      correctIndex: fallbackCorrectIndex,
    });
  };

  const toggleCorrect = (questionId: string, index: number) => {
    const q = questions.find((qu) => qu.id === questionId);
    if (!q) return;
    const exists = q.correctIndexes.includes(index);
    const nextCorrectIndexes = exists
      ? q.correctIndexes.filter((i) => i !== index)
      : [...q.correctIndexes, index].sort((a, b) => a - b);
    const normalized = nextCorrectIndexes.length > 0 ? nextCorrectIndexes : [index];
    updateQuestion(questionId, {
      correctIndexes: normalized,
      correctIndex: normalized[0] ?? index,
    });
  };

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{title || 'Quiz'}</CardTitle>
        <Button variant="accent" size="sm" onClick={addQuestion}>
          <Plus className="mr-2 size-4" />
          Ajouter une question
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {onMinScoreChange && (
          <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
            <label className="text-sm font-medium text-gray-700">
              Score minimum pour valider (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={minScoreToPass}
              onChange={(e) => onMinScoreChange(Number(e.target.value))}
              className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        )}

        {questions.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">
            Aucune question. Cliquez sur &quot;Ajouter une question&quot; pour commencer.
          </p>
        ) : (
          <ul className="space-y-3">
            {questions.map((q, idx) => (
              <li
                key={q.id}
                className="rounded-lg border border-gray-200 bg-gray-50/50 overflow-hidden"
              >
                <div
                  role="button"
                  tabIndex={0}
                  className="flex w-full items-center gap-2 p-3 cursor-pointer hover:bg-gray-100/80 text-left"
                  onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setExpandedId(expandedId === q.id ? null : q.id);
                    }
                  }}
                >
                  <GripVertical className="size-4 text-gray-400 shrink-0" aria-hidden />
                  <span className="font-medium text-facam-dark flex-1 min-w-0">
                    Question {idx + 1}
                    {q.questionText &&
                      ` : ${q.questionText.slice(0, 40)}${q.questionText.length > 40 ? '…' : ''}`}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeQuestion(q.id);
                    }}
                    aria-label="Supprimer la question"
                  >
                    <Trash2 className="size-4 text-red-500" />
                  </Button>
                </div>
                {expandedId === q.id && (
                  <div className="p-4 pt-0 space-y-4 border-t border-gray-100">
                    <Input
                      label="Énoncé de la question"
                      value={q.questionText}
                      onChange={(e) => updateQuestion(q.id, { questionText: e.target.value })}
                      placeholder="Ex. Quelle est la première étape d'une maintenance préventive ?"
                      className="font-medium"
                    />
                    <div>
                      <p
                        id={`options-label-${q.id}`}
                        className="text-sm font-medium text-gray-700 mb-1"
                      >
                        Choix de réponse
                      </p>
                      <p className="text-xs text-gray-500 mb-3">
                        Saisissez chaque proposition, puis cochez une ou plusieurs{' '}
                        <strong>bonnes réponses</strong>. L&apos;étudiant doit sélectionner toutes
                        les bonnes réponses (et aucune mauvaise) pour valider la question.
                      </p>
                      {q.options.map((opt, oi) => (
                        <div
                          key={`${q.id}-opt-${oi}`}
                          className={`flex flex-wrap items-center gap-2 mb-2 p-2 rounded-lg border ${
                            q.correctIndexes.includes(oi)
                              ? 'border-green-500 bg-green-50/50'
                              : 'border-gray-200'
                          }`}
                        >
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => updateOption(q.id, oi, e.target.value)}
                            placeholder={`Choix ${oi + 1}`}
                            className="flex-1 min-w-[120px] rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          />
                          <label className="flex items-center gap-2 shrink-0 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={q.correctIndexes.includes(oi)}
                              onChange={() => toggleCorrect(q.id, oi)}
                              className="text-green-600 focus:ring-green-500"
                              aria-label="Bonne réponse possible"
                            />
                            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                              Bonne réponse
                            </span>
                          </label>
                          {q.options.length > 2 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeOption(q.id, oi)}
                              aria-label="Supprimer ce choix"
                            >
                              <Trash2 className="size-4 text-gray-400" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => addOption(q.id)}
                      >
                        <Plus className="mr-1 size-4" /> Ajouter un choix
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {onSubmit && questions.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <Button variant="accent" onClick={onSubmit} disabled={submitDisabled}>
              {submitLabel}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
