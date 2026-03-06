/**
 * ModuleDiscussionsSection — Zone questions / discussions (fil de discussion simple).
 * Permet de poser une question et d'afficher les réponses. Style Q&R Udemy.
 */

'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DiscussionItem {
  id: string;
  author: string;
  content: string;
  date: string;
  replies?: Array<{ author: string; content: string; date: string }>;
}

interface ModuleDiscussionsSectionProps {
  moduleId: string;
  /** Discussions existantes (mock ou API) */
  discussions?: DiscussionItem[];
}

export function ModuleDiscussionsSection({
  moduleId,
  discussions: initialDiscussions = [],
}: ModuleDiscussionsSectionProps) {
  const [discussions, setDiscussions] = useState<DiscussionItem[]>(initialDiscussions);
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setSubmitting(true);
    setDiscussions((prev) => [
      ...prev,
      {
        id: `d-${Date.now()}`,
        author: 'Vous',
        content: question.trim(),
        date: new Date().toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
      },
    ]);
    setQuestion('');
    setSubmitting(false);
  };

  return (
    <section className="border-t border-gray-200 pt-6 mt-8" aria-labelledby="discussions-heading">
      <h2
        id="discussions-heading"
        className="text-xl font-bold text-facam-dark mb-4 font-montserrat flex items-center gap-2"
      >
        <MessageCircle className="size-5" />
        Questions & Discussions
      </h2>

      <form onSubmit={handleSubmit} className="mb-6">
        <input type="hidden" name="moduleId" value={moduleId} />
        <label htmlFor="question-input" className="block text-sm font-medium text-gray-700 mb-1">
          Poser une question
        </label>
        <textarea
          id="question-input"
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-facam-blue mb-2"
          placeholder="Votre question sur ce module..."
        />
        <Button type="submit" variant="outline" size="sm" disabled={submitting || !question.trim()}>
          Publier
        </Button>
      </form>

      <ul className="space-y-4">
        {discussions.length === 0 ? (
          <li className="text-gray-500 text-sm py-4">
            Aucune question pour le moment. Soyez le premier à en poser une.
          </li>
        ) : (
          discussions.map((d) => (
            <li key={d.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-facam-dark">{d.author}</span>
                <span className="text-gray-400 text-xs">{d.date}</span>
              </div>
              <p className="mt-2 text-gray-800 text-sm">{d.content}</p>
              {d.replies && d.replies.length > 0 && (
                <ul className="mt-3 ml-4 pl-4 border-l-2 border-gray-200 space-y-2">
                  {d.replies.map((rep, i) => (
                    <li key={i}>
                      <span className="font-medium text-gray-700 text-xs">{rep.author}</span>
                      <span className="text-gray-400 text-xs ml-2">{rep.date}</span>
                      <p className="text-sm text-gray-600 mt-0.5">{rep.content}</p>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
