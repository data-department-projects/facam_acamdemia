/**
 * Learner drill‑down (Admin) — fiche 360° ultra riche.
 * Inclut : KPI, radar performance/engagement/progression, timelines, stats par quiz, modules & progression.
 * Mode comparaison : query `?compare=<userId>` affiche deux profils côte à côte avec radar superposé.
 */

'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Crown,
  Flame,
  GitCompare,
  LineChart as LineChartIcon,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api-client';

type LearnerDetail = {
  filters: { from: string; to: string; moduleId: string | null };
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    avatarUrl: string | null;
    createdAt: string;
  };
  kpi: {
    attemptsTaken: number;
    avgQuizScore: number | null;
    passRate: number;
    bestScoreTop3Quizzes: number;
    totalMinutesLearned: number;
    engagementScore: number;
  };
  enrollments: {
    enrollmentId: string;
    moduleId: string;
    moduleTitle: string;
    moduleType: string | null;
    progressPercent: number;
    completedAt: string | null;
    enrolledAt: string;
    lastViewedChapterId: string | null;
    lastViewedItemId: string | null;
  }[];
  performanceOverTime: { day: string; attempts: number; avgScore: number }[];
  minutesTimeline: { day: string; minutes: number }[];
  perQuiz: {
    quizId: string;
    title: string;
    isFinal: boolean;
    attempts: number;
    passRate: number;
    avgScore: number;
    bestScore: number;
  }[];
};

function roleLabel(role: string): string {
  if (role === 'student') return 'Étudiant';
  if (role === 'employee') return 'Employé';
  return role;
}

/** Scores 0–100 pour le radar : performance (quiz), engagement (score interne), progression (modules terminés). */
function learnerRadarScores(d: LearnerDetail): {
  performance: number;
  engagement: number;
  progression: number;
} {
  const kpi = d.kpi;
  const performanceRaw = kpi.avgQuizScore ?? kpi.passRate;
  const enrollments = d.enrollments ?? [];
  const completed = enrollments.filter((e) => e.completedAt != null).length;
  const progression =
    enrollments.length > 0 ? Math.round((completed / enrollments.length) * 100) : 0;
  return {
    performance: Math.max(0, Math.min(100, performanceRaw)),
    engagement: Math.max(0, Math.min(100, kpi.engagementScore)),
    progression: Math.max(0, Math.min(100, progression)),
  };
}

function buildCompareRadarRows(
  a: LearnerDetail,
  b: LearnerDetail,
  labelA: string,
  labelB: string
): { subject: string; [key: string]: string | number }[] {
  const sa = learnerRadarScores(a);
  const sb = learnerRadarScores(b);
  return [
    { subject: 'Performance', [labelA]: sa.performance, [labelB]: sb.performance },
    { subject: 'Engagement', [labelA]: sa.engagement, [labelB]: sb.engagement },
    { subject: 'Progression', [labelA]: sa.progression, [labelB]: sb.progression },
  ];
}

const RADAR_PRIMARY_KEY = 'profilA';
const RADAR_COMPARE_KEY = 'profilB';

function LearnerKpiCards({ detail }: { readonly detail: LearnerDetail }) {
  const kpi = detail.kpi;
  const enrollments = detail.enrollments ?? [];
  const completed = enrollments.filter((e) => e.completedAt != null).length;
  const completionRate =
    enrollments.length > 0 ? Math.round((completed / enrollments.length) * 100) : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700">Complétion modules</CardTitle>
          <Crown className="size-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-extrabold text-facam-dark">{completionRate}%</p>
          <p className="text-xs text-gray-500">
            {completed}/{enrollments.length} module(s) terminés
          </p>
        </CardContent>
      </Card>
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700">Quiz passés</CardTitle>
          <BarChart3 className="size-4 text-violet-700" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-extrabold text-facam-dark">{kpi.attemptsTaken}</p>
          <p className="text-xs text-gray-500">Tentatives sur la période</p>
        </CardContent>
      </Card>
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700">Pass rate</CardTitle>
          <Target className="size-4 text-emerald-700" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-extrabold text-facam-dark">{kpi.passRate}%</p>
          <p className="text-xs text-gray-500">Réussite quiz</p>
        </CardContent>
      </Card>
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700">Minutes apprises</CardTitle>
          <Timer className="size-4 text-blue-700" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-extrabold text-facam-dark">{kpi.totalMinutesLearned}</p>
          <p className="text-xs text-gray-500">Estimation (vidéo + quiz)</p>
        </CardContent>
      </Card>
    </div>
  );
}

function LearnerLineBarCharts({ detail }: { readonly detail: LearnerDetail }) {
  const perf = detail.performanceOverTime ?? [];
  const minutes = detail.minutesTimeline ?? [];
  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <Card className="border-gray-200 shadow-sm lg:col-span-7">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <LineChartIcon className="size-5 text-facam-blue" />
            Performance (timeline)
          </CardTitle>
          <div className="text-xs text-gray-500">Score moyen & tentatives / jour</div>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={perf}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tickFormatter={(v) => String(v).slice(5)} />
                <YAxis yAxisId="left" domain={[0, 100]} />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name === 'avgScore' ? [`${value}%`, 'Score moyen'] : [value, 'Tentatives']
                  }
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="avgScore"
                  name="Score moyen"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="attempts"
                  name="Tentatives"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200 shadow-sm lg:col-span-5">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Flame className="size-5 text-emerald-600" />
            Engagement (minutes / jour)
          </CardTitle>
          <div className="text-xs text-gray-500">Apprentissage estimé</div>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={minutes} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tickFormatter={(v) => String(v).slice(5)} />
                <YAxis />
                <Tooltip formatter={(v: number) => [`${v} min`, 'Minutes']} />
                <Bar dataKey="minutes" name="Minutes" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LearnerQuizModules({ detail }: { readonly detail: LearnerDetail }) {
  const perQuiz = detail.perQuiz ?? [];
  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <Card className="border-gray-200 shadow-sm lg:col-span-7">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="size-5 text-violet-700" />
            Analyse des quiz
          </CardTitle>
          <div className="text-xs text-gray-500">Moy. / best / pass rate</div>
        </CardHeader>
        <CardContent>
          {perQuiz.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune tentative sur la période.</p>
          ) : (
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-600">
                    <th className="py-3 pr-4 font-semibold">Quiz</th>
                    <th className="py-3 pr-4 font-semibold">Tentatives</th>
                    <th className="py-3 pr-4 font-semibold">Score</th>
                    <th className="py-3 pr-4 font-semibold">Best</th>
                    <th className="py-3 pr-0 font-semibold text-right">Pass</th>
                  </tr>
                </thead>
                <tbody>
                  {perQuiz.slice(0, 15).map((q, idx) => (
                    <motion.tr
                      key={q.quizId}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, delay: Math.min(0.15, idx * 0.01) }}
                      className="border-b border-gray-100"
                    >
                      <td className="py-3 pr-4 font-semibold text-facam-dark">
                        {q.isFinal ? (
                          <span className="mr-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800">
                            Final
                          </span>
                        ) : null}
                        {q.title}
                      </td>
                      <td className="py-3 pr-4 text-gray-700">{q.attempts}</td>
                      <td className="py-3 pr-4 text-violet-700 font-bold">{q.avgScore}%</td>
                      <td className="py-3 pr-4 text-emerald-700 font-bold">{q.bestScore}%</td>
                      <td className="py-3 pr-0 text-right text-gray-700 font-semibold">
                        {q.passRate}%
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-gray-200 shadow-sm lg:col-span-5">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="size-5 text-amber-600" />
            Modules & progression
          </CardTitle>
          <div className="text-xs text-gray-500">{detail.enrollments.length} inscription(s)</div>
        </CardHeader>
        <CardContent>
          {detail.enrollments.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune inscription.</p>
          ) : (
            <ul className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {detail.enrollments.slice(0, 10).map((e) => (
                <li
                  key={e.enrollmentId}
                  className="rounded-2xl border border-gray-200 bg-white p-4"
                >
                  <p className="font-bold text-facam-dark">{e.moduleTitle}</p>
                  <p className="text-xs text-gray-500">
                    {e.completedAt ? 'Terminé' : 'En cours'} • Inscrit le{' '}
                    {new Date(e.enrolledAt).toLocaleDateString('fr-FR')}
                  </p>
                  <div className="mt-3 h-2 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-amber-400"
                      style={{ width: `${Math.min(100, e.progressPercent)}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                    <span>{e.progressPercent}%</span>
                    <span>{e.completedAt ? 'Certifié' : 'Progression'}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SingleLearnerRadar({ detail }: { readonly detail: LearnerDetail }) {
  const s = learnerRadarScores(detail);
  const chartData = [
    { subject: 'Performance', score: s.performance },
    { subject: 'Engagement', score: s.engagement },
    { subject: 'Progression', score: s.progression },
  ];
  return (
    <Card className="border-gray-200 shadow-sm lg:col-span-12">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="size-5 text-amber-500" />
          Profil synthétique (radar)
        </CardTitle>
        <p className="text-xs text-gray-500 max-w-md text-right">
          Performance (scores quiz), engagement (activité & progression) et complétion des modules —
          échelle 0–100.
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData} margin={{ top: 16, right: 24, bottom: 16, left: 24 }}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 12 }} />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: '#9ca3af', fontSize: 10 }}
              />
              <Tooltip formatter={(v: number) => [`${v}`, 'Score']} />
              <Radar
                name="Profil"
                dataKey="score"
                stroke="#7c3aed"
                fill="#7c3aed"
                fillOpacity={0.35}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function CompareLearnerRadar({
  left,
  right,
  leftLabel,
  rightLabel,
}: {
  readonly left: LearnerDetail;
  readonly right: LearnerDetail;
  readonly leftLabel: string;
  readonly rightLabel: string;
}) {
  const chartData = buildCompareRadarRows(left, right, RADAR_PRIMARY_KEY, RADAR_COMPARE_KEY);
  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-base flex items-center gap-2">
          <GitCompare className="size-5 text-amber-500" />
          Comparaison radar
        </CardTitle>
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-blue-600" />
            {leftLabel}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-emerald-500" />
            {rightLabel}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[380px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData} margin={{ top: 16, right: 40, bottom: 16, left: 40 }}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 12 }} />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: '#9ca3af', fontSize: 10 }}
              />
              <Tooltip />
              <Legend />
              <Radar
                name={leftLabel}
                dataKey={RADAR_PRIMARY_KEY}
                stroke="#2563eb"
                fill="#2563eb"
                fillOpacity={0.22}
                strokeWidth={2}
              />
              <Radar
                name={rightLabel}
                dataKey={RADAR_COMPARE_KEY}
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function HeroMiniStats({ detail }: { readonly detail: LearnerDetail }) {
  const kpi = detail.kpi;
  return (
    <div className="rounded-2xl bg-white/10 p-4 backdrop-blur min-w-[260px] flex-1">
      <p className="text-sm font-bold text-white mb-2 truncate">{detail.user.fullName}</p>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-white/70">Engagement</p>
          <p className="text-2xl font-extrabold">{kpi.engagementScore}</p>
        </div>
        <div>
          <p className="text-xs text-white/70">Minutes</p>
          <p className="text-2xl font-extrabold">{kpi.totalMinutesLearned}</p>
        </div>
        <div>
          <p className="text-xs text-white/70">Score moyen</p>
          <p className="text-xl font-extrabold">
            {kpi.avgQuizScore == null ? '—' : `${kpi.avgQuizScore}%`}
          </p>
        </div>
        <div>
          <p className="text-xs text-white/70">Top 3 quiz</p>
          <p className="text-xl font-extrabold">{kpi.bestScoreTop3Quizzes}%</p>
        </div>
      </div>
      <div className="mt-3 h-2 rounded-full bg-white/15">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-blue-400"
          style={{ width: `${Math.min(100, kpi.engagementScore)}%` }}
        />
      </div>
    </div>
  );
}

export default function AdminLearnerDrilldownPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = params.userId as string;

  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const moduleId = searchParams.get('moduleId');
  const compareRaw = searchParams.get('compare');
  const compareUserId =
    compareRaw && compareRaw.trim() !== '' && compareRaw.trim() !== userId
      ? compareRaw.trim()
      : null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [data, setData] = useState<LearnerDetail | null>(null);
  const [compareData, setCompareData] = useState<LearnerDetail | null>(null);

  const filterQs = useMemo(() => {
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    if (moduleId) qs.set('moduleId', moduleId);
    return qs;
  }, [from, to, moduleId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCompareError(null);
    try {
      const qs = filterQs.toString();
      const primaryUrl = `/analytics/admin/learner/${encodeURIComponent(userId)}?${qs}`;
      const res = await api.get<LearnerDetail>(primaryUrl);
      setData(res);
      setCompareData(null);

      if (!compareUserId) return;

      const secondUrl = `/analytics/admin/learner/${encodeURIComponent(compareUserId)}?${qs}`;
      try {
        const res2 = await api.get<LearnerDetail>(secondUrl);
        setCompareData(res2);
      } catch {
        setCompareError('Impossible de charger le second profil (comparaison).');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Impossible de charger la fiche.';
      setData(null);
      setCompareData(null);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [userId, compareUserId, filterQs]);

  useEffect(() => {
    void load();
  }, [load]);

  const detailBaseHref = `/admin/analytics/learners/${encodeURIComponent(userId)}?${filterQs.toString()}`;
  const invertCompareHref = useMemo(() => {
    if (!compareUserId) return '';
    const qs = new URLSearchParams(filterQs.toString());
    qs.set('compare', userId);
    return `/admin/analytics/learners/${encodeURIComponent(compareUserId)}?${qs.toString()}`;
  }, [compareUserId, filterQs, userId]);
  const shortName = (full: string) => {
    const part = full.trim().split(/\s+/)[0] ?? '';
    return part.length > 0 ? part : full;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-facam-dark via-[#0b2a8f] to-[#5b21b6] p-6 text-white shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">Learner 360</p>
              <h1 className="text-2xl md:text-3xl font-extrabold">Fiche apprenant</h1>
              <p className="text-sm text-white/75">Chargement des analytics…</p>
            </div>
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 text-sm">
          {error ?? 'Données indisponibles.'}
        </div>
        <Link href="/admin/analytics/learners">
          <Button variant="outline">
            <ArrowLeft className="mr-2 size-4" />
            Retour
          </Button>
        </Link>
      </div>
    );
  }

  const paired = compareData;
  const dualMode = Boolean(compareUserId && paired);
  const leftRadarLabel = shortName(data.user.fullName);
  const rightRadarLabel = paired ? shortName(paired.user.fullName) : '';

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-facam-dark via-[#0b2a8f] to-[#5b21b6] p-6 text-white shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1 min-w-[260px] flex-1">
            <Link
              href="/admin/analytics/learners"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white"
            >
              <ArrowLeft className="size-4" />
              <span className="text-sm font-semibold">Retour au Learners Explorer</span>
            </Link>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide">
                <Sparkles className="size-4" />
                Learner 360° • Drill‑down
              </div>
              {compareUserId ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-100">
                  <GitCompare className="size-4" />
                  Mode comparaison
                </div>
              ) : null}
            </div>
            {dualMode && paired ? (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <h1 className="text-xl md:text-2xl font-extrabold leading-snug">
                    {data.user.fullName}
                  </h1>
                  <p className="text-sm text-white/75">
                    {data.user.email} • {roleLabel(data.user.role)}
                  </p>
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-extrabold leading-snug">
                    {paired.user.fullName}
                  </h1>
                  <p className="text-sm text-white/75">
                    {paired.user.email} • {roleLabel(paired.user.role)}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <h1 className="mt-2 text-2xl md:text-3xl font-extrabold">{data.user.fullName}</h1>
                <p className="text-sm text-white/75">
                  {data.user.email} • {roleLabel(data.user.role)}
                </p>
              </>
            )}
            <p className="mt-2 text-[11px] text-white/60">
              <CalendarDays className="inline size-3 mr-1" />
              Période: {new Date(data.filters.from).toLocaleDateString('fr-FR')} →{' '}
              {new Date(data.filters.to).toLocaleDateString('fr-FR')}
            </p>
            {compareUserId ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={detailBaseHref}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/40 text-white hover:bg-white/10"
                  >
                    Quitter la comparaison
                  </Button>
                </Link>
                <Link href={invertCompareHref}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/40 text-white hover:bg-white/10"
                  >
                    Inverser A / B
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="mt-2 text-[11px] text-white/55 max-w-xl">
                Astuce: depuis le Learners Explorer, définissez une référence puis ouvrez un second
                profil avec « Comparer ».
              </p>
            )}
          </div>

          {dualMode && paired ? (
            <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[560px] lg:flex-row">
              <HeroMiniStats detail={data} />
              <HeroMiniStats detail={paired} />
            </div>
          ) : (
            <HeroMiniStats detail={data} />
          )}
        </div>
      </div>

      {compareError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 text-sm">
          {compareError}
        </div>
      ) : null}

      {dualMode && paired ? (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Référence</p>
              <LearnerKpiCards detail={data} />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Comparé</p>
              <LearnerKpiCards detail={paired} />
            </div>
          </div>
          <CompareLearnerRadar
            left={data}
            right={paired}
            leftLabel={leftRadarLabel}
            rightLabel={rightRadarLabel}
          />
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
              <p className="text-sm font-bold text-facam-dark">{data.user.fullName}</p>
              <LearnerLineBarCharts detail={data} />
              <LearnerQuizModules detail={data} />
            </div>
            <div className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
              <p className="text-sm font-bold text-facam-dark">{paired.user.fullName}</p>
              <LearnerLineBarCharts detail={paired} />
              <LearnerQuizModules detail={paired} />
            </div>
          </div>
        </div>
      ) : (
        <>
          <LearnerKpiCards detail={data} />
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-12">
              <SingleLearnerRadar detail={data} />
            </div>
          </div>
          <LearnerLineBarCharts detail={data} />
          <LearnerQuizModules detail={data} />
        </>
      )}
    </div>
  );
}
