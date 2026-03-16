/**
 * Gestion des modules (admin) — Création et édition des modules.
 * Seul l’administrateur peut créer un module (titre, description) ; le responsable de module
 * ajoute ensuite les cours (chapitres) et quiz au module qui lui est assigné.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
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
  moduleType?: string | null;
  authorName?: string;
  chaptersCount?: number;
}

type ModuleFormData = {
  title: string;
  description: string;
  authorName: string;
  moduleType: 'interne' | 'externe';
};

export default function AdminModulesPage() {
  const [modules, setModules] = useState<ApiModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moduleModal, setModuleModal] = useState<'new' | 'edit' | null>(null);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [deleteConfirmModule, setDeleteConfirmModule] = useState<ApiModule | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [moduleForm, setModuleForm] = useState<ModuleFormData>({
    title: '',
    description: '',
    authorName: 'FACAM',
    moduleType: 'externe',
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
    setModuleForm({
      title: '',
      description: '',
      authorName: 'FACAM',
      moduleType: 'externe',
    });
    setModuleModal('new');
  };

  const openEditModule = (mod: ApiModule) => {
    setEditingModuleId(mod.id);
    setModuleForm({
      title: mod.title,
      description: mod.description ?? '',
      authorName: mod.authorName ?? 'FACAM',
      moduleType: mod.moduleType === 'interne' ? 'interne' : 'externe',
    });
    setModuleModal('edit');
  };

  const confirmDeleteModule = async () => {
    if (!deleteConfirmModule) return;
    setDeleting(true);
    setError(null);
    try {
      await api.delete(`/formations/${deleteConfirmModule.id}`);
      setDeleteConfirmModule(null);
      await loadModules();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
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
          moduleType: moduleForm.moduleType,
        });
        await loadModules();
      } else if (editingModuleId) {
        await api.patch(`/formations/${editingModuleId}`, {
          title: moduleForm.title,
          description: moduleForm.description,
          authorName: moduleForm.authorName,
          moduleType: moduleForm.moduleType,
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
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{mod.title}</CardTitle>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        mod.moduleType === 'interne'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {mod.moduleType === 'interne' ? 'Interne' : 'Externe'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditModule(mod)}>
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                      onClick={() => setDeleteConfirmModule(mod)}
                      aria-label="Supprimer le module"
                    >
                      Supprimer
                    </Button>
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
            <label
              htmlFor="module-type"
              className="mb-1.5 block text-sm font-semibold text-facam-dark"
            >
              Type de module
            </label>
            <select
              id="module-type"
              value={moduleForm.moduleType}
              onChange={(e) =>
                setModuleForm((f) => ({
                  ...f,
                  moduleType: e.target.value as 'interne' | 'externe',
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="externe">Externe (étudiants)</option>
              <option value="interne">Interne (employés)</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Externe = visible par les étudiants ; Interne = visible par les employés.
            </p>
          </div>
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

      {/* Modal de confirmation de suppression du module */}
      <Modal
        open={deleteConfirmModule !== null}
        onClose={() => !deleting && setDeleteConfirmModule(null)}
        title="Supprimer le module"
      >
        {deleteConfirmModule && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Êtes-vous sûr de vouloir supprimer le module{' '}
              <strong>{deleteConfirmModule.title}</strong> ? Le responsable de formation associé à
              ce module sera également supprimé. Cette action est irréversible.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmModule(null)}
                disabled={deleting}
              >
                Annuler
              </Button>
              <Button
                variant="accent"
                className="bg-red-600 hover:bg-red-700"
                onClick={confirmDeleteModule}
                disabled={deleting}
              >
                {deleting ? 'Suppression…' : 'Supprimer'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
