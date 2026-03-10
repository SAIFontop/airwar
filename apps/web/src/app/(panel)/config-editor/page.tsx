'use client';

import { useSaveServerConfig, useServerConfig } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { AlertTriangle, Check, FileCode2, Loader2, RotateCcw, Save } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function ConfigEditorPage() {
    const { data, refetch, isLoading, isError } = useServerConfig();
    const saveConfig = useSaveServerConfig();

    const [content, setContent] = useState('');
    const [originalContent, setOriginalContent] = useState('');
    const [loaded, setLoaded] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Load on mount
    useEffect(() => { refetch(); }, [refetch]);

    // Sync content from API
    useEffect(() => {
        if (data?.content && !loaded) {
            setContent(data.content);
            setOriginalContent(data.content);
            setLoaded(true);
        }
    }, [data, loaded]);

    const isDirty = content !== originalContent;

    const lineNumbers = content.split('\n').length;

    const handleSave = useCallback(async () => {
        setMessage(null);
        const res = await saveConfig.mutateAsync(content);
        if (res.success) {
            setOriginalContent(content);
            setMessage({ type: 'success', text: 'Configuration saved successfully. A backup was created.' });
        } else {
            setMessage({ type: 'error', text: res.error || 'Failed to save' });
        }
    }, [content, saveConfig]);

    const handleRevert = () => {
        setContent(originalContent);
        setMessage(null);
    };

    // Ctrl+S shortcut
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (isDirty) handleSave();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isDirty, handleSave]);

    // Handle tab key in textarea
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const target = e.target as HTMLTextAreaElement;
            const start = target.selectionStart;
            const end = target.selectionEnd;
            const newContent = content.substring(0, start) + '    ' + content.substring(end);
            setContent(newContent);
            requestAnimationFrame(() => {
                target.selectionStart = target.selectionEnd = start + 4;
            });
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <FileCode2 className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold text-text">Config Editor</h2>
                    <span className="text-xs text-muted bg-white/5 px-2 py-0.5 rounded-full">server.cfg</span>
                    {isDirty && (
                        <span className="text-xs bg-warning/15 text-warning px-2 py-0.5 rounded-full animate-pulse">Unsaved changes</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted">{lineNumbers} lines</span>
                    <button
                        onClick={handleRevert}
                        disabled={!isDirty}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 text-muted hover:text-text text-sm transition disabled:opacity-30"
                    >
                        <RotateCcw className="w-4 h-4" /> Revert
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!isDirty || saveConfig.isPending}
                        className="btn-primary text-sm disabled:opacity-50"
                    >
                        {saveConfig.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save
                    </button>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={cn(
                    'rounded-xl px-4 py-3 text-sm flex items-center gap-2',
                    message.type === 'success' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                )}>
                    {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {message.text}
                </div>
            )}

            {/* Editor */}
            {isLoading && (
                <div className="glass-card flex-1 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            )}

            {isError && (
                <div className="glass-card p-12 text-center flex-1">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-warning/40" />
                    <p className="text-muted">Failed to load server.cfg. Make sure a profile is active and the file exists.</p>
                    <button onClick={() => { setLoaded(false); refetch(); }} className="mt-4 btn-primary text-sm">
                        <RotateCcw className="w-4 h-4" /> Retry
                    </button>
                </div>
            )}

            {loaded && !isError && (
                <div className="glass-card flex-1 overflow-hidden flex relative">
                    {/* Line numbers */}
                    <div className="w-12 bg-white/[0.02] border-r border-border py-4 px-2 text-right select-none overflow-hidden shrink-0">
                        {Array.from({ length: lineNumbers }, (_, i) => (
                            <div key={i} className="text-xs text-muted/40 leading-[1.625rem] font-mono">{i + 1}</div>
                        ))}
                    </div>

                    {/* Textarea */}
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 p-4 bg-transparent text-text font-mono text-sm resize-none focus:outline-none leading-[1.625rem] min-h-[500px]"
                        spellCheck={false}
                        wrap="off"
                    />
                </div>
            )}
        </motion.div>
    );
}
