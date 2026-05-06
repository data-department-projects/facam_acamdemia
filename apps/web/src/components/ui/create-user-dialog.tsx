/**
 * Dialog animé pour la création d'un utilisateur — Overlay modal avec animation d'entrée/sortie.
 * Utilise framer-motion pour les transitions fluides et le backdrop blur.
 * Remplace la Card inline dans la page admin/users.
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type CreateRole = 'student' | 'employee' | 'module_manager_internal' | 'module_manager_external';

interface ModuleItem {
  id: string;
  title: string;
  moduleType?: string | null;
}

interface CreateUserDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  readonly loading: boolean;
  readonly role: CreateRole;
  readonly onRoleChange: (role: CreateRole) => void;
  readonly fullName: string;
  readonly onFullNameChange: (value: string) => void;
  readonly email: string;
  readonly onEmailChange: (value: string) => void;
  readonly password: string;
  readonly onPasswordChange: (value: string) => void;
  readonly phoneNumber1: string;
  readonly onPhoneNumber1Change: (value: string) => void;
  readonly phoneNumber2: string;
  readonly onPhoneNumber2Change: (value: string) => void;
  readonly employeeId: string;
  readonly onEmployeeIdChange: (value: string) => void;
  readonly moduleId: string;
  readonly onModuleIdChange: (value: string) => void;
  readonly needsEmployeeId: boolean;
  readonly isManagerRole: boolean;
  readonly managerModulesForRole: readonly ModuleItem[];
}

export function CreateUserDialog({
  isOpen,
  onClose,
  onSubmit,
  loading,
  role,
  onRoleChange,
  fullName,
  onFullNameChange,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  phoneNumber1,
  onPhoneNumber1Change,
  phoneNumber2,
  onPhoneNumber2Change,
  employeeId,
  onEmployeeIdChange,
  moduleId,
  onModuleIdChange,
  needsEmployeeId: showEmployeeId,
  isManagerRole: showManagerFields,
  managerModulesForRole,
}: CreateUserDialogProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, loading, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !loading && onClose()}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 backdrop-blur-sm px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-facam-yellow/20">
                  <UserPlus className="h-4 w-4 text-facam-dark" />
                </div>
                <h2 className="text-lg font-bold text-facam-dark">Créer un compte</h2>
              </div>
              <button
                type="button"
                onClick={() => !loading && onClose()}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-72px)] p-6">
              <form onSubmit={onSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="dialog-role"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Rôle
                  </label>
                  <select
                    id="dialog-role"
                    value={role}
                    onChange={(e) => onRoleChange(e.target.value as CreateRole)}
                    className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-facam-blue focus:ring-offset-2 focus:border-facam-blue"
                  >
                    <option value="student">Étudiant</option>
                    <option value="employee">Employé</option>
                    <option value="module_manager_internal">Responsable module interne</option>
                    <option value="module_manager_external">Responsable module externe</option>
                  </select>
                  {showManagerFields && (
                    <div className="mt-2 flex items-start gap-2 rounded-lg bg-blue-50 px-3 py-2">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                      <p className="text-xs text-blue-700">
                        Le rôle « Employé » sera automatiquement ajouté.
                      </p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Nom complet"
                    value={fullName}
                    onChange={(e) => onFullNameChange(e.target.value)}
                    placeholder="Jean Dupont"
                    required
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => onEmailChange(e.target.value)}
                    placeholder="jean.dupont@facam.com"
                    required
                  />
                </div>
                <Input
                  label="Mot de passe (initial)"
                  type="password"
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Téléphone principal"
                    type="tel"
                    value={phoneNumber1}
                    onChange={(e) => onPhoneNumber1Change(e.target.value)}
                    placeholder="+237 6XX XXX XXX"
                    required
                  />
                  <Input
                    label="Téléphone secondaire"
                    type="tel"
                    value={phoneNumber2}
                    onChange={(e) => onPhoneNumber2Change(e.target.value)}
                    placeholder="+237 6XX XXX XXX (optionnel)"
                  />
                </div>
                {showEmployeeId && (
                  <Input
                    label="Matricule employé"
                    value={employeeId}
                    onChange={(e) => onEmployeeIdChange(e.target.value)}
                    placeholder="EMP-001"
                    required
                  />
                )}
                {showManagerFields && (
                  <div>
                    <label
                      htmlFor="dialog-module"
                      className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                      Module assigné
                    </label>
                    <select
                      id="dialog-module"
                      value={moduleId}
                      onChange={(e) => onModuleIdChange(e.target.value)}
                      className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-facam-blue focus:ring-offset-2 focus:border-facam-blue"
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
                      <p className="mt-1.5 text-xs text-amber-600">
                        Aucun module {role === 'module_manager_internal' ? 'interne' : 'externe'}{' '}
                        disponible.
                      </p>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                  <Button type="submit" variant="accent" className="flex-1" disabled={loading}>
                    {loading ? 'Création en cours...' : 'Créer le compte'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => !loading && onClose()}>
                    Annuler
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
