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

    const filteredMeetings = React.useMemo(() => {
        const lowerSearch = searchText.toLowerCase();

        return meetings
            .filter(m => m.meetingTypeCode === '002')
            .filter(m => {
                const meetingNo = m.meetingNo?.toLowerCase() ?? '';
                const description = m.description?.toLowerCase() ?? '';
                return meetingNo.includes(lowerSearch) || description.includes(lowerSearch);
            });
    }, [meetings, searchText]);

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
                                <MenuItem value="latest">แฟ้มล่าสุด</MenuItem>
                                <MenuItem value="first">แฟ้มที่ถูกนำเสนออันดับแรก</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            placeholder="ค้นหาเลขที่แฟ้ม หรือแฟ้มสำนวน"
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
                                            {['ลำดับ', 'เลขคำสั่งตรวจสอบ', 'สถานที่', 'รายละเอียดการประชุม', 'วันที่นำเข้าระบบ', ''].map((text, i) => (
                                                <TableCell
                                                    key={i}
                                                    align={i === 0 || i === 5 ? 'center' : 'left'}
                                                    width={i === 0 ? '5%' : i === 1 ? '12%' : i === 2 ? '20%' : i === 3 ? '15%' : i === 4 ? '8%' : '5%'}
                                                    sx={{ backgroundColor: 'white', fontWeight: 'bold', color: '#000', borderRadius: i === 0 ? '12px 0 0 0' : i === 5 ? '0 12px 0 0' : '0' }}
                                                >
                                                    {text}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>

                                    <TableBody>
                                        {pageData.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                                    ไม่พบข้อมูล
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
                                                        transition: 'background-color 0.2s',
                                                        '&:hover': {
                                                            bgcolor: '#e3f2fd', // สีฟ้าอ่อนเวลา hover
                                                        },
                                                        '& td': { borderBottom: '1px solid #f0f0f0', verticalAlign: 'top' },
                                                        '&:last-child td': { borderBottom: 'none' },
                                                    }}
                                                >
                                                    <TableCell align="center" width="5%" sx={{ fontWeight: 'medium' }}>
                                                        {String((page - 1) * rowsPerPage + index + 1).padStart(2, '0')}
                                                    </TableCell>

                                                    <Tooltip title={row.meetingNo}>
                                                        <TableCell
                                                            width="15%"
                                                            sx={{
                                                                whiteSpace: 'normal',
                                                                overflowWrap: 'break-word',
                                                                wordBreak: 'break-word',
                                                                lineHeight: 1.4,
                                                                fontSize: '0.95rem',
                                                                color: '#444',
                                                            }}
                                                        >
                                                            {row.meetingNo}
                                                        </TableCell>
                                                    </Tooltip>

                                                    <Tooltip title={row.location ?? '-'}>
                                                        <TableCell
                                                            width="15%"
                                                            sx={{
                                                                whiteSpace: 'normal',
                                                                overflowWrap: 'break-word',
                                                                wordBreak: 'break-word',
                                                                lineHeight: 1.4,
                                                                fontSize: '0.95rem',
                                                                color: '#444',
                                                            }}
                                                        >
                                                            {row.location ?? '-'}
                                                        </TableCell>
                                                    </Tooltip>

                                                    <Tooltip title={row.description ?? '-'}>
                                                        <TableCell
                                                            width="40%"
                                                            sx={{
                                                                whiteSpace: 'normal',
                                                                overflowWrap: 'break-word',
                                                                wordBreak: 'break-word',
                                                                lineHeight: 1.4,
                                                                fontSize: '0.95rem',
                                                                color: '#444',
                                                            }}
                                                        >
                                                            {row.description ?? '-'}
                                                        </TableCell>
                                                    </Tooltip>

                                                    <Tooltip title={formatDateTimeFromISO(row.createdAt)}>
                                                        <TableCell
                                                            width="20%"
                                                            sx={{ whiteSpace: 'nowrap', fontSize: '0.9rem', color: '#666' }}
                                                        >
                                                            {formatDateTimeFromISO(row.createdAt)}
                                                        </TableCell>
                                                    </Tooltip>

                                                    <TableCell align="center" width="5%" sx={{ pr: 1 }}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                alert('เมนูเพิ่มเติมยังไม่ทำ');
                                                            }}
                                                            aria-label="เพิ่มเติม"
                                                        >
                                                            <MoreVertIcon sx={{ color: '#1976d2' }} />
                                                        </IconButton>
                                                    </TableCell>
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
