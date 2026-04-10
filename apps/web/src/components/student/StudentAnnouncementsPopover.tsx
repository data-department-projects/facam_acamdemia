/**
 * Notifications étudiant / employé : charge les annonces module (`/announcements/my`)
 * et les affiche via `NotificationPopover`. Marque comme lues via l’API + événement global
 * (badge Messages dans le header).
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { NotificationPopover, type Notification } from '@/components/ui/notification-popover';
import { api } from '@/lib/api-client';
import { ANNOUNCEMENTS_READ_EVENT } from '@/lib/announcement-events';

type ApiAnnouncement = {
  id: string;
  moduleId: string;
  moduleTitle: string;
  content: string;
  createdAt: string;
  isRead: boolean;
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function toNotifications(rows: ApiAnnouncement[]): Notification[] {
  return [...rows]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20)
    .map((m) => ({
      id: m.id,
      title: m.moduleTitle,
      description: truncate(stripHtml(m.content), 160),
      timestamp: new Date(m.createdAt),
      read: m.isRead,
    }));
}

export function StudentAnnouncementsPopover() {
  const [items, setItems] = useState<ApiAnnouncement[]>([]);

  const load = useCallback(async () => {
    try {
      const data = await api.get<ApiAnnouncement[]>('/announcements/my');
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onRead = () => void load();
    globalThis.addEventListener(ANNOUNCEMENTS_READ_EVENT, onRead);
    return () => globalThis.removeEventListener(ANNOUNCEMENTS_READ_EVENT, onRead);
  }, [load]);

  const notifications = useMemo(() => toNotifications(items), [items]);

  const persistRead = useCallback(
    async (updated: Notification[]) => {
      const prevRead = new Map(items.map((x) => [x.id, x.isRead]));
      const ids = updated.filter((n) => n.read && prevRead.get(n.id) === false).map((n) => n.id);
      if (ids.length === 0) {
        setItems((prev) =>
          prev.map((row) => {
            const u = updated.find((x) => x.id === row.id);
            return u ? { ...row, isRead: u.read } : row;
          })
        );
        return;
      }
      try {
        await api.post<{ ok: true; marked: number }>('/announcements/mark-read', { ids });
        globalThis.dispatchEvent(new Event(ANNOUNCEMENTS_READ_EVENT));
        setItems((prev) =>
          prev.map((row) => {
            const u = updated.find((x) => x.id === row.id);
            return u ? { ...row, isRead: u.read } : row;
          })
        );
      } catch {
        await load();
      }
    },
    [items, load]
  );

  return (
    <NotificationPopover
      notifications={notifications}
      onNotificationsChange={persistRead}
      headerTitle="Notifications"
      seeAllHref="/student/messages"
      buttonClassName="h-10 w-10 shrink-0 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 shadow-sm hover:bg-gray-100 hover:text-facam-blue"
      popoverClassName="border border-gray-200 bg-white shadow-xl"
      textColor="text-gray-900"
      hoverBgColor="hover:bg-gray-50"
      dividerColor="divide-gray-100"
      headerBorderColor="border-gray-200"
      dotColor="bg-facam-blue"
      emptyMessage="Aucune annonce pour le moment."
    />
  );
}
