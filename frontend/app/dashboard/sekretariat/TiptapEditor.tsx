// frontend/app/dashboard/sekretariat/TiptapEditor.tsx
'use client';

import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';

interface TiptapEditorProps {
  value: string;
  onChange: (val: string) => void;
}

export default function TiptapEditor({ value, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: 'Ketik poin-poin hasil musyawarah atau keputusan murni rapat di sini...',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col flex-1 bg-white focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
      {/* Toolbar Premium dengan Ikon Standar */}
      <div className="bg-slate-50 border-b border-slate-200 p-2 flex flex-wrap gap-1 items-center shrink-0 select-none">
        
        {/* History Actions */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="p-1.5 rounded-md text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
          title="Undo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="p-1.5 rounded-md text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
          title="Redo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
        </button>

        <div className="w-px h-4 bg-slate-300 mx-1" />

        {/* Text Formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            editor.isActive('bold') ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-200'
          }`}
          title="Tebal"
        >
          <span className="font-extrabold text-sm block min-w-[16px] text-center">B</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            editor.isActive('italic') ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-200'
          }`}
          title="Miring"
        >
          <span className="italic font-serif font-bold text-sm block min-w-[16px] text-center">I</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            editor.isActive('underline') ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-200'
          }`}
          title="Garis Bawah"
        >
          <span className="underline text-sm block min-w-[16px] text-center">U</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            editor.isActive('strike') ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-200'
          }`}
          title="Coret"
        >
          <span className="line-through text-sm block min-w-[16px] text-center">S</span>
        </button>

        <div className="w-px h-4 bg-slate-300 mx-1" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            editor.isActive('bulletList') ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-200'
          }`}
          title="Bullet List"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            editor.isActive('orderedList') ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-200'
          }`}
          title="Numbered List"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
        </button>

        <div className="w-px h-4 bg-slate-300 mx-1" />

        {/* Text Alignment */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            editor.isActive({ textAlign: 'left' }) ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-200'
          }`}
          title="Rata Kiri"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            editor.isActive({ textAlign: 'center' }) ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-200'
          }`}
          title="Rata Tengah"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/></svg>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            editor.isActive({ textAlign: 'right' }) ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-200'
          }`}
          title="Rata Kanan"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></svg>
        </button>

        <div className="w-px h-4 bg-slate-300 mx-1" />

        {/* Clear Format */}
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          className="p-1.5 rounded-md text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          title="Hapus Semua Format"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* Area Mengetik Editor */}
      <EditorContent editor={editor} className="flex-1" />
    </div>
  );
}