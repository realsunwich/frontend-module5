'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Stack, Button, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CheckIcon from '@mui/icons-material/Check';

import Header from '@/components/header';
import Sidebar from '@/components/sidebar';
import StepLabel from '@/components/StepLabel';

// Import Components
import StepDetail, { Member } from '@/components/setup/StepDetail';
import StepAgendaCommon from '@/components/setup/StepAgendaCommon';
import StepAgendaConsideration from '@/components/setup/StepAgendaConsideration';
import StepAgendaOther from '@/components/setup/StepAgendaOther';

export default function SetupSubCommitteePage() {
    const router = useRouter();
    const [activeStep, setActiveStep] = useState(0);

    // State สำหรับข้อมูลการประชุม
    const [meetingInfo, setMeetingInfo] = useState({
        meetingDate: '',
        startTime: '',
        location: '',
        detail: ''
    });
    // State สำหรับรายชื่อคณะกรรมการ
    const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);

    const steps = ['รายละเอียด', 'วาระที่ 1', 'วาระที่ 2', 'วาระที่ 3', 'วาระที่ 4', 'วาระที่ 5'];

    // ฟังก์ชันสำหรับ Reset ค่าทั้งหมด
    const resetForm = () => {
        setMeetingInfo({
            meetingDate: '',
            startTime: '',
            location: '',
            detail: ''
        });
        setSelectedMembers([]);
    };

    const handleSaveData = async (status: 'DRAFT' | 'ACTIVE') => {
        // Validation เฉพาะตอนกด Next (ACTIVE) และอยู่ที่ Step แรก
        if (activeStep === 0 && status === 'ACTIVE') {
            if (!meetingInfo.meetingDate || !meetingInfo.location) {
                alert("กรุณาระบุวันที่และสถานที่ประชุม");
                return false;
            }
        }

        const payload = {
            meetingTypeCode: '001',
            meetingDate: meetingInfo.meetingDate === '' ? null : meetingInfo.meetingDate,
            meetingTime: meetingInfo.startTime ? `${meetingInfo.startTime}:00` : null,
            location: meetingInfo.location,
            description: meetingInfo.detail,
            memberIds: selectedMembers.map((member) => member.id),
            currentStep: activeStep,
            status: status
        };

        console.log("Saving Payload:", payload);

        try {
            const response = await fetch('http://localhost:8080/api/meetings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Server error occurred');
            }

            const data = await response.json();
            console.log("Save Success:", data);
            return true;
        } catch (error) {
            console.error("Error saving:", error);
            alert("เกิดข้อผิดพลาดในการบันทึก: " + (error instanceof Error ? error.message : "Unknown error"));
            return false;
        }
    };

    const handleNext = async () => {
        const success = await handleSaveData('ACTIVE');

        if (success) {
            if (activeStep === steps.length - 1) {
                alert("บันทึกข้อมูลทั้ง 5 วาระเรียบร้อยแล้ว");
                resetForm();
                router.push('/Meetings/subCommittee');
            } else {
                setActiveStep((prev) => prev + 1);
            }
        }
    };

    const handleSaveDraft = async () => {
        const success = await handleSaveData('DRAFT');
        if (success) {
            alert("บันทึกแบบร่างสำเร็จ");
        }
    };

    const handleBack = () => {
        if (activeStep > 0) {
            setActiveStep((prev) => prev - 1);
        } else {
            router.push('/Meetings/subCommittee');
        }
    };

    const handleOpenEbook = () => {
        alert("เปิดหน้า E-Book");
        // router.push('/ebook-preview'); // ตัวอย่างการลิงก์ไปหน้าอื่น
    };

    const renderStepContent = (step: number) => {
        switch (step) {
            case 0:
                return (
                    <StepDetail
                        meetingInfo={meetingInfo}
                        setMeetingInfo={setMeetingInfo}
                        selectedMembers={selectedMembers}
                        setSelectedMembers={setSelectedMembers}
                    />
                );
            case 1:
                return <StepAgendaCommon agendaNumber={1} />;
            case 2:
                return <StepAgendaCommon agendaNumber={2} />;
            case 3:
                return <StepAgendaCommon agendaNumber={3} />;
            case 4:
                return <StepAgendaConsideration />;
            case 5:
                return <StepAgendaOther />;
            default:
                return <Typography>ไม่พบข้อมูล</Typography>;
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
                                จัดตั้งการประชุมคณะอนุกรรมการ
                            </Typography>
                            <StepLabel
                                steps={steps}
                                activeStep={activeStep}
                                onStepClick={setActiveStep}
                            />
                        </Box>
                    </Box>

                    {/* --- MAIN CONTENT --- */}
                    <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 2 }, pt: 2, overflowY: 'auto' }}>
                        <Box sx={{ maxWidth: 1450, mx: 'auto', pb: 10 }}>
                            {renderStepContent(activeStep)}
                            {/* Buttons Navigation */}
                            <Stack
                                direction={{ xs: 'column-reverse', sm: 'row' }}
                                justifyContent="space-between"
                                alignItems="stretch"
                                spacing={2}
                                mt={1}
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
                                    <Button
                                        variant="outlined"
                                        startIcon={<SaveIcon />}
                                        onClick={handleSaveDraft}
                                        sx={{ color: '#3140BF', borderColor: '#3140BF', px: 4, py: 1, textTransform: 'none', '&:hover': { bgcolor: '#eff6ff' } }}
                                    >
                                        บันทึกร่าง
                                    </Button>

                                    {activeStep === steps.length - 1 && (
                                        <Button
                                            variant="outlined"
                                            startIcon={<MenuBookIcon />}
                                            onClick={handleOpenEbook}
                                            sx={{
                                                color: '#d97706',
                                                borderColor: '#d97706',
                                                px: 4,
                                                py: 1,
                                                textTransform: 'none',
                                                '&:hover': { bgcolor: '#fffbeb' }
                                            }}
                                        >
                                            E-Book
                                        </Button>
                                    )}

                                    <Button
                                        onClick={handleNext}
                                        variant="contained"
                                        endIcon={activeStep === steps.length - 1 ? <CheckIcon /> : <ArrowForwardIcon />}
                                        sx={{
                                            bgcolor: '#141371',
                                            '&:hover': { bgcolor: '#111827' },
                                            px: 4,
                                            py: 1,
                                            textTransform: 'none'
                                        }}
                                    >
                                        {activeStep === steps.length - 1 ? 'เสร็จสิ้น' : 'บันทึกและดำเนินการต่อ'}
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