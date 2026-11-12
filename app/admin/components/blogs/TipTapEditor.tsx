"use client";

import React, { useRef, useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Youtube from "@tiptap/extension-youtube";
import { common, createLowlight } from "lowlight";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Highlighter,
  Eraser,
  Pilcrow,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Quote,
  Code,
  Minus,
  Link2,
  Unlink,
  Table as TableIcon,
  Trash2,
  Video,
  ImageIcon,
  Undo2,
  Redo2,
  Loader2,
} from "lucide-react";
import { uploadBlogImage } from "@/lib/services/blogsService";

const lowlight = createLowlight(common);

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function TipTapEditor({ content, onChange }: TipTapEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: false,
      }),
      ImageExtension.configure({
        inline: true,
        allowBase64: true,
      }),
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: {
          class:
            "text-[#E0B669] underline font-medium hover:text-[#C89949] transition-colors",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class:
            "border-collapse table-auto w-full my-4 border border-[#B7873A]/30 rounded-lg overflow-hidden",
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class:
            "bg-[#0a233d] font-semibold p-3 border border-[#B7873A]/30 text-left text-[#E0B669] text-sm",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class:
            "p-3 border border-white/10 text-[#E9E8E3]/85 text-sm",
        },
      }),
      Subscript,
      Superscript,
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class:
            "bg-[#040D18] text-[#E9E8E3] p-4 rounded-xl font-mono text-sm my-4 overflow-x-auto border border-[#B7873A]/25",
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: "space-y-1.5 my-3 list-none pl-0",
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: "flex items-start gap-2.5 my-1 text-[#E9E8E3]/90",
        },
      }),
      Youtube.configure({
        inline: false,
        width: 640,
        height: 380,
        HTMLAttributes: {
          class:
            "mx-auto my-6 rounded-xl overflow-hidden shadow-xl border border-[#B7873A]/25 max-w-full aspect-video",
        },
      }),
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose max-w-none p-6 min-h-[420px] focus:outline-none bg-[#071A2E]/90 text-[#E9E8E3] selection:bg-[#C89949] selection:text-[#071A2E] leading-relaxed",
      },
    },
  });

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !editor) return;

      try {
        setIsUploading(true);
        const downloadUrl = await uploadBlogImage(file, "editor-images");
        editor
          .chain()
          .focus()
          .setImage({ src: downloadUrl, alt: file.name })
          .run();
      } catch (err) {
        console.error("Failed to upload editor image:", err);
        alert("Failed to upload image. Please try again.");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [editor]
  );

  const handleSetLink = () => {
    if (!editor) return;
    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      let formattedUrl = linkUrl.trim();
      if (
        !/^https?:\/\//i.test(formattedUrl) &&
        !formattedUrl.startsWith("/") &&
        !formattedUrl.startsWith("#")
      ) {
        formattedUrl = `https://${formattedUrl}`;
      }
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: formattedUrl })
        .run();
    }
    setShowLinkModal(false);
    setLinkUrl("");
  };

  const handleInsertYoutube = () => {
    if (!editor || !youtubeUrl) return;
    editor.commands.setYoutubeVideo({
      src: youtubeUrl.trim(),
    });
    setShowYoutubeModal(false);
    setYoutubeUrl("");
  };

  const handleInsertTable = () => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertTable({
        rows: Math.max(1, tableRows),
        cols: Math.max(1, tableCols),
        withHeaderRow: true,
      })
      .run();
    setShowTableModal(false);
  };

  if (!editor) {
    return (
      <div className="border border-[#B7873A]/25 rounded-2xl bg-[#0a233d]/65 p-8 flex items-center justify-center text-[#E9E8E3]/65 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-[#E0B669]" />
        <span>Loading Editor...</span>
      </div>
    );
  }

  const btnStyle = (active: boolean) =>
    `p-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer flex items-center justify-center ${
      active
        ? "bg-[#C89949] text-[#071A2E] shadow-sm"
        : "text-[#E9E8E3]/70 hover:text-[#E0B669] hover:bg-white/10"
    }`;

  return (
    <div className="border border-[#B7873A]/30 rounded-2xl bg-[#071A2E]/90 shadow-xl shadow-black/25 overflow-hidden focus-within:ring-1 focus-within:ring-[#C89949]/60 focus-within:border-[#C89949] transition-all">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Sticky Toolbar */}
      <div className="sticky top-0 z-20 bg-[#0a233d] border-b border-white/10 p-2 flex flex-wrap items-center gap-1">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 border-r border-white/10 pr-1.5 mr-1">
          <button
            type="button"
            title="Undo (Ctrl+Z)"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className={`${btnStyle(false)} disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Redo (Ctrl+Y)"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className={`${btnStyle(false)} disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Headings & Paragraph */}
        <div className="flex items-center gap-0.5 border-r border-white/10 pr-1.5 mr-1">
          <button
            type="button"
            title="Paragraph"
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={btnStyle(
              editor.isActive("paragraph") && !editor.isActive("heading")
            )}
          >
            <Pilcrow className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Heading 1"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={btnStyle(editor.isActive("heading", { level: 1 }))}
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Heading 2"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={btnStyle(editor.isActive("heading", { level: 2 }))}
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Heading 3"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={btnStyle(editor.isActive("heading", { level: 3 }))}
          >
            <Heading3 className="w-4 h-4" />
          </button>
        </div>

        {/* Text Formats */}
        <div className="flex items-center gap-0.5 border-r border-white/10 pr-1.5 mr-1">
          <button
            type="button"
            title="Bold"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={btnStyle(editor.isActive("bold"))}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Italic"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={btnStyle(editor.isActive("italic"))}
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Underline"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={btnStyle(editor.isActive("underline"))}
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Strikethrough"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={btnStyle(editor.isActive("strike"))}
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Highlight"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={btnStyle(editor.isActive("highlight"))}
          >
            <Highlighter className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Subscript"
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            className={btnStyle(editor.isActive("subscript"))}
          >
            <SubscriptIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Superscript"
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            className={btnStyle(editor.isActive("superscript"))}
          >
            <SuperscriptIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Clear Formatting"
            onClick={() =>
              editor.chain().focus().unsetAllMarks().clearNodes().run()
            }
            className={btnStyle(false)}
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-0.5 border-r border-white/10 pr-1.5 mr-1">
          <button
            type="button"
            title="Align Left"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={btnStyle(editor.isActive({ textAlign: "left" }))}
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Align Center"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={btnStyle(editor.isActive({ textAlign: "center" }))}
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Align Right"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={btnStyle(editor.isActive({ textAlign: "right" }))}
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Justify"
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            className={btnStyle(editor.isActive({ textAlign: "justify" }))}
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-0.5 border-r border-white/10 pr-1.5 mr-1">
          <button
            type="button"
            title="Bullet List"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={btnStyle(editor.isActive("bulletList"))}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Numbered List"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={btnStyle(editor.isActive("orderedList"))}
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Task List"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={btnStyle(editor.isActive("taskList"))}
          >
            <ListTodo className="w-4 h-4" />
          </button>
        </div>

        {/* Inserts */}
        <div className="flex items-center gap-0.5 border-r border-white/10 pr-1.5 mr-1">
          <button
            type="button"
            title="Blockquote"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={btnStyle(editor.isActive("blockquote"))}
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Code Block"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={btnStyle(editor.isActive("codeBlock"))}
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Horizontal Rule"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className={btnStyle(false)}
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Media & Link Inserts */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            title="Insert Link"
            onClick={() => {
              const previousUrl = editor.getAttributes("link").href;
              setLinkUrl(previousUrl || "");
              setShowLinkModal(true);
            }}
            className={btnStyle(editor.isActive("link"))}
          >
            <Link2 className="w-4 h-4" />
          </button>
          {editor.isActive("link") && (
            <button
              type="button"
              title="Remove Link"
              onClick={() => editor.chain().focus().unsetLink().run()}
              className={btnStyle(false)}
            >
              <Unlink className="w-4 h-4 text-red-400" />
            </button>
          )}

          <button
            type="button"
            title="Insert Table"
            onClick={() => setShowTableModal(true)}
            className={btnStyle(editor.isActive("table"))}
          >
            <TableIcon className="w-4 h-4" />
          </button>
          {editor.isActive("table") && (
            <button
              type="button"
              title="Delete Table"
              onClick={() => editor.chain().focus().deleteTable().run()}
              className={`${btnStyle(false)} text-red-400 hover:bg-red-500/15`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            title="Embed YouTube Video"
            onClick={() => setShowYoutubeModal(true)}
            className={btnStyle(false)}
          >
            <Video className="w-4 h-4" />
          </button>

          <button
            type="button"
            title="Upload Image (Auto Compressed to 1200px)"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer flex items-center justify-center bg-[#C89949]/15 text-[#E0B669] border border-[#B7873A]/35 hover:bg-[#C89949] hover:text-[#071A2E]"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ImageIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="min-h-[420px] bg-[#071A2E]/90">
        <EditorContent editor={editor} />
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#040D18]/85 backdrop-blur-md p-4">
          <div className="bg-[#071A2E] rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#B7873A]/40">
            <h3 className="text-lg font-medium text-white mb-2">
              Insert / Edit Link
            </h3>
            <p className="text-xs text-[#E9E8E3]/65 mb-4">
              Enter target URL. Internal links will automatically omit nofollow.
            </p>
            <input
              type="url"
              placeholder="https://solvpartners.in/services or /contactus"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a233d] border border-white/15 text-sm text-white placeholder-white/35 focus:outline-none focus:border-[#C89949] mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkUrl("");
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#E9E8E3]/80 bg-[#0a233d] border border-white/15 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSetLink}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#C89949] hover:bg-[#E0B669] text-[#071A2E] transition-colors cursor-pointer"
              >
                Apply Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* YouTube Modal */}
      {showYoutubeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#040D18]/85 backdrop-blur-md p-4">
          <div className="bg-[#071A2E] rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#B7873A]/40">
            <h3 className="text-lg font-medium text-white mb-2">
              Embed YouTube Video
            </h3>
            <p className="text-xs text-[#E9E8E3]/65 mb-4">
              Paste the full YouTube video link or share URL.
            </p>
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a233d] border border-white/15 text-sm text-white placeholder-white/35 focus:outline-none focus:border-[#C89949] mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowYoutubeModal(false);
                  setYoutubeUrl("");
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#E9E8E3]/80 bg-[#0a233d] border border-white/15 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertYoutube}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#C89949] hover:bg-[#E0B669] text-[#071A2E] transition-colors cursor-pointer"
              >
                Embed Video
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Modal */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#040D18]/85 backdrop-blur-md p-4">
          <div className="bg-[#071A2E] rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-[#B7873A]/40">
            <h3 className="text-lg font-medium text-white mb-2">
              Create Table
            </h3>
            <p className="text-xs text-[#E9E8E3]/65 mb-4">
              Specify the initial row and column count.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-[#E0B669] mb-1">
                  Rows
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={tableRows}
                  onChange={(e) =>
                    setTableRows(parseInt(e.target.value, 10) || 1)
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#0a233d] border border-white/15 text-sm text-white focus:outline-none focus:border-[#C89949]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#E0B669] mb-1">
                  Columns
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={tableCols}
                  onChange={(e) =>
                    setTableCols(parseInt(e.target.value, 10) || 1)
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#0a233d] border border-white/15 text-sm text-white focus:outline-none focus:border-[#C89949]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowTableModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#E9E8E3]/80 bg-[#0a233d] border border-white/15 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertTable}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#C89949] hover:bg-[#E0B669] text-[#071A2E] transition-colors cursor-pointer"
              >
                Insert Table
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

