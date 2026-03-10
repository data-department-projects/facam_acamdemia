/**
 * Gestion des modules (admin) — Création et édition des modules.
 * Seul l’administrateur peut créer un module (titre, description) ; le responsable de module
 * ajoute ensuite les cours (chapitres) et quiz au module qui lui est assigné.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, FileQuestion } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api-client';

interface ApiModule {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  chaptersCount?: number;
}

type ModuleFormData = { title: string; description: string; authorName: string };

export default function AdminModulesPage() {
  const [modules, setModules] = useState<ApiModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moduleModal, setModuleModal] = useState<'new' | 'edit' | null>(null);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleForm, setModuleForm] = useState<ModuleFormData>({
    title: '',
    description: '',
    authorName: 'FACAM',
  });

  const loadModules = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get<{ data: ApiModule[] }>('/formations?limit=100');
      setModules(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur chargement');
      setModules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  const openNewModule = () => {
    setModuleForm({ title: '', description: '', authorName: 'FACAM' });
    setModuleModal('new');
  };

  const openEditModule = (mod: ApiModule) => {
    setEditingModuleId(mod.id);
    setModuleForm({
      title: mod.title,
      description: mod.description ?? '',
      authorName: 'FACAM',
    });
    setModuleModal('edit');
  };

  const saveModule = async () => {
    setSaving(true);
    setError(null);
    try {
      if (moduleModal === 'new') {
        await api.post('/formations', {
          title: moduleForm.title,
          description: moduleForm.description,
          authorName: moduleForm.authorName,
        });
        await loadModules();
      } else if (editingModuleId) {
        await api.patch(`/formations/${editingModuleId}`, {
          title: moduleForm.title,
          description: moduleForm.description,
        });
        await loadModules();
      }
      setModuleModal(null);
      setEditingModuleId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur enregistrement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-facam-dark">Gestion des modules</h1>
        <Button variant="accent" onClick={openNewModule}>
          <Plus className="mr-2 size-4" />
          Nouveau module
        </Button>
      </div>
      <p className="text-sm text-gray-600">
        Créez les modules de formation (titre, description). Ensuite, créez un utilisateur «
        Responsable de module » et assignez-lui un module ; il pourra ajouter les cours et quiz.
      </p>
      {error && <p className="rounded-md bg-amber-50 p-2 text-sm text-amber-800">{error}</p>}
      {loading ? (
        <p className="text-sm text-gray-500">Chargement des modules…</p>
      ) : (
        <div className="space-y-4">
          {modules.map((mod) => (
            <Card key={mod.id} className="border-gray-200 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{mod.title}</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditModule(mod)}>
                      Modifier
                    </Button>
                    <Link href={`/module-manager/modules/${mod.id}/quiz`}>
                      <Button variant="outline" size="sm">
                        <FileQuestion className="mr-1 size-4" />
                        Voir quiz
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{mod.description ?? ''}</p>
                <p className="mt-2 text-xs text-gray-500">
                  {mod.chaptersCount ?? 0} chapitre(s) · Géré par un responsable (voir Gestion
                  utilisateurs)
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={moduleModal !== null}
        onClose={() => {
          setModuleModal(null);
          setEditingModuleId(null);
        }}
        title={moduleModal === 'new' ? 'Nouveau module' : 'Modifier le module'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveModule();
          }}
          className="space-y-4"
        >
          <Input
            label="Titre"
            value={moduleForm.title}
            onChange={(e) => setModuleForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Ex. Maintenance industrielle"
            required
          />
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-facam-dark">
              Description
            </label>
            <textarea
              value={moduleForm.description}
              onChange={(e) => setModuleForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Description du module..."
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          {moduleModal === 'new' && (
            <Input
              label="Nom de l’auteur"
              value={moduleForm.authorName}
              onChange={(e) => setModuleForm((f) => ({ ...f, authorName: e.target.value }))}
              placeholder="FACAM"
              required
            />
          )}
          <div className="flex gap-2">
            <Button type="submit" variant="accent" disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setModuleModal(null)}>
              Annuler
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
