'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Stack, Button, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import Header from '@/components/header';
import Sidebar from '@/components/sidebar';
import StepLabel from '@/components/StepLabel';

// Import Components ที่แยกไว้
import StepDetail from '@/components/setup/StepDetail';
import StepAgendaCommon from '@/components/setup/StepAgendaCommon';
import StepAgendaConsideration from '@/components/setup/StepAgendaConsideration';
import StepAgendaOther from '@/components/setup/StepAgendaOther';

export default function SetupSubCommitteePage() {
    const router = useRouter();
    const [members] = useState<any[]>([]);
    const [activeStep, setActiveStep] = useState(0);

    const steps = ['รายละเอียด', 'วาระที่ 1', 'วาระที่ 2', 'วาระที่ 3', 'วาระที่ 4', 'วาระที่ 5'];

    const renderStepContent = (step: number) => {
        switch (step) {
            case 0:
                return <StepDetail members={members} />;
            case 1:
                return <StepAgendaCommon agendaNumber={1} title="เรื่องแจ้งเพื่อทราบ" />;
            case 2:
                return <StepAgendaCommon agendaNumber={2} title="รับรองรายงานการประชุม" />;
            case 3:
                return <StepAgendaCommon agendaNumber={3} title="เรื่องสืบเนื่อง" />;
            case 4:
                return <StepAgendaConsideration />;
            case 5:
                return <StepAgendaOther />;

            default:
                return <Typography>ไม่พบข้อมูล</Typography>;
        }
    };

    const handleNext = () => {
        if (activeStep < steps.length - 1) {
            setActiveStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        if (activeStep > 0) {
            setActiveStep((prev) => prev - 1);
        } else {
            router.push('/AssetCheck');
        }
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f9fafb', flexDirection: 'column' }}>
            <Header />
            <Stack direction="row" sx={{ flex: 1, overflow: 'hidden' }}>
                <Sidebar />
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: '#f3f4f6' }}>
                    {/* --- TOP SECTION --- */}
                    <Box sx={{ zIndex: 1, pt: 3, px: { xs: 2, md: 4 } }}>
                        <Box sx={{ maxWidth: 1450, mx: 'auto' }}>
                            <Typography
                                variant="h5"
                                fontWeight="bold"
                                align="center"
                                sx={{ mb: 4, color: '#111827', fontSize: { xs: '1.25rem', md: '1.5rem' } }}
                            >
                                จัดตั้งการประชุมคณะกรรมการตรวจสอบทรัพย์สิน
                            </Typography>
                            <StepLabel
                                steps={steps}
                                activeStep={activeStep}
                                onStepClick={setActiveStep}
                            />
                        </Box>
                    </Box>

                    {/* --- MAIN CONTENT --- */}
                    <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 4 }, pt: 2, overflowY: 'auto' }}>
                        <Box sx={{ maxWidth: 1450, mx: 'auto', pb: 10 }}>
                            {/* แสดงผล Component ตาม Logic switch case */}
                            {renderStepContent(activeStep)}
                            {/* Buttons */}
                            <Stack
                                direction={{ xs: 'column-reverse', sm: 'row' }}
                                justifyContent="space-between"
                                alignItems="stretch"
                                spacing={2}
                                mt={4}
                            >
                                <Button
                                    onClick={handleBack}
                                    variant="outlined"
                                    startIcon={<ArrowBackIcon />}
                                    sx={{ color: '#6b7280', borderColor: '#d1d5db', px: 4, py: 1, textTransform: 'none', '&:hover': { bgcolor: '#f3f4f6', borderColor: '#9ca3af' } }}
                                >
                                    ย้อนกลับ
                                </Button>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <Button variant="outlined" sx={{ color: '#3140BF', borderColor: '#3140BF', px: 4, py: 1, textTransform: 'none' }}>
                                        บันทึกร่าง
                                    </Button>
                                    <Button
                                        onClick={handleNext}
                                        variant="contained"
                                        endIcon={<ArrowForwardIcon />}
                                        sx={{ bgcolor: '#141371', '&:hover': { bgcolor: '#111827' }, px: 4, py: 1, textTransform: 'none' }}
                                    >
                                        {activeStep === steps.length - 1 ? 'เสร็จสิ้น' : 'ถัดไป'}
                                    </Button>
                                </Stack>
                            </Stack>
                        </Box>
                    </Box>
                </Box>
            </Stack>
        </Box>
    );
}