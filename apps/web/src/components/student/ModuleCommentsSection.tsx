/**
 * ModuleCommentsSection — Zone commentaires sous le contenu du module.
 * Permet de laisser un avis + notation (étoiles). Style fil d'avis type Udemy.
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api-client';

interface ModuleCommentsSectionProps {
  moduleId: string;
}

interface ReviewItem {
  id: string;
  rating: number;
  comment?: string | null;
  author: string;
  createdAt: string;
}

export function ModuleCommentsSection({ moduleId }: ModuleCommentsSectionProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadReviews = async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const data = await api.get<ReviewItem[]>(`/reviews/module/${encodeURIComponent(moduleId)}`);
      setReviews(Array.isArray(data) ? data : []);
    } catch (e) {
      setReviews([]);
      setLoadError(e instanceof Error ? e.message : 'Impossible de charger les avis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId]);

  const canSubmit = useMemo(() => rating > 0 && !submitting, [rating, submitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      await api.post(`/reviews/module/${encodeURIComponent(moduleId)}`, {
        rating,
        comment: comment.trim() ? comment.trim() : undefined,
      });
      setComment('');
      setRating(0);
      await loadReviews();
    } catch (e) {
      setSubmitError(
        e instanceof Error ? e.message : "Impossible d'enregistrer votre avis pour le moment."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <section className="border-t border-gray-200 pt-6 mt-8" aria-labelledby="comments-heading">
      <h2 id="comments-heading" className="text-xl font-bold text-facam-dark mb-4 font-montserrat">
        Commentaires et avis
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 rounded-lg">
        <input type="hidden" name="moduleId" value={moduleId} />
        <p className="text-sm font-medium text-gray-700">Votre note</p>
        <div className="flex gap-1" role="group" aria-label="Notation en étoiles">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoverRating(value)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 rounded focus:outline-none focus:ring-2 focus:ring-facam-blue disabled:opacity-50"
              aria-label={`${value} étoile${value > 1 ? 's' : ''}`}
              disabled={submitting}
            >
              <Star
                className={`size-8 transition-colors ${
                  value <= displayRating ? 'fill-facam-yellow text-facam-yellow' : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
        <div>
          <label htmlFor="comment-text" className="block text-sm font-medium text-gray-700 mb-1">
            Votre avis (optionnel)
          </label>
          <textarea
            id="comment-text"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-facam-blue"
            placeholder="Partagez votre expérience..."
            disabled={submitting}
          />
        </div>
        {submitError && <p className="text-sm text-red-600">{submitError}</p>}
        <Button type="submit" variant="primary" disabled={!canSubmit}>
          {submitting ? 'Publication…' : 'Publier mon avis'}
        </Button>
        <p className="text-xs text-gray-500">
          Votre avis est public et visible par les autres apprenants de ce module.
        </p>
      </form>

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-gray-500">Chargement des avis…</p>
        ) : loadError ? (
          <p className="text-sm text-red-600">{loadError}</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun avis pour le moment. Soyez le premier.</p>
        ) : (
          <ul className="space-y-4">
            {reviews.map((r) => (
              <li key={r.id} className="border-b border-gray-100 pb-4 last:border-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-facam-dark">{r.author}</span>
                  <span className="flex text-facam-yellow" aria-label={`${r.rating} sur 5`}>
                    {Array.from({ length: 5 }, (_, j) => (
                      <Star
                        key={j}
                        className={`size-4 ${j < r.rating ? 'fill-current' : 'text-gray-200'}`}
                        aria-hidden
                      />
                    ))}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {new Date(r.createdAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'short',
                      day: '2-digit',
                    })}
                  </span>
                </div>
                {r.comment ? <p className="mt-1 text-gray-700 text-sm">{r.comment}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
