'use client';

import { useMemo, useState } from 'react';
import { Mail, MessageSquareText, Send } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api-client';

/**
 * Page d'assistance étudiant.
 * Permet de créer une demande support structurée stockée en base.
 */
export default function StudentHelpPage() {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('acces_compte');
  const [priority, setPriority] = useState('normale');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return subject.trim().length > 3 && message.trim().length > 10;
  }, [subject, message]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      await api.post<{ id: string }>('/support-feedback', {
        subject: subject.trim(),
        category,
        priority,
        contactEmail: email.trim() || undefined,
        message: message.trim(),
      });
      setSubject('');
      setCategory('acces_compte');
      setPriority('normale');
      setEmail('');
      setMessage('');
      setFeedback(
        'Votre commentaire a bien ete envoye a l equipe support. Merci pour votre retour.'
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Impossible d'envoyer votre demande pour le moment.";
      setFeedback(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-facam-dark">Aide et support</h1>
        <p className="mt-2 text-sm text-gray-600">
          Décrivez votre problème pour transmettre une demande claire à l&apos;équipe support.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="support-subject"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Sujet
            </label>
            <input
              id="support-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Je ne peux pas accéder au quiz du chapitre 2"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-facam-blue focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="support-category"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Catégorie
              </label>
              <select
                id="support-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-facam-blue focus:outline-none"
              >
                <option value="acces_compte">Accès au compte</option>
                <option value="cours_quiz">Cours / Quiz</option>
                <option value="certificat">Certificat</option>
                <option value="technique">Problème technique</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="support-priority"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Priorité
              </label>
              <select
                id="support-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-facam-blue focus:outline-none"
              >
                <option value="normale">Normale</option>
                <option value="haute">Haute</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="support-email" className="mb-1 block text-sm font-medium text-gray-700">
              Email de contact (optionnel)
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <input
                id="support-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-facam-blue focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="support-message"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Message
            </label>
            <div className="relative">
              <MessageSquareText className="pointer-events-none absolute left-3 top-3 size-4 text-gray-400" />
              <textarea
                id="support-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Décrivez le problème, les étapes, et ce que vous attendiez."
                rows={7}
                className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-facam-blue focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="accent" disabled={!canSubmit || submitting}>
              <Send className="mr-2 size-4" />
              {submitting ? 'Envoi...' : 'Envoyer au support'}
            </Button>
            <Link href="/student" className="text-sm font-medium text-facam-blue hover:underline">
              Retour à l&apos;accueil
            </Link>
          </div>
        </form>
      </div>

      {feedback ? (
        <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
