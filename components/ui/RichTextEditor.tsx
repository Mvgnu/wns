'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { forwardRef, useImperativeHandle, useCallback, useState, useRef, useEffect, useMemo } from 'react';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Youtube from '@tiptap/extension-youtube';
import Heading from '@tiptap/extension-heading';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Image as ImageIcon,
  Link as LinkIcon,
  Youtube as YoutubeIcon,
  Heading1,
  Heading2,
  Heading3,
  Minus as HorizontalRuleIcon,
  Code,
  Quote,
  Palette,
  Highlighter,
  Table as TableIcon,
  Undo,
  Redo,
} from 'lucide-react';

import './editor-styles.css'; // We'll create this file for styling

export interface RichTextEditorProps {
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  dark?: boolean;
  autoFocus?: boolean;
  id?: string;
  readOnly?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RichTextEditor = forwardRef<any, RichTextEditorProps>(
  ({ defaultValue = '', onChange, placeholder, dark, autoFocus, readOnly = false }, ref) => {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editor, setEditor] = useState<any>(null);
    
    const handleImageUpload = useCallback(async (file: File) => {
      // Create FormData for the file upload
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        // Upload the image to your server
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Image upload failed');
        }
        
        const data = await response.json();
        return data.url; // Return the URL of the uploaded image
      } catch (error) {
        console.error('Error uploading image:', error);
        return null;
      }
    }, []);
    
    const insertImage = useCallback(async () => {
      if (!editor || !selectedImage) return;
      
      try {
        const imageUrl = await handleImageUpload(selectedImage);
        if (imageUrl) {
          editor.chain().focus().setImage({ src: imageUrl, alt: selectedImage.name }).run();
        }
        setSelectedImage(null);
      } catch (error) {
        console.error('Error inserting image:', error);
      }
    }, [editor, selectedImage, handleImageUpload]);
    
    const addYoutubeVideo = useCallback(() => {
      if (!editor) return;
      
      const url = prompt('Enter YouTube URL');
      if (url) {
        // Use the Youtube extension to embed a YouTube video
        editor.chain().focus().setYoutubeVideo({ src: url }).run();
      }
    }, [editor]);

    // Define setLink callback before the conditional return
    const setLink = useCallback(() => {
      if (!editor) return;
      
      const previousUrl = editor.getAttributes('link').href;
      const url = window.prompt('URL', previousUrl);
      
      // cancelled
      if (url === null) return;
      
      // empty
      if (url === '') {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
        return;
      }
      
      // update link
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);
    
    // Memoize extensions to prevent re-creation
    const extensions = useMemo(() => [
      StarterKit.configure({
        heading: false, // We'll add our own heading configuration
        // Disable extensions that we'll configure separately
        bulletList: false,
        orderedList: false,
        listItem: false,
        horizontalRule: false,
        codeBlock: false,
        blockquote: false,
        dropcursor: false,
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Schreibe hier deinen Inhalt...',
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      Link.configure({
        openOnClick: false,
        linkOnPaste: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Youtube.configure({
        width: 640,
        height: 360,
        nocookie: true,
        modestBranding: true,
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
    ], [placeholder]);
    
    const tiptapEditor = useEditor({
      extensions,
      content: defaultValue,
      onUpdate: ({ editor }) => {
        if (onChange) onChange(editor.getHTML());
      },
      autofocus: autoFocus,
      editorProps: {
        attributes: {
          class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none px-4 py-2',
          spellcheck: 'true',
        },
      },
      editable: !readOnly,
      // Set immediatelyRender to false to handle SSR detection
      immediatelyRender: false,
    }, [defaultValue, onChange, autoFocus, readOnly, extensions]);

    // Update editor state when the tiptapEditor changes
    useEffect(() => {
      if (tiptapEditor) {
        setEditor(tiptapEditor);
      }
    }, [tiptapEditor]);
    
    useImperativeHandle(ref, () => tiptapEditor);

    if (!tiptapEditor) {
      return <div>Loading editor...</div>;
    }

    return (
      <div className={`tiptap-editor ${dark ? 'dark' : ''}`}>
        {!readOnly && (
          <div className="editor-toolbar">
            <div className="toolbar-section formatting">
              <button
                onClick={() => tiptapEditor.chain().focus().toggleBold().run()}
                className={tiptapEditor.isActive('bold') ? 'is-active' : ''}
                title="Bold"
                type="button"
              >
                <Bold size={16} />
              </button>
              <button
                onClick={() => tiptapEditor.chain().focus().toggleItalic().run()}
                className={tiptapEditor.isActive('italic') ? 'is-active' : ''}
                title="Italic"
                type="button"
              >
                <Italic size={16} />
              </button>
              <button
                onClick={() => tiptapEditor.chain().focus().toggleUnderline().run()}
                className={tiptapEditor.isActive('underline') ? 'is-active' : ''}
                title="Underline"
                type="button"
              >
                <UnderlineIcon size={16} />
              </button>
            </div>
            
            <div className="toolbar-section alignment">
              <button
                onClick={() => tiptapEditor.chain().focus().setTextAlign('left').run()}
                className={tiptapEditor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}
                title="Align left"
                type="button"
              >
                <AlignLeft size={16} />
              </button>
              <button
                onClick={() => tiptapEditor.chain().focus().setTextAlign('center').run()}
                className={tiptapEditor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}
                title="Align center"
                type="button"
              >
                <AlignCenter size={16} />
              </button>
              <button
                onClick={() => tiptapEditor.chain().focus().setTextAlign('right').run()}
                className={tiptapEditor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}
                title="Align right"
                type="button"
              >
                <AlignRight size={16} />
              </button>
              <button
                onClick={() => tiptapEditor.chain().focus().setTextAlign('justify').run()}
                className={tiptapEditor.isActive({ textAlign: 'justify' }) ? 'is-active' : ''}
                title="Justify"
                type="button"
              >
                <AlignJustify size={16} />
              </button>
            </div>
            
            <div className="toolbar-section headings">
              <button
                onClick={() => tiptapEditor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={tiptapEditor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
                title="Heading 1"
                type="button"
              >
                <Heading1 size={16} />
              </button>
              <button
                onClick={() => tiptapEditor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={tiptapEditor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
                title="Heading 2"
                type="button"
              >
                <Heading2 size={16} />
              </button>
              <button
                onClick={() => tiptapEditor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={tiptapEditor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
                title="Heading 3"
                type="button"
              >
                <Heading3 size={16} />
              </button>
            </div>
            
            <div className="toolbar-section lists">
              <button
                onClick={() => tiptapEditor.chain().focus().toggleBulletList().run()}
                className={tiptapEditor.isActive('bulletList') ? 'is-active' : ''}
                title="Bullet list"
                type="button"
              >
                <List size={16} />
              </button>
              <button
                onClick={() => tiptapEditor.chain().focus().toggleOrderedList().run()}
                className={tiptapEditor.isActive('orderedList') ? 'is-active' : ''}
                title="Ordered list"
                type="button"
              >
                <ListOrdered size={16} />
              </button>
            </div>
            
            <div className="toolbar-section media">
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Upload Image"
                type="button"
              >
                <ImageIcon size={16} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedImage(file);
                    insertImage();
                  }
                }}
              />
              <button
                onClick={setLink}
                className={tiptapEditor.isActive('link') ? 'is-active' : ''}
                title="Add Link"
                type="button"
              >
                <LinkIcon size={16} />
              </button>
              <button
                onClick={addYoutubeVideo}
                title="Embed YouTube Video"
                type="button"
              >
                <YoutubeIcon size={16} />
              </button>
            </div>
            
            <div className="toolbar-section advanced">
              <button
                onClick={() => tiptapEditor.chain().focus().setHorizontalRule().run()}
                title="Horizontal rule"
                type="button"
              >
                <HorizontalRuleIcon size={16} />
              </button>
              <button
                onClick={() => tiptapEditor.chain().focus().toggleCodeBlock().run()}
                className={tiptapEditor.isActive('codeBlock') ? 'is-active' : ''}
                title="Code block"
                type="button"
              >
                <Code size={16} />
              </button>
              <button
                onClick={() => tiptapEditor.chain().focus().toggleBlockquote().run()}
                className={tiptapEditor.isActive('blockquote') ? 'is-active' : ''}
                title="Blockquote"
                type="button"
              >
                <Quote size={16} />
              </button>
              <button
                onClick={() => {
                  const color = window.prompt('Color (hex, rgb, rgba):', '#000000');
                  if (color) {
                    tiptapEditor.chain().focus().setColor(color).run();
                  }
                }}
                title="Text color"
                type="button"
              >
                <Palette size={16} />
              </button>
              <button
                onClick={() => tiptapEditor.chain().focus().toggleHighlight().run()}
                className={tiptapEditor.isActive('highlight') ? 'is-active' : ''}
                title="Highlight"
                type="button"
              >
                <Highlighter size={16} />
              </button>
              <button
                onClick={() => {
                  tiptapEditor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                }}
                title="Insert table"
                type="button"
              >
                <TableIcon size={16} />
              </button>
            </div>
            
            <div className="toolbar-section history">
              <button
                onClick={() => tiptapEditor.chain().focus().undo().run()}
                disabled={!tiptapEditor.can().undo()}
                title="Undo"
                type="button"
              >
                <Undo size={16} />
              </button>
              <button
                onClick={() => tiptapEditor.chain().focus().redo().run()}
                disabled={!tiptapEditor.can().redo()}
                title="Redo"
                type="button"
              >
                <Redo size={16} />
              </button>
            </div>
          </div>
        )}
        
        <EditorContent editor={tiptapEditor} />
      </div>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';
export default RichTextEditor;