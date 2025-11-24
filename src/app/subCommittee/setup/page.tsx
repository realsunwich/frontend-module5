'use client';

import React, { useState } from 'react';
import {
    Typography, Box, Stack, Button, TextField, Select, MenuItem, InputLabel, FormControl,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    InputAdornment, OutlinedInput, Paper, IconButton
} from '@mui/material';

// Import Icons
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// Import Components
import Header from '@/components/header';
import Sidebar from '@/components/sidebar';
import StepLabel from '@/components/StepLabel';

export default function SetupSubCommitteePage() {
    const [members] = useState<any[]>([]);

    // 👇 1. สร้าง State เก็บขั้นตอนปัจจุบัน (เริ่มที่ 0)
    const [activeStep, setActiveStep] = useState(0);

    const steps = ['รายละเอียด', 'วาระที่ 1', 'วาระที่ 2', 'วาระที่ 3', 'วาระที่ 4', 'วาระที่ 5'];

    // 👇 2. ฟังก์ชันกดปุ่มถัดไป
    const handleNext = () => {
        if (activeStep < steps.length - 1) {
            setActiveStep((prev) => prev + 1);
        }
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f9fafb', flexDirection: 'column' }}>

            <Header />

            <Stack direction="row" sx={{ flex: 1, overflow: 'hidden' }}>

                <Sidebar />

                <Box component="main" sx={{ flex: 1, p: 4, overflowY: 'auto', bgcolor: '#f3f4f6' }}>
                    <Box sx={{ maxWidth: 1100, mx: 'auto', pb: 10 }}>

                        <Typography variant="h5" fontWeight="bold" align="center" sx={{ mb: 4, color: '#111827' }}>
                            จัดตั้งการประชุมคณะอนุกรรมการ
                        </Typography>

                        {/* 👇 3. ส่ง State และ Function ลงไปใน Props */}
                        <StepLabel
                            steps={steps}
                            activeStep={activeStep}
                            onStepClick={setActiveStep} // ส่งฟังก์ชันเปลี่ยนหน้าไปให้กดเองได้
                        />

                        {/* --- FORM SECTION --- */}
                        {/* คุณสามารถใช้ activeStep เพื่อซ่อน/แสดงเนื้อหาตามขั้นตอนได้ */}
                        <Paper sx={{ p: 4, borderRadius: 3, mb: 3, boxShadow: '0px 2px 4px rgba(0,0,0,0.05)' }}>
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} mb={3}>
                                <Box sx={{ flex: 1 }}>
                                    <InputLabel shrink sx={{ mb: 1 }}>เลขที่การประชุม</InputLabel>
                                    <TextField fullWidth placeholder="000/00000" disabled size="small" sx={{ bgcolor: '#f9fafb' }} />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <InputLabel shrink sx={{ mb: 1 }}>วันที่ประชุม</InputLabel>
                                    <FormControl fullWidth size="small">
                                        <OutlinedInput
                                            type="date"
                                            endAdornment={<InputAdornment position="end"><CalendarTodayIcon fontSize="small" /></InputAdornment>}
                                            sx={{ bgcolor: '#fff' }}
                                        />
                                    </FormControl>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <InputLabel shrink sx={{ mb: 1 }}>เวลา</InputLabel>
                                    <TextField fullWidth type="time" defaultValue="09:00" size="small" />
                                </Box>
                            </Stack>
                        </Paper>

                        {/* --- TABLE SECTION --- */}
                        <Paper sx={{ p: 4, borderRadius: 3, minHeight: 400, boxShadow: '0px 2px 4px rgba(0,0,0,0.05)' }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" mb={3} spacing={2}>
                                <Typography variant="h6" fontWeight="bold">คณะอนุกรรมการ</Typography>
                                <Stack direction="row" spacing={2} width={{ xs: '100%', sm: 'auto' }}>
                                    <FormControl size="small" sx={{ minWidth: 200 }}>
                                        <Select defaultValue="" displayEmpty>
                                            <MenuItem value="" disabled>รายชื่อคณะอนุกรรมการ</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <Button variant="contained" sx={{ bgcolor: '#3140BF', '&:hover': { bgcolor: '#141371' }, textTransform: 'none' }}>
                                        ตกลง
                                    </Button>
                                    <Button variant="outlined" startIcon={<AddIcon />} sx={{ color: '#3140BF', borderColor: '#3140BF', '&:hover': { bgcolor: '#eff6ff' }, textTransform: 'none', whiteSpace: 'nowrap' }}>
                                        เพิ่มคณะอนุกรรมการ
                                    </Button>
                                </Stack>
                            </Stack>

                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell align="center" sx={{ fontWeight: 'bold', color: '#6b7280' }}>ลำดับ</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#6b7280' }}>ชื่อ-นามสกุล</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#6b7280' }}>สังกัด</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#6b7280' }}>หน่วยงาน</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#6b7280' }}>เบอร์ติดต่อ</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#6b7280' }}>อีเมล</TableCell>
                                            <TableCell></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {members.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center" sx={{ py: 8, color: '#9ca3af', bgcolor: '#f9fafb' }}>
                                                    ยังไม่มีข้อมูลคณะอนุกรรมการ
                                                </TableCell>
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

                        {/* --- ACTION BUTTONS --- */}
                        <Stack direction="row" justifyContent="flex-end" spacing={2} mt={4}>
                            <Button variant="outlined" sx={{ color: '#3140BF', borderColor: '#3140BF', px: 4, py: 1, textTransform: 'none' }}>
                                บันทึกร่าง
                            </Button>

                            {/* 👇 4. ผูกฟังก์ชัน handleNext กับปุ่ม */}
                            <Button
                                onClick={handleNext}
                                variant="contained"
                                endIcon={<ArrowForwardIcon />}
                                sx={{ bgcolor: '#141371', '&:hover': { bgcolor: '#111827' }, px: 4, py: 1, textTransform: 'none' }}
                            >
                                {activeStep === steps.length - 1 ? 'เสร็จสิ้น' : 'ถัดไป'}
                            </Button>
                        </Stack>

                    </Box>
                </Box>
            </Stack>
        </Box>
    );
}