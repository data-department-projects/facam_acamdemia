/**
 * Popover de notifications (cloche + liste animée).
 * Rôle : UI étudiant / employé ; s’appuie sur shadcn-like `button` + Framer Motion.
 * Les données réelles sont fournies par le parent (ex. annonces API) ; sinon affichage des exemples.
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { ShadcnButton as Button } from '@/components/ui/shadcn-button';
import { cn } from '@/lib/utils';

export type Notification = {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
};

interface NotificationItemProps {
  notification: Notification;
  index: number;
  onMarkAsRead: (id: string) => void;
  textColor?: string;
  hoverBgColor?: string;
  dotColor?: string;
}

const NotificationItem = ({
  notification,
  index,
  onMarkAsRead,
  textColor = 'text-white',
  dotColor = 'bg-white',
  hoverBgColor = 'hover:bg-[#ffffff37]',
}: NotificationItemProps) => (
  <motion.div
    initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
    transition={{ duration: 0.3, delay: index * 0.1 }}
    key={notification.id}
    className={cn(`p-4 ${hoverBgColor} cursor-pointer transition-colors`)}
    onClick={() => onMarkAsRead(notification.id)}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onMarkAsRead(notification.id);
      }
    }}
  >
    <div className="flex justify-between items-start gap-2">
      <div className="flex items-center gap-2 min-w-0">
        {!notification.read ? (
          <span className={cn('h-2 w-2 shrink-0 rounded-full', dotColor)} />
        ) : null}
        <h4 className={cn('text-sm font-medium truncate', textColor)}>{notification.title}</h4>
      </div>

      <span className={cn('text-xs opacity-80 shrink-0', textColor)}>
        {notification.timestamp.toLocaleDateString('fr-FR')}
      </span>
    </div>
    <p className={cn('text-xs opacity-70 mt-1 line-clamp-3', textColor)}>
      {notification.description}
    </p>
  </motion.div>
);

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  textColor?: string;
  hoverBgColor?: string;
  dividerColor?: string;
  dotColor?: string;
}

const NotificationList = ({
  notifications,
  onMarkAsRead,
  textColor,
  hoverBgColor,
  dividerColor = 'divide-gray-200/40',
  dotColor,
}: NotificationListProps) => (
  <div className={cn('divide-y', dividerColor)}>
    {notifications.map((notification, index) => (
      <NotificationItem
        key={notification.id}
        notification={notification}
        index={index}
        onMarkAsRead={onMarkAsRead}
        textColor={textColor}
        hoverBgColor={hoverBgColor}
        dotColor={dotColor}
      />
    ))}
  </div>
);

export interface NotificationPopoverProps {
  notifications?: Notification[];
  onNotificationsChange?: (notifications: Notification[]) => void;
  buttonClassName?: string;
  popoverClassName?: string;
  textColor?: string;
  hoverBgColor?: string;
  dividerColor?: string;
  headerBorderColor?: string;
  dotColor?: string;
  headerTitle?: string;
  markAllReadLabel?: string;
  seeAllHref?: string;
  seeAllLabel?: string;
  emptyMessage?: string;
}

export const NotificationPopover = ({
  notifications: notificationsProp,
  onNotificationsChange,
  buttonClassName = 'w-10 h-10 rounded-xl bg-[#11111198] hover:bg-[#111111d1] shadow-[0_0_20px_rgba(0,0,0,0.2)]',
  popoverClassName = 'bg-[#11111198] backdrop-blur-sm',
  textColor = 'text-white',
  hoverBgColor = 'hover:bg-[#ffffff37]',
  dividerColor = 'divide-gray-200/40',
  headerBorderColor = 'border-gray-200/50',
  dotColor = 'bg-white',
  headerTitle = 'Notifications',
  markAllReadLabel = 'Tout marquer comme lu',
  seeAllHref,
  seeAllLabel = 'Voir tous les messages',
  emptyMessage = 'Aucune notification',
}: NotificationPopoverProps) => {
  const initial = notificationsProp ?? dummyNotifications;
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    initial.map((n) => ({
      ...n,
      timestamp: n.timestamp instanceof Date ? n.timestamp : new Date(n.timestamp),
    }))
  );

  const rootRef = useRef<HTMLDivElement>(null);

  /** Quand le parent fournit une liste (API), on reste aligné sur le serveur après refetch. */
  useEffect(() => {
    if (notificationsProp === undefined) return;
    setNotifications(
      notificationsProp.map((n) => ({
        ...n,
        timestamp: n.timestamp instanceof Date ? n.timestamp : new Date(n.timestamp),
      }))
    );
  }, [notificationsProp]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const toggleOpen = useCallback(() => setIsOpen((o) => !o), []);

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map((n) => ({
      ...n,
      read: true,
    }));
    setNotifications(updatedNotifications);
    onNotificationsChange?.(updatedNotifications);
  };

  const markAsRead = (id: string) => {
    const updatedNotifications = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    setNotifications(updatedNotifications);
    onNotificationsChange?.(updatedNotifications);
  };

  useEffect(() => {
    if (!isOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className={cn('relative', textColor)}>
      <Button
        type="button"
        onClick={toggleOpen}
        size="icon"
        variant="ghost"
        className={cn('relative text-current', buttonClassName)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={headerTitle}
      >
        <Bell size={16} aria-hidden />
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-gray-800 bg-black px-1 text-xs text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </Button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-label={headerTitle}
            className={cn(
              'absolute right-0 z-[60] mt-2 max-h-[400px] w-80 overflow-y-auto rounded-xl shadow-lg',
              popoverClassName
            )}
          >
            <div
              className={cn('flex items-center justify-between border-b p-4', headerBorderColor)}
            >
              <h3 className="text-sm font-medium">{headerTitle}</h3>
              <Button
                type="button"
                onClick={markAllAsRead}
                variant="ghost"
                size="sm"
                className={cn('text-xs text-current', hoverBgColor)}
                disabled={unreadCount === 0}
              >
                {markAllReadLabel}
              </Button>
            </div>

            {notifications.length === 0 ? (
              <p className={cn('p-6 text-center text-sm opacity-80', textColor)}>{emptyMessage}</p>
            ) : (
              <NotificationList
                notifications={notifications}
                onMarkAsRead={markAsRead}
                textColor={textColor}
                hoverBgColor={hoverBgColor}
                dividerColor={dividerColor}
                dotColor={dotColor}
              />
            )}

            {seeAllHref ? (
              <div className={cn('border-t p-3', headerBorderColor)}>
                <Link
                  href={seeAllHref}
                  className={cn(
                    'block text-center text-xs font-medium underline-offset-2 hover:underline',
                    textColor
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  {seeAllLabel}
                </Link>
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

const dummyNotifications: Notification[] = [
  {
    id: '1',
    title: 'Nouveau message',
    description: 'Vous avez reçu un message de votre responsable de module.',
    timestamp: new Date(),
    read: false,
  },
  {
    id: '2',
    title: 'Mise à jour',
    description: 'Une maintenance plateforme est prévue prochainement.',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    read: false,
  },
  {
    id: '3',
    title: 'Rappel',
    description: 'Pensez à compléter le chapitre en cours.',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    read: true,
  },
];
