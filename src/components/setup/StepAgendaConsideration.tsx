'use client';

import React, { useState } from 'react';
import {
    Paper, Typography, Box, Divider, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Menu, MenuItem,
    ListItemIcon, ListItemText, Select, MenuItem as SelectMenuItem, FormControl,
    Stack, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';

// --- Mock Data (หน้าหลัก) ---
const MOCK_ALL_CASES = [
    { id: 1, fileNo: '00/0000', name: 'นายข้าวมัน ไก่ทอด' },
    { id: 2, fileNo: '00/0000', name: 'นายข้าวเหนียว หมูปิ้ง' },
    { id: 3, fileNo: '00/0000', name: 'นางคู่ เสื้อ หาว' },
    { id: 4, fileNo: '00/0000', name: 'นางสาวไก่ทอด น้ำปลา', selectedAgenda: 'วาระที่ 4' },
];

const MOCK_AGENDA_ITEMS = [
    { id: 1, order: '4.1', name: 'นายข้าวมัน ไก่ทอด', region: 'ป.ป.ส. กทม.' },
    { id: 2, order: '4.2', name: 'นายข้าวมัน ไก่ทอด', region: 'ป.ป.ส. ภาค1' },
];

// --- Mock Data (ข้อมูลใน Dialog ตามรูป) ---
const MOCK_DIALOG_DATA = [
    { id: 1, fileNo: '0000/0000', name: 'นายข้าวมัน ไก่ทอด', asset: 'เงินสด จำนวน 100,000 บาท', amount: '100,000.00', status: 'seize' },
    { id: 2, fileNo: '', name: '', asset: 'เงินสด จำนวน 100,000 บาท', amount: '100,000.00', status: 'pending' },
    { id: 3, fileNo: '', name: '', asset: 'เงินสด จำนวน 100,000 บาท', amount: '100,000.00', status: 'reject' },
];

export default function StepAgendaConsideration() {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const openMenu = Boolean(anchorEl);

    // State สำหรับ Dialog
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleClickMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    // ฟังก์ชันเปิด Dialog (กดปุ่มไหนก็เปิดหน้าเดียวกันตามรูป)
    const handleOpenDialog = () => {
        setDialogOpen(true);
        handleCloseMenu();
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
    };

    return (
        <Box sx={{ width: '100%' }}>

            {/* --- ส่วนหน้าจอหลัก (Flexbox Layout) --- */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: 3,
                    alignItems: 'flex-start'
                }}
            >
                {/* Left Column */}
                <Box sx={{ flex: { xs: '1 1 100%', md: 4 }, width: '100%', minWidth: 0 }}>
                    <Paper elevation={0} sx={{ height: '100%', bgcolor: '#fff', borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0px 4px 20px rgba(0,0,0,0.02)' }}>
                        <Box sx={{ p: 2, borderBottom: '1px solid #f1f5f9' }}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <FolderOpenIcon fontSize="small" sx={{ color: '#64748b' }} />
                                <Typography variant="subtitle1" fontWeight="bold" color="#334155">เลือกแฟ้มสำนวนคดี</Typography>
                            </Stack>
                        </Box>
                        <TableContainer>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: '#fff' }}>
                                    <TableRow>
                                        <TableCell sx={{ color: '#64748b', fontWeight: '600', borderBottom: '1px solid #f1f5f9' }}>เลขที่แฟ้ม</TableCell>
                                        <TableCell sx={{ color: '#64748b', fontWeight: '600', borderBottom: '1px solid #f1f5f9' }}>ชื่อเรื่อง</TableCell>
                                        <TableCell align="right" sx={{ borderBottom: '1px solid #f1f5f9' }}></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {MOCK_ALL_CASES.map((row) => (
                                        <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 }, transition: 'background-color 0.2s' }}>
                                            <TableCell sx={{ color: '#475569', fontSize: '0.875rem' }}>{row.fileNo}</TableCell>
                                            <TableCell sx={{ color: '#1e293b', fontWeight: 500 }}>
                                                <Stack direction="column" spacing={0.5}>
                                                    <Box component="span">{row.name}</Box>
                                                </Stack>
                                            </TableCell>
                                            <TableCell align="right" sx={{ p: 1 }}>
                                                <IconButton size="small" onClick={handleClickMenu} sx={{ color: '#94a3b8' }}>
                                                    <MoreVertIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Box>

                {/* Right Column */}
                <Box sx={{ flex: { xs: '1 1 100%', md: 8 }, width: '100%', minWidth: 0 }}>
                    <Paper elevation={0} sx={{ p: 0, borderRadius: 3, bgcolor: '#fff', border: '1px solid #e2e8f0', boxShadow: '0px 4px 20px rgba(0,0,0,0.03)' }}>
                        <Box sx={{ p: 3, pb: 2 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="h6" fontWeight="bold" sx={{ color: '#1e293b' }}>วาระที่ 4 เรื่องเสนอเพื่อพิจารณา</Typography>
                                <Chip label={`${MOCK_AGENDA_ITEMS.length} รายการ`} size="small" color="primary" sx={{ bgcolor: '#e0e7ff', color: '#3140BF', fontWeight: 'bold' }} />
                            </Stack>
                        </Box>
                        <Divider sx={{ borderColor: '#e2e8f0', mb: 2 }} />
                        <Box sx={{ px: 3, pb: 3 }}>
                            <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2, borderColor: '#e2e8f0' }}>
                                <Table>
                                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold', width: '10%', color: '#475569' }}>ลำดับ</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', width: '50%', color: '#475569' }}>เรื่อง / แฟ้มสำนวน</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', width: '30%', color: '#475569' }}>หน่วยงานเจ้าของเรื่อง</TableCell>
                                            <TableCell align="right" sx={{ width: '10%', color: '#475569' }}>จัดการ</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {MOCK_AGENDA_ITEMS.map((item) => (
                                            <TableRow key={item.id} hover>
                                                <TableCell sx={{ color: '#334155', fontWeight: 500 }}>{item.order}</TableCell>
                                                <TableCell sx={{ color: '#334155' }}>{item.name}</TableCell>
                                                <TableCell sx={{ color: '#334155' }}>{item.region}</TableCell>
                                                <TableCell align="right">
                                                    <IconButton size="small" onClick={handleClickMenu} sx={{ color: '#94a3b8', '&:hover': { color: '#3140BF', bgcolor: '#eff6ff' } }}>
                                                        <MoreVertIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    </Paper>
                </Box>
            </Box>

            {/* --- Menu Popup --- */}
            <Menu
                anchorEl={anchorEl}
                open={openMenu}
                onClose={handleCloseMenu}
                PaperProps={{ elevation: 3, sx: { borderRadius: 2, minWidth: 160, mt: 1, boxShadow: '0px 10px 30px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9' } }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem onClick={handleOpenDialog} sx={{ py: 1.5 }}>
                    <ListItemIcon><VisibilityOutlinedIcon fontSize="small" sx={{ color: '#3140BF' }} /></ListItemIcon>
                    <ListItemText primary="ดูรายละเอียด" primaryTypographyProps={{ fontSize: 14, fontWeight: 500, color: '#334155' }} />
                </MenuItem>
                <MenuItem onClick={handleOpenDialog} sx={{ py: 1.5 }}>
                    <ListItemIcon><EditOutlinedIcon fontSize="small" sx={{ color: '#3140BF' }} /></ListItemIcon>
                    <ListItemText primary="แก้ไขข้อมูล" primaryTypographyProps={{ fontSize: 14, fontWeight: 500, color: '#334155' }} />
                </MenuItem>
            </Menu>

            {/* --- Dialog (Popup Table) --- */}
            <Dialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                maxWidth="xl" // กว้างพิเศษ (Extra Large) เพื่อให้ตารางไม่อัดแน่น
                fullWidth
                PaperProps={{ sx: { borderRadius: 2 } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0e0e0', pb: 2 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
                        เปลี่ยนแปลงคำสั่ง ตามมติของคณะอนุกรรมการตรวจสอบทรัพย์สิน
                    </Typography>
                    <IconButton onClick={handleCloseDialog} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 3, bgcolor: '#fafafa' }}>
                    {/* Table ภายใน Dialog */}
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1, border: '1px solid #e0e0e0' }}>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#333', whiteSpace: 'nowrap' }}>เลขแฟ้มคดี</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#333', whiteSpace: 'nowrap' }}>ชื่อ-นามสกุล</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#333', whiteSpace: 'nowrap' }}>รายการทรัพย์</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#333', whiteSpace: 'nowrap', textAlign: 'right' }}>จำนวนเงิน</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#333', whiteSpace: 'nowrap', width: '220px' }}>เสนอยึด/อายัด</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#333', whiteSpace: 'nowrap', width: '200px' }}>หมายเหตุ</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {MOCK_DIALOG_DATA.map((row) => (
                                    <TableRow key={row.id} sx={{ bgcolor: '#fff' }}>
                                        <TableCell sx={{ color: '#666', fontSize: '0.9rem' }}>{row.fileNo}</TableCell>
                                        <TableCell sx={{ color: '#666', fontSize: '0.9rem' }}>{row.name}</TableCell>
                                        <TableCell sx={{ color: '#333', fontSize: '0.9rem' }}>{row.asset}</TableCell>
                                        <TableCell sx={{ color: '#333', fontSize: '0.9rem', textAlign: 'right' }}>{row.amount}</TableCell>
                                        <TableCell>
                                            <FormControl fullWidth size="small">
                                                <Select
                                                    defaultValue={row.status}
                                                    displayEmpty
                                                    sx={{
                                                        height: 36,
                                                        fontSize: 13,
                                                        borderRadius: 1,
                                                        bgcolor: '#fff',
                                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e0e0e0' }
                                                    }}
                                                >
                                                    <SelectMenuItem value="seize">ยึด/อายัด</SelectMenuItem>
                                                    <SelectMenuItem value="pending">ยังไม่ยึด/อายัดขาดรายละเอียด</SelectMenuItem>
                                                    <SelectMenuItem value="reject">ไม่ยึด/อายัด</SelectMenuItem>
                                                </Select>
                                            </FormControl>
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                variant="outlined"
                                                placeholder=""
                                                sx={{
                                                    bgcolor: '#fff',
                                                    '& .MuiOutlinedInput-root': {
                                                        height: 36,
                                                        borderRadius: 1,
                                                        '& fieldset': { borderColor: '#e0e0e0' }
                                                    }
                                                }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>

                <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0', justifyContent: 'flex-end' }}>
                    {/* ปุ่ม Action ใน Dialog */}
                    <Button onClick={handleCloseDialog} variant="contained" sx={{ borderRadius: 2, bgcolor: '#fff', color: '#333', border: '1px solid #ddd', boxShadow: 'none', '&:hover': { bgcolor: '#f5f5f5' } }}>
                        ยกเลิก
                    </Button>
                    <Button onClick={handleCloseDialog} variant="contained" startIcon={<SaveIcon />} sx={{ borderRadius: 2, bgcolor: '#3140BF', boxShadow: 'none', '&:hover': { bgcolor: '#2c3aa8' } }}>
                        บันทึก
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
}