'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Paper, Typography, Box, Stack, Button, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import { CircularProgress } from '@mui/material';

// --- Tiptap Import ---
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';

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

    return (
        <Stack direction="row" spacing={0.5} sx={{ borderBottom: '1px solid #cbd5e1', p: 1, bgcolor: '#f8fafc' }}>
            <IconButton size="small" onClick={() => editor.chain().focus().toggleBold().run()} color={editor.isActive('bold') ? 'primary' : 'default'} sx={{ bgcolor: editor.isActive('bold') ? '#eff6ff' : 'transparent' }}><FormatBoldIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={() => editor.chain().focus().toggleItalic().run()} color={editor.isActive('italic') ? 'primary' : 'default'} sx={{ bgcolor: editor.isActive('italic') ? '#eff6ff' : 'transparent' }}><FormatItalicIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={() => editor.chain().focus().toggleUnderline().run()} color={editor.isActive('underline') ? 'primary' : 'default'} sx={{ bgcolor: editor.isActive('underline') ? '#eff6ff' : 'transparent' }}><FormatUnderlinedIcon fontSize="small" /></IconButton>
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            <IconButton size="small" onClick={() => editor.chain().focus().toggleBulletList().run()} color={editor.isActive('bulletList') ? 'primary' : 'default'} sx={{ bgcolor: editor.isActive('bulletList') ? '#eff6ff' : 'transparent' }}><FormatListBulletedIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={() => editor.chain().focus().toggleOrderedList().run()} color={editor.isActive('orderedList') ? 'primary' : 'default'} sx={{ bgcolor: editor.isActive('orderedList') ? '#eff6ff' : 'transparent' }}><FormatListNumberedIcon fontSize="small" /></IconButton>
        </Stack>
    );
};

// --- TiptapEditor Component (ปรับปรุง CSS) ---
const TiptapEditor = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const editor = useEditor({
        extensions: [StarterKit, Underline],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                // เอา Style inline ออก แล้วไปใช้ sx แทนเพื่อให้จัดการง่ายกว่า
                class: 'focus:outline-none',
            },
        },
        immediatelyRender: false
    });

    useEffect(() => {
        if (!editor) return;
        if (value !== editor.getHTML()) {
            const isEditorEmpty = editor.getText().trim() === '' && editor.getHTML() === '<p></p>';
            const isValueEmpty = value === '' || value === '<p></p>';
            if (isEditorEmpty && isValueEmpty) return;
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    return (
        <Box sx={{
            border: '1px solid #cbd5e1',
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: '#fff',
            '&:hover': { borderColor: '#94a3b8' },
            '&:focus-within': { borderColor: '#3140BF', borderWidth: '1px' },

            // ✅ เพิ่ม CSS สำหรับจัดรูปแบบ Text Editor โดยเฉพาะ
            '& .ProseMirror': {
                minHeight: '150px',
                padding: '16px',
                outline: 'none',
                fontSize: '1rem',
                lineHeight: 1.6,
                color: '#334155',

                // จัดการย่อหน้า
                '& p': { margin: '0 0 10px 0' },

                // จัดการ List (Bullet & Number)
                '& ul': {
                    listStyleType: 'disc',
                    paddingLeft: '24px',
                    margin: '10px 0'
                },
                '& ol': {
                    listStyleType: 'decimal',
                    paddingLeft: '24px',
                    margin: '10px 0'
                },
                '& li': {
                    marginBottom: '4px',
                    '& p': { margin: 0 } // ป้องกัน p ซ้อนใน li ดันบรรทัดห่างเกินไป
                },

                // จัดการ Heading (เผื่อมี)
                '& h1': { fontSize: '1.5em', fontWeight: 'bold', margin: '0.67em 0' },
                '& h2': { fontSize: '1.25em', fontWeight: 'bold', margin: '0.5em 0' },

                // จัดการ Quote (เผื่อใช้)
                '& blockquote': {
                    borderLeft: '4px solid #cbd5e1',
                    paddingLeft: '16px',
                    color: '#64748b',
                    fontStyle: 'italic',
                    margin: '10px 0'
                }
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

        if (lastSentRef.current === incomingDataStr) {
            return;
        }

        isInitializedRef.current = false;

        if (!defaultData) {
            setSubAgendas([{ id: 1, detail: '' }]);
            setFiles([]);
            lastSentRef.current = null;
            isInitializedRef.current = true;
            return;
        }

        const mapped = (defaultData.subAgendas ?? []).map((s) => ({
            id: s.subAgendaNo,
            detail: s.detail
        }));

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
        <Box sx={{ maxWidth: '100%', mx: 'auto' }}>
            <Paper sx={{ borderRadius: 3, mb: 1, boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}>
                <Box sx={{ px: 3, py: 1.5 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" spacing={2}>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: '#1e293b' }}>
                            วาระที่ {agendaNumber}
                        </Typography>
                        <Button onClick={handleAddSubAgenda} variant="outlined" startIcon={<AddIcon />} sx={{ textTransform: 'none', borderRadius: 2, borderColor: '#3140BF', color: '#3140BF', fontWeight: 600, bgcolor: '#fff', '&:hover': { backgroundColor: '#eff6ff', borderColor: '#1e3a8a' } }}>
                            เพิ่มวาระย่อย
                        </Button>
                    </Stack>
                </Box>

                {subAgendas.map((subAgenda, index) => (
                    <Box key={subAgenda.id} sx={{ px: 3, mb: 1 }}>
                        <Paper elevation={0} variant="outlined" sx={{ borderRadius: 3, borderColor: '#cbd5e1', overflow: 'hidden' }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', px: 3, py: 2 }}>
                                <Typography fontWeight="bold" variant="subtitle1" color="#334155">
                                    วาระที่ {agendaNumber}.{index + 1}
                                </Typography>
                                {subAgendas.length > 1 && (
                                    <Tooltip title="ลบวาระย่อยนี้">
                                        <IconButton size="small" onClick={() => handleRemoveSubAgenda(subAgenda.id)} sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444', bgcolor: '#fee2e2' } }}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Stack>

                            <Box sx={{ p: 3 }}>
                                <Stack spacing={1}>
                                    <Typography variant="body2" fontWeight="600" color="#475569">
                                        รายละเอียด <span style={{ color: 'red' }}>*</span>
                                    </Typography>
                                    <TiptapEditor
                                        value={subAgenda.detail}
                                        onChange={(val) => handleDetailChange(subAgenda.id, val)}
                                    />
                                </Stack>
                            </Box>
                        </Paper>
                    </Box>
                ))}

                <Box sx={{ px: 3, py: 1 }}>
                    <Stack spacing={1}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2" fontWeight="600" color="#475569">เอกสารแนบ</Typography>
                            <Typography variant="caption" color="text.secondary">(เฉพาะไฟล์ .pdf ขนาดไม่เกิน 10 MB)</Typography>
                        </Stack>
                        <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} accept=".pdf" multiple />
                        <Stack direction="row" spacing={0}>
                            <Box onClick={!uploading ? handleFileClick : undefined} sx={{ flex: 1, border: '1px solid #cbd5e1', borderRight: 'none', borderRadius: '8px 0 0 8px', display: 'flex', alignItems: 'center', px: 2, py: 1, cursor: uploading ? 'wait' : 'pointer', bgcolor: '#fff', color: '#64748b', transition: 'all 0.2s', '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' } }}>
                                <Typography variant="body2" noWrap>
                                    {uploading ? 'กำลังอัปโหลด...' : `แนบไฟล์แล้ว ${files.length} รายการ (คลิกเพื่อเพิ่ม)`}
                                </Typography>
                            </Box>
                            <Button onClick={handleFileClick} disabled={uploading} variant="contained" disableElevation startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />} sx={{ borderRadius: '0 8px 8px 0', bgcolor: '#3140BF', textTransform: 'none', px: 3, fontWeight: 600, '&:hover': { bgcolor: '#1e3a8a' } }}>
                                เลือกไฟล์
                            </Button>
                        </Stack>
                    </Stack>
                </Box>

                <Box sx={{ px: 3, py: 1 }}>
                    <TableContainer sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                        <Table>
                            <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#475569', width: '10%', py: 1.5 }}>ลำดับ</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#475569', width: '75%', py: 1.5 }}>ชื่อไฟล์แนบ</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569', width: '15%', py: 1.5 }}>จัดการ</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {files.length > 0 ? (
                                    files.map((file, index) => (
                                        <TableRow key={index} hover>
                                            <TableCell sx={{ color: '#334155' }}>{index + 1}</TableCell>
                                            <TableCell>
                                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                                    <Box sx={{ p: 0.5, borderRadius: 1, bgcolor: '#eff6ff', color: '#3140BF', display: 'flex' }}><AttachFileIcon fontSize="small" /></Box>
                                                    <Typography variant="body2" fontWeight={500} color="#3140BF" component="a" href={`http://localhost:8080${file.url}`} target="_blank" rel="noopener noreferrer" sx={{ textDecoration: 'underline', cursor: 'pointer' }}>
                                                        {file.name}
                                                    </Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Tooltip title="ลบไฟล์">
                                                    <IconButton size="small" onClick={() => handleRemoveFile(index)} sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fee2e2' } }}><DeleteOutlineIcon fontSize="small" /></IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} align="center" sx={{ py: 3, color: '#94a3b8' }}>ยังไม่มีเอกสารแนบ</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </Paper>
        </Box>
    );
}