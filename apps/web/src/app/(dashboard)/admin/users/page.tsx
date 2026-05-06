/**
 * Gestion des utilisateurs — Liste, création, modification (PATCH) et suppression (DELETE).
 * Système multi-rôles : un utilisateur peut avoir plusieurs rôles simultanés.
 * Nouveaux champs : employeeId (matricule), phoneNumber1, phoneNumber2.
 * API : GET /users, POST /users, GET /users/:id, PATCH /users/:id, DELETE /users/:id.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { MissionSuccessDialog } from '@/components/ui/mission-success-dialog';
import { api } from '@/lib/api-client';
import { Pencil, Trash2 } from 'lucide-react';

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

const ROLES_REQUIRING_EMPLOYEE_ID: readonly CreateRole[] = [
  'employee',
  'module_manager_internal',
  'module_manager_external',
];

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
  roles: string[];
  moduleId?: string | null;
  employeeId?: string | null;
  phoneNumber1?: string | null;
  phoneNumber2?: string | null;
}

function needsEmployeeId(roles: readonly string[]): boolean {
  return roles.some((r) => (ROLES_REQUIRING_EMPLOYEE_ID as readonly string[]).includes(r));
}

export default function AdminUsersPage() {
  const [showForm, setShowForm] = useState(false);
  const [role, setRole] = useState<CreateRole>('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [phoneNumber1, setPhoneNumber1] = useState('');
  const [phoneNumber2, setPhoneNumber2] = useState('');
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
  const [editEmployeeId, setEditEmployeeId] = useState('');
  const [editPhoneNumber1, setEditPhoneNumber1] = useState('');
  const [editPhoneNumber2, setEditPhoneNumber2] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'all' | string>('all');

  const loadUsers = async () => {
    try {
      setLoadError(null);
      const res = await api.get<{ data: UserItem[] }>('/users?limit=100');
      const rawData = Array.isArray(res.data)
        ? res.data
        : ((res as { data?: UserItem[] }).data ?? []);
      const normalized = rawData.map((u) => ({
        ...u,
        roles: u.roles?.length ? u.roles : u.role ? [u.role] : [],
      }));
      setUsers(normalized);
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

  const isManagerRole = (r: string): boolean =>
    r === 'module_manager_internal' || r === 'module_manager_external';

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const roles: string[] = [role];
      if (isManagerRole(role) && !roles.includes('employee')) {
        roles.push('employee');
      }
      const payload: Record<string, unknown> = {
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        password,
        roles,
        phoneNumber1: phoneNumber1.trim(),
      };
      if (phoneNumber2.trim()) {
        payload.phoneNumber2 = phoneNumber2.trim();
      }
      if (needsEmployeeId(roles)) {
        payload.employeeId = employeeId.trim();
      }
      if (isManagerRole(role) && moduleId) {
        payload.moduleId = moduleId;
      }
      await api.post('/users', payload);
      setMessage('success');
      setMessageText('Compte créé avec succès.');
      setFullName('');
      setEmail('');
      setPassword('');
      setModuleId('');
      setEmployeeId('');
      setPhoneNumber1('');
      setPhoneNumber2('');
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
    const primaryRole = u.roles?.[0] ?? u.role;
    setEditRole(
      primaryRole === 'module_manager_internal' ||
        primaryRole === 'module_manager_external' ||
        primaryRole === 'student' ||
        primaryRole === 'employee'
        ? primaryRole
        : 'student'
    );
    setEditModuleId(u.moduleId ?? '');
    setEditEmployeeId(u.employeeId ?? '');
    setEditPhoneNumber1(u.phoneNumber1 ?? '');
    setEditPhoneNumber2(u.phoneNumber2 ?? '');
    setEditPassword('');
    setEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editUser) return;
    setSavingEdit(true);
    setMessage(null);
    try {
      const roles: string[] = [editRole as string];
      if (isManagerRole(editRole) && !roles.includes('employee')) {
        roles.push('employee');
      }
      const payload: Record<string, unknown> = {
        fullName: editFullName.trim(),
        roles,
        phoneNumber1: editPhoneNumber1.trim() || undefined,
      };
      if (editPhoneNumber2.trim()) {
        payload.phoneNumber2 = editPhoneNumber2.trim();
      } else {
        payload.phoneNumber2 = null;
      }
      if (needsEmployeeId(roles)) {
        payload.employeeId = editEmployeeId.trim();
      } else {
        payload.employeeId = null;
      }
      if (isManagerRole(editRole)) {
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

  const filteredUsers = users.filter((u) => {
    if (roleFilter === 'all') return true;
    const effectiveRoles = u.roles?.length ? u.roles : u.role ? [u.role] : [];
    return effectiveRoles.includes(roleFilter);
  });

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

      <MissionSuccessDialog
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Créer un compte utilisateur"
        description="Renseignez les champs ci-dessous. Les champs obligatoires sont indiqués sur le formulaire."
        maxWidthClassName="max-w-3xl"
      >
        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label
              htmlFor="create-role"
              className="mb-1.5 block text-sm font-semibold text-facam-dark"
            >
              Rôle
            </label>
            <select
              id="create-role"
              value={role}
              onChange={(e) => setRole(e.target.value as CreateRole)}
              className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm transition-colors focus:border-facam-blue focus:outline-none focus:ring-2 focus:ring-facam-blue focus:ring-offset-2"
            >
              <option value="student">Étudiant</option>
              <option value="employee">Employé</option>
              <option value="module_manager_internal">Responsable module interne</option>
              <option value="module_manager_external">Responsable module externe</option>
            </select>
            {isManagerRole(role) && (
              <p className="mt-1 text-xs text-blue-600">
                Le rôle « Employé » sera automatiquement ajouté.
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
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
            <Input
              label="Téléphone principal"
              type="tel"
              value={phoneNumber1}
              onChange={(e) => setPhoneNumber1(e.target.value)}
              placeholder="+237 6XX XXX XXX"
              required
            />
            <Input
              label="Téléphone secondaire (optionnel)"
              type="tel"
              value={phoneNumber2}
              onChange={(e) => setPhoneNumber2(e.target.value)}
              placeholder="+237 6XX XXX XXX"
            />
            {needsEmployeeId([role]) && (
              <Input
                label="Matricule employé"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="EMP-001"
                required
              />
            )}
          </div>
          {isManagerRole(role) && (
            <div>
              <label
                htmlFor="create-module"
                className="mb-1.5 block text-sm font-semibold text-facam-dark"
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
                className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm transition-colors focus:border-facam-blue focus:outline-none focus:ring-2 focus:ring-facam-blue focus:ring-offset-2"
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
                  Créez-en un dans Gestion des modules.
                </p>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-5">
            <Button type="submit" variant="accent" disabled={loading}>
              {loading ? 'Création...' : 'Créer le compte'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
          </div>
        </form>
      </MissionSuccessDialog>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">Comptes</CardTitle>
            <div className="flex items-center gap-2">
              <label htmlFor="role-filter" className="text-sm text-gray-600">
                Filtrer par rôle
              </label>
              <select
                id="role-filter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-facam-blue focus:outline-none focus:ring-2 focus:ring-facam-blue/30"
              >
                <option value="all">Tous les rôles</option>
                <option value="student">Étudiant</option>
                <option value="employee">Employé</option>
                <option value="module_manager_internal">Responsable module interne</option>
                <option value="module_manager_external">Responsable module externe</option>
                <option value="admin">Administrateur</option>
                <option value="platform_manager">Responsable plateforme</option>
                <option value="support">Support technique</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingList ? (
            <p className="text-sm text-gray-500">Chargement...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="w-[32%] pb-3 pr-3 font-medium text-gray-700">Nom</th>
                    <th className="w-[33%] pb-3 pr-3 font-medium text-gray-700">Email</th>
                    <th className="w-[25%] pb-3 pr-3 font-medium text-gray-700">Rôle(s)</th>
                    <th className="w-[10%] pb-3 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-500">
                        Aucun utilisateur pour ce filtre.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b border-gray-100">
                        <td
                          className="truncate py-3 pr-3 font-medium text-facam-dark"
                          title={u.fullName}
                        >
                          {u.fullName}
                        </td>
                        <td className="truncate py-3 pr-3 text-gray-600" title={u.email}>
                          {u.email}
                        </td>
                        <td className="py-3 pr-3">
                          <div className="flex flex-wrap gap-1">
                            {(u.roles?.length ? u.roles : [u.role]).map((r) => (
                              <span
                                key={r}
                                className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                              >
                                {ROLE_LABELS[r] ?? r}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(u)}
                              aria-label={`Modifier ${u.fullName}`}
                              title="Modifier"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => setUserToDelete(u)}
                              aria-label={`Supprimer ${u.fullName}`}
                              title="Supprimer"
                            >
                              <Trash2 className="size-4" />
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
                Rôle principal
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
              {isManagerRole(editRole) && (
                <p className="mt-1 text-xs text-blue-600">
                  Le rôle « Employé » sera automatiquement ajouté.
                </p>
              )}
            </div>
            <Input
              label="Téléphone principal"
              type="tel"
              value={editPhoneNumber1}
              onChange={(e) => setEditPhoneNumber1(e.target.value)}
              placeholder="+228 70 39 39 24"
            />
            <Input
              label="Téléphone secondaire (optionnel)"
              type="tel"
              value={editPhoneNumber2}
              onChange={(e) => setEditPhoneNumber2(e.target.value)}
              placeholder="+228 70 39 39 24"
            />
            {needsEmployeeId([editRole]) && (
              <Input
                label="Matricule employé"
                value={editEmployeeId}
                onChange={(e) => setEditEmployeeId(e.target.value)}
                placeholder="EMP-001"
                required
              />
            )}
            {isManagerRole(editRole) && (
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
