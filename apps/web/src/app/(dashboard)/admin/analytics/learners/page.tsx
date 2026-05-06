/**
 * Learners Explorer (Admin) — table premium pour suivre performance & engagement.
 * Recherche, tri, pagination, filtres, et accès au drill-down par apprenant.
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CalendarDays,
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
import Select1 from '@/components/ui/select-1';
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

const RANGE_OPTIONS: ReadonlyArray<{ label: string; value: '7d' | '30d' | '90d' }> = [
  { label: '7 jours', value: '7d' },
  { label: '30 jours', value: '30d' },
  { label: '90 jours', value: '90d' },
];

const ROLE_OPTIONS: ReadonlyArray<{ label: string; value: 'all' | 'student' | 'employee' }> = [
  { label: 'Tous', value: 'all' },
  { label: 'Étudiants', value: 'student' },
  { label: 'Employés', value: 'employee' },
];

const SORT_OPTIONS: ReadonlyArray<{
  label: string;
  value: 'performance' | 'engagement' | 'minutes' | 'quizzes' | 'progress' | 'name';
}> = [
  { label: 'Tri: performance', value: 'performance' },
  { label: 'Tri: engagement', value: 'engagement' },
  { label: 'Tri: minutes', value: 'minutes' },
  { label: 'Tri: quiz', value: 'quizzes' },
  { label: 'Tri: progression', value: 'progress' },
  { label: 'Tri: nom', value: 'name' },
];

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
            <Timer className="size-4" /> {r.minutesLearned} min de présence
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
  const moduleOptions = useMemo(
    () => [
      { label: 'Tous les modules', value: '' },
      ...modules.map((m) => ({ label: m.title, value: m.id })),
    ],
    [modules]
  );

  const handleToggleReference = useCallback((row: LearnerRow) => {
    setCompareAnchor((prev) => nextCompareAnchor(prev, row));
  }, []);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl min-h-[260px] md:min-h-[310px]">
        <Image
          src="/hero.jpg"
          alt="Learners Explorer"
          fill
          priority
          className="object-cover object-[center_-50px] md:object-[center_-140px]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-facam-blue/90 via-facam-blue/70 to-facam-blue/40" />
        <div className="relative z-10 flex min-h-[260px] flex-col gap-6 p-5 md:min-h-[310px] md:p-6">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-transparent px-3 py-1 text-xs font-semibold tracking-wide text-white">
              <Sparkles className="size-4" />
              Learners Explorer
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white">
              Performance & engagement
            </h1>
            <p className="max-w-2xl text-xs text-white/80 md:text-sm">
              Recherchez, triez et identifiez instantanément les profils les plus performants et les
              plus investis.
            </p>
          </div>
          <div className="mt-auto rounded-2xl bg-black/15 p-3 backdrop-blur-sm md:p-4">
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-2 text-xs font-semibold text-white/90 backdrop-blur-sm">
                <Filter className="size-3.5" />
                <span>Filtres</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 backdrop-blur-sm min-w-[165px]">
                <CalendarDays className="size-3.5 text-white/80" />
                <Select1
                  value={range}
                  onValueChange={(value) => {
                    setRange(value as typeof range);
                    setPage(1);
                  }}
                  options={RANGE_OPTIONS}
                  triggerClassName="h-8 w-full border-0 bg-transparent px-1 text-sm text-white hover:bg-white/10"
                  popupClassName="border-gray-200 bg-white text-gray-800"
                />
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 backdrop-blur-sm min-w-[220px]">
                <Users className="size-3.5 text-white/80" />
                <Select1
                  value={role}
                  onValueChange={(value) => {
                    setRole(value as typeof role);
                    setPage(1);
                  }}
                  options={ROLE_OPTIONS}
                  triggerClassName="h-8 w-full border-0 bg-transparent px-1 text-sm text-white hover:bg-white/10"
                  popupClassName="border-gray-200 bg-white text-gray-800"
                />
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 backdrop-blur-sm min-w-[250px] flex-1">
                <Target className="size-3.5 text-white/80" />
                <Select1
                  value={moduleId}
                  onValueChange={(value) => {
                    setModuleId(value);
                    setPage(1);
                  }}
                  options={moduleOptions}
                  triggerClassName="h-8 w-full border-0 bg-transparent px-1 text-sm text-white hover:bg-white/10"
                  popupClassName="border-gray-200 bg-white text-gray-800"
                />
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 backdrop-blur-sm min-w-[220px]">
                <TrendingUp className="size-3.5 text-white/80" />
                <Select1
                  value={sort}
                  onValueChange={(value) => {
                    setSort(value as typeof sort);
                    setPage(1);
                  }}
                  options={SORT_OPTIONS}
                  triggerClassName="h-8 w-full border-0 bg-transparent px-1 text-sm text-white hover:bg-white/10"
                  popupClassName="border-gray-200 bg-white text-gray-800"
                />
              </div>
              <Button
                size="sm"
                className="h-8 bg-white px-4 font-semibold text-facam-blue hover:bg-white/90"
                onClick={() => void load()}
              >
                Actualiser
              </Button>
            </div>
            <p className="mt-2 text-[10px] text-white/70 md:text-xs">
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
                      <th className="py-3 pr-4 font-semibold">Présence & Engagement</th>
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
