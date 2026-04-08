/**
 * Page Messages (étudiant / employé) — lecture seule des messages envoyés par le responsable de module.
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api-client';
import { ANNOUNCEMENTS_READ_EVENT } from '@/lib/announcement-events';
import { RichTextContent } from '@/components/ui/RichTextContent';

type Announcement = {
  id: string;
  moduleId: string;
  moduleTitle: string;
  content: string;
  createdAt: string;
  isRead: boolean;
};

export default function StudentMessagesPage() {
  const [messages, setMessages] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const markAllVisibleAsRead = async (items: Announcement[]) => {
    const unreadIds = items.filter((m) => !m.isRead).map((m) => m.id);
    if (unreadIds.length === 0) return;
    try {
      await api.post<{ ok: true; marked: number }>('/announcements/mark-read', { ids: unreadIds });
      setMessages((prev) =>
        prev.map((m) => (unreadIds.includes(m.id) ? { ...m, isRead: true } : m))
      );
      globalThis.dispatchEvent(new Event(ANNOUNCEMENTS_READ_EVENT));
    } catch {
      // best-effort : ne pas bloquer l'UX si le mark-read échoue
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<string, { moduleTitle: string; items: Announcement[] }>();
    for (const m of messages) {
      const entry = map.get(m.moduleId) ?? { moduleTitle: m.moduleTitle, items: [] };
      entry.items.push(m);
      map.set(m.moduleId, entry);
    }
    return Array.from(map.entries()).map(([moduleId, v]) => ({ moduleId, ...v }));
  }, [messages]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get<Announcement[]>('/announcements/my')
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setMessages(list);
      })
      .catch((e) => {
        if (cancelled) return;
        setMessages([]);
        setError(e instanceof Error ? e.message : 'Impossible de charger les messages.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Marque automatiquement comme lus les messages visibles dès l'ouverture de la page.
  useEffect(() => {
    if (loading) return;
    if (messages.length === 0) return;
    void markAllVisibleAsRead(messages);
  }, [loading, messages]);

  const contentNode = (() => {
    if (loading) return <p className="text-sm text-gray-500">Chargement…</p>;
    if (grouped.length === 0) {
      return (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Aucun message</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Vous n’avez pas encore reçu de message sur vos modules.
            </p>
          </CardContent>
        </Card>
      );
    }
    return (
      <div className="space-y-6">
        {grouped.map((g) => (
          <Card key={g.moduleId} className="border-gray-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{g.moduleTitle}</CardTitle>
              <p className="text-xs text-gray-500">
                {g.items.length} message(s) • {g.items.filter((m) => !m.isRead).length} non lu(s)
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {g.items.map((m) => {
                  const itemClass = m.isRead
                    ? 'rounded-xl border border-gray-200 bg-white p-4'
                    : 'rounded-xl border border-facam-yellow/60 bg-facam-yellow/10 p-4';
                  return (
                    <li key={m.id} className={itemClass}>
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
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  })();

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-facam-dark">Messages</h1>
          <p className="text-sm text-gray-600">
            Informations envoyées par le responsable de module. Vous ne pouvez pas répondre.
          </p>
        </div>
        <Link href="/student">
          <Button variant="outline">Retour à l’accueil</Button>
        </Link>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
          {error}
        </div>
      ) : null}

      {contentNode}
    </div>
  );
}
