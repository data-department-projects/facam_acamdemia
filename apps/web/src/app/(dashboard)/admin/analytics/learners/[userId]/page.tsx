/**
 * Learner drill‑down (Admin) — fiche 360° ultra riche.
 * Inclut : KPI, radar performance/engagement/progression, timelines, stats par quiz, modules & progression.
 * Mode comparaison : query `?compare=<userId>` affiche deux profils côte à côte avec radar superposé.
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Award,
  BarChart3,
  CalendarDays,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Crown,
  GitCompare,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  PieChart,
  Pie,
  Cell,
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
    chapterTitle: string | null;
    moduleId: string;
    moduleTitle: string;
    isFinal: boolean;
    attempts: number;
    passRate: number;
    avgScore: number;
    bestScore: number;
    scores: number[];
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
const MODULE_PROGRESS_COLORS: readonly string[] = [
  '#0f766e',
  '#eab308',
  '#fb7185',
  '#2563eb',
  '#7c3aed',
  '#f97316',
  '#14b8a6',
  '#a855f7',
];

function LearnerKpiCards({ detail }: { readonly detail: LearnerDetail }) {
  const kpi = detail.kpi;
  const enrollments = detail.enrollments ?? [];
  const completed = enrollments.filter((e) => e.completedAt != null).length;
  const completionRate =
    enrollments.length > 0 ? Math.round((completed / enrollments.length) * 100) : 0;
  const ColorKpiCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    gradient,
  }: {
    readonly title: string;
    readonly value: React.ReactNode;
    readonly subtitle: string;
    readonly icon: typeof Crown;
    readonly gradient: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg ${gradient}`}>
        <div className="absolute right-3 top-3 opacity-30">
          <Icon className="size-12" />
        </div>
        <p className="text-3xl font-extrabold">{value}</p>
        <p className="mt-1 text-sm font-medium uppercase tracking-wide opacity-90">{title}</p>
        <p className="mt-1 text-[11px] opacity-80">{subtitle}</p>
      </div>
    </motion.div>
  );
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <ColorKpiCard
        title="Complétion modules"
        value={`${completionRate}%`}
        subtitle={`${completed}/${enrollments.length} module(s) terminés`}
        icon={Crown}
        gradient="bg-gradient-to-br from-teal-500 to-teal-600"
      />
      <ColorKpiCard
        title="Quiz passés"
        value={kpi.attemptsTaken}
        subtitle="Tentatives sur la période"
        icon={BarChart3}
        gradient="bg-gradient-to-br from-purple-500 to-purple-600"
      />
      <ColorKpiCard
        title="Pass rate"
        value={`${kpi.passRate}%`}
        subtitle="Réussite quiz"
        icon={Target}
        gradient="bg-gradient-to-br from-orange-500 to-red-500"
      />
      <ColorKpiCard
        title="Temps de présence"
        value={`${kpi.totalMinutesLearned} min`}
        subtitle="Temps de présence total"
        icon={Timer}
        gradient="bg-gradient-to-br from-blue-500 to-blue-600"
      />
    </div>
  );
}

const JOURS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const;

function getMondayOfWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  const day = d.getUTCDay(); // 0=Dim, 1=Lun...
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

function getUniqueWeeks(timeline: { day: string }[]): string[] {
  const set = new Set<string>();
  for (const { day } of timeline) set.add(getMondayOfWeek(day));
  return Array.from(set).sort();
}

function buildWeekRows(
  monday: string,
  timeline: { day: string; minutes: number }[]
): { label: string; minutes: number }[] {
  const byDay = new Map(timeline.map(({ day, minutes }) => [day, minutes]));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    return { label: JOURS_FR[i], minutes: byDay.get(dateStr) ?? 0 };
  });
}

function formatWeekLabel(monday: string): string {
  const d = new Date(monday + 'T00:00:00Z');
  return `Sem. du ${d.getUTCDate().toString().padStart(2, '0')}/${(d.getUTCMonth() + 1).toString().padStart(2, '0')}/${d.getUTCFullYear()}`;
}

function LearnerPresenceChart({ detail }: { readonly detail: LearnerDetail }) {
  const timeline = useMemo(() => detail.minutesTimeline ?? [], [detail.minutesTimeline]);
  const weeks = useMemo(() => getUniqueWeeks(timeline), [timeline]);
  const [weekIdx, setWeekIdx] = useState<number>(() => Math.max(0, weeks.length - 1));

  const currentMonday = weeks[weekIdx] ?? null;
  const weekData = useMemo(
    () => (currentMonday ? buildWeekRows(currentMonday, timeline) : []),
    [currentMonday, timeline]
  );
  const weekTotal = weekData.reduce((acc, d) => acc + d.minutes, 0);
  const hasNoData = weeks.length === 0;

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Timer className="size-5 text-blue-600" />
          Temps de présence réel
        </CardTitle>

        {!hasNoData && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekIdx((i) => Math.max(0, i - 1))}
              disabled={weekIdx === 0}
              className="flex items-center justify-center rounded-lg border border-gray-200 p-1.5 text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Semaine précédente"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="min-w-[170px] text-center text-xs font-semibold text-gray-700">
              {currentMonday ? formatWeekLabel(currentMonday) : '—'}
            </span>
            <button
              onClick={() => setWeekIdx((i) => Math.min(weeks.length - 1, i + 1))}
              disabled={weekIdx === weeks.length - 1}
              className="flex items-center justify-center rounded-lg border border-gray-200 p-1.5 text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Semaine suivante"
            >
              <ChevronRight className="size-4" />
            </button>
            <span className="ml-2 text-xs text-gray-400">
              {weekTotal > 0 ? `${weekTotal} min` : 'aucune activité'}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {hasNoData ? (
          <div className="flex h-[240px] flex-col items-center justify-center gap-2 text-sm text-gray-400">
            <Timer className="size-8 opacity-30" />
            <p>Aucune donnée de présence pour cette période.</p>
            <p className="text-xs">Les données apparaîtront dès la prochaine session.</p>
          </div>
        ) : (
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData} margin={{ left: 0, right: 16, top: 28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#374151' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: '#eff6ff' }}
                  formatter={(v: number) => [`${v} min`, 'Présence']}
                  labelFormatter={(l) => String(l)}
                />
                <Bar
                  dataKey="minutes"
                  name="Présence"
                  fill="#2563eb"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={52}
                >
                  <LabelList
                    dataKey="minutes"
                    position="top"
                    style={{ fontSize: 11, fontWeight: 700, fill: '#1d4ed8' }}
                    formatter={(v: number) => (v > 0 ? `${v}` : '')}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LearnerQuizModules({ detail }: { readonly detail: LearnerDetail }) {
  const perQuiz = detail.perQuiz ?? [];
  const quizByModule = perQuiz.reduce<
    Record<string, { moduleTitle: string; quizzes: LearnerDetail['perQuiz'] }>
  >((acc, quiz) => {
    if (!acc[quiz.moduleId]) {
      acc[quiz.moduleId] = { moduleTitle: quiz.moduleTitle, quizzes: [] };
    }
    acc[quiz.moduleId].quizzes.push(quiz);
    return acc;
  }, {});
  const moduleSections = Object.entries(quizByModule);
  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <Card className="border-gray-200 shadow-sm lg:col-span-7">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="size-5 text-violet-700" />
            Analyse des quiz
          </CardTitle>
          <div className="text-xs text-gray-500">Moy. / best / pass rate / détails des scores</div>
        </CardHeader>
        <CardContent>
          {perQuiz.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune tentative sur la période.</p>
          ) : (
            <div className="max-h-[460px] space-y-4 overflow-y-auto pr-1">
              {moduleSections.map(([moduleId, moduleSection]) => (
                <div
                  key={moduleId}
                  className="overflow-x-auto rounded-xl border border-gray-200 bg-white"
                >
                  <div className="border-b border-gray-200 bg-facam-blue-tint/30 px-3 py-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-facam-blue">
                      Module pédagogique
                    </p>
                    <p className="text-sm font-semibold text-facam-dark">
                      {moduleSection.moduleTitle}
                    </p>
                  </div>
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-600">
                        <th className="py-3 pr-4 pl-3 font-semibold">Quiz</th>
                        <th className="py-3 pr-4 font-semibold">Tentatives</th>
                        <th className="py-3 pr-4 font-semibold">Score</th>
                        <th className="py-3 pr-4 font-semibold">Best</th>
                        <th className="py-3 pr-4 font-semibold">Détails scores</th>
                        <th className="py-3 pr-3 font-semibold text-right">Pass</th>
                      </tr>
                    </thead>
                    <tbody>
                      {moduleSection.quizzes.map((q, idx) => (
                        <motion.tr
                          key={q.quizId}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.22, delay: Math.min(0.15, idx * 0.01) }}
                          className="border-b border-gray-100"
                        >
                          <td className="py-3 pr-4 pl-3 font-semibold text-facam-dark">
                            {q.isFinal ? (
                              <span className="mr-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800">
                                Final
                              </span>
                            ) : null}
                            {q.title}
                            {!q.isFinal && q.chapterTitle ? (
                              <p className="mt-0.5 text-[11px] font-medium text-gray-500">
                                Chapitre: {q.chapterTitle}
                              </p>
                            ) : null}
                          </td>
                          <td className="py-3 pr-4 text-gray-700">{q.attempts}</td>
                          <td className="py-3 pr-4 text-violet-700 font-bold">{q.avgScore}%</td>
                          <td className="py-3 pr-4 text-emerald-700 font-bold">{q.bestScore}%</td>
                          <td className="py-3 pr-4">
                            <div className="flex flex-wrap gap-1.5">
                              {q.scores.length > 0 ? (
                                q.scores.map((score, scoreIndex) => (
                                  <span
                                    key={`${q.quizId}-score-${scoreIndex}`}
                                    className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700"
                                  >
                                    {score}%
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 pr-3 text-right text-gray-700 font-semibold">
                            {q.passRate}%
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
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
                      style={{
                        width: `${e.completedAt ? 100 : Math.min(100, e.progressPercent)}%`,
                      }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                    <span>{e.completedAt ? 100 : e.progressPercent}%</span>
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

type UserCertificate = {
  id: string;
  moduleId: string;
  enrollmentId: string;
  moduleTitle: string;
  finalGrade: number;
  mention: string;
  issuedAt: string;
};

type CertificateDetail = {
  id: string;
  fullName: string;
  moduleTitle: string;
  startDate: string;
  endDate: string;
  mention: string;
  issuedAt: string;
};

function LearnerCertifiedModules({ detail }: { readonly detail: LearnerDetail }) {
  const [certificates, setCertificates] = useState<UserCertificate[]>([]);
  const [certLoading, setCertLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<CertificateDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    void api
      .get<UserCertificate[]>(`/certificates/admin/user/${detail.user.id}`)
      .then(setCertificates)
      .catch(() => setCertificates([]))
      .finally(() => setCertLoading(false));
  }, [detail.user.id]);

  const openCertModal = async (enrollmentId: string): Promise<void> => {
    setModalOpen(true);
    setModalLoading(true);
    setSelectedCert(null);
    try {
      const data = await api.get<CertificateDetail>(`/certificates/enrollment/${enrollmentId}`);
      setSelectedCert(data);
    } catch {
      // modal shows error state
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = (): void => {
    setModalOpen(false);
    setSelectedCert(null);
  };

  return (
    <>
      <Card className="border-gray-200 shadow-sm h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="size-5 text-amber-500" />
            Modules certifiés
          </CardTitle>
          {!certLoading && (
            <span className="text-xs text-gray-500">{certificates.length} certification(s)</span>
          )}
        </CardHeader>
        <CardContent>
          {certLoading ? (
            <div className="flex justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-facam-blue border-t-transparent" />
            </div>
          ) : certificates.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              Aucun module certifié pour cet apprenant.
            </p>
          ) : (
            <div className="max-h-[280px] space-y-3 overflow-y-auto pr-1">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-emerald-200 hover:bg-emerald-50/30"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <CheckCircle className="size-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {cert.moduleTitle}
                      </p>
                      <p className="text-xs text-gray-500">
                        {cert.mention} • {new Date(cert.issuedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void openCertModal(cert.enrollmentId)}
                    className="ml-3 shrink-0 text-xs"
                  >
                    Voir le certificat
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-5 text-lg font-bold text-gray-900">Informations du certificat</h3>
            {modalLoading ? (
              <div className="flex justify-center py-6">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-facam-blue border-t-transparent" />
              </div>
            ) : selectedCert ? (
              <div className="space-y-1 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                      Apprenant
                    </p>
                    <p className="mt-0.5 font-semibold text-gray-900">{selectedCert.fullName}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                      Module
                    </p>
                    <p className="mt-0.5 font-semibold text-gray-900">{selectedCert.moduleTitle}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                      Mention
                    </p>
                    <p className="mt-0.5 font-semibold text-facam-dark">{selectedCert.mention}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                      Délivré le
                    </p>
                    <p className="mt-0.5 font-semibold text-gray-900">
                      {new Date(selectedCert.issuedAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                      Début de formation
                    </p>
                    <p className="mt-0.5 font-semibold text-gray-900">
                      {new Date(selectedCert.startDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                      Fin de formation
                    </p>
                    <p className="mt-0.5 font-semibold text-gray-900">
                      {new Date(selectedCert.endDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-gray-500">
                Impossible de charger les informations du certificat.
              </p>
            )}
            <div className="mt-5 flex justify-end">
              <Button variant="outline" onClick={closeModal}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function LearnerModulesProgressDonut({ detail }: { readonly detail: LearnerDetail }) {
  const progressData = detail.enrollments.map((enrollment) => ({
    moduleTitle: enrollment.moduleTitle,
    progressPercent: enrollment.progressPercent,
  }));
  return (
    <Card className="border-gray-200 shadow-sm h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="size-5 text-teal-700" />
          Avancement par module
        </CardTitle>
        <div className="text-xs text-gray-500">{progressData.length} module(s)</div>
      </CardHeader>
      <CardContent>
        {progressData.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune inscription pour ce profil.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={progressData}
                    dataKey="progressPercent"
                    nameKey="moduleTitle"
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {progressData.map((item, index) => (
                      <Cell
                        key={`${item.moduleTitle}-${index}`}
                        fill={MODULE_PROGRESS_COLORS[index % MODULE_PROGRESS_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'Avancement']}
                    labelFormatter={(label) => `Module: ${label}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="max-h-[220px] space-y-2 overflow-y-auto pr-1">
              {progressData.map((item, index) => (
                <div
                  key={`${item.moduleTitle}-legend-${index}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-2 py-1.5"
                >
                  <div className="mr-2 flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          MODULE_PROGRESS_COLORS[index % MODULE_PROGRESS_COLORS.length],
                      }}
                    />
                    <p className="truncate text-xs font-medium text-gray-700">{item.moduleTitle}</p>
                  </div>
                  <span className="text-xs font-bold text-facam-dark">{item.progressPercent}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
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
  const profileInitial = detail.user.fullName.charAt(0).toUpperCase();
  return (
    <div className="rounded-2xl bg-white/10 p-4 backdrop-blur min-w-[260px] flex-1">
      <div className="mb-3 flex items-center gap-3">
        <div className="relative size-12 overflow-hidden rounded-xl border border-white/30 bg-white/10">
          {detail.user.avatarUrl ? (
            <Image
              src={detail.user.avatarUrl}
              alt={detail.user.fullName}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-bold text-white">
              {profileInitial}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">{detail.user.fullName}</p>
          <p className="text-[11px] text-white/70">{roleLabel(detail.user.role)}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-white/70">Engagement</p>
          <p className="text-2xl font-extrabold">{kpi.engagementScore}</p>
        </div>
        <div>
          <p className="text-xs text-white/70">Présence</p>
          <p className="text-2xl font-extrabold">{kpi.totalMinutesLearned} min</p>
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
              <LearnerPresenceChart detail={data} />
              <LearnerQuizModules detail={data} />
            </div>
            <div className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
              <p className="text-sm font-bold text-facam-dark">{paired.user.fullName}</p>
              <LearnerPresenceChart detail={paired} />
              <LearnerQuizModules detail={paired} />
            </div>
          </div>
        </div>
      ) : (
        <>
          <LearnerKpiCards detail={data} />
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <LearnerCertifiedModules detail={data} />
            </div>
            <div className="lg:col-span-5">
              <LearnerModulesProgressDonut detail={data} />
            </div>
          </div>
          <LearnerPresenceChart detail={data} />
          <LearnerQuizModules detail={data} />
        </>
      )}
    </div>
  );
}
