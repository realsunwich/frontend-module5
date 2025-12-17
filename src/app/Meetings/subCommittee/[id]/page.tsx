'use client';

import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Paper, CircularProgress, Button, Stack, Divider, Chip, Avatar,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon,
    PictureAsPdf as PdfIcon,
    InsertDriveFile as DocIcon,
    AccessTime as TimeIcon,
    Place as LocationIcon,
    CalendarToday as DateIcon,
    EventNote as AgendaIcon,
    AssignmentTurnedIn as ResolutionIcon,
    Group as GroupIcon,
    CheckCircle as CheckCircleIcon,
    MenuBook as MenuBookIcon,
    Tune as TuneIcon
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { pdf } from '@react-pdf/renderer';
import Header from '@/components/header';
import Sidebar from '@/components/sidebar';
import EbookPdfDocument from '@/components/EbookPdfDocument';

// --- Types ---
type Member = {
    id: number;
    prename: string;
    firstname: string;
    lastname: string;
    affiliation: string;
    department: string;
};

type FileData = {
    name: string;
    url: string;
};

type Meeting = {
    id: number;
    meetingNo: string;
    meetingTypeCode?: string;
    meetingDate?: string;
    meetingTime?: string;
    location?: string;
    description?: string;
    status?: string;
    createdAt?: string;

    agendaOneData?: string;
    agendaTwoData?: string;
    agendaThreeData?: string;
    agendaFourData?: string;
    agendaFiveData?: string;

    resolutionDetail?: string;
    resolutionFourData?: string;
    resolutionFiveData?: string;

    attendees?: Member[];
    members?: Member[];
    pdfConfig?: string;
};

// --- Helpers ---
const getFileUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `http://localhost:8080${cleanPath}`;
};

const HtmlContent = ({ content, sx = {} }: { content: string, sx?: any }) => {
    if (!content) return null;
    return (
        <Box
            sx={{
                '& p': { mb: 1, mt: 0, lineHeight: 1.7 },
                '& ul, & ol': { pl: 3, mb: 1, mt: 0 },
                '& ul': { listStyleType: 'disc' },
                '& ol': { listStyleType: 'decimal' },
                '& strong': { fontWeight: 600, color: '#1e293b' },
                '& em': { fontStyle: 'italic' },
                color: '#475569',
                fontSize: '0.95rem',
                wordBreak: 'break-word',
                ...sx
            }}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
};

// --- Main Component ---
export default function subCommitteeMeetingDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    const [meeting, setMeeting] = useState<Meeting | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [generatingPdf, setGeneratingPdf] = useState(false);

    useEffect(() => {
        if (id) fetchMeetingDetail(id as string);
    }, [id]);

    const fetchMeetingDetail = async (meetingId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8080/api/meetings/${meetingId}`);
            if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลได้');
            const data = await res.json();
            setMeeting(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateEbook = async () => {
        if (!meeting) return;
        setGeneratingPdf(true);
        try {
            // ดึง pdfConfig ที่บันทึกไว้ (ถ้ามี) และแปลงค่ากลับเป็น points
            let config = undefined;
            if (meeting.pdfConfig) {
                try {
                    const savedConfig = JSON.parse(meeting.pdfConfig);
                    // แปลงค่าจาก cm กลับเป็น points (1 cm = 28.346 points)
                    config = {
                        fontSize: savedConfig.fontSize,
                        lineHeight: savedConfig.lineHeight,
                        marginTop: savedConfig.marginTop * 28.346,
                        marginLeft: savedConfig.marginLeft * 28.346,
                        marginRight: savedConfig.marginRight * 28.346,
                        marginBottom: savedConfig.marginBottom * 28.346,
                        sectionTitleIndent: savedConfig.sectionTitleIndent * 28.346,
                        subHeaderIndent: savedConfig.subHeaderIndent * 28.346,
                        subAgendaIndent: savedConfig.subAgendaIndent * 28.346,
                        attendeeListIndent: savedConfig.attendeeListIndent * 28.346,
                        itemListIndent: savedConfig.itemListIndent * 28.346,
                        assetListIndent: savedConfig.assetListIndent * 28.346,
                        resolutionIndent: savedConfig.resolutionIndent * 28.346,
                        sectionSpacing: savedConfig.sectionSpacing * 28.346,
                    };
                } catch (e) {
                    console.error("Error parsing saved PDF config:", e);
                }
            }

            // สร้าง PDF จาก React component พร้อม config
            const meetingWithConfig = config ? { ...meeting, config } : meeting;
            const blob = await pdf(<EbookPdfDocument meeting={meetingWithConfig} />).toBlob();
            const url = window.URL.createObjectURL(blob);

            // เปิด PDF ใน tab ใหม่
            window.open(url, '_blank');

            // ลบ URL object หลังจากเปิดแล้ว
            setTimeout(() => window.URL.revokeObjectURL(url), 100);
        } catch (error) {
            console.error("Error generating E-Book:", error);
            alert("ไม่สามารถสร้าง E-Book ได้");
        } finally {
            setGeneratingPdf(false);
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const handleOpenPdf = (url: string) => {
        // เปิด PDF ใน tab ใหม่
        window.open(getFileUrl(url), '_blank');
    };

    if (loading) return <LoadingState />;
    if (error || !meeting) return <ErrorState message={error} router={router} />;

    const attendeesList = meeting.attendees || meeting.members || [];
    const isPublished = meeting.status === 'PUBLISH';

    // Logic ดึงข้อมูลสรุปผลการประชุม
    let overallRes = { detail: '', files: [] as FileData[] };
    if (meeting.resolutionDetail) {
        try {
            const parsed = JSON.parse(meeting.resolutionDetail);
            if (typeof parsed === 'object') {
                overallRes.detail = parsed.detail || '';
                if (parsed.files && Array.isArray(parsed.files)) {
                    overallRes.files = parsed.files;
                } else if (parsed.file) {
                    overallRes.files = [{ name: parsed.file.split('/').pop() || 'เอกสารแนบ', url: parsed.file }];
                }
            } else {
                overallRes.detail = meeting.resolutionDetail;
            }
        } catch {
            overallRes.detail = meeting.resolutionDetail;
        }
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f8fafc' }}>
            <Header />
            <Stack direction="row" sx={{ flex: 1, overflow: 'hidden' }}>
                <Sidebar />
                <Box sx={{ flex: 1, p: { xs: 2, md: 4 }, overflowY: 'auto' }}>

                    {/* --- Page Header & Actions --- */}
                    <Paper elevation={0} sx={{ p: 2, mb: 4, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#fff' }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
                            <Button
                                startIcon={<ArrowBackIcon />}
                                onClick={() => router.back()}
                                sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#f1f5f9' } }}
                            >
                                ย้อนกลับ
                            </Button>

                            <Stack direction="row" spacing={2}>
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    startIcon={<TuneIcon />}
                                    onClick={() => router.push(`/editor?id=${id}`)}
                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 2 }}
                                >
                                    Editor PDF
                                </Button>

                                <Button
                                    variant="outlined"
                                    color="warning"
                                    startIcon={generatingPdf ? <CircularProgress size={20} color="inherit" /> : <MenuBookIcon />}
                                    onClick={handleGenerateEbook}
                                    disabled={generatingPdf}
                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 2 }}
                                >
                                    E-Book
                                </Button>

                                <Button
                                    variant="outlined"
                                    startIcon={isPublished ? <EditIcon /> : <ResolutionIcon />}
                                    onClick={() => router.push(`/Meetings/subCommittee/${id}/resolution`)}
                                    sx={{
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        px: 2,
                                        borderColor: '#3140BF',
                                        color: '#3140BF'
                                    }}
                                >
                                    {isPublished ? "แก้ไขบันทึกผลการประชุม" : "บันทึกผลการประชุม"}
                                </Button>

                                {!isPublished && (
                                    <Button
                                        variant="contained"
                                        startIcon={<EditIcon />}
                                        onClick={() => router.push(`/Meetings/subCommittee/${id}/edit`)}
                                        sx={{
                                            borderRadius: 2,
                                            textTransform: 'none',
                                            fontWeight: 700,
                                            px: 2,
                                            bgcolor: '#3140BF',
                                            '&:hover': { bgcolor: '#1e1b4b' }
                                        }}
                                    >
                                        แก้ไขข้อมูล
                                    </Button>
                                )}
                            </Stack>
                        </Stack>
                    </Paper>

                    <Stack spacing={4} maxWidth={1000} mx="auto">

                        {/* --- 1. ข้อมูลการประชุม (Meeting Info) --- */}
                        <Paper elevation={0} sx={{ p: 0, borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <Box sx={{ p: 3, bgcolor: '#fff' }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} mb={1}>
                                    <Box>
                                        <Typography variant="h5" fontWeight={800} color="#1e293b" gutterBottom>
                                            การประชุมครั้งที่ {meeting.meetingNo}
                                        </Typography>
                                        <HtmlContent content={meeting.description || '<i>ไม่มีรายละเอียดเพิ่มเติม</i>'} />
                                    </Box>
                                    <Chip
                                        label={meeting.status || 'DRAFT'}
                                        color={meeting.status === 'PUBLISH' ? 'info' : meeting.status === 'ACTIVE' ? 'success' : 'warning'}
                                        sx={{ fontWeight: 700, borderRadius: 1.5, height: 28 }}
                                    />
                                </Stack>
                            </Box>

                            <Divider sx={{ borderColor: '#f1f5f9' }} />

                            <Box sx={{ p: 3, bgcolor: '#f8fafc' }}>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4}>
                                    <InfoTile icon={<DateIcon sx={{ color: '#3140BF' }} />} label="วันที่ประชุม" value={formatDate(meeting.meetingDate)} />
                                    <InfoTile icon={<TimeIcon sx={{ color: '#d97706' }} />} label="เวลา" value={meeting.meetingTime ? `${meeting.meetingTime.substring(0, 5)} น.` : "-"} />
                                    <InfoTile icon={<LocationIcon sx={{ color: '#dc2626' }} />} label="สถานที่" value={meeting.location} />
                                </Stack>
                            </Box>
                        </Paper>

                        {/* --- 2. ผู้เข้าร่วมประชุม (Attendees) --- */}
                        {attendeesList.length > 0 && (
                            <Paper elevation={0} sx={{ p: 0, borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                <Box sx={{ p: 2, px: 3, bgcolor: '#fff', borderBottom: '1px solid #e2e8f0' }}>
                                    <Stack direction="row" alignItems="center" spacing={1.5}>
                                        <Avatar sx={{ bgcolor: '#eff6ff', color: '#3140BF', width: 36, height: 36 }}><GroupIcon fontSize="small" /></Avatar>
                                        <Typography variant="h6" fontWeight={700} color="#1e293b">
                                            ผู้เข้าร่วมประชุม <span style={{ color: '#94a3b8', fontSize: '0.9em', fontWeight: 500 }}>({attendeesList.length} ท่าน)</span>
                                        </Typography>
                                    </Stack>
                                </Box>
                                <TableContainer>
                                    <Table>
                                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b', pl: 3 }}>ชื่อ-นามสกุล</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>ตำแหน่ง/สังกัด</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {attendeesList.map((m, i) => (
                                                <TableRow key={m.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                                                    <TableCell sx={{ pl: 3, color: '#334155', fontWeight: 500 }}>
                                                        {i + 1}. {m.prename}{m.firstname} {m.lastname}
                                                    </TableCell>
                                                    <TableCell sx={{ color: '#64748b' }}>
                                                        {m.affiliation} {m.department ? `(${m.department})` : ''}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        )}

                        {/* --- 3. วาระการประชุม (Agendas) --- */}
                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                                <Avatar sx={{ bgcolor: '#3140BF', width: 36, height: 36 }}><AgendaIcon fontSize="small" /></Avatar>
                                <Typography variant="h6" fontWeight={800} color="#1e293b">วาระการประชุม</Typography>
                            </Stack>
                            <Stack spacing={2.5}>
                                <AgendaCard prefix={1} title="วาระที่ 1" content={meeting.agendaOneData} onOpenPdf={handleOpenPdf} />
                                <AgendaCard prefix={2} title="วาระที่ 2" content={meeting.agendaTwoData} onOpenPdf={handleOpenPdf} />
                                <AgendaCard prefix={3} title="วาระที่ 3" content={meeting.agendaThreeData} onOpenPdf={handleOpenPdf} />
                                <AgendaCard prefix={4} title="วาระที่ 4" content={meeting.agendaFourData} resolution={meeting.resolutionFourData} onOpenPdf={handleOpenPdf} />
                                <AgendaCard prefix={5} title="วาระที่ 5" content={meeting.agendaFiveData} resolution={meeting.resolutionFiveData} onOpenPdf={handleOpenPdf} />
                            </Stack>
                        </Box>

                        {/* --- 4. สรุปผลการประชุม (Resolution) --- */}
                        {(overallRes.detail || overallRes.files.length > 0) && (
                            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '2px solid #10b981', bgcolor: '#f0fdf4' }}>
                                <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
                                    <Avatar sx={{ bgcolor: "#10b981", width: 32, height: 32 }}><CheckCircleIcon sx={{ fontSize: 20 }} /></Avatar>
                                    <Typography variant="h6" fontWeight={800} color="#047857">สรุปผลการประชุม</Typography>
                                </Stack>

                                {overallRes.detail && (
                                    <Box mb={2} sx={{ pl: 5.5 }}>
                                        <HtmlContent content={overallRes.detail} sx={{ color: '#064e3b' }} />
                                    </Box>
                                )}

                                {overallRes.files.length > 0 && (
                                    <Box sx={{ mt: 2, pt: 2, pl: 5.5, borderTop: '1px dashed #6ee7b7' }}>
                                        <Typography variant="caption" fontWeight="bold" color="#059669" display="block" mb={1}>
                                            เอกสารแนบ ({overallRes.files.length})
                                        </Typography>
                                        <Stack direction="row" flexWrap="wrap" gap={1}>
                                            {overallRes.files.map((file, index) => (
                                                <Button
                                                    key={index}
                                                    variant="outlined"
                                                    size="small"
                                                    startIcon={/\.pdf$/i.test(file.url) ? <PdfIcon /> : <DocIcon />}
                                                    onClick={() => {
                                                        if (/\.pdf$/i.test(file.url)) {
                                                            handleOpenPdf(file.url);
                                                        } else {
                                                            window.open(getFileUrl(file.url), '_blank');
                                                        }
                                                    }}
                                                    sx={{
                                                        bgcolor: '#fff',
                                                        textTransform: 'none',
                                                        borderColor: '#10b981',
                                                        color: '#059669',
                                                        borderRadius: 2,
                                                        '&:hover': { bgcolor: '#ecfdf5', borderColor: '#059669' }
                                                    }}
                                                >
                                                    {file.name}
                                                </Button>
                                            ))}
                                        </Stack>
                                    </Box>
                                )}
                            </Paper>
                        )}

                    </Stack>
                </Box>
            </Stack>
        </Box>
    );
}

// --- Sub Components ---
const InfoTile = ({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string; }) => (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
        <Box sx={{
            width: 48, height: 48, borderRadius: 2.5,
            bgcolor: '#fff', border: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            {icon}
        </Box>
        <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">{label}</Typography>
            <Typography variant="body2" fontWeight={700} color="#1e293b">{value || "-"}</Typography>
        </Box>
    </Stack>
);

const LoadingState = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#f4f6f8' }}>
        <CircularProgress size={40} thickness={4} sx={{ color: '#3140BF' }} />
    </Box>
);

const ErrorState = ({ message, router }: { message: string | null, router: any }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 2 }}>
        <Typography variant="h6" color="error">{message || 'เกิดข้อผิดพลาด'}</Typography>
        <Button variant="outlined" onClick={() => router.back()}>กลับหน้าหลัก</Button>
    </Box>
);

function AgendaCard({ prefix, title, content, resolution, onOpenPdf }: any) {
    if (!content) return null;
    let parsed: any = null;
    try { parsed = JSON.parse(content); } catch { parsed = null; }

    return (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: "hidden" }}>
            <Box sx={{ p: 2, px: 3, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#3140BF', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                        {prefix}
                    </Box>
                    <Typography variant="subtitle1" fontWeight="bold" color="#1e293b">{title}</Typography>
                </Stack>
            </Box>

            <Box sx={{ p: 3, bgcolor: "#fff" }}>
                {(prefix === 4 || prefix === 5) && parsed && parsed.items && parsed.dialogData ? (
                    <AgendaTableDisplay data={parsed} />
                ) : (prefix === 1 || prefix === 2 || prefix === 3) && parsed && parsed.subAgendas ? (
                    <AgendaStandardDisplay prefix={prefix} data={parsed} onOpenPdf={onOpenPdf} />
                ) : (parsed && typeof parsed === "object" ? (
                    <RenderJsonData data={parsed} onOpenPdf={onOpenPdf} />
                ) : (
                    <HtmlContent content={content} />
                ))}
            </Box>

            {resolution && (
                <Box sx={{ p: 3, bgcolor: "#f0fdf4", borderTop: "1px dashed #86efac" }}>
                    <Stack direction="row" spacing={1} mb={1} alignItems="center">
                        <CheckCircleIcon color="success" fontSize="small" />
                        <Typography variant="subtitle2" fontWeight="bold" color="#047857">มติที่ประชุม</Typography>
                    </Stack>
                    <Box sx={{ pl: 3.5 }}>
                        <HtmlContent content={resolution} sx={{ color: "#065f46" }} />
                    </Box>
                </Box>
            )}
        </Paper>
    );
}

const AgendaStandardDisplay = ({ prefix, data, onOpenPdf }: { prefix: number, data: any, onOpenPdf?: (url: string) => void }) => {
    const { subAgendas, attachedFiles } = data;

    return (
        <Stack spacing={2}>
            {Array.isArray(subAgendas) && subAgendas.map((sub: any, index: number) => (
                <Box key={index} sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #f1f5f9' }}>
                    <Typography variant="subtitle2" fontWeight="bold" color="#3140BF" gutterBottom>
                        วาระที่ {prefix}.{sub.subAgendaNo}
                    </Typography>
                    <HtmlContent content={sub.detail} />
                </Box>
            ))}

            {attachedFiles && Array.isArray(attachedFiles) && attachedFiles.length > 0 && (
                <Box sx={{ mt: 1, pt: 2 }}>
                    <Typography variant="caption" fontWeight="bold" color="text.secondary" gutterBottom display="block">
                        เอกสารแนบ ({attachedFiles.length})
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                        {attachedFiles.map((file: any, index: number) => (
                            <Button
                                key={index}
                                variant="outlined"
                                startIcon={/\.pdf$/i.test(file.url) ? <PdfIcon color="error" /> : <DocIcon color="primary" />}
                                size="small"
                                onClick={() => {
                                    if (/\.pdf$/i.test(file.url) && onOpenPdf) {
                                        onOpenPdf(file.url);
                                    } else {
                                        window.open(getFileUrl(file.url), "_blank");
                                    }
                                }}
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 500,
                                    borderColor: '#e2e8f0',
                                    color: '#64748b',
                                    bgcolor: '#fff',
                                    borderRadius: 2,
                                    '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f1f5f9' }
                                }}
                            >
                                {file.name || 'Download File'}
                            </Button>
                        ))}
                    </Stack>
                </Box>
            )}
        </Stack>
    );
};

const AgendaTableDisplay = ({ data }: { data: any }) => {
    const { items, dialogData } = data;
    const getStatusChip = (status: string) => {
        let color: "default" | "success" | "warning" | "error" = "default";
        let label = status;
        let bgcolor = '#f3f4f6';
        let textColor = '#374151';

        switch (status) {
            case 'seize': color = 'success'; label = 'ยึดทรัพย์'; bgcolor = '#ecfdf5'; textColor = '#047857'; break;
            case 'pending': color = 'warning'; label = 'รอตรวจสอบ'; bgcolor = '#fffbeb'; textColor = '#b45309'; break;
            case 'reject': color = 'error'; label = 'ยกคำร้อง'; bgcolor = '#fef2f2'; textColor = '#b91c1c'; break;
        }
        return <Chip label={label} size="small" sx={{ bgcolor: bgcolor, color: textColor, fontWeight: 600, borderRadius: 1.5, border: '1px solid transparent' }} />;
    };

    return (
        <Stack spacing={4}>
            <Box>
                <Typography variant="subtitle2" fontWeight="bold" mb={2} color="primary.main">รายชื่อผู้เกี่ยวข้อง (Items)</Typography>
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee', borderRadius: 2 }}>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b', width: '15%' }}>ลำดับ</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b', width: '45%' }}>ชื่อ-นามสกุล</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b', width: '40%' }}>สังกัด/หน่วยงาน</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Array.isArray(items) && items.map((row: any) => (
                                <TableRow key={row.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                                    <TableCell sx={{ color: '#475569' }}>{row.order}</TableCell>
                                    <TableCell sx={{ color: '#1e293b', fontWeight: 500 }}>{row.name}</TableCell>
                                    <TableCell sx={{ color: '#475569' }}>{row.region}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
            <Box>
                <Typography variant="subtitle2" fontWeight="bold" mb={2} color="primary.main">รายการทรัพย์สินและสถานะ (Details)</Typography>
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee', borderRadius: 2 }}>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>เลขที่เอกสาร</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>ชื่อ-นามสกุล</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>ทรัพย์สิน</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b', textAlign: 'right' }}>มูลค่า (บาท)</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b', textAlign: 'center' }}>สถานะ</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>หมายเหตุ</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Array.isArray(dialogData) && dialogData.map((row: any) => (
                                <TableRow key={row.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                                    <TableCell sx={{ color: '#475569' }}>{row.fileNo || '-'}</TableCell>
                                    <TableCell sx={{ color: '#1e293b' }}>{row.name || '-'}</TableCell>
                                    <TableCell sx={{ color: '#475569' }}>{row.asset}</TableCell>
                                    <TableCell align="right" sx={{ fontFamily: 'monospace', color: '#1e293b' }}>{row.amount ? Number(row.amount.replace(/,/g, '')).toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-'}</TableCell>
                                    <TableCell align="center">{getStatusChip(row.status)}</TableCell>
                                    <TableCell sx={{ color: '#64748b' }}>{row.note || '-'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Stack>
    );
};

const RenderJsonData = ({ data, onOpenPdf }: { data: any, onOpenPdf?: (url: string) => void }) => {
    if (!data || typeof data !== "object") return <Typography color="text.secondary">-</Typography>;
    if (Array.isArray(data)) return (<Stack spacing={1} sx={{ pl: 2, borderLeft: '3px solid #3140BF', mb: 1 }}>{data.map((item, idx) => (<Typography key={idx} variant="body2" sx={{ whiteSpace: "pre-wrap", color: '#475569' }}>• {typeof item === "string" ? item : JSON.stringify(item)}</Typography>))}</Stack>);
    return (
        <Stack spacing={2}>
            {Object.entries(data).map(([key, value]) => (
                <Box key={key} sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1, alignItems: { xs: "flex-start", sm: "center" } }}>
                    <Typography variant="subtitle2" sx={{ minWidth: 140, fontWeight: 600, color: "#334155", textTransform: "capitalize", whiteSpace: "nowrap" }}>{key.replace(/_/g, " ")}:</Typography>
                    <Box sx={{ flex: 1 }}><RenderValue value={value} onOpenPdf={onOpenPdf} /></Box>
                </Box>
            ))}
        </Stack>
    );
};

const RenderValue = ({ value, onOpenPdf }: { value: any, onOpenPdf?: (url: string) => void }) => {
    if (value === null || value === undefined || value === "") return <Typography variant="body2" color="text.disabled">-</Typography>;
    if (typeof value === "string" && /\.(jpe?g|png|gif|webp|svg)$/i.test(value)) {
        return <Box component="img" src={getFileUrl(value)} alt="image" sx={{ maxHeight: 160, maxWidth: "100%", borderRadius: 2, cursor: "pointer", objectFit: "cover", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", transition: "transform 0.2s", "&:hover": { transform: "scale(1.02)" } }} onClick={() => window.open(getFileUrl(value), "_blank")} onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-image.png'; }} />;
    }
    if (typeof value === "string" && /\.(pdf|docx?|xlsx?|pptx?)$/i.test(value)) {
        const fileName = value.split("/").pop() || "Download File";
        return <Button
            variant="outlined"
            startIcon={/\.pdf$/i.test(value) ? <PdfIcon color="error" /> : <DocIcon color="primary" />}
            size="small"
            onClick={() => {
                if (/\.pdf$/i.test(value) && onOpenPdf) {
                    onOpenPdf(value);
                } else {
                    window.open(getFileUrl(value), "_blank");
                }
            }}
            sx={{ textTransform: "none", fontWeight: 500, borderColor: '#e2e8f0', color: '#475569', borderRadius: 2 }}
        >
            {fileName}
        </Button>;
    }
    if (Array.isArray(value)) return (<Stack component="ul" spacing={0.5} sx={{ pl: 3, m: 0 }}>{value.map((item, i) => (<Typography component="li" key={i} variant="body2" sx={{ whiteSpace: "pre-wrap", color: "#475569" }}>{typeof item === "string" ? item : JSON.stringify(item)}</Typography>))}</Stack>);
    return <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", color: "#475569" }}>{value.toString()}</Typography>;
};