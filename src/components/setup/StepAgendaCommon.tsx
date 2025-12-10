'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    Paper, Typography, Box, Stack, Button, IconButton, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Tooltip, Divider, Chip
} from '@mui/material';
import {
    Add as AddIcon,
    CloudUpload as CloudUploadIcon,
    AttachFile as AttachFileIcon,
    DeleteOutline as DeleteOutlineIcon,
    Delete as DeleteIcon,
    FormatBold as FormatBoldIcon,
    FormatItalic as FormatItalicIcon,
    FormatUnderlined as FormatUnderlinedIcon,
    FormatListBulleted as FormatListBulletedIcon,
    FormatListNumbered as FormatListNumberedIcon,
    Description as DescriptionIcon
} from '@mui/icons-material';
import { CircularProgress } from '@mui/material';

// --- Tiptap Import ---
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';

export type FileData = {
    name: string;
    url: string;
};

export type AgendaItem = {
    agendaNo: number;
    subAgendas?: { subAgendaNo: number; detail: string }[];
    attachedFiles?: FileData[];
    [key: string]: any;
};
type Props = {
    agendaNumber: number;
    onDataChange: (data: AgendaItem | null) => void;
    defaultData?: AgendaItem | null;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

// --- MenuBar Component ---
const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) return null;

    const isActive = (type: string, opts?: any) => editor.isActive(type, opts) ? 'primary' : 'default';
    const bgActive = (type: string, opts?: any) => editor.isActive(type, opts) ? '#eff6ff' : 'transparent';

    return (
        <Stack direction="row" spacing={0.5} sx={{ borderBottom: '1px solid #e2e8f0', p: 1, bgcolor: '#f8fafc' }}>
            <IconButton size="small" onClick={() => editor.chain().focus().toggleBold().run()} color={isActive('bold')} sx={{ bgcolor: bgActive('bold') }}><FormatBoldIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={() => editor.chain().focus().toggleItalic().run()} color={isActive('italic')} sx={{ bgcolor: bgActive('italic') }}><FormatItalicIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={() => editor.chain().focus().toggleUnderline().run()} color={isActive('underline')} sx={{ bgcolor: bgActive('underline') }}><FormatUnderlinedIcon fontSize="small" /></IconButton>
            <Divider orientation="vertical" flexItem sx={{ mx: 1, borderColor: '#cbd5e1' }} />
            <IconButton size="small" onClick={() => editor.chain().focus().toggleBulletList().run()} color={isActive('bulletList')} sx={{ bgcolor: bgActive('bulletList') }}><FormatListBulletedIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={() => editor.chain().focus().toggleOrderedList().run()} color={isActive('orderedList')} sx={{ bgcolor: bgActive('orderedList') }}><FormatListNumberedIcon fontSize="small" /></IconButton>
        </Stack>
    );
};

// --- TiptapEditor Component ---
const TiptapEditor = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const editor = useEditor({
        extensions: [StarterKit, Underline],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: { class: 'focus:outline-none' },
        },
        immediatelyRender: false
    });

    useEffect(() => {
        if (!editor) return;
        if (value !== editor.getHTML()) {
            const isEditorEmpty = editor.getText().trim() === '' && editor.getHTML() === '<p></p>';
            const isValueEmpty = value === '' || value === '<p></p>';
            if (isEditorEmpty && isValueEmpty) return;
            setTimeout(() => { if (!editor.isDestroyed) editor.commands.setContent(value); }, 0);
        }
    }, [value, editor]);

    return (
        <Box sx={{
            border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden', bgcolor: '#fff',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            '&:hover': { borderColor: '#94a3b8' },
            '&:focus-within': { borderColor: '#3140BF', boxShadow: '0 0 0 3px rgba(49, 64, 191, 0.1)' },
            '& .ProseMirror': {
                minHeight: '150px', padding: '16px', outline: 'none', fontSize: '0.95rem', lineHeight: 1.6, color: '#334155',
                '& p': { margin: '0 0 10px 0' },
                '& ul': { listStyleType: 'disc', paddingLeft: '24px', margin: '10px 0' },
                '& ol': { listStyleType: 'decimal', paddingLeft: '24px', margin: '10px 0' },
                '& li': { marginBottom: '4px', '& p': { margin: 0 } }
            }
        }}>
            <MenuBar editor={editor} />
            <EditorContent editor={editor} />
        </Box>
    );
};

// --- Main Component ---
export default function StepAgendaCommon({ agendaNumber, onDataChange, defaultData = null }: Props) {
    const [subAgendas, setSubAgendas] = useState<{ id: number; detail: string }[]>([{ id: 1, detail: '' }]);
    const [files, setFiles] = useState<FileData[]>([]);
    const [uploading, setUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const lastSentRef = useRef<string | null>(null);
    const onDataChangeRef = useRef(onDataChange);
    const isInitializedRef = useRef(false);

    onDataChangeRef.current = onDataChange;

    useEffect(() => {
        const incomingDataStr = JSON.stringify({
            agendaNo: agendaNumber,
            subAgendas: defaultData?.subAgendas ?? [],
            attachedFiles: defaultData?.attachedFiles ?? [],
        });

        if (lastSentRef.current === incomingDataStr) return;

        isInitializedRef.current = false;
        if (!defaultData) {
            setSubAgendas([{ id: 1, detail: '' }]);
            setFiles([]);
            lastSentRef.current = null;
            isInitializedRef.current = true;
            return;
        }

        const mapped = (defaultData.subAgendas ?? []).map((s) => ({ id: s.subAgendaNo, detail: s.detail }));
        setSubAgendas(mapped.length ? mapped : [{ id: 1, detail: '' }]);
        setFiles(defaultData.attachedFiles ?? []);
        lastSentRef.current = incomingDataStr;
        isInitializedRef.current = true;
    }, [agendaNumber, defaultData]);

    useEffect(() => {
        if (!isInitializedRef.current) return;
        const payload: AgendaItem = {
            agendaNo: agendaNumber,
            subAgendas: subAgendas.map((s) => ({ subAgendaNo: s.id, detail: s.detail })),
            attachedFiles: files,
        };
        const str = JSON.stringify(payload);
        if (lastSentRef.current !== str) {
            lastSentRef.current = str;
            onDataChangeRef.current(payload);
        }
    }, [subAgendas, files, agendaNumber]);

    const handleAddSubAgenda = () => {
        setSubAgendas((prev) => {
            const nextId = prev.length ? Math.max(...prev.map((p) => p.id)) + 1 : 1;
            return [...prev, { id: nextId, detail: '' }];
        });
    };

    const handleRemoveSubAgenda = (id: number) => {
        setSubAgendas((prev) => (prev.length <= 1 ? [{ id: 1, detail: '' }] : prev.filter((p) => p.id !== id)));
    };

    const handleDetailChange = (id: number, content: string) => {
        setSubAgendas((prev) => prev.map((p) => (p.id === id ? { ...p, detail: content } : p)));
    };

    const handleFileClick = () => fileInputRef.current?.click();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const selectedFiles = Array.from(e.target.files);
        const validFiles: File[] = [];

        for (const file of selectedFiles) {
            if (file.type !== 'application/pdf') {
                alert(`ไฟล์ "${file.name}" ไม่ได้รับอนุญาต (ต้องเป็นไฟล์ .pdf เท่านั้น)`);
                continue;
            }
            if (file.size > MAX_FILE_SIZE) {
                alert(`ไฟล์ "${file.name}" มีขนาดใหญ่เกิน 10 MB`);
                continue;
            }
            validFiles.push(file);
        }

        if (validFiles.length === 0) {
            if (e.target) e.target.value = '';
            return;
        }

        setUploading(true);
        const newUploadedFiles: FileData[] = [];
        try {
            await Promise.all(validFiles.map(async (file) => {
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch('http://localhost:8080/api/upload', { method: 'POST', body: formData });
                if (!res.ok) throw new Error(`Upload failed for ${file.name}`);
                const data = await res.json();
                newUploadedFiles.push({ name: file.name, url: data.url });
            }));
            setFiles((prev) => [...prev, ...newUploadedFiles]);
        } catch (error) {
            console.error('Error uploading files:', error);
            alert('บางไฟล์อัปโหลดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
        } finally {
            setUploading(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleRemoveFile = (indexToRemove: number) => {
        setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
    };

    return (
        <Box sx={{ maxWidth: '100%', mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>

            {/* Header Section */}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                    <Typography variant="h6" fontWeight={800} color="#1e293b">วาระที่ {agendaNumber}</Typography>
                    <Typography variant="body2" color="text.secondary">กรอกรายละเอียดวาระการประชุมและแนบไฟล์ประกอบ</Typography>
                </Box>
                <Button
                    onClick={handleAddSubAgenda}
                    variant="outlined"
                    startIcon={<AddIcon />}
                    sx={{
                        borderRadius: 2, textTransform: 'none', fontWeight: 600,
                        borderColor: '#3140BF', color: '#3140BF',
                        '&:hover': { bgcolor: '#eff6ff', borderColor: '#1e3a8a' }
                    }}
                >
                    เพิ่มวาระย่อย
                </Button>
            </Stack>

            {/* Sub Agendas List */}
            <Stack spacing={3}>
                {subAgendas.map((subAgenda, index) => (
                    <Paper
                        key={subAgenda.id}
                        elevation={0}
                        sx={{
                            p: 0, borderRadius: 3, border: '1px solid #e2e8f0',
                            overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
                        }}
                    >
                        <Box sx={{ px: 3, py: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1" fontWeight={700} color="#334155">
                                วาระที่ {agendaNumber}.{index + 1}
                            </Typography>
                            {subAgendas.length > 1 && (
                                <Tooltip title="ลบวาระย่อยนี้">
                                    <IconButton size="small" onClick={() => handleRemoveSubAgenda(subAgenda.id)} sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444', bgcolor: '#fee2e2' } }}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                        <Box sx={{ p: 3 }}>
                            <Typography variant="body2" fontWeight={600} color="#475569" mb={1}>
                                รายละเอียด <span style={{ color: '#ef4444' }}>*</span>
                            </Typography>
                            <TiptapEditor
                                value={subAgenda.detail}
                                onChange={(val) => handleDetailChange(subAgenda.id, val)}
                            />
                        </Box>
                    </Paper>
                ))}
            </Stack>

            {/* File Upload Section */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#fff' }}>
                <Typography variant="subtitle1" fontWeight={700} color="#1e293b" mb={2}>เอกสารแนบ</Typography>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" mb={3}>
                    <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} accept=".pdf" multiple />
                    <Button
                        onClick={handleFileClick}
                        disabled={uploading}
                        variant="contained"
                        disableElevation
                        startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                        sx={{
                            borderRadius: 2, bgcolor: '#3140BF', textTransform: 'none', px: 3, py: 1.2, fontWeight: 600,
                            '&:hover': { bgcolor: '#1e3a8a' }
                        }}
                    >
                        {uploading ? 'กำลังอัปโหลด...' : 'เลือกไฟล์เอกสาร'}
                    </Button>
                    <Typography variant="body2" color="text.secondary">
                        รองรับไฟล์ .pdf ขนาดไม่เกิน 10 MB
                    </Typography>
                </Stack>

                {files.length > 0 ? (
                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#64748b', width: '10%' }}>ลำดับ</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#64748b', width: '75%' }}>ชื่อไฟล์</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', color: '#64748b', width: '15%' }}>จัดการ</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {files.map((file, index) => (
                                    <TableRow key={index} hover>
                                        <TableCell sx={{ color: '#334155' }}>{index + 1}</TableCell>
                                        <TableCell>
                                            <Stack direction="row" alignItems="center" spacing={1.5}>
                                                <Typography
                                                    component="a"
                                                    href={`http://localhost:8080${file.url}`}
                                                    target="_blank"
                                                    variant="body2"
                                                    fontWeight={500}
                                                    color="#3140BF"
                                                    sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                                                >
                                                    {file.name}
                                                </Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="ลบไฟล์">
                                                <IconButton size="small" onClick={() => handleRemoveFile(index)} sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fee2e2' } }}>
                                                    <DeleteOutlineIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Box sx={{ p: 4, textAlign: 'center', border: '1px dashed #e2e8f0', borderRadius: 2, bgcolor: '#f8fafc' }}>
                        <DescriptionIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">ยังไม่มีเอกสารแนบ</Typography>
                    </Box>
                )}
            </Paper>
        </Box>
    );
}