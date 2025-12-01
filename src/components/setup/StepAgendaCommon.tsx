'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Paper, Typography, Box, TextField, Stack, Button, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import { CircularProgress } from '@mui/material';

export type AgendaItem = {
    agendaNo: number;
    subAgendas?: { subAgendaNo: number; detail: string }[];
    attachedFile?: string;
    [key: string]: any;
};

type Props = {
    agendaNumber: number;
    onDataChange: (data: AgendaItem | null) => void;
    defaultData?: AgendaItem | null;
};

export default function StepAgendaCommon({ agendaNumber, onDataChange, defaultData = null }: Props) {
    const [subAgendas, setSubAgendas] = useState<{ id: number; detail: string }[]>([{ id: 1, detail: '' }]);
    const [fileName, setFileName] = useState<string>('');
    const [uploading, setUploading] = useState(false);

    const fileInputRef = React.useRef<HTMLInputElement | null>(null);
    const lastSentRef = useRef<string | null>(null);
    const onDataChangeRef = useRef(onDataChange);
    const isInitializedRef = useRef(false);

    // Update ref on every render (no useEffect needed)
    onDataChangeRef.current = onDataChange;

    // Initialize from defaultData (runs only once or when agendaNumber changes)
    useEffect(() => {
        isInitializedRef.current = false;

        if (!defaultData) {
            setSubAgendas([{ id: 1, detail: '' }]);
            setFileName('');
            lastSentRef.current = null;
            isInitializedRef.current = true;
            return;
        }

        const mapped = (defaultData.subAgendas ?? []).map((s) => ({ id: s.subAgendaNo, detail: s.detail }));
        setSubAgendas(mapped.length ? mapped : [{ id: 1, detail: '' }]);
        setFileName(defaultData.attachedFile ?? '');

        const newDataStr = JSON.stringify({
            agendaNo: agendaNumber,
            subAgendas: defaultData.subAgendas ?? [],
            attachedFile: defaultData.attachedFile ?? '',
        });

        lastSentRef.current = newDataStr;
        isInitializedRef.current = true;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [agendaNumber]); // Only re-run when agendaNumber changes

    // Send updates when user modifies data
    useEffect(() => {
        if (!isInitializedRef.current) return;

        const payload: AgendaItem = {
            agendaNo: agendaNumber,
            subAgendas: subAgendas.map((s) => ({ subAgendaNo: s.id, detail: s.detail })),
            attachedFile: fileName || undefined,
        };

        const str = JSON.stringify(payload);
        if (lastSentRef.current !== str) {
            lastSentRef.current = str;
            onDataChangeRef.current(payload);
        }
    }, [subAgendas, fileName, agendaNumber]);

    const handleAddSubAgenda = () => {
        setSubAgendas((prev) => {
            const nextId = prev.length ? Math.max(...prev.map((p) => p.id)) + 1 : 1;
            return [...prev, { id: nextId, detail: '' }];
        });
    };

    const handleRemoveSubAgenda = (id: number) => {
        setSubAgendas((prev) => (prev.length <= 1 ? [{ id: 1, detail: '' }] : prev.filter((p) => p.id !== id)));
    };

    const handleDetailChange = (id: number, v: string) => {
        setSubAgendas((prev) => prev.map((p) => (p.id === id ? { ...p, detail: v } : p)));
    };

    const handleFileClick = () => fileInputRef.current?.click();
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 1. เริ่มอัปโหลด
        setUploading(true);

        try {
            // สร้าง FormData เพื่อส่งไฟล์
            const formData = new FormData();
            formData.append('file', file);

            // 2. ยิง API Upload ไปที่ Backend
            const res = await fetch('http://localhost:8080/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            // data.url คือ Path ที่ Backend ส่งกลับมา (เช่น /uploads/uuid.pdf)

            // 3. เก็บ Path นั้นลงใน State (แทนชื่อไฟล์เฉยๆ)
            setFileName(data.url);

        } catch (error) {
            console.error('Error uploading file:', error);
            alert('อัปโหลดไฟล์ไม่สำเร็จ');
        } finally {
            setUploading(false);
            if (e.target) e.target.value = ''; // Reset input
        }
    };

    const handleRemoveFile = () => setFileName('');

    return (
        <Box sx={{ maxWidth: '100%', mx: 'auto' }}>
            {/* --- Header Section --- */}
            <Paper sx={{ borderRadius: 3, mb: 1, boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}>
                <Box sx={{ px: 3, py: 1.5 }}>
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        alignItems="center"
                        justifyContent="space-between"
                        spacing={2}
                    >
                        <Typography variant="h6" fontWeight="bold" sx={{ color: '#1e293b' }}>
                            วาระที่ {agendaNumber}
                        </Typography>
                        <Button
                            onClick={handleAddSubAgenda}
                            variant="outlined"
                            startIcon={<AddIcon />}
                            size="medium"
                            sx={{
                                textTransform: 'none',
                                borderRadius: 2,
                                borderColor: '#3140BF',
                                color: '#3140BF',
                                fontWeight: 600,
                                bgcolor: '#fff',
                                '&:hover': { backgroundColor: '#eff6ff', borderColor: '#1e3a8a' },
                            }}
                        >
                            เพิ่มวาระย่อย
                        </Button>
                    </Stack>
                </Box>

                {/* --- Sub-Agenda Loop --- */}
                {subAgendas.map((subAgenda, index) => (
                    <Box key={subAgenda.id} sx={{ px: 3, mb: 1 }}>
                        <Paper
                            elevation={0}
                            variant="outlined"
                            sx={{ borderRadius: 3, borderColor: '#cbd5e1', overflow: 'hidden' }}
                        >
                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', px: 3, py: 2 }}
                            >
                                <Typography fontWeight="bold" variant="subtitle1" color="#334155">
                                    วาระที่ {agendaNumber}.{index + 1}
                                </Typography>
                                {subAgendas.length > 1 && (
                                    <Tooltip title="ลบวาระย่อยนี้">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleRemoveSubAgenda(subAgenda.id)}
                                            sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444', bgcolor: '#fee2e2' } }}
                                        >
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
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        placeholder="ระบุรายละเอียดของวาระการประชุม..."
                                        value={subAgenda.detail}
                                        onChange={(e) => handleDetailChange(subAgenda.id, e.target.value)} // ✅ Bind State
                                        sx={{
                                            bgcolor: '#fff',
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                '& fieldset': { borderColor: '#cbd5e1' },
                                                '&:hover fieldset': { borderColor: '#94a3b8' },
                                                '&.Mui-focused fieldset': { borderColor: '#3140BF' },
                                            },
                                        }}
                                    />
                                </Stack>
                            </Box>
                        </Paper>
                    </Box>
                ))}

                {/* --- File Upload Section --- */}
                <Box sx={{ px: 3, py: 1 }}>
                    <Stack spacing={1}>
                        <Typography variant="body2" fontWeight="600" color="#475569">เอกสารแนบ</Typography>
                        <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />

                        <Stack direction="row" spacing={0}>
                            <Box onClick={!uploading ? handleFileClick : undefined} sx={{ flex: 1, border: '1px solid #cbd5e1', borderRight: 'none', borderRadius: '8px 0 0 8px', display: 'flex', alignItems: 'center', px: 2, py: 1, cursor: uploading ? 'wait' : 'pointer', bgcolor: '#fff', color: '#64748b', transition: 'all 0.2s', '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' } }}>
                                <Typography variant="body2" noWrap>
                                    {/* แสดง URL หรือข้อความ Loading */}
                                    {uploading ? 'กำลังอัปโหลด...' : (fileName ? `อัปโหลดแล้ว: ${fileName.split('/').pop()}` : 'คลิกเพื่อเลือกไฟล์ .pdf หรือ .jpg')}
                                </Typography>
                            </Box>

                            <Button
                                onClick={handleFileClick}
                                disabled={uploading} // ห้ามกดซ้ำตอนโหลด
                                variant="contained"
                                disableElevation
                                startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                                sx={{ borderRadius: '0 8px 8px 0', bgcolor: '#3140BF', textTransform: 'none', px: 3, fontWeight: 600, '&:hover': { bgcolor: '#1e3a8a' } }}
                            >
                                เลือกไฟล์
                            </Button>
                        </Stack>
                    </Stack>
                </Box>

                {/* --- Table Section --- */}
                <Box sx={{ px: 3, py: 1 }}>
                    <TableContainer sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                        <Table>
                            <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#475569', width: '10%', py: 1.5 }}>
                                        ลำดับ
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#475569', width: '75%', py: 1.5 }}>
                                        ชื่อไฟล์แนบ
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        sx={{ fontWeight: 'bold', color: '#475569', width: '15%', py: 1.5 }}
                                    >
                                        จัดการ
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {fileName ? (
                                    <TableRow hover>
                                        <TableCell sx={{ color: '#334155' }}>1</TableCell>
                                        <TableCell>
                                            <Stack direction="row" alignItems="center" spacing={1.5}>
                                                <Box sx={{ p: 0.5, borderRadius: 1, bgcolor: '#eff6ff', color: '#3140BF', display: 'flex' }}><AttachFileIcon fontSize="small" /></Box>

                                                {/* ทำเป็น Link ให้กดเปิดไฟล์ได้ */}
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={500}
                                                    color="#3140BF"
                                                    component="a"
                                                    href={`http://localhost:8080${fileName}`} // Link ไปหาไฟล์ที่ Server
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    sx={{ textDecoration: 'underline', cursor: 'pointer' }}
                                                >
                                                    {/* ตัด /uploads/ ออก ให้เหลือแค่ชื่อไฟล์ตอนแสดงผล (หรือจะแสดงเต็มก็ได้) */}
                                                    {fileName.split('/').pop()}
                                                </Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="ลบไฟล์">
                                                <IconButton size="small" onClick={handleRemoveFile} sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fee2e2' } }}><DeleteOutlineIcon fontSize="small" /></IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
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