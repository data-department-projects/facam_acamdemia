/**
 * Page Messages (responsable de module) — envoi broadcast + historique.
 * Le responsable écrit un message qui sera visible en lecture seule par les apprenants inscrits.
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { RichTextContent } from '@/components/ui/RichTextContent';
import { api } from '@/lib/api-client';

type SentAnnouncement = {
  id: string;
  moduleId: string;
  content: string;
  createdAt: string;
};

export default function ModuleManagerMessagesPage() {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<SentAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const MAX_LEN = 20000;
  const canSend = useMemo(
    () => content.trim().length > 0 && content.trim().length <= MAX_LEN,
    [content]
  );

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<SentAnnouncement[]>('/announcements/sent');
      setSent(Array.isArray(data) ? data : []);
    } catch (e) {
      setSent([]);
      setError(e instanceof Error ? e.message : "Impossible de charger l'historique.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSend = async () => {
    if (!canSend || sending) return;
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post<{ id: string }>('/announcements', { content: content.trim() });
      setContent('');
      setSuccess('Message envoyé à tous les apprenants du module.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible d'envoyer le message.");
    } finally {
      setSending(false);
    }
  };

  const historyNode = (() => {
    if (loading) return <p className="text-sm text-gray-500">Chargement…</p>;
    if (sent.length === 0)
      return <p className="text-sm text-gray-500">Aucun message envoyé pour le moment.</p>;
    return (
      <ul className="space-y-3">
        {sent.map((m) => (
          <li key={m.id} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">
              {new Date(m.createdAt).toLocaleString('fr-FR', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <div className="mt-2 text-sm text-gray-800 leading-relaxed">
              <RichTextContent content={m.content} />
            </div>
          </li>
        ))}
      </ul>
    );
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-facam-dark">Messages</h1>
        <p className="text-sm text-gray-600">
          Envoyez un message aux étudiants/employés inscrits à votre module (lecture seule côté
          apprenants).
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 text-sm">
          {success}
        </div>
      ) : null}

      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Nouveau message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <RichTextEditor
            label="Message"
            value={content}
            onChange={setContent}
            placeholder="Écrivez votre message…"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-gray-500">
              {content.trim().length}/{MAX_LEN}
            </p>
            <Button
              variant="accent"
              disabled={!canSend || sending}
              onClick={() => void handleSend()}
            >
              {sending ? 'Envoi…' : 'Envoyer'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Historique</CardTitle>
        </CardHeader>
        <CardContent>{historyNode}</CardContent>
      </Card>
    </div>
  );
}
