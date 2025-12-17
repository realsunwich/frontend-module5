'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    CircularProgress, Box, Typography, IconButton, Tooltip, Alert,
    Fade, Paper, Divider, Chip, Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions, Button
} from '@mui/material';
import {
    Save as SaveIcon,
    Refresh as RefreshIcon,
    Close as CloseIcon,
    Edit as EditIcon,
    CheckCircle as CheckCircleIcon,
    Tune as TuneIcon
} from '@mui/icons-material';

// Import Component PDF
import EbookPdfDocument from './EbookPdfDocument';

// Import PDFViewer แบบ Dynamic
const PDFViewer = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFViewer),
    {
        ssr: false,
        loading: () => (
            <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1 }}>
                <CircularProgress size={30} sx={{ color: '#fff' }} />
                <Typography sx={{ color: '#fff', fontSize: '0.8rem' }}>โหลด PDF...</Typography>
            </Box>
        ),
    }
);

// --- Helpers ---
const safeJsonParse = (data: any, fallback: any) => {
    if (typeof data === 'object' && data !== null) return data;
    try {
        return JSON.parse(data);
    } catch {
        return fallback;
    }
};

type RangeInputProps = {
    label: string;
    val: number;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    defaultVal?: number;
    color?: string;
    onChange: (value: string) => void;
};

// Helper function to get meeting type info
const getMeetingTypeInfo = (typeCode: string) => {
    switch (typeCode) {
        case '001':
            return { name: 'การประชุมคณะอนุกรรมการ', path: 'subCommittee', color: '#3140BF' };
        case '002':
            return { name: 'การประชุมตรวจสอบทรัพย์สิน', path: 'AssetsCheck', color: '#d97706' };
        case '003':
            return { name: 'การประชุมทรัพย์สินล้านขึ้นไป', path: 'MillionAssets', color: '#059669' };
        default:
            return { name: 'การประชุม', path: 'subCommittee', color: '#3140BF' };
    }
};

// Default PDF Config - ค่าเริ่มต้นสำหรับการตั้งค่า PDF
const DEFAULT_PDF_CONFIG = {
    fontSize: 16,
    lineHeight: 1,
    marginTop: 2.5,    // cm
    marginLeft: 2.0,   // cm
    marginRight: 2.0,  // cm
    marginBottom: 2.0, // cm
    sectionTitleIndent: 2.5,
    subHeaderIndent: 2.5,
    subAgendaIndent: 3.0,
    attendeeListIndent: 3.2,
    itemListIndent: 3.2,
    assetListIndent: 3.2,
    resolutionIndent: 2.5,
    sectionSpacing: 0.5,
};

const MeetingEditor = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const meetingId = searchParams.get('id');

    // --- State: Config ---
    const [pdfConfig, setPdfConfig] = useState(DEFAULT_PDF_CONFIG);

    // --- State: Data ---
    const [basicInfo, setBasicInfo] = useState({
        meetingNo: '', meetingTypeCode: '001', meetingDate: '',
        location: '', meetingTime: '', description: '',
        agendaOneData: '', agendaTwoData: '', agendaThreeData: '',
        resolutionDetail: '', resolutionFourData: '', resolutionFiveData: ''
    });

    const [attendees, setAttendees] = useState<any[]>([]);
    const [agenda4Items, setAgenda4Items] = useState<any[]>([]);
    const [agenda4Assets, setAgenda4Assets] = useState<any[]>([]);
    const [agenda5Items, setAgenda5Items] = useState<any[]>([]);
    const [agenda5Assets, setAgenda5Assets] = useState<any[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [pdfData, setPdfData] = useState<any>(null);
    const [isClosing, setIsClosing] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showCloseDialog, setShowCloseDialog] = useState(false);

    // Check if running on client
    useEffect(() => {
        setIsClient(true);
    }, []);

    // --- Fetch Meeting Detail Function ---
    const fetchMeetingDetail = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`http://localhost:8080/api/meetings/${id}`);
            if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลได้');
            const data = await res.json();

            setBasicInfo({
                meetingNo: data.meetingNo || '',
                meetingTypeCode: data.meetingTypeCode || '001',
                meetingDate: data.meetingDate ? data.meetingDate.split('T')[0] : '',
                location: data.location || '',
                meetingTime: data.meetingTime || '',
                description: data.description || '',
                agendaOneData: typeof data.agendaOneData === 'string' ? data.agendaOneData : JSON.stringify(data.agendaOneData || ''),
                agendaTwoData: typeof data.agendaTwoData === 'string' ? data.agendaTwoData : JSON.stringify(data.agendaTwoData || ''),
                agendaThreeData: typeof data.agendaThreeData === 'string' ? data.agendaThreeData : JSON.stringify(data.agendaThreeData || ''),
                resolutionDetail: data.resolutionDetail || '',
                resolutionFourData: data.resolutionFourData || '',
                resolutionFiveData: data.resolutionFiveData || '',
            });

            const memberList = data.attendees || data.members || [];
            setAttendees(memberList.map((m: any) => ({
                prename: m.prename || '', firstname: m.firstname || '', lastname: m.lastname || '', department: m.department || m.affiliation || ''
            })));

            const parsedA4 = safeJsonParse(data.agendaFourData, { items: [], dialogData: [] });
            setAgenda4Items(Array.isArray(parsedA4.items) ? parsedA4.items : []);
            setAgenda4Assets(Array.isArray(parsedA4.dialogData) ? parsedA4.dialogData : []);

            const parsedA5 = safeJsonParse(data.agendaFiveData, { items: [], dialogData: [] });
            setAgenda5Items(Array.isArray(parsedA5.items) ? parsedA5.items : []);
            setAgenda5Assets(Array.isArray(parsedA5.dialogData) ? parsedA5.dialogData : []);

            // โหลด PDF Config ที่บันทึกไว้ หรือใช้ค่า default
            if (data.pdfConfig) {
                try {
                    const savedConfig = JSON.parse(data.pdfConfig);
                    if (savedConfig && typeof savedConfig === 'object') {
                        // ใช้ค่าที่บันทึกไว้ทั้งหมด โดย merge กับ default เพื่อป้องกัน missing fields
                        setPdfConfig({ ...DEFAULT_PDF_CONFIG, ...savedConfig });
                    }
                } catch (e) {
                    console.error("Error parsing saved PDF config:", e);
                    // ถ้า parse ไม่ได้ ให้ใช้ค่า default
                    setPdfConfig(DEFAULT_PDF_CONFIG);
                }
            } else {
                // ถ้าไม่มี config ที่บันทึกไว้ ให้ใช้ค่า default
                setPdfConfig(DEFAULT_PDF_CONFIG);
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (meetingId) {
            fetchMeetingDetail(meetingId);
        }
    }, [meetingId, fetchMeetingDetail]);

    // --- Debounce Logic ---
    useEffect(() => {
        const timer = setTimeout(() => {
            const convertedConfig = {
                fontSize: pdfConfig.fontSize,
                lineHeight: pdfConfig.lineHeight,
                marginTop: pdfConfig.marginTop * 28.346,
                marginLeft: pdfConfig.marginLeft * 28.346,
                marginRight: pdfConfig.marginRight * 28.346,
                marginBottom: pdfConfig.marginBottom * 28.346,
                sectionTitleIndent: pdfConfig.sectionTitleIndent * 28.346,
                subHeaderIndent: pdfConfig.subHeaderIndent * 28.346,
                subAgendaIndent: pdfConfig.subAgendaIndent * 28.346,
                attendeeListIndent: pdfConfig.attendeeListIndent * 28.346,
                itemListIndent: pdfConfig.itemListIndent * 28.346,
                assetListIndent: pdfConfig.assetListIndent * 28.346,
                resolutionIndent: pdfConfig.resolutionIndent * 28.346,
                sectionSpacing: pdfConfig.sectionSpacing * 28.346,
            };

            setPdfData({
                ...basicInfo,
                attendees,
                agendaFourData: JSON.stringify({ items: agenda4Items, dialogData: agenda4Assets }),
                agendaFiveData: JSON.stringify({ items: agenda5Items, dialogData: agenda5Assets }),
                config: convertedConfig
            });

            // ถ้ามีการเปลี่ยนแปลง ให้ตั้งค่า hasUnsavedChanges (ไม่เช็ค pdfData เพื่อหลีกเลี่ยง infinite loop)
            setHasUnsavedChanges(true);
        }, 500);
        return () => clearTimeout(timer);
    }, [basicInfo, attendees, agenda4Items, agenda4Assets, agenda5Items, agenda5Assets, pdfConfig]);

    // --- Handlers ---
    const handleConfig = (key: string, val: string) => setPdfConfig(p => ({ ...p, [key]: Number(val) }));
    const resetToDefault = () => {
        setPdfConfig(DEFAULT_PDF_CONFIG);
    };

    const applyPreset = (preset: string) => {
        if (preset === 'standard') resetToDefault();
        else if (preset === 'compact') setPdfConfig({
            fontSize: 14, lineHeight: 1, marginTop: 2.0, marginLeft: 1.5, marginRight: 1.5, marginBottom: 1.5,
            sectionTitleIndent: 1.5, subHeaderIndent: 1.5, subAgendaIndent: 2.0,
            attendeeListIndent: 2.5, itemListIndent: 2.5, assetListIndent: 2.5,
            resolutionIndent: 1.5, sectionSpacing: 0.3,
        });
        else if (preset === 'expanded') setPdfConfig({
            fontSize: 18, lineHeight: 1.3, marginTop: 3.0, marginLeft: 3.0, marginRight: 3.0, marginBottom: 3.0,
            sectionTitleIndent: 3.5, subHeaderIndent: 3.5, subAgendaIndent: 4.0,
            attendeeListIndent: 4.5, itemListIndent: 4.5, assetListIndent: 4.5,
            resolutionIndent: 3.5, sectionSpacing: 0.8,
        });
    };

    const handleSave = async () => {
        if (!meetingId) return;

        setSaveStatus('saving');
        setError(null);

        try {
            const payload = {
                description: basicInfo.description,
                location: basicInfo.location,

                agendaFourData: JSON.stringify({ items: agenda4Items, dialogData: agenda4Assets }),
                agendaFiveData: JSON.stringify({ items: agenda5Items, dialogData: agenda5Assets }),

                pdfConfig: JSON.stringify(pdfConfig)
            };

            const res = await fetch(`http://localhost:8080/api/meetings/${meetingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error('บันทึกข้อมูลไม่สำเร็จ');
            }
            setSaveStatus('saved');
            setHasUnsavedChanges(false); // รีเซ็ตหลังจากบันทึกสำเร็จ
            setTimeout(() => setSaveStatus('idle'), 2000);

        } catch (err: any) {
            console.error(err);
            setError(err.message);
            setSaveStatus('idle');
        }
    };

    const handleClose = useCallback(() => {
        // ป้องกันการคลิกซ้ำ
        if (isClosing) return;

        // ถ้ามีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก ให้แสดง dialog ยืนยัน
        if (hasUnsavedChanges) {
            setShowCloseDialog(true);
            return;
        }

        // ถ้าไม่มีการเปลี่ยนแปลง ให้ปิดเลย
        performClose();
    }, [isClosing, hasUnsavedChanges]);

    const performClose = useCallback(() => {
        setIsClosing(true);

        try {
            // ใช้ setTimeout เล็กน้อยเพื่อให้ UI มีเวลา update
            setTimeout(() => {
                // กำหนด path ตาม meetingTypeCode โดยใช้ helper function
                const meetingTypeInfo = getMeetingTypeInfo(basicInfo.meetingTypeCode);

                // กลับไปหน้า detail ของการประชุมที่กำลังแก้ไข
                const backPath = `/Meetings/${meetingTypeInfo.path}/${meetingId}`;
                router.push(backPath);
            }, 100);
        } catch (err) {
            console.error('Error closing editor:', err);
            setIsClosing(false);
            // fallback ถ้า push ไม่สำเร็จ
            router.back();
        }
    }, [router, meetingId, basicInfo.meetingTypeCode]);

    const handleCloseDialogCancel = () => {
        setShowCloseDialog(false);
    };

    const handleCloseDialogConfirm = () => {
        setShowCloseDialog(false);
        performClose();
    };

    const handleCloseDialogSaveAndClose = async () => {
        setShowCloseDialog(false);
        await handleSave();
        // รอให้บันทึกเสร็จก่อน แล้วค่อยปิด
        setTimeout(() => {
            performClose();
        }, 500);
    };

    // Error & Loading States
    if (!meetingId) return <Box sx={centerStyle}><Alert severity="warning">กรุณาระบุ ID (เช่น /editor?id=123)</Alert></Box>;
    if (loading && !pdfData) return <Box sx={centerStyle}><CircularProgress /><Typography sx={{ mt: 2 }}>โหลดข้อมูล...</Typography></Box>;
    if (error) return <Box sx={centerStyle}><Alert severity="error">{error}</Alert></Box>;

    // Get meeting type info
    const meetingTypeInfo = getMeetingTypeInfo(basicInfo.meetingTypeCode);

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            bgcolor: '#f8fafc',
            '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.5 }
            }
        }}>

            {/* --- TOP BAR (Modern) --- */}
            <Paper
                elevation={0}
                sx={{
                    zIndex: 10,
                    px: 3,
                    height: '64px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: `linear-gradient(135deg, ${meetingTypeInfo.color}05 0%, #ffffff 100%)`,
                    borderBottom: `2px solid ${meetingTypeInfo.color}20`,
                    backdropFilter: 'blur(10px)',
                    flexShrink: 0,
                    transition: 'all 0.3s ease'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${meetingTypeInfo.color} 0%, ${meetingTypeInfo.color}dd 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 4px 12px ${meetingTypeInfo.color}40`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 6px 16px ${meetingTypeInfo.color}50`
                        }
                    }}>
                        <EditIcon sx={{ color: '#fff', fontSize: 20 }} />
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem', letterSpacing: '-0.025em' }}>
                                PDF Editor
                            </Typography>
                            <Chip
                                label={meetingTypeInfo.name}
                                size="small"
                                sx={{
                                    height: 24,
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    background: `linear-gradient(135deg, ${meetingTypeInfo.color} 0%, ${meetingTypeInfo.color}dd 100%)`,
                                    color: '#fff',
                                    borderRadius: 1.5,
                                    boxShadow: `0 2px 8px ${meetingTypeInfo.color}30`,
                                    '& .MuiChip-label': { px: 1.5 }
                                }}
                            />
                        </Box>
                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 500 }}>
                            การประชุมครั้งที่ {basicInfo.meetingNo || '-'} • แก้ไขรูปแบบ PDF
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {saveStatus === 'saved' && (
                        <Fade in timeout={300}>
                            <Chip
                                icon={<CheckCircleIcon style={{ fontSize: 16 }} />}
                                label="บันทึกแล้ว"
                                size="small"
                                sx={{
                                    height: 28,
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    bgcolor: '#10b98120',
                                    color: '#059669',
                                    border: '1.5px solid #10b98140',
                                    '& .MuiChip-icon': { color: '#059669' }
                                }}
                            />
                        </Fade>
                    )}
                    <Tooltip title="รีเฟรชข้อมูล" arrow>
                        <IconButton
                            onClick={() => meetingId && fetchMeetingDetail(meetingId)}
                            disabled={loading}
                            sx={{
                                width: 38,
                                height: 38,
                                bgcolor: '#f1f5f9',
                                '&:hover': {
                                    bgcolor: '#e2e8f0',
                                    transform: 'rotate(180deg)'
                                },
                                transition: 'all 0.4s ease'
                            }}
                        >
                            <RefreshIcon fontSize="small" sx={{ color: '#64748b' }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="บันทึกการตั้งค่า" arrow>
                        <IconButton
                            onClick={handleSave}
                            disabled={saveStatus === 'saving'}
                            sx={{
                                background: `linear-gradient(135deg, ${meetingTypeInfo.color} 0%, ${meetingTypeInfo.color}dd 100%)`,
                                color: '#fff',
                                width: 38,
                                height: 38,
                                boxShadow: `0 4px 12px ${meetingTypeInfo.color}40`,
                                '&:hover': {
                                    background: `linear-gradient(135deg, ${meetingTypeInfo.color}dd 0%, ${meetingTypeInfo.color}bb 100%)`,
                                    boxShadow: `0 6px 16px ${meetingTypeInfo.color}50`,
                                    transform: 'translateY(-2px)'
                                },
                                '&:disabled': {
                                    bgcolor: '#cbd5e1',
                                    boxShadow: 'none'
                                },
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {saveStatus === 'saving' ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <SaveIcon fontSize="small" />}
                        </IconButton>
                    </Tooltip>
                    <Box sx={{ width: 1, height: 24, bgcolor: '#e2e8f0', mx: 0.5 }} />
                    <Tooltip title="ปิดหน้าต่าง" arrow>
                        <IconButton
                            onClick={handleClose}
                            disabled={isClosing}
                            sx={{
                                width: 38,
                                height: 38,
                                bgcolor: '#f1f5f9',
                                '&:hover': {
                                    bgcolor: '#fee2e2',
                                    '& svg': { color: '#dc2626' }
                                },
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <CloseIcon fontSize="small" sx={{ color: '#64748b', transition: 'color 0.3s ease' }} />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Paper>

            {/* --- MAIN SPLIT VIEW --- */}
            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* --- LEFT: EDITOR PANEL (Compact) --- */}
                <Box sx={{
                    width: '420px',
                    minWidth: '320px',
                    height: '100%',
                    overflowY: 'auto',
                    background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
                    borderRight: '2px solid #e2e8f0',
                    p: 3,
                    '&::-webkit-scrollbar': { width: '8px' },
                    '&::-webkit-scrollbar-track': {
                        bgcolor: 'transparent',
                        borderRadius: '4px',
                        my: 2
                    },
                    '&::-webkit-scrollbar-thumb': {
                        bgcolor: '#cbd5e1',
                        borderRadius: '4px',
                        border: '2px solid transparent',
                        backgroundClip: 'content-box',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            bgcolor: '#94a3b8'
                        }
                    }
                }}>
                    {/* Config Section */}
                    <Section title="ตั้งค่าหน้ากระดาษ" icon={<TuneIcon sx={{ fontSize: 18, color: meetingTypeInfo.color }} />} >
                        <Box sx={{ mb: 2 }}>
                            <SubLabel>🔤 ตัวอักษร</SubLabel>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                                <RangeInput label="ขนาด" val={pdfConfig.fontSize} min={10} max={24} step={0.5} unit="pt" color={meetingTypeInfo.color} onChange={(v) => handleConfig('fontSize', v)} />
                                <RangeInput label="ระยะบรรทัด" val={pdfConfig.lineHeight} min={1} max={2.5} step={0.1} color={meetingTypeInfo.color} onChange={(v) => handleConfig('lineHeight', v)} />
                            </Box>
                        </Box>

                        <Divider sx={{
                            my: 2,
                            borderStyle: 'dashed',
                            borderColor: '#e2e8f0',
                            opacity: 0.6
                        }} />

                        <Box sx={{ mb: 2 }}>
                            <SubLabel>📏 ขอบกระดาษ (cm)</SubLabel>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                                <RangeInput label="บน" val={pdfConfig.marginTop} min={0.5} max={5} step={0.1} color={meetingTypeInfo.color} onChange={(v) => handleConfig('marginTop', v)} />
                                <RangeInput label="ล่าง" val={pdfConfig.marginBottom} min={0.5} max={5} step={0.1} color={meetingTypeInfo.color} onChange={(v) => handleConfig('marginBottom', v)} />
                                <RangeInput label="ซ้าย" val={pdfConfig.marginLeft} min={0.5} max={5} step={0.1} color={meetingTypeInfo.color} onChange={(v) => handleConfig('marginLeft', v)} />
                                <RangeInput label="ขวา" val={pdfConfig.marginRight} min={0.5} max={5} step={0.1} color={meetingTypeInfo.color} onChange={(v) => handleConfig('marginRight', v)} />
                            </Box>
                        </Box>

                        <Divider sx={{
                            my: 2,
                            borderStyle: 'dashed',
                            borderColor: '#e2e8f0',
                            opacity: 0.6
                        }} />

                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                <SubLabel>↔️ การเยื้อง (cm)</SubLabel>
                                <Chip
                                    label="รีเซ็ต"
                                    size="small"
                                    onClick={resetToDefault}
                                    sx={{
                                        height: 24,
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        bgcolor: '#f1f5f9',
                                        color: '#64748b',
                                        border: '1.5px solid #e2e8f0',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            bgcolor: '#e2e8f0',
                                            borderColor: '#cbd5e1',
                                            transform: 'translateY(-1px)',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                        }
                                    }}
                                />
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <RangeInput label="หัวข้อหลัก" val={pdfConfig.sectionTitleIndent} min={0} max={8} step={0.1} color={meetingTypeInfo.color} onChange={(v) => handleConfig('sectionTitleIndent', v)} />
                                <RangeInput label="หัวข้อรอง" val={pdfConfig.subHeaderIndent} min={0} max={8} step={0.1} color={meetingTypeInfo.color} onChange={(v) => handleConfig('subHeaderIndent', v)} />
                                <RangeInput label="วาระย่อย" val={pdfConfig.subAgendaIndent} min={0} max={8} step={0.1} color={meetingTypeInfo.color} onChange={(v) => handleConfig('subAgendaIndent', v)} />
                                <RangeInput label="รายการผู้เข้า" val={pdfConfig.attendeeListIndent} min={0} max={8} step={0.1} color={meetingTypeInfo.color} onChange={(v) => handleConfig('attendeeListIndent', v)} />
                                <RangeInput label="รายการสิ่งของ" val={pdfConfig.itemListIndent} min={0} max={8} step={0.1} color={meetingTypeInfo.color} onChange={(v) => handleConfig('itemListIndent', v)} />
                                <RangeInput label="มติที่ประชุม" val={pdfConfig.resolutionIndent} min={0} max={8} step={0.1} color={meetingTypeInfo.color} onChange={(v) => handleConfig('resolutionIndent', v)} />
                                <RangeInput label="ระยะห่างหัวข้อ" val={pdfConfig.sectionSpacing} min={0} max={3} step={0.1} color={meetingTypeInfo.color} onChange={(v) => handleConfig('sectionSpacing', v)} />
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
                            {['standard', 'compact', 'expanded'].map((p) => (
                                <Button
                                    key={p}
                                    onClick={() => applyPreset(p)}
                                    variant="outlined"
                                    size="small"
                                    sx={{
                                        flex: 1,
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        py: 1,
                                        borderRadius: 2,
                                        borderWidth: 2,
                                        borderColor: `${meetingTypeInfo.color}30`,
                                        color: meetingTypeInfo.color,
                                        background: `${meetingTypeInfo.color}08`,
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            borderWidth: 2,
                                            borderColor: meetingTypeInfo.color,
                                            background: `linear-gradient(135deg, ${meetingTypeInfo.color}20 0%, ${meetingTypeInfo.color}15 100%)`,
                                            transform: 'translateY(-2px)',
                                            boxShadow: `0 4px 12px ${meetingTypeInfo.color}30`
                                        }
                                    }}
                                >
                                    {p === 'standard' ? '📄 ปกติ' : p === 'compact' ? '📋 แน่น' : '📑 กว้าง'}
                                </Button>
                            ))}
                        </Box>
                    </Section>

                    <Box sx={{ height: 20 }} />
                </Box>

                {/* --- RIGHT: PREVIEW PANEL (Maximize Space) --- */}
                <Box sx={{ flex: 1, height: '100%', bgcolor: '#525659', display: 'flex', flexDirection: 'column' }}>
                    {/* Header สำหรับ Preview */}
                    <Box sx={{
                        height: '48px',
                        background: 'linear-gradient(135deg, #323639 0%, #2a2d30 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 3,
                        borderBottom: '2px solid #1a1c1e',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                bgcolor: '#10b981',
                                boxShadow: '0 0 8px #10b981',
                                animation: 'pulse 2s infinite'
                            }} />
                            <Typography sx={{
                                color: '#e2e8f0',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                letterSpacing: '0.02em'
                            }}>
                                Preview Mode
                            </Typography>
                        </Box>
                        <Chip
                            label="Live Update"
                            size="small"
                            sx={{
                                height: 22,
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: '#fff',
                                boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                                '& .MuiChip-label': { px: 1.5 }
                            }}
                        />
                    </Box>

                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {!isClient ? (
                            <CircularProgress size={40} sx={{ color: '#fff' }} />
                        ) : pdfData ? (
                            <Box sx={{ width: '100%', height: '100%' }}>
                                <PDFViewer width="100%" height="100%" showToolbar={true}>
                                    <EbookPdfDocument meeting={pdfData} />
                                </PDFViewer>
                            </Box>
                        ) : (
                            <CircularProgress size={40} sx={{ color: '#fff' }} />
                        )}
                    </Box>
                </Box>

            </Box>

            {/* --- CONFIRMATION DIALOG --- */}
            <Dialog
                open={showCloseDialog}
                onClose={handleCloseDialogCancel}
                maxWidth="xs"
                fullWidth
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: 2,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                        }
                    }
                }}
            >
                <DialogTitle sx={{ pb: 1, fontWeight: 600, color: '#1e293b' }}>
                    ยืนยันการปิดหน้าต่าง
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: '#475569' }}>
                        คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก ต้องการบันทึกก่อนปิดหรือไม่?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button
                        onClick={handleCloseDialogCancel}
                        sx={{
                            color: '#64748b',
                            textTransform: 'none',
                            '&:hover': { bgcolor: '#f1f5f9' }
                        }}
                    >
                        ยกเลิก
                    </Button>
                    <Button
                        onClick={handleCloseDialogConfirm}
                        variant="outlined"
                        sx={{
                            textTransform: 'none',
                            borderColor: '#e2e8f0',
                            color: '#475569',
                            '&:hover': {
                                borderColor: '#cbd5e1',
                                bgcolor: '#f8fafc'
                            }
                        }}
                    >
                        ปิดโดยไม่บันทึก
                    </Button>
                    <Button
                        onClick={handleCloseDialogSaveAndClose}
                        variant="contained"
                        sx={{
                            textTransform: 'none',
                            bgcolor: meetingTypeInfo.color,
                            '&:hover': {
                                bgcolor: meetingTypeInfo.color,
                                filter: 'brightness(0.85)'
                            }
                        }}
                    >
                        บันทึกและปิด
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

// --- Compact Styled Components ---

const Section = ({ title, children, icon }: any) => {
    return (
        <Paper
            elevation={0}
            sx={{
                mb: 2,
                borderRadius: 3,
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'all 0.3s ease',
                '&:hover': {
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    transform: 'translateY(-2px)'
                }
            }}
        >
            <Box sx={{
                p: 2,
                background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
                display: 'flex',
                alignItems: 'center',
                borderBottom: '2px solid #f1f5f9'
            }}>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    flex: 1
                }}>
                    <Box sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                        {icon}
                    </Box>
                    <Typography sx={{
                        fontWeight: 700,
                        color: '#1e293b',
                        fontSize: '0.9rem',
                        letterSpacing: '-0.02em'
                    }}>
                        {title}
                    </Typography>
                </Box>
            </Box>
            <Box sx={{ p: 2.5, bgcolor: '#ffffff' }}>{children}</Box>
        </Paper>
    );
};

const SubLabel = ({ children }: any) => (
    <Typography sx={{
        fontSize: '0.75rem',
        fontWeight: 700,
        color: '#64748b',
        mb: 1.5,
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
        display: 'flex',
        alignItems: 'center',
        gap: 0.5
    }}>
        {children}
    </Typography>
);

const RangeInput = ({ label, val, min, max, step, unit, color = '#3140BF', onChange }: RangeInputProps) => (
    <Box sx={{ mb: 1.5 }}>
        <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            mb: 0.8
        }}>
            <Typography sx={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#475569'
            }}>
                {label}
            </Typography>
            <Box sx={{
                px: 1.5,
                py: 0.3,
                borderRadius: 1.5,
                background: `${color}15`,
                border: `1.5px solid ${color}30`
            }}>
                <Typography sx={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: color
                }}>
                    {val}{unit}
                </Typography>
            </Box>
        </Box>
        <Box
            component="input"
            type="range"
            min={min}
            max={max}
            step={step || 1}
            value={val}
            onChange={(e: any) => onChange(e.target.value)}
            sx={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: `linear-gradient(to right, ${color} 0%, ${color} ${((val - min) / (max - min)) * 100}%, #e2e8f0 ${((val - min) / (max - min)) * 100}%, #e2e8f0 100%)`,
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                transition: 'all 0.2s ease',

                '&::-webkit-slider-thumb': {
                    appearance: 'none',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
                    cursor: 'pointer',
                    marginTop: '-5px',
                    boxShadow: `0 2px 8px ${color}60, 0 0 0 0 ${color}40`,
                    transition: 'all 0.2s ease',
                    border: '2px solid #fff',
                    '&:hover': {
                        transform: 'scale(1.2)',
                        boxShadow: `0 4px 12px ${color}70, 0 0 0 4px ${color}20`
                    },
                    '&:active': {
                        transform: 'scale(1.1)',
                        boxShadow: `0 2px 6px ${color}80, 0 0 0 6px ${color}15`
                    }
                },

                '&::-moz-range-thumb': {
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
                    cursor: 'pointer',
                    border: '2px solid #fff',
                    boxShadow: `0 2px 8px ${color}60, 0 0 0 0 ${color}40`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        transform: 'scale(1.2)',
                        boxShadow: `0 4px 12px ${color}70, 0 0 0 4px ${color}20`
                    },
                    '&:active': {
                        transform: 'scale(1.1)',
                        boxShadow: `0 2px 6px ${color}80, 0 0 0 6px ${color}15`
                    }
                }
            }}
        />
    </Box>
);

// Style Helpers (Compact)
const centerStyle = { display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', gap: 2 };

export default MeetingEditor;