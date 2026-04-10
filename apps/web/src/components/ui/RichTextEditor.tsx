/**
 * `RichTextEditor` — Éditeur WYSIWYG (TipTap) pour saisir du contenu riche stocké en base (HTML).
 *
 * Rôle dans l'app:
 * - Permet au responsable module de mettre en forme "Prérequis" et "Objectifs d'apprentissage".
 * - Supporte les listes, gras/italique, liens, titres, et petites illustrations (images).
 *
 * Bases importantes:
 * - L'éditeur produit du **HTML**: ce HTML doit être **sanitisé** au rendu (voir `RichTextContent`).
 * - Les images sont insérées en **data URL** (pratique, mais à garder "petites" pour éviter de gros champs).
 */

'use client';

import { useCallback, useEffect, useId, useMemo, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Underline as UnderlineIcon, Link2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Lecture du fichier impossible'));
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.readAsDataURL(file);
  });
}

export function RichTextEditor({
  label,
  value,
  onChange,
  placeholder,
  className,
}: Readonly<{
  label: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}>) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: 'text-facam-blue underline underline-offset-2',
          rel: 'noopener noreferrer nofollow',
          target: '_blank',
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: placeholder ?? '',
      }),
    ],
    [placeholder]
  );

  const editor = useEditor({
    // Next.js (SSR/RSC) : évite le rendu immédiat côté serveur et les mismatchs d'hydratation.
    immediatelyRender: false,
    extensions,
    content: value || '',
    editorProps: {
      attributes: {
        class:
          'min-h-[120px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-facam-blue/40',
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    // Sync uniquement si la valeur externe change “vraiment” (évite boucle).
    const current = editor.getHTML();
    if ((value || '') !== current) {
      // TipTap v2: le 2e argument est un objet d'options (et non plus un booléen).
      // `emitUpdate: false` évite de déclencher `onUpdate` lors du sync depuis la prop `value`.
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [editor, value]);

  const toggleLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL du lien', prev ?? 'https://');
    if (url == null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  }, [editor]);

  const insertImageFromFile = useCallback(
    async (file: File) => {
      if (!editor) return;
      const dataUrl = await fileToDataUrl(file);
      if (!dataUrl.startsWith('data:image/')) {
        throw new Error('Seules les images sont acceptées.');
      }
      editor.chain().focus().setImage({ src: dataUrl, alt: file.name }).run();
    },
    [editor]
  );

  const openImagePicker = useCallback(() => fileInputRef.current?.click(), []);

  if (!editor) {
    return (
      <div className={className}>
        <label className="mb-1.5 block text-sm font-semibold text-facam-dark">{label}</label>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
          Chargement de l’éditeur…
        </div>
      </div>
    );
  }

  const ToolbarButton = ({
    active,
    onClick,
    disabled,
    children,
    title,
  }: {
    active?: boolean;
    onClick: () => void;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      title={title}
      aria-pressed={active ? 'true' : 'false'}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-md border px-2 py-1 text-xs font-semibold transition-colors',
        active
          ? 'border-facam-blue/30 bg-facam-blue-tint text-facam-blue'
          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
        disabled && 'opacity-50'
      )}
    >
      {children}
    </button>
  );

  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-facam-dark">
        {label}
      </label>

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <ToolbarButton
          title="Gras"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Italique"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Souligné"
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton title="Lien" active={editor.isActive('link')} onClick={toggleLink}>
          <Link2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton title="Image" onClick={openImagePicker}>
          <ImageIcon className="size-4" />
        </ToolbarButton>

        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          className="sr-only"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            try {
              await insertImageFromFile(file);
            } catch (err) {
              // On évite de throw (UX) : le parent affichera déjà les erreurs de formulaire si besoin.
              console.error(err);
            }
          }}
        />
      </div>

      <EditorContent editor={editor} />
      <p className="mt-1 text-xs text-gray-500">
        Astuce: vous pouvez coller du texte formaté (Word/Google Docs) et insérer de petites images.
      </p>
    </div>
  );
}
