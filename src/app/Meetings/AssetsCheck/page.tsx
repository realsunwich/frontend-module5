'use client';

import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Paper, TableContainer, Table, TableHead, TableRow, TableCell,
    TableBody, CircularProgress, Button, Stack, TextField, InputAdornment,
    Select, MenuItem, IconButton, FormControl, Tooltip,
} from '@mui/material';
import {
    Search as SearchIcon,
    MoreVert as MoreVertIcon,
    ArrowBack as ArrowBackIcon,
    ArrowForward as ArrowForwardIcon,
    NavigateBefore as NavigateBeforeIcon,
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

export default function AssetsCheckListPage() {
    const router = useRouter();

    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [filterType, setFilterType] = useState('latest');
    const [searchText, setSearchText] = useState('');
    const [page, setPage] = useState(1);
    const rowsPerPage = 10;

    // --- ส่วนที่แก้ไข Logic การเรียงข้อมูล ---
    const filteredMeetings = React.useMemo(() => {
        const lowerSearch = searchText.toLowerCase();

        // 1. กรองข้อมูล (Filter)
        let result = meetings
            .filter(m => m.meetingTypeCode === '002')
            .filter(m => {
                const meetingNo = m.meetingNo?.toLowerCase() ?? '';
                const description = m.description?.toLowerCase() ?? '';
                return meetingNo.includes(lowerSearch) || description.includes(lowerSearch);
            });

        // 2. เรียงลำดับข้อมูล (Sort) ตาม createdAt
        result.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();

            if (filterType === 'latest') {
                // มากไปน้อย (ใหม่สุดขึ้นก่อน)
                return dateB - dateA;
            } else {
                // น้อยไปมาก (เก่าสุดขึ้นก่อน)
                return dateA - dateB;
            }
        });

        return result;
    }, [meetings, searchText, filterType]); // เพิ่ม filterType เข้าไปใน dependency
    // ------------------------------------

    const totalPages = Math.max(1, Math.ceil(filteredMeetings.length / rowsPerPage));

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    useEffect(() => {
        fetchMeetings();
    }, []);

    async function fetchMeetings() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('http://localhost:8080/api/showmeeting');
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data: Meeting[] = await res.json();

            // แปลงข้อมูลหากจำเป็น เช่น mock asset_value และ submitter
            const mapped = data.map((item) => ({
                ...item,
            }));

            setMeetings(mapped);
        } catch (err: any) {
            setError(err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
        } finally {
            setLoading(false);
        }
    }

    const handleRowClick = (id: number) => {
        router.push(`/Meetings/AssetsCheck/${id}`);
    };

    const formatDateTimeFromISO = (isoStr?: string) => {
        if (!isoStr) return '-';
        try {
            const dt = new Date(isoStr);
            const buddhistYear = dt.getFullYear() + 543;
            const day = dt.getDate();
            const monthNamesFull = [
                'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
            ];
            const month = monthNamesFull[dt.getMonth()];

            const hours = dt.getHours().toString().padStart(2, '0');
            const minutes = dt.getMinutes().toString().padStart(2, '0');

            return `${day} ${month} ${buddhistYear} ${hours}:${minutes} น.`;
        } catch {
            return '-';
        }
    };

    const renderStatusText = (status?: string) => {
        const s = status?.toUpperCase();
        let label = status || '-';
        let color = 'text.primary';

        if (s === 'PUBLISH') {
            label = 'สรุปผลเรียบร้อยแล้ว';
            color = 'info.main';
        } else if (s === 'ACTIVE') {
            label = 'รอลงมติประชุม';
            color = 'success.main';
        } else if (s === 'DRAFT') {
            label = 'แบบร่าง';
            color = 'text.secondary';
        }

        return (
            <Typography variant="body2" sx={{ color: color, fontWeight: 'bold' }}>
                {label}
            </Typography>
        );
    };

    const pageData = filteredMeetings.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            <Header />
            <Stack direction="row" sx={{ flex: 1, overflow: 'hidden' }}>
                <Sidebar />
                <Box sx={{ flex: 1, p: 3, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" fontWeight="bold" mb={2} sx={{ color: '#000' }}>
                        รายการนำเสนอเพื่อเข้าประชุมคณะกรรมการตรวจสอบทรัพย์สิน
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                        <Button
                            variant="contained"
                            sx={{
                                bgcolor: 'primary.main',
                                borderRadius: 2,
                                px: 3,
                                textTransform: 'none',
                                fontWeight: 'bold',
                                '&:hover': { bgcolor: 'primary.main' },
                            }}
                            onClick={() => router.push('/Meetings/AssetsCheck/setup')}
                        >
                            จัดตั้งการประชุม
                        </Button>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
                        <FormControl size="small" sx={{ minWidth: 220, bgcolor: 'white', borderRadius: 1 }}>
                            <Select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                displayEmpty
                                variant="outlined"
                                sx={{ bgcolor: '#fff', borderRadius: 1 }}
                            >
                                <MenuItem value="latest">บันทึกล่าสุด (ใหม่-เก่า)</MenuItem>
                                <MenuItem value="first">บันทึกแรกสุด (เก่า-ใหม่)</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            placeholder="ค้นหาเลขที่แฟ้ม หรือรายละเอียด"
                            size="small"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            sx={{
                                width: 300,
                                bgcolor: '#fff', borderRadius: 1
                            }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                            <CircularProgress />
                        </Box>
                    ) : error ? (
                        <Typography color="error" align="center" sx={{ mt: 4 }}>
                            {error}
                        </Typography>
                    ) : (
                        <Paper sx={{ width: '100%', borderRadius: 3, boxShadow: '0px 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 800, }}                        >
                            <TableContainer sx={{ flex: 1 }}>
                                <Table stickyHeader sx={{ minWidth: 750 }}>
                                    <TableHead>
                                        <TableRow>
                                            {[
                                                { label: 'ลำดับ', width: '5%', align: 'center' },
                                                { label: 'เลขคำสั่งตรวจสอบ', width: '10%', align: 'left' },
                                                { label: 'สถานที่', width: '15%', align: 'center' },
                                                { label: 'รายละเอียดการประชุม', width: '50%', align: 'center' },
                                                { label: 'วันที่นำเข้าระบบ', width: '10%', align: 'center' },
                                                { label: 'สถานะการประชุม', width: '10%', align: 'center' },
                                            ].map((col, i) => (
                                                <TableCell
                                                    key={i}
                                                    align={col.align as any}
                                                    width={col.width}
                                                    sx={{
                                                        backgroundColor: '#fff',
                                                        borderBottom: '2px solid #f0f0f0',
                                                        fontWeight: 700,
                                                        color: '#455a64',
                                                        fontSize: '0.9rem',
                                                        whiteSpace: 'nowrap',
                                                        borderRadius: i === 0 ? '12px 0 0 0' : i === 5 ? '0 12px 0 0' : '0'
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
                                                <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                                    <Stack alignItems="center" spacing={1}>
                                                        <Typography variant="body1">ไม่พบข้อมูลการประชุม</Typography>
                                                    </Stack>
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
                                                        bgcolor: 'background.paper',
                                                        transition: 'all 0.2s',
                                                        '&:hover': {
                                                            bgcolor: '#f5f9ff',
                                                            transform: 'translateY(-1px)',
                                                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                                            '& td': { borderColor: 'transparent' }
                                                        },
                                                        '& td': {
                                                            borderBottom: '1px solid #f4f6f8',
                                                            verticalAlign: 'middle',
                                                            py: 2
                                                        },
                                                    }}
                                                >
                                                    <TableCell align="center" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                                        {String((page - 1) * rowsPerPage + index + 1).padStart(2, '0')}
                                                    </TableCell>

                                                    <Tooltip title={row.meetingNo}>
                                                        <TableCell sx={{ color: '#1565c0', fontWeight: 500 }}>
                                                            {row.meetingNo}
                                                        </TableCell>
                                                    </Tooltip>

                                                    <Tooltip title={row.location ?? '-'}>
                                                        <TableCell sx={{ color: '#37474f' }}>
                                                            {row.location ?? '-'}
                                                        </TableCell>
                                                    </Tooltip>

                                                    <Tooltip title={row.description ?? '-'}>
                                                        <TableCell sx={{ color: '#546e7a' }}>
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
                                                        </TableCell>
                                                    </Tooltip>

                                                    <Tooltip title={formatDateTimeFromISO(row.createdAt)}>
                                                        <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#78909c' }}>
                                                            {formatDateTimeFromISO(row.createdAt)}
                                                        </TableCell>
                                                    </Tooltip>

                                                    <Tooltip title={row.status ? renderStatusText(row.status).props.children : '-'}>
                                                        <TableCell align="center">
                                                            {renderStatusText(row.status)}
                                                        </TableCell>
                                                    </Tooltip>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    p: 1.5,
                                    bgcolor: '#f3f4f6',
                                    borderTop: '1px solid #e0e0e0',
                                }}
                            >
                                <Button
                                    startIcon={<NavigateBeforeIcon />}
                                    sx={{
                                        color: page === 1 ? '#aaa' : '#333',
                                        textTransform: 'none',
                                        fontWeight: 'bold',
                                        mr: 1,
                                    }}
                                    onClick={() => setPage(1)}
                                    disabled={page === 1}
                                >
                                    กลับไปหน้า 1
                                </Button>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <IconButton onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} size="small">
                                        <ArrowBackIcon fontSize="small" />
                                    </IconButton>

                                    <Button
                                        variant="contained"
                                        sx={{
                                            bgcolor: '#2d3748',
                                            color: 'white',
                                            minWidth: 100,
                                            '&:hover': { bgcolor: '#1a202c' },
                                        }}
                                        endIcon={<ArrowForwardIcon />}
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={page >= totalPages}
                                    >
                                        หน้าต่อไป
                                    </Button>

                                    <Typography variant="body2" sx={{ mx: 1 }}>
                                        หน้า
                                    </Typography>
                                    <Box
                                        component="input"
                                        value={page}
                                        readOnly
                                        sx={{
                                            width: 40,
                                            textAlign: 'center',
                                            border: '1px solid #ddd',
                                            borderRadius: 1,
                                            py: 0.5,
                                            userSelect: 'none',
                                            backgroundColor: '#fff',
                                        }}
                                    />
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        จาก {totalPages}
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    )}
                </Box>
            </Stack>
        </Box>
    );
}