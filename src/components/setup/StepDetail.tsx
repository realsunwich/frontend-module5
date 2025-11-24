'use client';

import React, { useState } from 'react';
import {
    Box, Stack, TextField, Select, MenuItem, FormControl,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    InputAdornment, OutlinedInput, Paper, IconButton, Typography, Button
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FormRow from '@/components/common/FormRow';
import AddMemberDialog from './AddMemberDialog';

interface StepDetailProps {
    members: any[];
}

export default function StepDetail({ members }: StepDetailProps) {
    const [openDialog, setOpenDialog] = useState(false);

    return (
        <>
            {/* --- เรียกใช้ Dialog --- */}
            <AddMemberDialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
            />
            {/* Form Section (เหมือนเดิม) */}
            <Paper sx={{ p: { xs: 3, md: 3 }, borderRadius: 3, mb: 1, boxShadow: '0px 2px 4px rgba(0,0,0,0.05)' }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} mb={3}>
                    <Box sx={{ flex: 1 }}>
                        <FormRow label="เลขที่การประชุม">
                            <TextField fullWidth placeholder="000/00000" disabled size="small" sx={{ bgcolor: '#f9fafb', '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                        </FormRow>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <FormRow label="วันที่ประชุม" required>
                            <FormControl fullWidth size="small">
                                <OutlinedInput type="date" size="small" sx={{ bgcolor: '#fff', borderRadius: 2 }} endAdornment={<InputAdornment position="end"></InputAdornment>} />
                            </FormControl>
                        </FormRow>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <FormRow label="เวลา" required>
                            <TextField fullWidth type="time" defaultValue="09:00" size="small" sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                        </FormRow>
                    </Box>
                </Stack>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                    <Box sx={{ flex: 1 }}>
                        <FormRow label="สถานที่ประชุม" required>
                            <FormControl fullWidth size="small">
                                <Select defaultValue="" displayEmpty sx={{ bgcolor: '#fff', borderRadius: 2 }}>
                                    <MenuItem value="" disabled><span style={{ color: '#9ca3af' }}>เลือกสถานที่</span></MenuItem>
                                    <MenuItem value="room1">ห้องประชุม 1</MenuItem>
                                    <MenuItem value="online">Online</MenuItem>
                                </Select>
                            </FormControl>
                        </FormRow>
                    </Box>
                    <Box sx={{ flex: 2 }}>
                        <FormRow label="รายละเอียด">
                            <TextField fullWidth size="small" placeholder="ระบุรายละเอียดเพิ่มเติม" sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                        </FormRow>
                    </Box>
                </Stack>
            </Paper>

            {/* Table Section */}
            <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 3, minHeight: 200, boxShadow: '0px 2px 4px rgba(0,0,0,0.05)' }}>
                <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', lg: 'center' }} mb={3} spacing={2}>
                    <Typography variant="h6" fontWeight="bold">คณะอนุกรรมการ</Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} width={{ xs: '100%', lg: 'auto' }} justifyContent="flex-end">
                        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
                            <Select defaultValue="" displayEmpty sx={{ borderRadius: 2 }}>
                                <MenuItem value="" disabled>รายชื่อคณะอนุกรรมการ</MenuItem>
                            </Select>
                        </FormControl>
                        <Button variant="contained" sx={{ bgcolor: '#3140BF', borderRadius: 2, '&:hover': { bgcolor: '#141371' }, textTransform: 'none' }}>ตกลง</Button>
                        <Button
                            onClick={() => setOpenDialog(true)}
                            variant="outlined"
                            startIcon={<AddIcon />}
                            sx={{ color: '#3140BF', borderColor: '#3140BF', borderRadius: 2, '&:hover': { bgcolor: '#eff6ff' }, textTransform: 'none', whiteSpace: 'nowrap' }}
                        >
                            เพิ่มคณะอนุกรรมการ
                        </Button>
                    </Stack>
                </Stack>

                {/* Table Content (เหมือนเดิม) */}
                <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table sx={{ minWidth: 650 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell align="center" sx={{ fontWeight: 'bold', color: '#6b7280', whiteSpace: 'nowrap' }}>ลำดับ</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#6b7280', whiteSpace: 'nowrap' }}>ชื่อ-นามสกุล</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#6b7280', whiteSpace: 'nowrap' }}>สังกัด</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#6b7280', whiteSpace: 'nowrap' }}>หน่วยงาน</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#6b7280', whiteSpace: 'nowrap' }}>เบอร์ติดต่อ</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#6b7280', whiteSpace: 'nowrap' }}>อีเมล</TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {members.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 2, color: '#9ca3af', bgcolor: '#f9fafb' }}>ยังไม่มีข้อมูลคณะอนุกรรมการ</TableCell>
                                </TableRow>
                            ) : (
                                members.map((row, index) => (
                                    <TableRow key={index} hover>
                                        <TableCell align="center">{index + 1}</TableCell>
                                        <TableCell>{row.name}</TableCell>
                                        <TableCell>{row.affiliation}</TableCell>
                                        <TableCell>{row.department}</TableCell>
                                        <TableCell>{row.phone}</TableCell>
                                        <TableCell>{row.email}</TableCell>
                                        <TableCell align="right"><IconButton size="small"><MoreVertIcon /></IconButton></TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </>
    );
}