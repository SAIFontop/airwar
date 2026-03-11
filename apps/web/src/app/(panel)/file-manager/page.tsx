'use client';

import { api } from '@/lib/api';
import { useCreateDir, useDeleteFile, useFileList, useFileWrite } from '@/lib/hooks';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowLeft,
    ChevronRight,
    File,
    FileCode,
    FilePlus,
    Folder,
    FolderPlus,
    Home,
    Save,
    Trash2,
    X,
} from 'lucide-react';
import { useCallback, useState } from 'react';

export default function FileManagerPage() {
    const [currentPath, setCurrentPath] = useState('.');
    const [editingFile, setEditingFile] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [originalContent, setOriginalContent] = useState('');
    const [showNewFile, setShowNewFile] = useState(false);
    const [showNewDir, setShowNewDir] = useState(false);
    const [newName, setNewName] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const { data: listing, isLoading, refetch } = useFileList(currentPath);
    const writeFile = useFileWrite();
    const deleteFile = useDeleteFile();
    const createDir = useCreateDir();

    const navigate = useCallback((path: string) => {
        setEditingFile(null);
        setCurrentPath(path);
    }, []);

    const openFile = useCallback(async (filePath: string) => {
        const res = await api.readFileContent(filePath);
        if (res.success && res.data) {
            setEditingFile(filePath);
            setEditContent(res.data.content);
            setOriginalContent(res.data.content);
        }
    }, []);

    const saveFile = useCallback(async () => {
        if (!editingFile) return;
        await writeFile.mutateAsync({ path: editingFile, content: editContent });
        setOriginalContent(editContent);
        refetch();
    }, [editingFile, editContent, writeFile, refetch]);

    const handleCreateFile = useCallback(async () => {
        if (!newName.trim()) return;
        const filePath = currentPath === '.' ? newName.trim() : `${currentPath}/${newName.trim()}`;
        await writeFile.mutateAsync({ path: filePath, content: '' });
        setShowNewFile(false);
        setNewName('');
        refetch();
    }, [newName, currentPath, writeFile, refetch]);

    const handleCreateDir = useCallback(async () => {
        if (!newName.trim()) return;
        const dirPath = currentPath === '.' ? newName.trim() : `${currentPath}/${newName.trim()}`;
        await createDir.mutateAsync(dirPath);
        setShowNewDir(false);
        setNewName('');
        refetch();
    }, [newName, currentPath, createDir, refetch]);

    const handleDelete = useCallback(async () => {
        if (!deleteTarget) return;
        await deleteFile.mutateAsync(deleteTarget);
        if (editingFile === deleteTarget) setEditingFile(null);
        setDeleteTarget(null);
        refetch();
    }, [deleteTarget, deleteFile, editingFile, refetch]);

    const breadcrumbs = currentPath === '.' ? ['root'] : ['root', ...currentPath.split('/')];

    const getFileIcon = (name: string) => {
        const ext = name.split('.').pop()?.toLowerCase();
        if (['lua', 'js', 'ts', 'json', 'cfg', 'yaml', 'yml', 'sh'].includes(ext || ''))
            return <FileCode className="w-4 h-4 text-accent" />;
        return <File className="w-4 h-4 text-muted" />;
    };

    const hasChanges = editContent !== originalContent;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col h-[calc(100vh-8rem)]"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Folder className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold text-text">File Manager</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { setShowNewFile(true); setShowNewDir(false); setNewName(''); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-muted hover:text-text transition text-xs"
                    >
                        <FilePlus className="w-3.5 h-3.5" /> New File
                    </button>
                    <button
                        onClick={() => { setShowNewDir(true); setShowNewFile(false); setNewName(''); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-muted hover:text-text transition text-xs"
                    >
                        <FolderPlus className="w-3.5 h-3.5" /> New Folder
                    </button>
                </div>
            </div>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-1 mb-3 text-xs overflow-x-auto scrollbar-thin">
                {breadcrumbs.map((crumb, i) => (
                    <div key={i} className="flex items-center gap-1">
                        {i > 0 && <ChevronRight className="w-3 h-3 text-muted/40" />}
                        <button
                            onClick={() => {
                                if (i === 0) navigate('.');
                                else navigate(breadcrumbs.slice(1, i + 1).join('/'));
                            }}
                            className="text-muted hover:text-primary transition px-1 py-0.5 rounded"
                        >
                            {i === 0 ? <Home className="w-3.5 h-3.5" /> : crumb}
                        </button>
                    </div>
                ))}
            </div>

            <div className="flex-1 flex gap-3 min-h-0">
                {/* File List */}
                <div className="w-80 shrink-0 glass-card p-3 overflow-y-auto scrollbar-thin">
                    {/* New file/dir inline form */}
                    <AnimatePresence>
                        {(showNewFile || showNewDir) && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-2"
                            >
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                                    {showNewDir ? <FolderPlus className="w-4 h-4 text-primary" /> : <FilePlus className="w-4 h-4 text-accent" />}
                                    <input
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') showNewFile ? handleCreateFile() : handleCreateDir();
                                            if (e.key === 'Escape') { setShowNewFile(false); setShowNewDir(false); }
                                        }}
                                        placeholder={showNewDir ? 'Folder name...' : 'File name...'}
                                        className="flex-1 bg-transparent text-sm text-text outline-none placeholder:text-muted/40"
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => { setShowNewFile(false); setShowNewDir(false); }}
                                        className="text-muted hover:text-text"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Back button */}
                    {currentPath !== '.' && (
                        <button
                            onClick={() => {
                                const parts = currentPath.split('/');
                                navigate(parts.length > 1 ? parts.slice(0, -1).join('/') : '.');
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-muted hover:text-text hover:bg-white/5 transition mb-1"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" /> Back
                        </button>
                    )}

                    {isLoading ? (
                        <div className="text-center text-muted text-xs py-8">Loading...</div>
                    ) : (
                        listing?.items
                            ?.sort((a, b) => {
                                if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
                                return a.name.localeCompare(b.name);
                            })
                            .map((item) => (
                                <div
                                    key={item.name}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs cursor-pointer transition group ${editingFile && editingFile.endsWith(item.name)
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted hover:text-text hover:bg-white/5'
                                        }`}
                                    onClick={() => {
                                        const itemPath = currentPath === '.' ? item.name : `${currentPath}/${item.name}`;
                                        if (item.type === 'directory') navigate(itemPath);
                                        else openFile(itemPath);
                                    }}
                                >
                                    {item.type === 'directory' ? (
                                        <Folder className="w-4 h-4 text-primary shrink-0" />
                                    ) : (
                                        getFileIcon(item.name)
                                    )}
                                    <span className="flex-1 truncate">{item.name}</span>
                                    {item.type === 'file' && (
                                        <span className="text-[10px] text-muted/50">
                                            {item.size > 1024 ? `${(item.size / 1024).toFixed(1)}K` : `${item.size}B`}
                                        </span>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const itemPath = currentPath === '.' ? item.name : `${currentPath}/${item.name}`;
                                            setDeleteTarget(itemPath);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 transition"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))
                    )}

                    {listing?.items?.length === 0 && (
                        <div className="text-center text-muted/50 text-xs py-8">Empty directory</div>
                    )}
                </div>

                {/* File Editor */}
                <div className="flex-1 glass-card flex flex-col min-h-0">
                    {editingFile ? (
                        <>
                            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                                <div className="flex items-center gap-2 text-xs">
                                    <FileCode className="w-4 h-4 text-accent" />
                                    <span className="text-text font-medium">{editingFile.split('/').pop()}</span>
                                    {hasChanges && (
                                        <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">modified</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={saveFile}
                                        disabled={!hasChanges || writeFile.isPending}
                                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition text-xs disabled:opacity-40"
                                    >
                                        <Save className="w-3.5 h-3.5" /> Save
                                    </button>
                                    <button
                                        onClick={() => setEditingFile(null)}
                                        className="text-muted hover:text-text transition"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="flex-1 p-4 bg-transparent text-text font-mono text-xs leading-relaxed outline-none resize-none scrollbar-thin"
                                spellCheck={false}
                            />
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted">
                            <File className="w-12 h-12 mb-4 opacity-30" />
                            <p className="text-sm">Select a file to edit</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteTarget && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setDeleteTarget(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="glass-card p-6 max-w-sm w-full mx-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-text font-bold mb-2">Delete Confirmation</h3>
                            <p className="text-muted text-sm mb-4">
                                Are you sure you want to delete <span className="text-text font-mono">{deleteTarget.split('/').pop()}</span>?
                            </p>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setDeleteTarget(null)}
                                    className="px-4 py-2 rounded-lg bg-white/5 text-muted hover:text-text transition text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleteFile.isPending}
                                    className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition text-sm"
                                >
                                    {deleteFile.isPending ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
