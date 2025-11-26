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
    location?: string;
    description?: string;
    status?: string;
    meetingDate?: string;
    meetingTime?: string;
};

export default function SubCommitteeMeetingListPage() {
    const router = useRouter();

    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [filterType, setFilterType] = useState('first');
    const [searchText, setSearchText] = useState('');
    const [page, setPage] = useState(1);
    const rowsPerPage = 10;

    // ฟิลเตอร์ข้อมูลจาก searchText
    const filteredMeetings = React.useMemo(() => {
        const lowerSearch = searchText.toLowerCase();
        return meetings.filter((m) => {
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
        router.push(`/Meetings/subCommittee/${id}`);
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
                        รายการนำเสนอเพื่อเข้าประชุมคณะอนุกรรมการตรวจสอบทรัพย์สิน ภาค/กทม.
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
                            onClick={() => router.push('/Meetings/subCommittee/setup')}
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
                                sx={{ borderRadius: 1, '& fieldset': { border: 'none' } }}
                            >
                                <MenuItem value="first">แฟ้มที่ถูกนำเสนออันดับแรก</MenuItem>
                                <MenuItem value="latest">แฟ้มล่าสุด</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            placeholder="ค้นหาเลขที่แฟ้ม หรือแฟ้มสำนวน"
                            size="small"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            sx={{
                                width: 300,
                                bgcolor: 'white',
                                borderRadius: 1,
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': { border: 'none' },
                                },
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
                        <Paper
                            sx={{
                                width: '100%',
                                mb: 2,
                                borderRadius: 0,
                                boxShadow: 'none',
                                display: 'flex',
                                flexDirection: 'column',
                                flex: 1,
                                minHeight: 300,
                            }}
                            elevation={0}
                        >
                            <TableContainer sx={{ bgcolor: 'white', flex: 1 }}>
                                <Table stickyHeader sx={{ minWidth: 750 }}>
                                    <TableHead>
                                        <TableRow sx={{ '& th': { bgcolor: '#f8f9fa', fontWeight: 'bold', color: '#000' } }}>
                                            <TableCell align="center" width="5%">ลำดับ</TableCell>
                                            <TableCell width="12%">เลขคำสั่งตรวจสอบ</TableCell>
                                            <TableCell width="20%">แฟ้มสำนวน</TableCell>
                                            <TableCell width="15%">วันที่นำเข้าระบบ</TableCell>
                                            <TableCell width="5%" align="center"></TableCell>
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
                                                        '& td': { borderBottom: '1px solid #f0f0f0' },
                                                        '&:last-child td': { borderBottom: 'none' },
                                                    }}
                                                >
                                                    <TableCell align="center">{String((page - 1) * rowsPerPage + index + 1).padStart(2, '0')}</TableCell>

                                                    <Tooltip title={row.meetingNo}>
                                                        <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {row.meetingNo}
                                                        </TableCell>
                                                    </Tooltip>

                                                    <Tooltip title={row.description ?? '-'}>
                                                        <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {row.description ?? '-'}
                                                        </TableCell>
                                                    </Tooltip>

                                                    <TableCell>
                                                        {formatDateTimeFromISO(row.createdAt)}
                                                    </TableCell>

                                                    <TableCell align="center" sx={{ pr: 1 }}>
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
                                    sx={{ color: '#333', textTransform: 'none', fontWeight: 'bold' }}
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
