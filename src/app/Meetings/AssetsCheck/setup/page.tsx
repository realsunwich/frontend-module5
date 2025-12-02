'use client';

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Stack, Button, Typography, CircularProgress } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import CheckIcon from '@mui/icons-material/Check';

import Header from '@/components/header';
import Sidebar from '@/components/sidebar';
import StepLabel from '@/components/StepLabel';

// Import Components
import StepDetail, { Member } from '@/components/setup/StepDetail';
import StepAgendaCommon from '@/components/setup/StepAgendaCommon';
import StepAgendaConsideration from '@/components/setup/StepAgendaConsideration';
import StepAgendaOther from '@/components/setup/StepAgendaOther';

function SetupAssetsCheckContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [activeStep, setActiveStep] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [meetingId, setMeetingId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // State สำหรับข้อมูลการประชุม
    const [meetingInfo, setMeetingInfo] = useState({
        meetingDate: '',
        startTime: '08:00',
        location: '',
        detail: '',
    });

    // State สำหรับรายชื่อคณะกรรมการ
    const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);

    // State สำหรับเก็บข้อมูลวาระต่างๆ
    const [agendasData, setAgendasData] = useState<any>({});

    type AgendaItem = {
        agendaNo: number;
        title?: string;
        description?: string;
        [key: string]: unknown;
    };

    const steps = ['รายละเอียด', 'วาระที่ 1', 'วาระที่ 2', 'วาระที่ 3', 'วาระที่ 4', 'วาระที่ 5'];

    const handleAgendaChange = useCallback(
        (data: AgendaItem | null | undefined): void => {
            if (!data || data.agendaNo === undefined || data.agendaNo === null) return;

            setAgendasData((prev: Record<string, AgendaItem>) => ({
                ...prev,
                [String(data.agendaNo)]: data,
            }));
        },
        []
    );

    // ดึงข้อมูลการประชุมเมื่อมี meetingId (fetch เฉพาะครั้งแรกที่โหลดหน้า)
    useEffect(() => {
        const fetchMeetingData = async () => {
            const idFromParams = searchParams.get('id');
            if (!idFromParams) return;

            setIsLoading(true);
            try {
                const response = await fetch(`http://localhost:8080/api/meetings/${idFromParams}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch meeting data');
                }

                const data = await response.json();
                console.log('Fetched meeting data:', data);

                // Set meeting info
                setMeetingInfo({
                    meetingDate: data.meetingDate || '',
                    startTime: data.meetingTime ? data.meetingTime.substring(0, 5) : '08:00',
                    location: data.location || '',
                    detail: data.description || '',
                });

                // Set meeting ID
                if (data.id) {
                    setMeetingId(data.id);
                }

                // Set members
                if (data.attendees && Array.isArray(data.attendees)) {
                    setSelectedMembers(data.attendees);
                }

                // Parse และ set agenda data
                const agendas: Record<string, any> = {};
                for (let i = 1; i <= 5; i++) {
                    const agendaKey = `agenda${i === 1 ? 'One' : i === 2 ? 'Two' : i === 3 ? 'Three' : i === 4 ? 'Four' : 'Five'}Data`;
                    if (data[agendaKey]) {
                        try {
                            const parsedData = typeof data[agendaKey] === 'string'
                                ? JSON.parse(data[agendaKey])
                                : data[agendaKey];
                            agendas[String(i)] = parsedData;
                        } catch (e) {
                            console.error(`Error parsing ${agendaKey}:`, e);
                        }
                    }
                }
                setAgendasData(agendas);

            } catch (error) {
                console.error('Error fetching meeting data:', error);
                alert('ไม่สามารถดึงข้อมูลการประชุมได้');
            } finally {
                setIsLoading(false);
            }
        };

        fetchMeetingData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Fetch เฉพาะครั้งแรกที่โหลดหน้า

    // ฟังก์ชันสำหรับ Reset ค่าทั้งหมด
    const resetForm = () => {
        setMeetingInfo({
            meetingDate: '',
            startTime: '08:00',
            location: '',
            detail: '',
        });
        setSelectedMembers([]);
        setAgendasData({});
    };

    const handleSaveData = async (status: 'DRAFT' | 'ACTIVE') => {
        const agendasList: Record<string, any> = {};

        for (let i = 1; i <= 5; i++) {
            if (agendasData[String(i)]) {
                agendasList[`agenda_${i}_data`] = JSON.stringify(agendasData[String(i)]);
            }
        }

        const payload = {
            meetingTypeCode: '002',
            meetingDate: meetingInfo.meetingDate || null,
            meetingTime: meetingInfo.startTime ? `${meetingInfo.startTime}:00` : null,
            location: meetingInfo.location,
            description: meetingInfo.detail,
            memberIds: selectedMembers.map((m) => m.id),
            status,
            ...agendasList,
        };

        console.log('PAYLOAD =>', payload);

        let response;
        if (meetingId === null) {
            response = await fetch('http://localhost:8080/api/meetings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                console.error('Error response:', errorData);
                alert(`เกิดข้อผิดพลาด: ${JSON.stringify(errorData)}`);
                return false;
            }

            const data = await response.json();
            setMeetingId(data.id);
        } else {
            response = await fetch(`http://localhost:8080/api/meetings/${meetingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                console.error('Error response:', errorData);
                alert(`เกิดข้อผิดพลาด: ${JSON.stringify(errorData)}`);
                return false;
            }
        }

        return true;
    };

    const handleNext = async () => {
        const success = await handleSaveData('ACTIVE');
        if (success) {
            if (activeStep === steps.length - 1) {
                alert('บันทึกข้อมูลทั้ง 5 วาระเรียบร้อยแล้ว');
                resetForm();
                router.push('/Meetings/AssetsCheck');
                setIsFinished(true);
            } else {
                setActiveStep((prev) => prev + 1);
            }
        }
    };

    const handleSaveDraft = async () => {
        const success = await handleSaveData('DRAFT');
        if (success) {
            alert('บันทึกแบบร่างสำเร็จ');
        }
    };

    const handleBack = () => {
        if (activeStep > 0) {
            setActiveStep((prev) => prev - 1);
        } else {
            router.push('/Meetings/AssetsCheck');
        }
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
                return <StepAgendaCommon agendaNumber={1} onDataChange={handleAgendaChange} defaultData={agendasData['1'] || null} />;
            case 2:
                return <StepAgendaCommon agendaNumber={2} onDataChange={handleAgendaChange} defaultData={agendasData['2'] || null} />;
            case 3:
                return <StepAgendaCommon agendaNumber={3} onDataChange={handleAgendaChange} defaultData={agendasData['3'] || null} />;
            case 4:
                return <StepAgendaConsideration agendaNumber={4} onDataChange={handleAgendaChange} />;
            case 5:
                return <StepAgendaOther agendaNumber={5} onDataChange={handleAgendaChange} />;
            default:
                return <Typography>ไม่พบข้อมูล</Typography>;
        }
    };

    if (isFinished) {
        return (
            <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f9fafb', flexDirection: 'column' }}>
                <Header />
                <Stack direction="row" sx={{ flex: 1, overflow: 'hidden' }}>
                    <Sidebar />
                    <Box
                        sx={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'auto',
                            bgcolor: '#f3f4f6',
                        }}
                    >
                        <Typography variant="h4" align="center" mt={10}>
                            บันทึกข้อมูลเสร็จสิ้น (หน้ารายละเอียดการประชุม)
                        </Typography>
                    </Box>
                </Stack>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f9fafb', flexDirection: 'column' }}>
            <Header />
            <Stack direction="row" sx={{ flex: 1, overflow: 'hidden' }}>
                <Sidebar />
                <Box
                    sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        bgcolor: '#f3f4f6',
                    }}
                >
                    {/* --- TOP SECTION --- */}
                    <Box sx={{ zIndex: 1, pt: 3, px: { xs: 2, md: 4 } }}>
                        <Box sx={{ maxWidth: 1450, mx: 'auto' }}>
                            <Typography
                                variant="h5"
                                fontWeight="bold"
                                align="center"
                                sx={{
                                    mb: 4,
                                    color: '#111827',
                                    fontSize: { xs: '1.25rem', md: '1.5rem' },
                                }}
                            >
                                จัดตั้งการประชุมคณะกรรมการตรวจสอบทรัพย์สิน
                            </Typography>
                            <StepLabel steps={steps} activeStep={activeStep} onStepClick={setActiveStep} />
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
                                    sx={{
                                        color: '#6b7280',
                                        borderColor: '#d1d5db',
                                        px: 4,
                                        py: 1,
                                        textTransform: 'none',
                                        '&:hover': { bgcolor: '#f3f4f6', borderColor: '#9ca3af' },
                                    }}
                                >
                                    ย้อนกลับ
                                </Button>

                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <Button
                                        variant="outlined"
                                        startIcon={<SaveIcon />}
                                        onClick={handleSaveDraft}
                                        sx={{
                                            color: '#3140BF',
                                            borderColor: '#3140BF',
                                            px: 4,
                                            py: 1,
                                            textTransform: 'none',
                                            '&:hover': { bgcolor: '#eff6ff' },
                                        }}
                                    >
                                        บันทึกร่าง
                                    </Button>

                                    <Button
                                        onClick={handleNext}
                                        variant="contained"
                                        endIcon={activeStep === steps.length - 1 ? <CheckIcon /> : <ArrowForwardIcon />}
                                        sx={{
                                            bgcolor: '#141371',
                                            '&:hover': { bgcolor: '#111827' },
                                            px: 4,
                                            py: 1,
                                            textTransform: 'none',
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

export default function SetupAssetsCheckPage() {
    return (
        <Suspense
            fallback={
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '100vh',
                        bgcolor: '#f9fafb',
                    }}
                >
                    <CircularProgress />
                </Box>
            }
        >
            <SetupAssetsCheckContent />
        </Suspense>
    );
}
