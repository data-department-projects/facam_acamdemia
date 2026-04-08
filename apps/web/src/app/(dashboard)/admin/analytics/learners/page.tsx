/**
 * Learners Explorer (Admin) — table premium pour suivre performance & engagement.
 * Recherche, tri, pagination, filtres, et accès au drill-down par apprenant.
 */

'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Crown,
  Filter,
  Flame,
  GitCompare,
  Search,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api-client';

type ModuleItem = { id: string; title: string };

type LearnerRow = {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  enrollmentsCount: number;
  avgProgress: number;
  quizzesTaken: number;
  avgQuizScore: number;
  passRate: number;
  bestScoreTop3Quizzes: number;
  minutesLearned: number;
  engagementScore: number;
};

type LearnersResponse = {
  meta: {
    from: string;
    to: string;
    role: 'student' | 'employee' | 'all';
    moduleId: string | null;
    q: string;
    sort: string;
  };
  data: LearnerRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function roleLabel(role: string): string {
  if (role === 'student') return 'Étudiant';
  if (role === 'employee') return 'Employé';
  return role;
}

function learnerCompareHref(
  anchorId: string,
  otherUserId: string,
  from: string,
  to: string,
  moduleId: string
): string {
  const qs = new URLSearchParams({ from, to, compare: otherUserId });
  if (moduleId) qs.set('moduleId', moduleId);
  return `/admin/analytics/learners/${encodeURIComponent(anchorId)}?${qs.toString()}`;
}

function perfToneClass(avgQuizScore: number): string {
  if (avgQuizScore >= 80) return 'text-emerald-700';
  if (avgQuizScore >= 60) return 'text-amber-700';
  return 'text-red-700';
}

function nextCompareAnchor(
  prev: { id: string; fullName: string } | null,
  row: LearnerRow
): { id: string; fullName: string } | null {
  return prev?.id === row.userId ? null : { id: row.userId, fullName: row.fullName };
}

type ExplorerRowProps = Readonly<{
  row: LearnerRow;
  idx: number;
  sort: LearnersResponse['meta']['sort'];
  from: string;
  to: string;
  moduleId: string;
  compareAnchor: { id: string; fullName: string } | null;
  onToggleReference: (row: LearnerRow) => void;
}>;

function LearnerExplorerTableRow({
  row: r,
  idx,
  sort,
  from,
  to,
  moduleId,
  compareAnchor,
  onToggleReference,
}: ExplorerRowProps) {
  const perfClass = perfToneClass(r.avgQuizScore);
  const badge =
    idx < 3 && sort === 'performance' ? (
      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">
        <Crown className="size-3" /> Top
      </span>
    ) : null;
  const detailHref = `/admin/analytics/learners/${r.userId}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
  const detailHrefWithModule = moduleId
    ? `${detailHref}&moduleId=${encodeURIComponent(moduleId)}`
    : detailHref;
  const isAnchor = compareAnchor?.id === r.userId;
  const compareAgainstHref =
    compareAnchor && compareAnchor.id !== r.userId
      ? learnerCompareHref(compareAnchor.id, r.userId, from, to, moduleId)
      : '';

  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(0.15, idx * 0.01) }}
      className={
        isAnchor
          ? 'border-b border-amber-100 bg-amber-50/40 hover:bg-amber-50/70'
          : 'border-b border-gray-100 hover:bg-gray-50/70'
      }
    >
      <td className="py-3 pr-4">
        <div className="min-w-[260px]">
          <p className="font-bold text-facam-dark truncate">
            {r.fullName}
            {badge}
          </p>
          <p className="text-xs text-gray-500 truncate">{r.email}</p>
        </div>
      </td>
      <td className="py-3 pr-4">
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
          {roleLabel(r.role)}
        </span>
      </td>
      <td className="py-3 pr-4">
        <div className="space-y-1">
          <div className={`inline-flex items-center gap-2 text-xs font-bold ${perfClass}`}>
            <TrendingUp className="size-4" /> {r.avgQuizScore}% • {r.passRate}% pass
          </div>
          <div className="text-[11px] text-gray-500 inline-flex items-center gap-2">
            <Target className="size-3" /> {r.bestScoreTop3Quizzes}% (top 3) • {r.quizzesTaken} quiz
          </div>
        </div>
      </td>
      <td className="py-3 pr-4">
        <div className="space-y-2">
          <div className="text-xs font-bold text-emerald-700 inline-flex items-center gap-2">
            <Timer className="size-4" /> {r.minutesLearned} min
          </div>
          <div className="h-2 w-40 rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500"
              style={{ width: `${Math.min(100, r.engagementScore)}%` }}
            />
          </div>
          <div className="text-[11px] text-gray-500 inline-flex items-center gap-2">
            <Flame className="size-3" /> Score engagement: {r.engagementScore}
          </div>
        </div>
      </td>
      <td className="py-3 pr-4">
        <div className="space-y-2">
          <div className="text-xs font-bold text-violet-700">{r.avgProgress}%</div>
          <div className="h-2 w-32 rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-amber-400"
              style={{ width: `${Math.min(100, r.avgProgress)}%` }}
            />
          </div>
          <div className="text-[11px] text-gray-500">{r.enrollmentsCount} inscription(s)</div>
        </div>
      </td>
      <td className="py-3 pr-0 text-right">
        <div className="flex flex-col items-end gap-2 sm:flex-row sm:justify-end">
          <Link href={detailHrefWithModule}>
            <Button variant="accent" size="sm">
              Ouvrir <ArrowRight className="ml-1 size-4" />
            </Button>
          </Link>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onToggleReference(r);
            }}
            className={isAnchor ? 'border-amber-400 bg-amber-50' : ''}
          >
            Réf.
          </Button>
          {compareAgainstHref ? (
            <Link href={compareAgainstHref}>
              <Button variant="outline" size="sm" className="gap-1">
                <GitCompare className="size-4" />
                Comparer
              </Button>
            </Link>
          ) : null}
        </div>
      </td>
    </motion.tr>
  );
}

export default function AdminLearnersExplorerPage() {
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LearnersResponse | null>(null);

  const [q, setQ] = useState('');
  const [role, setRole] = useState<'all' | 'student' | 'employee'>('all');
  const [moduleId, setModuleId] = useState('');
  const [sort, setSort] = useState<
    'performance' | 'engagement' | 'minutes' | 'quizzes' | 'progress' | 'name'
  >('performance');
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [page, setPage] = useState(1);
  /** Profil « A » pour ouvrir la fiche en mode comparaison avec un « B » depuis la colonne actions. */
  const [compareAnchor, setCompareAnchor] = useState<{ id: string; fullName: string } | null>(null);

  const fromTo = useMemo(() => {
    const to = new Date();
    const daysByRange: Record<typeof range, number> = { '7d': 7, '30d': 30, '90d': 90 };
    const days = daysByRange[range];
    const from = new Date(to.getTime() - days * 86400000);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [range]);

  const loadModules = async () => {
    try {
      const res = await api.get<{ data: ModuleItem[] }>('/formations?limit=100&catalogue=1');
      setModules(Array.isArray(res.data) ? res.data : []);
    } catch {
      setModules([]);
    }
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      qs.set('from', fromTo.from);
      qs.set('to', fromTo.to);
      qs.set('role', role);
      qs.set('sort', sort);
      qs.set('page', String(page));
      qs.set('limit', '25');
      if (q.trim()) qs.set('q', q.trim());
      if (moduleId) qs.set('moduleId', moduleId);
      const res = await api.get<LearnersResponse>(`/analytics/admin/learners?${qs.toString()}`);
      setData(res);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : 'Impossible de charger la table.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadModules();
  }, []);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromTo.from, fromTo.to, role, moduleId, sort, page]);

  const rows = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handleToggleReference = useCallback((row: LearnerRow) => {
    setCompareAnchor((prev) => nextCompareAnchor(prev, row));
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-facam-dark via-[#0b2a8f] to-[#5b21b6] p-6 text-white shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide">
              <Sparkles className="size-4" />
              Learners Explorer
            </div>
            <h1 className="mt-2 text-2xl md:text-3xl font-extrabold">Performance & engagement</h1>
            <p className="text-sm text-white/75 max-w-2xl">
              Recherchez, triez et identifiez instantanément les profils les plus performants et les
              plus investis.
            </p>
          </div>

          <div className="w-full md:w-auto rounded-2xl bg-white/10 p-4 backdrop-blur">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
                <Filter className="size-4" />
                Filtres
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
                <select
                  value={range}
                  onChange={(e) => {
                    setRange(e.target.value as typeof range);
                    setPage(1);
                  }}
                  className="bg-transparent text-sm font-semibold text-white outline-none"
                >
                  <option value="7d">7 jours</option>
                  <option value="30d">30 jours</option>
                  <option value="90d">90 jours</option>
                </select>
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
                <select
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value as typeof role);
                    setPage(1);
                  }}
                  className="bg-transparent text-sm font-semibold text-white outline-none"
                >
                  <option value="all">Étudiants + Employés</option>
                  <option value="student">Étudiants</option>
                  <option value="employee">Employés</option>
                </select>
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 max-w-[260px]">
                <select
                  value={moduleId}
                  onChange={(e) => {
                    setModuleId(e.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent text-sm font-semibold text-white outline-none w-full"
                >
                  <option value="">Tous les modules</option>
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value as typeof sort);
                    setPage(1);
                  }}
                  className="bg-transparent text-sm font-semibold text-white outline-none"
                >
                  <option value="performance">Tri: performance</option>
                  <option value="engagement">Tri: engagement</option>
                  <option value="minutes">Tri: minutes</option>
                  <option value="quizzes">Tri: quiz</option>
                  <option value="progress">Tri: progression</option>
                  <option value="name">Tri: nom</option>
                </select>
              </div>
              <Button
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
                onClick={() => void load()}
              >
                Actualiser
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-white/60">
              Période: {new Date(fromTo.from).toLocaleDateString('fr-FR')} →{' '}
              {new Date(fromTo.to).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 text-sm">
          {error}
        </div>
      ) : null}

      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="size-5 text-facam-blue" />
              Table apprenants
            </CardTitle>
            <p className="text-xs text-gray-500">
              Ouvrez une fiche 360°, ou définissez une <strong>référence</strong> puis cliquez{' '}
              <strong>Comparer</strong> sur un autre apprenant pour un mode côte à côte (radar +
              détails).
            </p>
            {compareAnchor ? (
              <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-violet-200 bg-violet-50/80 px-3 py-2 text-xs text-violet-950">
                <GitCompare className="size-4 shrink-0" />
                <span>
                  Référence: <span className="font-bold">{compareAnchor.fullName}</span>
                </span>
                <Button variant="outline" size="sm" onClick={() => setCompareAnchor(null)}>
                  Effacer
                </Button>
              </div>
            ) : null}
          </div>
          <div className="w-full md:w-[420px]">
            <Input
              label=""
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher par nom ou email…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setPage(1);
                  void load();
                }
              }}
            />
            <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
              <span className="inline-flex items-center gap-1">
                <Search className="size-3" /> Appuyez sur Entrée
              </span>
              <span>{data?.total ?? 0} profil(s)</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {(() => {
            if (loading) return <p className="text-sm text-gray-500">Chargement…</p>;
            if (rows.length === 0) return <p className="text-sm text-gray-500">Aucun résultat.</p>;
            return (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-600">
                      <th className="py-3 pr-4 font-semibold">Profil</th>
                      <th className="py-3 pr-4 font-semibold">Rôle</th>
                      <th className="py-3 pr-4 font-semibold">Performance</th>
                      <th className="py-3 pr-4 font-semibold">Engagement</th>
                      <th className="py-3 pr-4 font-semibold">Progression</th>
                      <th className="py-3 pr-0 font-semibold text-right min-w-[200px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, idx) => (
                      <LearnerExplorerTableRow
                        key={r.userId}
                        row={r}
                        idx={idx}
                        sort={sort}
                        from={fromTo.from}
                        to={fromTo.to}
                        moduleId={moduleId}
                        compareAnchor={compareAnchor}
                        onToggleReference={handleToggleReference}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-gray-500">
              Page {page} / {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4" />
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Suivant
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
