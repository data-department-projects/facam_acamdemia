/**
 * Dashboard responsable de module — KPIs et graphiques depuis l'API (GET /formations/stats/dashboard).
 * Données réelles : modules, inscrits, taux de complétion, score moyen quiz,
 * graphique cercle (finis / en cours), barres horizontales par chapitre, courbe inscriptions par mois, tableau étudiants.
 */

'use client';

import { useState, useEffect } from 'react';
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Users, TrendingUp, Target, Activity, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { api } from '@/lib/api-client';

interface DashboardStats {
  totalModules: number;
  totalEnrolled: number;
  completionRate: number;
  avgQuizScore: number | null;
  pie: {
    finished: number;
    inProgress: number;
    finishedPercent: number;
    inProgressPercent: number;
  };
  byChapter: { chapterId: string; chapterTitle: string; order: number; count: number }[];
  enrollmentsByMonth: { month: number; count: number }[];
  studentsTable: {
    enrollmentId: string;
    userId: string;
    fullName: string;
    email: string;
    progressPercent: number;
    completedAt: string | null;
    quizzesCompleted: number;
    totalQuizzes: number;
    finalQuizScore: number | null;
    finalQuizPassedAt: string | null;
  }[];
}

interface ModuleItem {
  id: string;
  title: string;
}

interface Paginated<T> {
  data: T[];
}

interface ReviewItem {
  id: string;
  rating: number;
  comment?: string | null;
  author: string;
  createdAt: string;
}

const MONTH_LABELS: Record<number, string> = {
  1: 'Jan',
  2: 'Fév',
  3: 'Mar',
  4: 'Avr',
  5: 'Mai',
  6: 'Juin',
  7: 'Juil',
  8: 'Août',
  9: 'Sep',
  10: 'Oct',
  11: 'Nov',
  12: 'Déc',
};

const PIE_COLORS = { finished: '#001b61', inProgress: '#ffae03' };

export default function ModuleManagerDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    api
      .get<DashboardStats>(`/formations/stats/dashboard?year=${year}`)
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((e) => {
        if (!cancelled) {
          setStats(null);
          setError(e instanceof Error ? e.message : 'Impossible de charger les statistiques.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [year]);

  useEffect(() => {
    let cancelled = false;
    api
      .get<Paginated<ModuleItem>>('/formations?limit=100')
      .then((res) => {
        const list = Array.isArray(res.data)
          ? res.data
          : ((res as { data?: ModuleItem[] }).data ?? []);
        if (!cancelled) {
          setModules(list);
          setSelectedModuleId((prev) => prev ?? list[0]?.id ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setModules([]);
          setSelectedModuleId(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedModuleId) {
      setReviews([]);
      return;
    }
    let cancelled = false;
    setReviewsLoading(true);
    api
      .get<ReviewItem[]>(`/reviews/module/${encodeURIComponent(selectedModuleId)}`)
      .then((data) => {
        if (!cancelled) setReviews(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setReviews([]);
      })
      .finally(() => {
        if (!cancelled) setReviewsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedModuleId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-facam-dark">Dashboard responsable de module</h1>
        <p className="text-gray-500">Chargement…</p>
      </div>
    );
  }

  const pieData =
    stats && (stats.pie.finished > 0 || stats.pie.inProgress > 0)
      ? [
          { name: 'Formation terminée', value: stats.pie.finished, color: PIE_COLORS.finished },
          { name: 'En cours', value: stats.pie.inProgress, color: PIE_COLORS.inProgress },
        ]
      : [];

  const lineData =
    stats?.enrollmentsByMonth?.map((m) => ({
      name: MONTH_LABELS[m.month] ?? m.month,
      inscriptions: m.count,
    })) ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-facam-dark">Dashboard responsable de module</h1>
      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm">
          {error}
        </div>
      )}

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Modules</CardTitle>
            <Activity className="size-5 text-facam-blue" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-facam-dark">{stats?.totalModules ?? 0}</p>
            <p className="text-xs text-gray-500">Formations assignées</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Étudiants inscrits</CardTitle>
            <Users className="size-5 text-facam-blue" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-facam-dark">{stats?.totalEnrolled ?? '—'}</p>
            <p className="text-xs text-gray-500">Sur vos modules</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Taux de complétion</CardTitle>
            <Target className="size-5 text-facam-yellow" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-facam-yellow">{stats?.completionRate ?? 0} %</p>
            <p className="text-xs text-gray-500">
              {stats?.pie.finished ?? 0} formation(s) terminée(s)
            </p>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Score moyen quiz</CardTitle>
            <TrendingUp className="size-5 text-facam-blue" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-facam-dark">
              {stats?.avgQuizScore != null ? `${stats.avgQuizScore} %` : '—'}
            </p>
            <p className="text-xs text-gray-500">Quiz de chapitres</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphique en cercle : terminés vs en cours */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Formation : terminés vs en cours</CardTitle>
          <p className="text-sm font-normal text-gray-500">
            Nombre et pourcentage d&apos;étudiants ayant fini la formation ou en cours
          </p>
        </CardHeader>
        <CardContent>
          {pieData.length > 0 ? (
            <div className="flex flex-wrap items-center gap-6">
              <div className="h-64 w-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value, percent }) =>
                        `${name}: ${value} (${(percent * 100).toFixed(0)} %)`
                      }
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string, props) => [
                        `${value} (${(props.payload.percent * 100).toFixed(1)} %)`,
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-facam-dark">
                  Terminés : {stats?.pie.finished ?? 0} ({stats?.pie.finishedPercent ?? 0} %)
                </p>
                <p className="font-medium text-facam-dark">
                  En cours : {stats?.pie.inProgress ?? 0} ({stats?.pie.inProgressPercent ?? 0} %)
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Aucune donnée (inscriptions ou modules manquants).
            </p>
          )}
        </CardContent>
      </Card>

      {/* Commentaires et avis (responsable module) */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Commentaires & avis sur le module</CardTitle>
            <p className="text-sm font-normal text-gray-500">
              Liste des avis publiés par les étudiants (notation + commentaire)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Module</label>
            <select
              value={selectedModuleId ?? ''}
              onChange={(e) => setSelectedModuleId(e.target.value || null)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              disabled={modules.length === 0}
            >
              {modules.length === 0 ? (
                <option value="">Aucun module</option>
              ) : (
                modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))
              )}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {reviewsLoading ? (
            <p className="text-sm text-gray-500">Chargement des avis…</p>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun avis pour ce module pour le moment.</p>
          ) : (
            <ul className="space-y-4">
              {reviews.map((r) => (
                <li key={r.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-facam-dark">{r.author}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(r.createdAt).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit',
                        })}
                      </p>
                    </div>
                    <div
                      className="flex items-center gap-1 text-facam-yellow"
                      aria-label={`${r.rating} sur 5`}
                    >
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`size-4 ${i < r.rating ? 'fill-current' : 'text-gray-200'}`}
                          aria-hidden
                        />
                      ))}
                    </div>
                  </div>
                  {r.comment ? (
                    <p className="mt-3 text-sm text-gray-700 leading-relaxed">{r.comment}</p>
                  ) : (
                    <p className="mt-3 text-sm text-gray-500 italic">
                      Aucun commentaire (note uniquement).
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Courbe : inscriptions sur 12 mois (avec filtre année) */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Évolution des inscriptions</CardTitle>
            <p className="text-sm font-normal text-gray-500">
              Nombre d&apos;inscriptions par mois pour l&apos;année sélectionnée
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Année</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
            >
              {[year, year - 1, year - 2].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {lineData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="inscriptions"
                    name="Inscriptions"
                    stroke="#001b61"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Aucune inscription pour cette année.</p>
          )}
        </CardContent>
      </Card>

      {/* Tableau : tous les étudiants et leur évolution + quiz complétés / total */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Étudiants et évolution</CardTitle>
          <p className="text-sm font-normal text-gray-500">
            Liste des inscrits avec progression et nombre de quiz réussis sur le total du module
          </p>
        </CardHeader>
        <CardContent>
          {stats?.studentsTable && stats.studentsTable.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-600">
                    <th className="pb-2 pr-4 font-semibold">Nom</th>
                    <th className="pb-2 pr-4 font-semibold">Email</th>
                    <th className="pb-2 pr-4 font-semibold">Progression</th>
                    <th className="pb-2 pr-4 font-semibold">Quiz (réussis / total)</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.studentsTable.map((row) => (
                    <tr key={row.enrollmentId} className="border-b border-gray-100">
                      <td className="py-2 pr-4 font-medium text-facam-dark">{row.fullName}</td>
                      <td className="py-2 pr-4 text-gray-600">{row.email}</td>
                      <td className="py-2 pr-4">{row.progressPercent} %</td>
                      <td className="py-2 pr-4">
                        {row.quizzesCompleted} / {row.totalQuizzes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Aucun étudiant inscrit.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
