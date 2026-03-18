/**
 * Gestion des utilisateurs — Liste, création, modification (PATCH) et suppression (DELETE).
 * Rôles : Étudiant, Employé, Responsable module interne, Responsable module externe.
 * API : GET /users, POST /users, GET /users/:id, PATCH /users/:id, DELETE /users/:id.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api-client';

const ROLE_LABELS: Record<string, string> = {
  student: 'Étudiant',
  employee: 'Employé',
  module_manager_internal: 'Responsable module interne',
  module_manager_external: 'Responsable module externe',
  admin: 'Administrateur',
  platform_manager: 'Responsable plateforme',
  support: 'Support technique',
};

type CreateRole = 'student' | 'employee' | 'module_manager_internal' | 'module_manager_external';

interface ModuleItem {
  id: string;
  title: string;
  moduleType?: string | null;
}

interface UserItem {
  id: string;
  email: string;
  fullName: string;
  role: string;
  moduleId?: string | null;
}

export default function AdminUsersPage() {
  const [showForm, setShowForm] = useState(false);
  const [role, setRole] = useState<CreateRole>('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [message, setMessage] = useState<'success' | 'error' | null>(null);
  const [messageText, setMessageText] = useState('');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editModal, setEditModal] = useState(false);
  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState<CreateRole | string>('student');
  const [editModuleId, setEditModuleId] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

  const loadUsers = async () => {
    try {
      setLoadError(null);
      const res = await api.get<{ data: UserItem[] }>('/users?limit=100');
      setUsers(Array.isArray(res.data) ? res.data : ((res as { data?: UserItem[] }).data ?? []));
    } catch (e) {
      setUsers([]);
      setLoadError(
        e instanceof Error ? e.message : 'Impossible de charger la liste des utilisateurs.'
      );
    } finally {
      setLoadingList(false);
    }
  };

  const loadModules = useCallback(async () => {
    try {
      const res = await api.get<{ data: ModuleItem[] }>('/formations?limit=100');
      setModules(
        Array.isArray(res.data) ? res.data : ((res as { data?: ModuleItem[] }).data ?? [])
      );
    } catch (e) {
      setModules([]);
      if (showForm)
        setLoadError(e instanceof Error ? e.message : 'Impossible de charger les modules.');
    }
  }, [showForm]);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (showForm || editModal) loadModules();
  }, [showForm, editModal, loadModules]);

  const managerModulesInternal = modules.filter((m) => m.moduleType === 'interne');
  const managerModulesExternal = modules.filter((m) => m.moduleType === 'externe');
  const managerModulesForRole =
    role === 'module_manager_internal'
      ? managerModulesInternal
      : role === 'module_manager_external'
        ? managerModulesExternal
        : [];
  const managerModulesForEditRole =
    editRole === 'module_manager_internal'
      ? managerModulesInternal
      : editRole === 'module_manager_external'
        ? managerModulesExternal
        : [];

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const payload: Record<string, string> = {
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        password,
        role,
      };
      if ((role === 'module_manager_internal' || role === 'module_manager_external') && moduleId) {
        payload.moduleId = moduleId;
      }
      await api.post('/users', payload);
      setMessage('success');
      setMessageText('Compte créé avec succès.');
      setFullName('');
      setEmail('');
      setPassword('');
      setModuleId('');
      setShowForm(false);
      await loadUsers();
    } catch (err) {
      setMessage('error');
      setMessageText(err instanceof Error ? err.message : 'Erreur lors de la création du compte.');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (u: UserItem) => {
    setEditUser(u);
    setEditFullName(u.fullName);
    setEditRole(
      u.role === 'module_manager_internal' ||
        u.role === 'module_manager_external' ||
        u.role === 'student' ||
        u.role === 'employee'
        ? u.role
        : 'student'
    );
    setEditModuleId(u.moduleId ?? '');
    setEditPassword('');
    setEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editUser) return;
    setSavingEdit(true);
    setMessage(null);
    try {
      const payload: Record<string, string | null> = {
        fullName: editFullName.trim(),
        role: editRole as string,
      };
      if (editRole === 'module_manager_internal' || editRole === 'module_manager_external') {
        payload.moduleId = editModuleId || null;
      } else {
        payload.moduleId = null;
      }
      if (editPassword.trim()) payload.password = editPassword;
      await api.patch(`/users/${editUser.id}`, payload);
      setMessage('success');
      setMessageText('Utilisateur mis à jour.');
      setEditModal(false);
      setEditUser(null);
      await loadUsers();
    } catch (err) {
      setMessage('error');
      setMessageText(err instanceof Error ? err.message : 'Erreur lors de la mise à jour.');
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setDeletingUser(true);
    setMessage(null);
    try {
      await api.delete(`/users/${userToDelete.id}`);
      setMessage('success');
      setMessageText('Utilisateur supprimé.');
      setUserToDelete(null);
      await loadUsers();
    } catch (err) {
      setMessage('error');
      setMessageText(err instanceof Error ? err.message : 'Erreur lors de la suppression.');
    } finally {
      setDeletingUser(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-facam-dark">Gestion des utilisateurs</h1>
        <Button variant="accent" onClick={() => setShowForm(true)}>
          Nouvel utilisateur
        </Button>
      </div>

      {message === 'success' && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 text-sm">
          {messageText}
        </div>
      )}
      {message === 'error' && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
          {messageText}
        </div>
      )}
      {loadError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm">
          {loadError}
        </div>
      )}

      {showForm && (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Créer un compte</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Fermer
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label
                  htmlFor="create-role"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Rôle
                </label>
                <select
                  id="create-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as CreateRole)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="student">Étudiant</option>
                  <option value="employee">Employé</option>
                  <option value="module_manager_internal">Responsable module interne</option>
                  <option value="module_manager_external">Responsable module externe</option>
                </select>
              </div>
              <Input
                label="Nom complet"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jean Dupont"
                required
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jean.dupont@facam.com"
                required
              />
              <Input
                label="Mot de passe (initial)"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
              />
              {(role === 'module_manager_internal' || role === 'module_manager_external') && (
                <div>
                  <label
                    htmlFor="create-module"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Module assigné
                  </label>
                  <select
                    id="create-module"
                    value={moduleId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setModuleId(id);
                      const mod = modules.find((m) => m.id === id);
                      if (mod?.moduleType) {
                        const isInterne = String(mod.moduleType).toLowerCase() === 'interne';
                        setRole(isInterne ? 'module_manager_internal' : 'module_manager_external');
                      }
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    required
                  >
                    <option value="">— Sélectionner un module —</option>
                    {managerModulesForRole.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                  {managerModulesForRole.length === 0 && (
                    <p className="mt-1 text-xs text-amber-600">
                      Aucun module {role === 'module_manager_internal' ? 'interne' : 'externe'}.
                      Créez-en un (type {role === 'module_manager_internal' ? 'Interne' : 'Externe'}
                      ) dans Gestion des modules.
                    </p>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <Button type="submit" variant="accent" disabled={loading}>
                  {loading ? 'Création...' : 'Créer le compte'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Comptes</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingList ? (
            <p className="text-sm text-gray-500">Chargement...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 font-medium text-gray-700">Nom</th>
                    <th className="pb-3 font-medium text-gray-700">Email</th>
                    <th className="pb-3 font-medium text-gray-700">Rôle</th>
                    <th className="pb-3 font-medium text-gray-700 w-32">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-500">
                        Aucun utilisateur. Créez un compte avec le bouton « Nouvel utilisateur ».
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="border-b border-gray-100">
                        <td className="py-3 font-medium text-facam-dark">{u.fullName}</td>
                        <td className="py-3 text-gray-600">{u.email}</td>
                        <td className="py-3">
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                            {ROLE_LABELS[u.role] ?? u.role}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEdit(u)}>
                              Modifier
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => setUserToDelete(u)}
                            >
                              Supprimer
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={editModal}
        onClose={() => {
          setEditModal(false);
          setEditUser(null);
        }}
        title="Modifier l'utilisateur"
      >
        {editUser && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <p className="text-sm text-gray-600">Email : {editUser.email}</p>
            <Input
              label="Nom complet"
              value={editFullName}
              onChange={(e) => setEditFullName(e.target.value)}
              required
            />
            <div>
              <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 mb-1">
                Rôle
              </label>
              <select
                id="edit-role"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as CreateRole | string)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="student">Étudiant</option>
                <option value="employee">Employé</option>
                <option value="module_manager_internal">Responsable module interne</option>
                <option value="module_manager_external">Responsable module externe</option>
              </select>
            </div>
            {(editRole === 'module_manager_internal' || editRole === 'module_manager_external') && (
              <div>
                <label
                  htmlFor="edit-module"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Module assigné
                </label>
                <select
                  id="edit-module"
                  value={editModuleId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setEditModuleId(id);
                    const mod = modules.find((m) => m.id === id);
                    if (mod?.moduleType) {
                      const isInterne = String(mod.moduleType).toLowerCase() === 'interne';
                      setEditRole(
                        isInterne ? 'module_manager_internal' : 'module_manager_external'
                      );
                    }
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">— Aucun —</option>
                  {managerModulesForEditRole.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Input
              label="Nouveau mot de passe (optionnel)"
              type="password"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              placeholder="Laisser vide pour ne pas changer"
              minLength={6}
            />
            <div className="flex gap-2">
              <Button type="submit" variant="accent" disabled={savingEdit}>
                {savingEdit ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setEditModal(false)}>
                Annuler
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal de confirmation de suppression d'un utilisateur */}
      <Modal
        open={userToDelete !== null}
        onClose={() => !deletingUser && setUserToDelete(null)}
        title="Supprimer l'utilisateur"
      >
        {userToDelete && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Êtes-vous sûr de vouloir supprimer l'utilisateur{' '}
              <strong>{userToDelete.fullName}</strong> ({userToDelete.email}) ? Cette action est
              irréversible. Les rôles et relations associés seront gérés par le système.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setUserToDelete(null)}
                disabled={deletingUser}
              >
                Annuler
              </Button>
              <Button
                variant="accent"
                className="bg-red-600 hover:bg-red-700"
                onClick={confirmDeleteUser}
                disabled={deletingUser}
              >
                {deletingUser ? 'Suppression…' : 'Supprimer'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
