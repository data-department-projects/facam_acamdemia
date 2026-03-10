/**
 * Statistiques détaillées du responsable de module — Données depuis l’API.
 * Indicateurs avancés (temps passé, tentatives) à brancher lorsque l’API les exposera.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { api } from '@/lib/api-client';

interface Paginated<T> {
  data: T[];
  total: number;
}

export default function ModuleManagerStatsPage() {
  const [totalModules, setTotalModules] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get<Paginated<unknown>>('/formations?page=1&limit=1')
      .then((res) => {
        if (!cancelled) setTotalModules(typeof res.total === 'number' ? res.total : 0);
      })
      .catch(() => {
        if (!cancelled) setTotalModules(0);
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
        <h1 className="text-2xl font-bold text-slate-900">Statistiques du module</h1>
        <p className="text-slate-500">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Statistiques du module</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalModules}</p>
            <p className="text-xs text-slate-500">Formations (API)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Étudiants</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">—</p>
            <p className="text-xs text-slate-500">(endpoint stats à venir)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Complétions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-facam-blue">—</p>
            <p className="text-xs text-slate-500">(endpoint stats à venir)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Temps moyen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">—</p>
            <p className="text-xs text-slate-500">(calcul backend à venir)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export et rapports</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">
            Export CSV/Excel des notes et progression, rapports par période : à brancher sur l’API
            backend lorsqu’elle sera disponible.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
