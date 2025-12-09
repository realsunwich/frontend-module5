'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
    Box, Typography, Paper, TableContainer, Table, TableHead, TableRow, TableCell,
    TableBody, CircularProgress, Button, Stack, TextField, InputAdornment,
    Select, MenuItem, IconButton, FormControl, Tooltip, Alert
} from '@mui/material';
import {
    Search as SearchIcon,
    ArrowBack as ArrowBackIcon,
    ArrowForward as ArrowForwardIcon,
    NavigateBefore as NavigateBeforeIcon,
    Close as CloseIcon,
    Add as AddIcon // เพิ่ม Icon เครื่องหมายบวก
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
            const description = (m.description || '').toLowerCase();
            const location = (m.location || '').toLowerCase();
            const status = (m.status || '').toLowerCase();

            return (
                meetingNo.includes(lowerSearch) ||
                description.includes(lowerSearch) ||
                location.includes(lowerSearch) ||
                status.includes(lowerSearch) ||
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
            return dt.toLocaleDateString('th-TH', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            }) + ' น.';
        } catch {
            return '-';
        }
    };

    const renderStatusText = (status?: string) => {
        const s = status?.toUpperCase();
        let label = status || '-';
        let color = 'text.primary';
        let bg = 'transparent';

        if (s === 'PUBLISH') {
            label = 'สรุปผลเรียบร้อยแล้ว';
            color = '#1e40af';
            bg = '#dbeafe';
        } else if (s === 'ACTIVE') {
            label = 'รอลงมติประชุม';
            color = '#065f46';
            bg = '#d1fae5';
        } else if (s === 'DRAFT') {
            label = 'แบบร่าง';
            color = '#92400e';
            bg = '#fef3c7';
        }

        return (
            <Box sx={{
                bgcolor: bg, color: color,
                px: 1.5, py: 0.5, borderRadius: 1,
                display: 'inline-block', fontSize: '0.8rem', fontWeight: 600
            }}>
                {label}
            </Box>
        );
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            <Header />
            <Stack direction="row" sx={{ flex: 1, overflow: 'hidden' }}>
                <Sidebar />
                <Box sx={{ flex: 1, p: 3, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h5" fontWeight="bold" mb={3} sx={{ color: '#1e293b' }}>
                        รายการนำเสนอเพื่อเข้าประชุมคณะอนุกรรมการตรวจสอบทรัพย์สินเกินล้านบาท
                    </Typography>

                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" mb={3} gap={2}>

                        {/* --- ปุ่มสร้างการประชุม (แก้ไขแล้ว) --- */}
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            sx={{
                                bgcolor: '#3140BF',
                                borderRadius: 2,
                                px: 3,
                                py: 1,
                                textTransform: 'none',
                                fontWeight: 'bold',
                                boxShadow: '0 4px 6px -1px rgba(49, 64, 191, 0.2)',
                                '&:hover': {
                                    bgcolor: '#1e1b4b',
                                    boxShadow: '0 10px 15px -3px rgba(49, 64, 191, 0.3)'
                                },
                            }}
                            onClick={() => router.push('/Meetings/MillionAssets/setup')}
                        >
                            สร้างการประชุมใหม่
                        </Button>
                        {/* ------------------------------------- */}

                        <Stack direction="row" spacing={2} alignItems="center">
                            <FormControl size="small" sx={{ minWidth: 180 }}>
                                <Select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    displayEmpty
                                    sx={{ bgcolor: '#fff', borderRadius: 2, '& fieldset': { borderColor: '#e2e8f0' } }}
                                >
                                    <MenuItem value="latest">บันทึกล่าสุด (ใหม่-เก่า)</MenuItem>
                                    <MenuItem value="first">บันทึกแรกสุด (เก่า-ใหม่)</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                placeholder="ค้นหาเลขที่, รายละเอียด, สถานะ..."
                                size="small"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                sx={{
                                    width: 320,
                                    bgcolor: '#fff', borderRadius: 2,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        '& fieldset': { borderColor: '#e2e8f0' },
                                        '&:hover fieldset': { borderColor: '#cbd5e1' },
                                        '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
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
                        </Stack>
                    </Stack>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                            <CircularProgress />
                        </Box>
                    ) : error ? (
                        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
                    ) : (
                        <Paper sx={{ width: '100%', borderRadius: 3, boxShadow: '0px 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                            <TableContainer sx={{ flex: 1 }}>
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            {[
                                                { label: 'ลำดับ', width: '5%', align: 'center' },
                                                { label: 'เลขคำสั่งตรวจสอบ', width: '15%', align: 'left' },
                                                { label: 'สถานที่', width: '15%', align: 'left' },
                                                { label: 'รายละเอียดการประชุม', width: '35%', align: 'left' },
                                                { label: 'วันที่นำเข้าระบบ', width: '15%', align: 'center' },
                                                { label: 'สถานะ', width: '15%', align: 'center' },
                                            ].map((col, i) => (
                                                <TableCell
                                                    key={i}
                                                    align={col.align as any}
                                                    width={col.width}
                                                    sx={{
                                                        bgcolor: '#f8fafc',
                                                        borderBottom: '1px solid #e2e8f0',
                                                        fontWeight: 700,
                                                        color: '#475569',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {col.label}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>

                                    <TableBody>
                                        {pageData.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                                                    <Typography variant="body1">ไม่พบข้อมูลการประชุม</Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            pageData.map((row, index) => (
                                                <TableRow
                                                    hover
                                                    onClick={() => handleRowClick(row.id)}
                                                    key={row.id}
                                                    sx={{
                                                        cursor: 'pointer',
                                                        transition: 'all 0.1s',
                                                        '&:hover': { bgcolor: '#f1f5f9' },
                                                        '& td': { borderBottom: '1px solid #f1f5f9', py: 2 }
                                                    }}
                                                >
                                                    <TableCell align="center" sx={{ color: '#64748b', fontWeight: 500 }}>
                                                        {String((page - 1) * rowsPerPage + index + 1).padStart(2, '0')}
                                                    </TableCell>

                                                    <TableCell sx={{ color: '#2563eb', fontWeight: 600 }}>
                                                        {row.meetingNo || '-'}
                                                    </TableCell>

                                                    <TableCell sx={{ color: '#334155' }}>
                                                        <Tooltip title={row.location ?? ''}>
                                                            <Typography noWrap variant="body2" sx={{ maxWidth: 150 }}>{row.location ?? '-'}</Typography>
                                                        </Tooltip>
                                                    </TableCell>

                                                    <TableCell sx={{ color: '#475569' }}>
                                                        <Tooltip title={row.description ?? ''}>
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    display: '-webkit-box',
                                                                    overflow: 'hidden',
                                                                    WebkitBoxOrient: 'vertical',
                                                                    WebkitLineClamp: 2,
                                                                }}
                                                            >
                                                                {row.description ?? '-'}
                                                            </Typography>
                                                        </Tooltip>
                                                    </TableCell>

                                                    <TableCell align="center" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                                                        {formatDateTimeFromISO(row.createdAt)}
                                                    </TableCell>

                                                    <TableCell align="center">
                                                        {renderStatusText(row.status)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* Pagination */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#fff', borderTop: '1px solid #e2e8f0' }}>
                                <Button
                                    startIcon={<NavigateBeforeIcon />}
                                    sx={{ color: '#64748b', textTransform: 'none' }}
                                    onClick={() => setPage(1)}
                                    disabled={page === 1}
                                >
                                    หน้าแรก
                                </Button>

                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <IconButton onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} size="small" sx={{ border: '1px solid #e2e8f0' }}>
                                        <ArrowBackIcon fontSize="small" />
                                    </IconButton>
                                    <Typography variant="body2" color="text.secondary">
                                        หน้า <strong>{page}</strong> จาก <strong>{totalPages}</strong>
                                    </Typography>
                                    <IconButton onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} size="small" sx={{ border: '1px solid #e2e8f0' }}>
                                        <ArrowForwardIcon fontSize="small" />
                                    </IconButton>
                                </Stack>
                            </Box>
                        </Paper>
                    )}
                </Box>
            </Stack>
        </Box>
    );
}