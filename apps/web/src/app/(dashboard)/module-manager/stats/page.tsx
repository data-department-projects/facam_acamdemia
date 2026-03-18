/**
 * Statistiques responsable de module — Tableau étudiants (nom, progression %, score quiz final, date),
 * œil pour voir les scores par quiz de chapitre, export PDF et Excel.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Eye, FileDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api-client';

interface StudentRow {
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
}

interface StudentDetail {
  fullName: string;
  progressPercent: number;
  finalQuizScore: number | null;
  finalQuizPassedAt: string | null;
  chapterScores: { chapterTitle: string; scorePercent: number }[];
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export default function ModuleManagerStatsPage() {
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detailModal, setDetailModal] = useState(false);
  const [detail, setDetail] = useState<StudentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      setError(null);
      const data = await api.get<{ studentsTable: StudentRow[] }>('/formations/stats/dashboard');
      setRows(data.studentsTable ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de charger les statistiques.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const openDetail = async (enrollmentId: string) => {
    setDetailModal(true);
    setDetail(null);
    setDetailLoading(true);
    try {
      const d = await api.get<StudentDetail>(
        `/formations/stats/student-detail?enrollmentId=${encodeURIComponent(enrollmentId)}`
      );
      setDetail(d);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const exportExcel = () => {
    const headers = ['Nom', 'Progression (%)', 'Score quiz final (%)', 'Date passage quiz'];
    const csvRows = [
      headers.join(';'),
      ...rows.map((r) =>
        [
          r.fullName,
          r.progressPercent,
          r.finalQuizScore ?? '',
          r.finalQuizPassedAt ? formatDate(r.finalQuizPassedAt) : '',
        ].join(';')
      ),
    ];
    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statistiques-etudiants-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const content = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><title>Statistiques étudiants</title>
          <style>
            table { border-collapse: collapse; width: 100%; font-size: 12px; }
            th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
            th { background: #001b61; color: white; }
          </style>
        </head>
        <body>
          <h1>Statistiques étudiants — ${new Date().toLocaleDateString('fr-FR')}</h1>
          <table>
            <thead><tr><th>Nom</th><th>Progression (%)</th><th>Score quiz final</th><th>Date passage quiz</th></tr></thead>
            <tbody>
              ${rows
                .map(
                  (r) =>
                    `<tr><td>${r.fullName}</td><td>${r.progressPercent}</td><td>${r.finalQuizScore ?? '—'}</td><td>${r.finalQuizPassedAt ? formatDate(r.finalQuizPassedAt) : '—'}</td></tr>`
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>`;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-facam-dark">Statistiques du module</h1>
        <p className="text-gray-500">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-facam-dark">Statistiques du module</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportExcel}>
            <FileDown className="mr-1 size-4" />
            Export Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportPdf}>
            <FileDown className="mr-1 size-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm">
          {error}
        </div>
      )}

      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Étudiants</CardTitle>
          <p className="text-sm font-normal text-gray-500">
            Progression, score au quiz final, date de passage. Cliquez sur l&apos;œil pour voir le
            score par quiz de chapitre.
          </p>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun étudiant inscrit.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-600">
                    <th className="pb-2 pr-4 font-semibold">Nom étudiant</th>
                    <th className="pb-2 pr-4 font-semibold">Progression (%)</th>
                    <th className="pb-2 pr-4 font-semibold">Score au quiz final (%)</th>
                    <th className="pb-2 pr-4 font-semibold">Date passage quiz</th>
                    <th className="w-12 pb-2 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.enrollmentId} className="border-b border-gray-100">
                      <td className="py-2 pr-4 font-medium text-facam-dark">{row.fullName}</td>
                      <td className="py-2 pr-4">{row.progressPercent} %</td>
                      <td className="py-2 pr-4">
                        {row.finalQuizScore != null ? `${row.finalQuizScore} %` : '—'}
                      </td>
                      <td className="py-2 pr-4">{formatDate(row.finalQuizPassedAt)}</td>
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={() => openDetail(row.enrollmentId)}
                          className="rounded p-1.5 text-facam-blue hover:bg-facam-blue-tint"
                          aria-label="Voir les scores par chapitre"
                        >
                          <Eye className="size-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={detailModal}
        onClose={() => {
          setDetailModal(false);
          setDetail(null);
        }}
        title="Détail — Scores par quiz de chapitre"
      >
        {detailLoading ? (
          <p className="text-sm text-gray-500">Chargement…</p>
        ) : detail ? (
          <div className="space-y-4">
            <p className="font-medium text-facam-dark">{detail.fullName}</p>
            <p className="text-sm text-gray-600">
              Progression : {detail.progressPercent} % — Quiz final :{' '}
              {detail.finalQuizScore != null ? `${detail.finalQuizScore} %` : '—'} (
              {formatDate(detail.finalQuizPassedAt)})
            </p>
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">Score par quiz de chapitre</p>
              <ul className="space-y-1 text-sm">
                {detail.chapterScores.length === 0 ? (
                  <li className="text-gray-500">Aucun quiz de chapitre passé.</li>
                ) : (
                  detail.chapterScores.map((s) => (
                    <li key={s.chapterTitle} className="flex justify-between gap-4">
                      <span>{s.chapterTitle}</span>
                      <span className="font-medium">{s.scorePercent} %</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Impossible de charger le détail.</p>
        )}
      </Modal>
    </div>
  );
}
