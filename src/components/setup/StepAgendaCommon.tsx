'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Paper,
    Typography,
    Box,
    TextField,
    Stack,
    Button,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DeleteIcon from '@mui/icons-material/Delete';

type AgendaItem = {
    agendaNo: number;
    subAgendas?: { subAgendaNo: number; detail: string }[];
    attachedFile?: string;
    [key: string]: any;
};

type StepAgendaCommonProps = {
    agendaNumber: number;
    onDataChange: (data: AgendaItem) => void;
    defaultData?: AgendaItem | null;  // รองรับ null ด้วย
};

export default function StepAgendaCommon({
    agendaNumber,
    onDataChange,
    defaultData = null,
}: StepAgendaCommonProps) {
    const [subAgendas, setSubAgendas] = useState<{ id: number; detail: string }[]>([
        { id: 1, detail: '' },
    ]);
    const [fileName, setFileName] = useState<string>('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    // เก็บข้อมูลล่าสุดที่แจ้ง onDataChange
    const lastDataRef = useRef<AgendaItem | null>(null);

    // เก็บ defaultData ก่อนหน้าเพื่อเช็คการเปลี่ยนแปลง
    const prevDefaultDataRef = useRef<AgendaItem | null>(null);

    // รีเซ็ตข้อมูลเมื่อ defaultData หรือ agendaNumber เปลี่ยน (เช็คความเปลี่ยนแปลง)
    useEffect(() => {
        const isSameData = JSON.stringify(prevDefaultDataRef.current) === JSON.stringify(defaultData);
        if (isSameData) return;

        prevDefaultDataRef.current = defaultData;

        if (!defaultData) {
            setSubAgendas([{ id: 1, detail: '' }]);
            setFileName('');
            lastDataRef.current = null; // รีเซ็ต
            return;
        }

        const newSubAgendas =
            defaultData.subAgendas?.map((sub) => ({
                id: sub.subAgendaNo,
                detail: sub.detail,
            })) || [{ id: 1, detail: '' }];

        setSubAgendas(newSubAgendas);
        setFileName(defaultData.attachedFile || '');

        lastDataRef.current = {
            agendaNo: agendaNumber,
            subAgendas: defaultData.subAgendas || [],
            attachedFile: defaultData.attachedFile || '',
        };
    }, [defaultData, agendaNumber]);

    // แจ้งข้อมูลกลับพ่อแม่เมื่อ subAgendas หรือ fileName เปลี่ยน (เช็คความเปลี่ยนแปลง)
    useEffect(() => {
        const subAgendasMapped = subAgendas.map((item) => ({
            subAgendaNo: item.id,
            detail: item.detail,
        }));

        const newData: AgendaItem = {
            agendaNo: agendaNumber,
            subAgendas: subAgendasMapped,
            attachedFile: fileName,
        };

        // ฟังก์ชันเช็คความเท่ากันแบบง่าย (เทียบ agendaNo, attachedFile, subAgendas)
        function isDataEqual(a: AgendaItem | null, b: AgendaItem): boolean {
            if (!a) return false;
            if (a.agendaNo !== b.agendaNo) return false;
            if (a.attachedFile !== b.attachedFile) return false;
            if (!a.subAgendas || !b.subAgendas) return false;
            if (a.subAgendas.length !== b.subAgendas.length) return false;
            for (let i = 0; i < a.subAgendas.length; i++) {
                if (
                    a.subAgendas[i].subAgendaNo !== b.subAgendas[i].subAgendaNo ||
                    a.subAgendas[i].detail !== b.subAgendas[i].detail
                )
                    return false;
            }
            return true;
        }

        if (!isDataEqual(lastDataRef.current, newData)) {
            lastDataRef.current = newData;
            onDataChange(newData);
        }
    }, [subAgendas, fileName, agendaNumber, onDataChange]);

    const handleAddSubAgenda = () => {
        setSubAgendas((prev) => {
            const newId = prev.length > 0 ? Math.max(...prev.map((item) => item.id)) + 1 : 1;
            return [...prev, { id: newId, detail: '' }];
        });
    };

    const handleRemoveSubAgenda = (idToRemove: number) => {
        setSubAgendas((prev) => prev.filter((item) => item.id !== idToRemove));
    };

    const handleFileClick = () => fileInputRef.current?.click();

    const handleDetailChange = (id: number, value: string) => {
        setSubAgendas((prev) =>
            prev.map((item) => (item.id === id ? { ...item, detail: value } : item))
        );
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setFileName(file.name);
        }
        // รีเซ็ตค่า input ไฟล์ เพื่อให้สามารถอัพโหลดไฟล์เดิมซ้ำได้
        if (event.target) event.target.value = '';
    };

    const handleRemoveFile = () => {
        setFileName('');
    };

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
                        <Typography variant="body2" fontWeight="600" color="#475569">
                            เอกสารแนบ
                        </Typography>
                        <input
                            type="file"
                            hidden
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".pdf,.jpg,.jpeg,.png"
                        />
                        <Stack direction="row" spacing={0}>
                            <Box
                                onClick={handleFileClick}
                                sx={{
                                    flex: 1,
                                    border: '1px solid #cbd5e1',
                                    borderRight: 'none',
                                    borderRadius: '8px 0 0 8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    px: 2,
                                    py: 1,
                                    cursor: 'pointer',
                                    bgcolor: '#fff',
                                    color: '#64748b',
                                    transition: 'all 0.2s',
                                    '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' },
                                }}
                            >
                                <Typography variant="body2" noWrap>
                                    {fileName ? `ไฟล์ที่เลือก: ${fileName}` : 'คลิกเพื่อเลือกไฟล์ .pdf หรือ .jpg'}
                                </Typography>
                            </Box>
                            <Button
                                onClick={handleFileClick}
                                variant="contained"
                                disableElevation
                                startIcon={<CloudUploadIcon />}
                                sx={{
                                    borderRadius: '0 8px 8px 0',
                                    bgcolor: '#3140BF',
                                    textTransform: 'none',
                                    px: 3,
                                    fontWeight: 600,
                                    '&:hover': { bgcolor: '#1e3a8a' },
                                }}
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
                                                <Box
                                                    sx={{
                                                        p: 0.5,
                                                        borderRadius: 1,
                                                        bgcolor: '#eff6ff',
                                                        color: '#3140BF',
                                                        display: 'flex',
                                                    }}
                                                >
                                                    <AttachFileIcon fontSize="small" />
                                                </Box>
                                                <Typography variant="body2" fontWeight={500} color="#334155">
                                                    {fileName}
                                                </Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="ลบไฟล์">
                                                <IconButton
                                                    size="small"
                                                    onClick={handleRemoveFile}
                                                    sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fee2e2' } }}
                                                >
                                                    <DeleteOutlineIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} align="center" sx={{ py: 3, color: '#94a3b8' }}>
                                            ยังไม่มีเอกสารแนบ
                                        </TableCell>
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