/**
 * Layout minimaliste pour la page de sélection d'interface.
 * Pas de sidebar ni header — affichage centré plein écran.
 */

export default function SelectRoleLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-facam-blue-tint via-white to-facam-blue-tint/50 font-montserrat">
      {children}
    </div>
  );
}
