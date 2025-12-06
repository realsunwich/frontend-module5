'use client';

import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Paper, CircularProgress, Button, Stack, Divider, Chip, Avatar
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
    AttachFile as AttachFileIcon,
    MenuBook as MenuBookIcon
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/header';
import Sidebar from '@/components/sidebar';

// Define Type
type Member = {
    id: number;
    prename: string;
    firstname: string;
    lastname: string;
    affiliation: string;
    department: string;
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

    // Agendas
    agendaOneData?: string;
    agendaTwoData?: string;
    agendaThreeData?: string;
    agendaFourData?: string;
    agendaFiveData?: string;

    // Resolutions
    resolutionDetail?: string;
    resolutionFourData?: string;
    resolutionFiveData?: string;

    attendees?: Member[];
    members?: Member[];
};

const HtmlContent = ({ content, sx = {} }: { content: string, sx?: any }) => {
    if (!content) return null;
    return (
        <Box
            sx={{
                // จัด Style พื้นฐานให้ HTML เพราะ Tiptap ไม่มี CSS มาให้
                '& p': { mb: 1, mt: 0, lineHeight: 1.6 },
                '& ul, & ol': { pl: 3, mb: 1, mt: 0 },
                '& ul': { listStyleType: 'disc' },
                '& ol': { listStyleType: 'decimal' },
                '& strong': { fontWeight: 600, color: 'text.primary' },
                '& em': { fontStyle: 'italic' },
                '& u': { textDecoration: 'underline' },
                color: 'text.secondary',
                fontSize: '0.875rem',
                wordBreak: 'break-word',
                ...sx // ยอมให้ override style ได้
            }}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
};

export default function MillionAssetsMeetingDetailPage() {
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
            const payload = {
                ...meeting,
                meetingTime: meeting.meetingTime ? (meeting.meetingTime.length > 5 ? meeting.meetingTime : meeting.meetingTime + ":00") : null,
                memberIds: (meeting.members || meeting.attendees || []).map(m => m.id)
            };

            const response = await fetch('http://localhost:8080/api/reports/generate-ebook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    meetingTitle: "รายงานการประชุมคณะอนุกรรมการตรวจสอบทรัพย์สินมูลค่า 1 ล้านบาทขึ้นไป",
                    ...payload
                })
            });

            if (!response.ok) throw new Error('Failed to generate PDF');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
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

    if (loading) return <LoadingState />;
    if (error || !meeting) return <ErrorState message={error} router={router} />;

    const attendeesList = meeting.attendees || meeting.members || [];
    const isPublished = meeting.status === 'PUBLISH';

    // Parse Overall Resolution
    let overallRes = { detail: '', file: '' };
    if (meeting.resolutionDetail) {
        try {
            const parsed = JSON.parse(meeting.resolutionDetail);
            if (typeof parsed === 'object') {
                overallRes = { detail: parsed.detail || '', file: parsed.file || '' };
            } else {
                overallRes.detail = meeting.resolutionDetail;
            }
        } catch {
            overallRes.detail = meeting.resolutionDetail;
        }
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f4f6f8' }}>
            <Header />
            <Stack direction="row" sx={{ flex: 1, overflow: 'hidden' }}>
                <Sidebar />
                <Box sx={{ flex: 1, p: { xs: 2, md: 4 }, overflow: 'auto' }}>

                    {/* Buttons */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                        <Button
                            startIcon={<ArrowBackIcon />}
                            onClick={() => router.back()}
                            sx={{ color: '#637381', textTransform: 'none', fontWeight: 600 }}
                        >
                            ย้อนกลับ
                        </Button>

                        <Stack direction="row" spacing={2}>
                            <Button
                                variant="outlined"
                                color="warning"
                                startIcon={generatingPdf ? <CircularProgress size={20} color="inherit" /> : <MenuBookIcon />}
                                onClick={handleGenerateEbook}
                                disabled={generatingPdf}
                                sx={{
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    px: 3,
                                    borderWidth: 2,
                                    borderColor: '#ed6c02',
                                    color: '#ed6c02',
                                    '&:hover': { borderWidth: 2, borderColor: '#e65100', bgcolor: '#fff3e0' }
                                }}
                            >
                                E-Book
                            </Button>

                            {!isPublished && (
                                <>
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        startIcon={<ResolutionIcon />}
                                        onClick={() => router.push(`/Meetings/MillionAssets/${id}/resolution`)}
                                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3, borderWidth: 2 }}
                                    >
                                        บันทึกผลการประชุม
                                    </Button>
                                    <Button
                                        variant="contained"
                                        startIcon={<EditIcon />}
                                        onClick={() => router.push(`/Meetings/MillionAssets/${id}/edit`)}
                                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3, bgcolor: '#141371' }}
                                    >
                                        แก้ไขข้อมูล
                                    </Button>
                                </>
                            )}
                        </Stack>
                    </Stack>

                    <Stack spacing={3} maxWidth={1100} mx="auto">

                        {/* 1. Meeting Info */}
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(145, 158, 171, 0.2)' }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2} mb={3}>
                                <Box>
                                    <Typography variant="h4" fontWeight={800}>การประชุมครั้งที่ {meeting.meetingNo}</Typography>
                                    <Typography variant="body1" color="text.secondary" mt={1}>{meeting.description}</Typography>
                                </Box>
                                <Chip
                                    label={meeting.status || 'DRAFT'}
                                    color={
                                        meeting.status === 'PUBLISH' ? 'info' :
                                            meeting.status === 'ACTIVE' ? 'success' : 'warning'
                                    }
                                    sx={{ fontWeight: 700, borderRadius: 1 }}
                                />
                            </Stack>
                            <Box sx={{ display: "flex", gap: 3, p: 3, borderRadius: 3, bgcolor: "#f9fafb", border: "1px solid rgba(145,158,171,0.12)" }}>
                                <InfoTile icon={<DateIcon color="primary" />} label="วันที่" value={formatDate(meeting.meetingDate)} />
                                <InfoTile icon={<TimeIcon color="warning" />} label="เวลา" value={meeting.meetingTime ? `${meeting.meetingTime} น.` : "-"} />
                                <InfoTile icon={<LocationIcon color="error" />} label="สถานที่" value={meeting.location} />
                            </Box>
                        </Paper>

                        {/* 2. Attendees */}
                        {attendeesList.length > 0 && (
                            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(145, 158, 171, 0.2)' }}>
                                <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
                                    <Avatar sx={{ bgcolor: "info.main", width: 32, height: 32 }}><GroupIcon sx={{ fontSize: 20 }} /></Avatar>
                                    <Typography variant="h6" fontWeight={800}>ผู้เข้าร่วมประชุม ({attendeesList.length})</Typography>
                                </Stack>
                                <TableContainer sx={{ border: '1px solid #eee', borderRadius: 2 }}>
                                    <Table size="small">
                                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold' }}>ลำดับ</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>ชื่อ-นามสกุล</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>ตำแหน่ง/สังกัด</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {attendeesList.map((m, i) => (
                                                <TableRow key={m.id} hover>
                                                    <TableCell>{i + 1}</TableCell>
                                                    <TableCell>{m.prename}{m.firstname} {m.lastname}</TableCell>
                                                    <TableCell>{m.affiliation} {m.department ? `(${m.department})` : ''}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        )}

                        {/* 3. Agendas + Resolutions */}
                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                                <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32 }}><AgendaIcon sx={{ fontSize: 20 }} /></Avatar>
                                <Typography variant="h6" fontWeight={800}>วาระการประชุม</Typography>
                            </Stack>
                            <Stack spacing={3}>
                                <AgendaCard prefix={1} title="วาระที่ 1" content={meeting.agendaOneData} />
                                <AgendaCard prefix={2} title="วาระที่ 2" content={meeting.agendaTwoData} />
                                <AgendaCard prefix={3} title="วาระที่ 3" content={meeting.agendaThreeData} />

                                <AgendaCard
                                    prefix={4}
                                    title="วาระที่ 4"
                                    content={meeting.agendaFourData}
                                    resolution={meeting.resolutionFourData} // ✅ ส่งผลการประชุม
                                />

                                <AgendaCard
                                    prefix={5}
                                    title="วาระที่ 5"
                                    content={meeting.agendaFiveData}
                                    resolution={meeting.resolutionFiveData} // ✅ ส่งผลการประชุม
                                />
                            </Stack>
                        </Box>

                        {/* 4. Overall Resolution (สรุปผลการประชุม) */}
                        {(overallRes.detail || overallRes.file) && (
                            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '2px solid #4caf50', bgcolor: '#f1f8e9' }}>
                                <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
                                    <Avatar sx={{ bgcolor: "success.main", width: 32, height: 32 }}><CheckCircleIcon sx={{ fontSize: 20 }} /></Avatar>
                                    <Typography variant="h6" fontWeight={800} color="success.main">สรุปผลการประชุม</Typography>
                                </Stack>

                                {overallRes.detail && (
                                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                                        {overallRes.detail}
                                    </Typography>
                                )}

                                {overallRes.file && (
                                    <Button
                                        variant="outlined"
                                        color="success"
                                        startIcon={<AttachFileIcon />}
                                        onClick={() => window.open(`http://localhost:8080${overallRes.file}`, '_blank')}
                                        sx={{ bgcolor: '#fff', textTransform: 'none' }}
                                    >
                                        ดูไฟล์แนบสรุปผล: {overallRes.file.split('/').pop()}
                                    </Button>
                                )}
                            </Paper>
                        )}

                    </Stack>
                </Box>
            </Stack>
        </Box>
    );
}

const InfoTile = ({
    icon,
    label,
    value
}: {
    icon: React.ReactNode;
    label: string;
    value?: string;
}) => (
    <Box
        sx={{
            flex: 1,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 2,
            p: 2.5,
            borderRadius: 2,
            backgroundColor: "#FFFFFF",
            border: "1px solid rgba(145,158,171,0.12)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
            transition: "all 0.2s ease",
            "&:hover": {
                boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
                transform: "translateY(-2px)"
            }
        }}
    >
        <Box
            sx={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                bgcolor: "#F5F5F5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}
        >
            {icon}
        </Box>

        <Box>
            <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontWeight: 700 }}
            >
                {label}
            </Typography>
            <Typography
                variant="subtitle1"
                sx={{ fontWeight: 800, color: "text.primary", mt: 0.5 }}
            >
                {value || "-"}
            </Typography>
        </Box>
    </Box>
);

const LoadingState = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#f4f6f8' }}>
        <CircularProgress size={40} thickness={4} />
    </Box>
);

const ErrorState = ({ message, router }: { message: string | null, router: any }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 2 }}>
        <Typography variant="h6" color="error">{message || 'เกิดข้อผิดพลาด'}</Typography>
        <Button variant="outlined" onClick={() => router.back()}>กลับหน้าหลัก</Button>
    </Box>
);

function AgendaCard({ prefix, title, content, resolution }: any) {
    if (!content) return null;
    let parsed: any = null;
    try { parsed = JSON.parse(content); } catch { parsed = null; }

    return (
        <Paper elevation={1} sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid rgba(0,0,0,0.05)" }}>
            <Box sx={{ p: 3, bgcolor: "background.paper", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: "primary.main", color: "white", fontWeight: "bold" }}>{prefix}</Avatar>
                    <Typography variant="h6" fontWeight="bold" color="text.primary">{title}</Typography>
                </Stack>
            </Box>
            <Box sx={{ p: 3, bgcolor: "background.default" }}>
                {(prefix === 4 || prefix === 5) && parsed && parsed.items && parsed.dialogData ? (
                    <AgendaTableDisplay data={parsed} />
                ) : (prefix === 1 || prefix === 2 || prefix === 3) && parsed && parsed.subAgendas ? (
                    <AgendaStandardDisplay prefix={prefix} data={parsed} />
                ) : (parsed && typeof parsed === "object" ? (
                    <RenderJsonData data={parsed} />
                ) : (
                    // 🔴 จุดที่ 1: เนื้อหาทั่วไป
                    <HtmlContent content={content} />
                ))}
            </Box>
            {/* ✅ ส่วนแสดงผล Resolution */}
            {resolution && (
                <Box sx={{ p: 3, bgcolor: "#f1f8e9", borderTop: "1px dashed #a5d6a7" }}>
                    <Stack direction="row" spacing={1} mb={1} alignItems="center">
                        <CheckCircleIcon color="success" fontSize="small" />
                        <Typography variant="subtitle1" fontWeight="bold" color="success.main">มติที่ประชุม</Typography>
                    </Stack>

                    {/* 🔴 จุดที่ 2: มติที่ประชุม (ถ้าหน้ากรอกมติใช้ Tiptap ด้วย) */}
                    <HtmlContent content={resolution} sx={{ color: "#33691e" }} />
                </Box>
            )}
        </Paper>
    );
}

const AgendaStandardDisplay = ({ prefix, data }: { prefix: number, data: any }) => {
    const { subAgendas, attachedFile, attachedFiles } = data;

    const getFileUrl = (path: string) => {
        if (path.startsWith('http')) return path;
        return `http://localhost:8080${path.startsWith('/') ? '' : '/'}${path}`;
    };

    return (
        <Stack spacing={3}>
            {Array.isArray(subAgendas) && subAgendas.map((sub: any, index: number) => (
                <Box key={index} sx={{ p: 2, bgcolor: '#fff', borderRadius: 2, border: '1px solid #eee' }}>
                    <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        color="primary.main"
                        gutterBottom
                    >
                        วาระที่ {prefix}.{sub.subAgendaNo}
                    </Typography>

                    <HtmlContent content={sub.detail} />
                </Box>
            ))}

            {attachedFiles && Array.isArray(attachedFiles) && attachedFiles.length > 0 && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #ddd' }}>
                    <Typography variant="body2" fontWeight="bold" color="text.secondary" gutterBottom>
                        เอกสารแนบ ({attachedFiles.length} รายการ)
                    </Typography>
                    <Stack spacing={1}>
                        {attachedFiles.map((file: any, index: number) => (
                            <Button
                                key={index}
                                variant="outlined"
                                startIcon={/\.pdf$/i.test(file.url) ? <PdfIcon color="error" /> : <DocIcon color="primary" />}
                                size="small"
                                onClick={() => window.open(getFileUrl(file.url), "_blank")}
                                sx={{
                                    justifyContent: 'flex-start',
                                    textTransform: "none",
                                    fontWeight: 500,
                                    borderColor: '#ddd',
                                    color: '#555',
                                    bgcolor: '#fff',
                                    maxWidth: 'fit-content'
                                }}
                            >
                                {file.name || 'Download File'}
                            </Button>
                        ))}
                    </Stack>
                </Box>
            )}

            {(!subAgendas || subAgendas.length === 0) && !attachedFile && (
                <Typography variant="body2" color="text.secondary" align="center">
                    ไม่มีรายละเอียด
                </Typography>
            )}
        </Stack>
    );
};

import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

const AgendaTableDisplay = ({ data }: { data: any }) => {
    const { items, dialogData } = data;

    const getStatusChip = (status: string) => {
        let color: "default" | "success" | "warning" | "error" = "default";
        let label = status;

        switch (status) {
            case 'seize':
                color = 'success';
                label = 'ยึดทรัพย์';
                break;
            case 'pending':
                color = 'warning';
                label = 'รอตรวจสอบ';
                break;
            case 'reject':
                color = 'error';
                label = 'ยกคำร้อง';
                break;
            default:
                break;
        }

        return (
            <Chip
                label={label}
                color={color}
                size="small"
                variant={status === 'pending' ? 'outlined' : 'filled'}
                sx={{ fontWeight: 600, minWidth: 80 }}
            />
        );
    };

    return (
        <Stack spacing={4}>
            <Box>
                <Typography variant="subtitle1" fontWeight="bold" mb={2} color="primary.main">
                    รายชื่อผู้เกี่ยวข้อง (Items)
                </Typography>
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee' }}>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>ลำดับ</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', width: '45%' }}>ชื่อ-นามสกุล</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>สังกัด/หน่วยงาน</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Array.isArray(items) && items.map((row: any) => (
                                <TableRow key={row.id} hover>
                                    <TableCell>{row.order}</TableCell>
                                    <TableCell>{row.name}</TableCell>
                                    <TableCell>{row.region}</TableCell>
                                </TableRow>
                            ))}
                            {(!items || items.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={3} align="center">ไม่พบข้อมูล</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Divider />

            <Box>
                <Typography variant="subtitle1" fontWeight="bold" mb={2} color="primary.main">
                    รายการทรัพย์สินและสถานะ (Details)
                </Typography>
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee' }}>
                    <Table size="medium">
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>เลขที่เอกสาร</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>ชื่อ-นามสกุล</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>ทรัพย์สิน</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>มูลค่า (บาท)</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>สถานะ</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>หมายเหตุ</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Array.isArray(dialogData) && dialogData.map((row: any) => (
                                <TableRow key={row.id} hover>
                                    <TableCell>{row.fileNo || '-'}</TableCell>
                                    <TableCell>{row.name || '-'}</TableCell>
                                    <TableCell>{row.asset}</TableCell>
                                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                                        {row.amount ? Number(row.amount.replace(/,/g, '')).toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-'}
                                    </TableCell>
                                    <TableCell align="center">
                                        {getStatusChip(row.status)}
                                    </TableCell>
                                    <TableCell>{row.note || '-'}</TableCell>
                                </TableRow>
                            ))}
                            {(!dialogData || dialogData.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">ไม่พบข้อมูล</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Stack>
    );
};

const RenderJsonData = ({ data }: { data: any }) => {
    if (!data || typeof data !== "object") {
        return <Typography color="text.secondary">-</Typography>;
    }

    if (Array.isArray(data)) {
        return (
            <Stack spacing={1} sx={{ pl: 2, borderLeft: '3px solid #1976d2', mb: 1 }}>
                {data.map((item, idx) => (
                    <Typography key={idx} variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                        • {typeof item === "string" ? item : JSON.stringify(item)}
                    </Typography>
                ))}
            </Stack>
        );
    }

    return (
        <Stack spacing={2}>
            {Object.entries(data).map(([key, value]) => (
                <Box
                    key={key}
                    sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        gap: 1,
                        alignItems: { xs: "flex-start", sm: "center" },
                    }}
                >
                    <Typography
                        variant="subtitle2"
                        sx={{
                            minWidth: 140,
                            fontWeight: 700,
                            color: "primary.main",
                            textTransform: "capitalize",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {key.replace(/_/g, " ")}:
                    </Typography>
                    <Box sx={{ flex: 1 }}>
                        <RenderValue value={value} />
                    </Box>
                </Box>
            ))}
        </Stack>
    );
};

const RenderValue = ({ value }: { value: any }) => {
    if (value === null || value === undefined || value === "") {
        return <Typography variant="body2" color="text.disabled">-</Typography>;
    }

    // Helper function to get full URL
    const getFileUrl = (path: string) => {
        if (path.startsWith('http')) return path;
        return `http://localhost:8080${path.startsWith('/') ? '' : '/'}${path}`;
    };

    // รูปภาพ (thumbnail คลิกขยาย)
    if (typeof value === "string" && /\.(jpe?g|png|gif|webp|svg)$/i.test(value)) {
        const imageUrl = getFileUrl(value);
        return (
            <Box
                component="img"
                src={imageUrl}
                alt="image"
                sx={{
                    maxHeight: 160,
                    maxWidth: "100%",
                    borderRadius: 2,
                    cursor: "pointer",
                    objectFit: "cover",
                    boxShadow: "0 3px 8px rgba(0,0,0,0.12)",
                    transition: "transform 0.2s ease",
                    "&:hover": { transform: "scale(1.05)" }
                }}
                onClick={() => window.open(imageUrl, "_blank")}
                onError={(e) => {
                    // Fallback if image fails to load
                    (e.target as HTMLImageElement).src = '/placeholder-image.png';
                }}
            />
        );
    }

    // ไฟล์เอกสาร (ปุ่มดาวน์โหลด)
    if (typeof value === "string" && /\.(pdf|docx?|xlsx?|pptx?)$/i.test(value)) {
        const fileName = value.split("/").pop() || "Download File";
        const isPdf = /\.pdf$/i.test(value);
        const fileUrl = getFileUrl(value);

        return (
            <Button
                variant="outlined"
                startIcon={isPdf ? <PdfIcon color="error" /> : <DocIcon color="primary" />}
                size="small"
                onClick={() => window.open(fileUrl, "_blank")}
                sx={{ textTransform: "none", fontWeight: 600, borderColor: '#ddd', color: '#555' }}
            >
                {fileName}
            </Button>
        );
    }

    // Array: แสดงรายการจุด โดยเว้นระยะและจัด indentation
    if (Array.isArray(value)) {
        return (
            <Stack component="ul" spacing={0.5} sx={{ pl: 3, m: 0 }}>
                {value.map((item, i) => (
                    <Typography
                        component="li"
                        key={i}
                        variant="body2"
                        sx={{ whiteSpace: "pre-wrap", color: "text.secondary" }}
                    >
                        {typeof item === "string" ? item : JSON.stringify(item)}
                    </Typography>
                ))}
            </Stack>
        );
    }

    // ค่า string/number ธรรมดา
    return (
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", color: "text.secondary" }}>
            {value.toString()}
        </Typography>
    );
};