/**
 * Quiz — Page dédiée au quiz final du module. Aucune redirection : on reste sur cette URL.
 * Le responsable définit ici les questions et réponses du quiz final (même page, pas de lien vers une autre).
 */

'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { ModuleQuizClient } from '../modules/[id]/quiz/ModuleQuizClient';

interface ModuleItem {
  id: string;
  title: string;
}

interface Paginated<T> {
  data: T[];
}

export default function ModuleManagerQuizPage() {
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get<Paginated<ModuleItem>>('/formations?limit=100')
      .then((res) => {
        if (!cancelled) {
          const list = Array.isArray(res.data)
            ? res.data
            : ((res as { data?: ModuleItem[] }).data ?? []);
          setModules(list);
        }
      })
      .catch(() => {
        if (!cancelled) setModules([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <p className="text-gray-500">Chargement…</p>
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-facam-dark">Quiz final</h1>
        <p className="text-sm text-gray-500">
          Aucun module assigné. L&apos;administrateur doit vous attribuer un module.
        </p>
      </div>
    );
  }

  const module = modules[0];
  return (
    <ModuleQuizClient
      moduleId={module.id}
      initialModule={{ id: module.id, title: module.title }}
      embedded
    />
  );
}
