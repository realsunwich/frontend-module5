'use client';

import { useEffect, useState, useMemo } from 'react';
import {
    Box, Typography, Paper, TableContainer, Table, TableHead, TableRow, TableCell,
    TableBody, CircularProgress, Button, Stack, TextField, InputAdornment,
    Select, MenuItem, IconButton, FormControl, Tooltip, Chip, Divider
} from '@mui/material';
import {
    Search as SearchIcon,
    ArrowBack as ArrowBackIcon,
    ArrowForward as ArrowForwardIcon,
    NavigateBefore as NavigateBeforeIcon,
    Close as CloseIcon,
    Add as AddIcon,
    CalendarToday as CalendarIcon,
    AccessTime as TimeIcon,
    Place as PlaceIcon,
    Sort as SortIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import Sidebar from '@/components/sidebar';

type Meeting = {
    id: number;
    meetingNo: string;
    createdAt: string;
    meetingTypeCode?: string;
    location?: string;
    description?: string;
    status?: string;
    meetingDate?: string;
    meetingTime?: string;
};

// Component: แสดงผล HTML
const HtmlContent = ({ html }: { html: string }) => {
    return (
        <div
            dangerouslySetInnerHTML={{ __html: html }}
            style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.5,
                fontSize: '0.875rem',
                color: '#475569'
            }}
        />
    );
};

export default function MillionAssetsMeetingListPage() {
    const router = useRouter();

    // --- States ---
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [filterType, setFilterType] = useState('latest');
    const [searchText, setSearchText] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const rowsPerPage = 10;

    // --- Debounce Logic ---
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchText);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchText]);

    // --- Fetching ---
    async function fetchMeetings() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('http://localhost:8080/api/meetings');
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data: Meeting[] = await res.json();

            // Filter เอาเฉพาะ meetingTypeCode '003' (MillionAssets)
            const MillionAssetsMeetings = data.filter(m => m.meetingTypeCode === '003' || m.meetingTypeCode?.startsWith('003'));
            setMeetings(MillionAssetsMeetings);
        } catch (err: any) {
            setError(err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchMeetings();
    }, []);

    // --- Filter & Sort Logic ---
    const filteredMeetings = useMemo(() => {
        const lowerSearch = debouncedSearch.toLowerCase();

        const statusKeywords: string[] = [];
        if ('แบบร่าง'.includes(lowerSearch) || 'draft'.includes(lowerSearch)) statusKeywords.push('DRAFT');
        if ('รอลงมติ'.includes(lowerSearch) || 'active'.includes(lowerSearch)) statusKeywords.push('ACTIVE');
        if ('สรุปผลแล้ว'.includes(lowerSearch) || 'สรุป'.includes(lowerSearch) || 'publish'.includes(lowerSearch)) statusKeywords.push('PUBLISH');

        let result = meetings.filter(m => {
            if (!lowerSearch) return true;

            const meetingNo = (m.meetingNo || '').toLowerCase();
            // ลบ HTML tags ออกก่อนค้นหา
            const descriptionRaw = (m.description || '').replace(/<[^>]*>?/gm, '').toLowerCase();
            const location = (m.location || '').toLowerCase();
            const status = (m.status || '').toLowerCase();
            const meetingDate = (m.meetingDate || '').toLowerCase();

            return (
                meetingNo.includes(lowerSearch) ||
                descriptionRaw.includes(lowerSearch) ||
                location.includes(lowerSearch) ||
                status.includes(lowerSearch) ||
                meetingDate.includes(lowerSearch) ||
                (m.status && statusKeywords.includes(m.status))
            );
        });

        result.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return filterType === 'latest' ? dateB - dateA : dateA - dateB;
        });

        return result;
    }, [meetings, debouncedSearch, filterType]);

    // --- Pagination ---
    const totalPages = Math.max(1, Math.ceil(filteredMeetings.length / rowsPerPage));

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [filteredMeetings.length, totalPages, page]);

    const pageData = filteredMeetings.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    // --- Helpers ---
    const handleRowClick = (id: number) => {
        router.push(`/Meetings/MillionAssets/${id}`);
    };

    const formatDateTimeFromISO = (isoStr?: string) => {
        if (!isoStr) return '-';
        try {
            const dt = new Date(isoStr);
            if (isNaN(dt.getTime())) return '-';
            return dt.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch { return '-'; }
    };

    const renderStatusBadge = (status?: string) => {
        const s = status?.toUpperCase();
        let label = status || '-';
        let color: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" = "default";
        let bgcolor = '#f3f4f6';
        let textColor = '#4b5563';

        if (s === 'PUBLISH') {
            label = 'สรุปผลแล้ว';
            color = 'info';
            bgcolor = '#eff6ff';
            textColor = '#1d4ed8';
        } else if (s === 'ACTIVE') {
            label = 'รอลงมติ';
            color = 'success';
            bgcolor = '#f0fdf4';
            textColor = '#15803d';
        } else if (s === 'DRAFT') {
            label = 'แบบร่าง';
            color = 'warning';
            bgcolor = '#fffbeb';
            textColor = '#b45309';
        }

        return (
            <Chip
                label={label}
                size="small"
                sx={{
                    bgcolor: bgcolor,
                    color: textColor,
                    fontWeight: 700,
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: 'transparent',
                    height: 24,
                    fontSize: '0.75rem'
                }}
            />
        );
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f8fafc' }}>
            <Header />
            <Stack direction="row" sx={{ flex: 1, overflow: 'hidden' }}>
                <Sidebar />
                <Box sx={{ flex: 1, p: { xs: 2, md: 4 }, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>

                    {/* Page Title & Actions */}
                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} mb={4} gap={2}>
                        <Box>
                            <Typography variant="h5" fontWeight={800} color="#1e293b" gutterBottom>
                                การประชุมคณะอนุกรรมการ (ทรัพย์สินเกินล้านบาท)
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                จัดการข้อมูลและติดตามสถานะการประชุมตรวจสอบทรัพย์สิน
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => router.push('/Meetings/MillionAssets/setup')}
                            sx={{
                                bgcolor: '#3140BF',
                                borderRadius: 2.5,
                                px: 3, py: 1.2,
                                textTransform: 'none',
                                fontWeight: 'bold',
                                boxShadow: '0 4px 12px rgba(49, 64, 191, 0.25)',
                                '&:hover': { bgcolor: '#1e1b4b', boxShadow: '0 6px 16px rgba(49, 64, 191, 0.35)' }
                            }}
                        >
                            สร้างการประชุม
                        </Button>
                    </Stack>

                    {/* Filters & Search */}
                    <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <TextField
                            placeholder="ค้นหาเลขที่, รายละเอียด..."
                            size="small"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            sx={{
                                flex: 1,
                                minWidth: 280,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    bgcolor: '#f8fafc',
                                    '& fieldset': { borderColor: 'transparent' },
                                    '&:hover fieldset': { borderColor: '#cbd5e1' },
                                    '&.Mui-focused fieldset': { borderColor: '#3140BF' }
                                }
                            }}
                            InputProps={{
                                startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>),
                                endAdornment: searchText && (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setSearchText('')}><CloseIcon fontSize="small" /></IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />

                        <Divider orientation="vertical" flexItem sx={{ height: 28, alignSelf: 'center', borderColor: '#e2e8f0' }} />

                        <Stack direction="row" spacing={2} alignItems="center">
                            <FormControl size="small" sx={{ minWidth: 160 }}>
                                <Select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    displayEmpty
                                    IconComponent={SortIcon}
                                    sx={{
                                        borderRadius: 2,
                                        bgcolor: '#fff',
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                                        fontWeight: 500, color: '#475569'
                                    }}
                                >
                                    <MenuItem value="latest">ล่าสุดก่อน</MenuItem>
                                    <MenuItem value="first">เก่าสุดก่อน</MenuItem>
                                </Select>
                            </FormControl>
                            <Tooltip title="รีเฟรชข้อมูล">
                                <IconButton onClick={fetchMeetings} sx={{ bgcolor: '#f1f5f9', color: '#64748b', '&:hover': { bgcolor: '#e2e8f0', color: '#3140BF' } }}>
                                    <RefreshIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    </Paper>

                    {/* Content Table */}
                    {loading ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400 }}>
                            <CircularProgress size={40} thickness={4} sx={{ color: '#3140BF' }} />
                            <Typography variant="body2" color="text.secondary" mt={2}>กำลังโหลดข้อมูล...</Typography>
                        </Box>
                    ) : error ? (
                        <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center', border: '1px dashed #ef4444', bgcolor: '#fef2f2' }}>
                            <Typography color="error" fontWeight="bold" mb={1}>เกิดข้อผิดพลาด</Typography>
                            <Typography variant="body2" color="error.dark" mb={2}>{error}</Typography>
                            <Button variant="outlined" color="error" onClick={fetchMeetings} startIcon={<RefreshIcon />}>ลองใหม่</Button>
                        </Paper>
                    ) : (
                        <Paper sx={{ width: '100%', borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.01)', overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <TableContainer sx={{ flex: 1 }}>
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0', py: 2 }}>เลขคำสั่ง</TableCell>
                                            <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0', py: 2 }}>รายละเอียดการประชุม</TableCell>
                                            <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0', py: 2 }}>สถานที่ & เวลา</TableCell>
                                            <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0', py: 2, textAlign: 'center' }}>สถานะ</TableCell>
                                        </TableRow>
                                    </TableHead>

                                    <TableBody>
                                        {pageData.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.5 }}>
                                                        <SearchIcon sx={{ fontSize: 48, mb: 1, color: '#cbd5e1' }} />
                                                        <Typography variant="body1" color="text.secondary">ไม่พบข้อมูลการประชุม</Typography>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            pageData.map((row) => (
                                                <TableRow
                                                    key={row.id}
                                                    hover
                                                    onClick={() => handleRowClick(row.id)}
                                                    sx={{
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        '&:hover': { bgcolor: '#f8fafc' },
                                                        '& td': { borderBottom: '1px solid #f1f5f9', py: 2.5 }
                                                    }}
                                                >
                                                    {/* เลขคำสั่ง & วันที่ */}
                                                    <TableCell width="20%" sx={{ verticalAlign: 'top' }}>
                                                        <Stack spacing={0.5}>
                                                            <Typography variant="subtitle2" fontWeight={700} color="#3140BF">
                                                                {row.meetingNo || '-'}
                                                            </Typography>
                                                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                                                <CalendarIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                                                                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                                                    {formatDateTimeFromISO(row.meetingDate)}
                                                                </Typography>
                                                            </Stack>
                                                        </Stack>
                                                    </TableCell>

                                                    {/* รายละเอียด (HTML Content) */}
                                                    <TableCell width="45%" sx={{ verticalAlign: 'top' }}>
                                                        <HtmlContent html={row.description || '-'} />
                                                    </TableCell>

                                                    {/* สถานที่ & เวลา */}
                                                    <TableCell width="20%" sx={{ verticalAlign: 'top' }}>
                                                        <Stack spacing={0.5}>
                                                            <Stack direction="row" spacing={1} alignItems="flex-start">
                                                                <PlaceIcon sx={{ fontSize: 16, color: '#ef4444', mt: 0.2 }} />
                                                                <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.4 }}>
                                                                    {row.location || '-'}
                                                                </Typography>
                                                            </Stack>
                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                <TimeIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {row.meetingTime ? `${row.meetingTime.substring(0, 5)} น.` : '-'}
                                                                </Typography>
                                                            </Stack>
                                                        </Stack>
                                                    </TableCell>

                                                    {/* สถานะ */}
                                                    <TableCell width="15%" align="center" sx={{ verticalAlign: 'top' }}>
                                                        {renderStatusBadge(row.status)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* Pagination */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#fff', borderTop: '1px solid #e2e8f0' }}>
                                {/* ส่วนซ้าย: แสดงจำนวนรายการที่กำลังดูอยู่ */}
                                <Typography variant="body2" color="text.secondary">
                                    แสดง
                                    <Box component="span" fontWeight="bold" color="#1e293b" mx={0.5}>
                                        {filteredMeetings.length > 0 ? (page - 1) * rowsPerPage + 1 : 0}
                                    </Box>
                                    ถึง
                                    <Box component="span" fontWeight="bold" color="#1e293b" mx={0.5}>
                                        {Math.min(page * rowsPerPage, filteredMeetings.length)}
                                    </Box>
                                    จากทั้งหมด
                                    <Box component="span" fontWeight="bold" color="#1e293b" mx={0.5}>
                                        {filteredMeetings.length}
                                    </Box>
                                    รายการ
                                </Typography>

                                {/* ส่วนขวา: ปุ่มเปลี่ยนหน้า */}
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Button
                                        startIcon={<NavigateBeforeIcon />}
                                        onClick={() => setPage(1)}
                                        disabled={page === 1}
                                        size="small"
                                        sx={{ color: '#64748b', textTransform: 'none', display: { xs: 'none', sm: 'inline-flex' } }}
                                    >
                                        หน้าแรก
                                    </Button>

                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <IconButton
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            size="small"
                                            sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5, '&:disabled': { opacity: 0.5 } }}
                                        >
                                            <ArrowBackIcon fontSize="small" />
                                        </IconButton>

                                        <Typography variant="body2" color="text.secondary" sx={{ mx: 2, fontWeight: 600 }}>
                                            {page} / {totalPages}
                                        </Typography>

                                        <IconButton
                                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                            disabled={page >= totalPages}
                                            size="small"
                                            sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5, '&:disabled': { opacity: 0.5 } }}
                                        >
                                            <ArrowForwardIcon fontSize="small" />
                                        </IconButton>
                                    </Stack>
                                </Stack>
                            </Box>
                        </Paper>
                    )}
                </Box>
            </Stack>
        </Box>
    );
}