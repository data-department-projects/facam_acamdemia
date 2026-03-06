/**
 * ModuleCommentsSection — Zone commentaires sous le contenu du module.
 * Permet de laisser un avis + notation (étoiles). Style fil d'avis type Udemy.
 */

'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ModuleCommentsSectionProps {
  moduleId: string;
  /** Avis existants (mock ou API) */
  reviews?: Array<{ author: string; rating: number; comment: string; date: string }>;
}

export function ModuleCommentsSection({ moduleId, reviews = [] }: ModuleCommentsSectionProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    setSubmitted(true);
    setComment('');
    setRating(0);
  };

  const displayRating = hoverRating || rating;

  return (
    <section className="border-t border-gray-200 pt-6 mt-8" aria-labelledby="comments-heading">
      <h2 id="comments-heading" className="text-xl font-bold text-facam-dark mb-4 font-montserrat">
        Commentaires et avis
      </h2>

      {!submitted ? (
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
                className="p-1 rounded focus:outline-none focus:ring-2 focus:ring-facam-blue"
                aria-label={`${value} étoile${value > 1 ? 's' : ''}`}
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
            />
          </div>
          <Button type="submit" variant="primary" disabled={rating === 0}>
            Publier mon avis
          </Button>
        </form>
      ) : (
        <p className="text-green-600 font-medium">Merci pour votre avis !</p>
      )}

      {reviews.length > 0 && (
        <ul className="mt-6 space-y-4">
          {reviews.map((r, i) => (
            <li key={i} className="border-b border-gray-100 pb-4 last:border-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-facam-dark">{r.author}</span>
                <span className="flex text-facam-yellow" aria-label={`${r.rating} sur 5`}>
                  {Array.from({ length: 5 }, (_, j) => (
                    <Star
                      key={j}
                      className={`size-4 ${j < r.rating ? 'fill-current' : 'text-gray-200'}`}
                    />
                  ))}
                </span>
                <span className="text-gray-400 text-xs">{r.date}</span>
              </div>
              {r.comment && <p className="mt-1 text-gray-700 text-sm">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
