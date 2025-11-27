'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress, Button, Stack, Divider, Chip, Avatar } from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon,
    PictureAsPdf as PdfIcon,
    InsertDriveFile as DocIcon,
    AccessTime as TimeIcon,
    Place as LocationIcon,
    CalendarToday as DateIcon,
    EventNote as AgendaIcon
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/header';
import Sidebar from '@/components/sidebar';

// Define Type
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
};

export default function MeetingDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    const [meeting, setMeeting] = useState<Meeting | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            fetchMeetingDetail(id as string);
        }
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

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    if (loading) return <LoadingState />;
    if (error || !meeting) return <ErrorState message={error} router={router} />;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f4f6f8' }}>
            <Header />
            <Stack direction="row" sx={{ flex: 1, overflow: 'hidden' }}>
                <Sidebar />
                <Box sx={{ flex: 1, p: { xs: 2, md: 4 }, overflow: 'auto' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                        <Button
                            startIcon={<ArrowBackIcon />}
                            onClick={() => router.back()}
                            sx={{
                                color: '#637381',
                                textTransform: 'none',
                                fontWeight: 600,
                                '&:hover': { bgcolor: 'rgba(99, 115, 129, 0.08)' }
                            }}
                        >
                            ย้อนกลับ
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<EditIcon />}
                            onClick={() => alert('ไปหน้าแก้ไข')}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                boxShadow: '0 8px 16px 0 rgba(0, 171, 85, 0.24)',
                                fontWeight: 700,
                                px: 3
                            }}
                        >
                            แก้ไข
                        </Button>
                    </Stack>

                    <Stack spacing={3} maxWidth={1100} mx="auto">

                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 3, md: 5 },
                                borderRadius: 3,
                                border: '1px solid rgba(145, 158, 171, 0.2)',
                                boxShadow: '0 0 2px 0 rgba(145, 158, 171, 0.2), 0 12px 24px -4px rgba(145, 158, 171, 0.12)'
                            }}
                        >
                            {/* Title & Status */}
                            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2} mb={4}>
                                <Box>
                                    <Typography variant="h4" fontWeight={800} color="text.primary">
                                        การประชุมครั้งที่ {meeting.meetingNo}
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary" mt={1} sx={{ maxWidth: 800 }}>
                                        {meeting.description}
                                    </Typography>
                                </Box>
                                <Chip
                                    label={meeting.status || 'DRAFT'}
                                    color={meeting.status === 'PUBLISHED' ? 'warning' : 'success'}
                                    sx={{
                                        fontWeight: 700,
                                        borderRadius: 1,
                                        height: 32,
                                        px: 1,
                                        fontSize: '0.85rem'
                                    }}
                                />
                            </Stack>

                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: { xs: "column", md: "row" },
                                    gap: 3,
                                    p: 3,
                                    borderRadius: 3,
                                    border: "1px solid rgba(145,158,171,0.24)",
                                    background: "linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%)",
                                }}
                            >
                                <InfoTile
                                    icon={<DateIcon sx={{ fontSize: 28 }} color="primary" />}
                                    label="วันที่ประชุม"
                                    value={formatDate(meeting.meetingDate)}
                                />

                                <InfoTile
                                    icon={<TimeIcon sx={{ fontSize: 28 }} color="warning" />}
                                    label="เวลา"
                                    value={meeting.meetingTime ? `${meeting.meetingTime} น.` : "-"}
                                />

                                <InfoTile
                                    icon={<LocationIcon sx={{ fontSize: 28 }} color="error" />}
                                    label="สถานที่"
                                    value={meeting.location}
                                />
                            </Box>
                        </Paper>

                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1.5} mb={3} px={1}>
                                <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32 }}>
                                    <AgendaIcon sx={{ fontSize: 20 }} />
                                </Avatar>
                                <Typography variant="h6" fontWeight={800}>
                                    วาระการประชุม
                                </Typography>
                            </Stack>

                            <Stack spacing={3}>
                                <AgendaCard prefix={1} title="วาระที่ 1" content={meeting.agendaOneData} />
                                <AgendaCard prefix={2} title="วาระที่ 2" content={meeting.agendaTwoData} />
                                <AgendaCard prefix={3} title="วาระที่ 3" content={meeting.agendaThreeData} />
                                <AgendaCard prefix={4} title="วาระที่ 4" content={meeting.agendaFourData} />
                                <AgendaCard prefix={5} title="วาระที่ 5" content={meeting.agendaFiveData} />
                            </Stack>
                        </Box>

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

function AgendaCard({ prefix, title, content }: {
    prefix: number; title: string; content?: string;
}) {
    if (!content) return null;

    let parsed: any = null;
    try {
        parsed = JSON.parse(content);
    } catch {
        parsed = null;
    }

    return (
        <Paper
            elevation={1}
            sx={{
                borderRadius: 2,
                overflow: "hidden",
                border: "1px solid rgba(0,0,0,0.05)",
            }}
        >
            <Box sx={{ p: 3, bgcolor: "background.paper", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: "primary.main", color: "white", fontWeight: "bold" }}>
                        {prefix}
                    </Avatar>
                    <Typography variant="h6" fontWeight="bold" color="text.primary">
                        {title}
                    </Typography>
                </Stack>
            </Box>

            <Box sx={{ p: 3, bgcolor: "background.default" }}>
                {(prefix === 4 || prefix === 5) && parsed && parsed.items && parsed.dialogData ? (
                    <AgendaTableDisplay data={parsed} />
                )
                    : (prefix === 1 || prefix === 2 || prefix === 3) && parsed && parsed.subAgendas ? (
                        <AgendaStandardDisplay prefix={prefix} data={parsed} />
                    )
                        : (
                            parsed && typeof parsed === "object" ? (
                                <RenderJsonData data={parsed} />
                            ) : (
                                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", color: "text.secondary" }}>
                                    {content}
                                </Typography>
                            )
                        )}
            </Box>
        </Paper>
    );
}

const AgendaStandardDisplay = ({ prefix, data }: { prefix: number, data: any }) => {
    const { subAgendas, attachedFile } = data;

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

                    <Typography
                        variant="body1"
                        sx={{
                            whiteSpace: "pre-wrap",
                            color: "text.primary",
                        }}
                    >
                        {sub.detail}
                    </Typography>
                </Box>
            ))}

            {attachedFile && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #ddd' }}>
                    <Typography variant="body2" fontWeight="bold" color="text.secondary" gutterBottom>
                        เอกสารแนบ:
                    </Typography>
                    <Box sx={{ maxWidth: '100%' }}>
                        <RenderValue value={attachedFile} />
                    </Box>
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

import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';

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

    if (typeof value === "string" && /\.(jpe?g|png|gif|webp|svg)$/i.test(value)) {
        return (
            <Box
                component="img"
                src={value}
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
                onClick={() => window.open(value, "_blank")}
            />
        );
    }

    if (typeof value === "string" && /\.(pdf|docx?|xlsx?|pptx?)$/i.test(value)) {
        const fileName = value.split("/").pop() || "Download File";
        const isPdf = /\.pdf$/i.test(value);

        return (
            <Button
                variant="outlined"
                startIcon={isPdf ? <PdfIcon color="error" /> : <DocIcon color="primary" />}
                size="small"
                onClick={() => window.open(value, "_blank")}
                sx={{ textTransform: "none", fontWeight: 600 }}
            >
                {fileName}
            </Button>
        );
    }

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

    return (
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", color: "text.secondary" }}>
            {value.toString()}
        </Typography>
    );
};