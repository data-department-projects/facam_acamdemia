/**
 * Client du dashboard admin — charge les données depuis l’API (utilisateurs, formations, stats).
 * Aucune donnée mock : tout vient du backend / Supabase.
 */

'use client';

import { useState, useEffect } from 'react';
import { Users, BookOpen, Award, Activity, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api-client';

interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface StatsResponse {
  totalCompletions: number;
}

export default function AdminDashboardClient() {
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [totalStudents, setTotalStudents] = useState<number | null>(null);
  const [totalModules, setTotalModules] = useState<number | null>(null);
  const [totalCompletions, setTotalCompletions] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);
      const [usersResult, studentsResult, formationsResult, statsResult] = await Promise.allSettled(
        [
          api.get<Paginated<unknown>>('/users?page=1&limit=1'),
          api.get<Paginated<unknown>>('/users?page=1&limit=1&role=student'),
          api.get<Paginated<unknown>>('/formations?page=1&limit=1'),
          api.get<StatsResponse>('/enrollments/stats'),
        ]
      );
      if (cancelled) return;

      const errors: string[] = [];
      if (usersResult.status === 'fulfilled' && typeof usersResult.value?.total === 'number') {
        setTotalUsers(usersResult.value.total);
      } else {
        setTotalUsers(0);
        if (usersResult.status === 'rejected') errors.push('utilisateurs');
      }
      if (
        studentsResult.status === 'fulfilled' &&
        typeof studentsResult.value?.total === 'number'
      ) {
        setTotalStudents(studentsResult.value.total);
      } else {
        setTotalStudents(0);
        if (studentsResult.status === 'rejected') errors.push('étudiants');
      }
      if (
        formationsResult.status === 'fulfilled' &&
        typeof formationsResult.value?.total === 'number'
      ) {
        setTotalModules(formationsResult.value.total);
      } else {
        setTotalModules(0);
        if (formationsResult.status === 'rejected') errors.push('modules');
      }
      if (
        statsResult.status === 'fulfilled' &&
        typeof (statsResult.value as StatsResponse)?.totalCompletions === 'number'
      ) {
        setTotalCompletions((statsResult.value as StatsResponse).totalCompletions);
      } else {
        setTotalCompletions(0);
        if (statsResult.status === 'rejected') errors.push('statistiques');
      }
      if (errors.length > 0) {
        const firstRejection =
          usersResult.status === 'rejected'
            ? usersResult.reason
            : studentsResult.status === 'rejected'
              ? studentsResult.reason
              : formationsResult.status === 'rejected'
                ? formationsResult.reason
                : statsResult.status === 'rejected'
                  ? statsResult.reason
                  : null;
        const msg =
          errors.length === 4
            ? firstRejection instanceof Error
              ? firstRejection.message
              : "Impossible de charger les données. Vérifiez que l'API est démarrée (NEXT_PUBLIC_API_URL)."
            : `Données non disponibles : ${errors.join(', ')}.`;
        setError(msg);
      }
      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const globalCompletionRate =
    totalStudents != null && totalStudents > 0 && totalCompletions != null
      ? Math.round((totalCompletions / totalStudents) * 100)
      : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-facam-dark">Dashboard administrateur</h1>
        <p className="text-gray-500">Chargement des indicateurs…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-facam-dark">Dashboard administrateur</h1>
      {error && <p className="rounded-md bg-amber-50 p-2 text-sm text-amber-800">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Utilisateurs</CardTitle>
            <Users className="size-4 text-facam-blue" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-facam-dark">{totalUsers ?? '—'}</p>
            <p className="text-xs text-gray-500">Comptes actifs</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Étudiants</CardTitle>
            <Users className="size-4 text-facam-blue" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-facam-dark">{totalStudents ?? '—'}</p>
            <p className="text-xs text-gray-500">Inscrits</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Modules</CardTitle>
            <BookOpen className="size-4 text-facam-blue" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-facam-dark">{totalModules ?? '—'}</p>
            <p className="text-xs text-gray-500">Formations</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Taux de complétion</CardTitle>
            <Award className="size-4 text-facam-yellow" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-facam-yellow">{globalCompletionRate} %</p>
            <p className="text-xs text-gray-500">Global ({totalCompletions ?? 0} complétions)</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="size-5" />
            Activité récente
          </CardTitle>
          <Link href="/admin/users">
            <Button variant="ghost" size="sm">
              Voir tout
              <ArrowRight className="ml-1 size-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Les événements d’activité seront affichés ici lorsqu’un endpoint dédié sera disponible.
          </p>
        </CardContent>
      </Card>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Actions rapides</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Link href="/admin/users">
            <Button variant="accent">Créer un compte étudiant / responsable</Button>
          </Link>
          <Link href="/admin/users">
            <Button variant="outline">Gestion des utilisateurs</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
