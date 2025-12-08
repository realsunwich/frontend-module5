'use client';

import React, { useState, useCallback, useEffect, Suspense, useRef } from 'react';
import { useRouter } from 'next/navigation';
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

function SetupMillionAssetsContent() {
    const router = useRouter();

    const [activeStep, setActiveStep] = useState(0);
    console.log('SetupMillionAssetsPage rendered, activeStep =', activeStep);

    const [isFinished, setIsFinished] = useState(false);
    const [meetingId, setMeetingId] = useState<number | null>(null);

    const skipFetchRef = useRef(false);

    const [meetingInfo, setMeetingInfo] = useState({
        meetingDate: '',
        startTime: '08:00',
        location: '',
        detail: '',
    });

    const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);

    const [agendasData, setAgendasData] = useState<Record<string, any>>({});

    useEffect(() => {
        if (meetingId !== null) {
            //เช็คว่าถ้าเพิ่งสร้างเสร็จ (skipFetchRef เป็น true) ให้ข้ามการดึงข้อมูลไปเลย
            if (skipFetchRef.current) {
                console.log('Skipping fetch because just created/saved.');
                skipFetchRef.current = false; // รีเซ็ตค่าให้ครั้งหน้าทำงานปกติ (เช่นกรณีกด Refresh)
                return;
            }
            (async () => {
                const res = await fetch(`http://localhost:8080/api/meetings/${meetingId}`);
                if (res.ok) {
                    const data = await res.json();

                    const loadedAgendas: Record<string, any> = {};
                    for (let i = 1; i <= 5; i++) {
                        const agendaKey = `agenda_${i}_data`;
                        if (data[agendaKey]) {
                            try {
                                loadedAgendas[String(i)] = JSON.parse(data[agendaKey]);
                            } catch {
                                loadedAgendas[String(i)] = {}; // กรณี parse ไม่ได้
                            }
                        } else {
                            loadedAgendas[String(i)] = {}; // กรณีไม่มีข้อมูลวาระนี้
                        }
                    }
                    setAgendasData(loadedAgendas);

                    setMeetingInfo({
                        meetingDate: data.meetingDate || '',
                        startTime: data.meetingTime ? data.meetingTime.slice(0, 5) : '08:00',
                        location: data.location || '',
                        detail: data.description || '',
                    });

                    // ตรงนี้ต้องระวังเรื่อง Mapping ให้ตรงกับ Interface Member ด้วย
                    setSelectedMembers(
                        data.members ? data.members.map((m: any) => ({
                            id: m.id,
                            firstname: m.firstname || m.name, // เช็ค key ให้ตรงกับที่ Backend ส่งมา
                            lastname: m.lastname || '',
                            prename: m.prename || '',
                            // map field อื่นๆ ให้ครบตาม type Member
                        })) : []
                    );
                }
            })();
        } else {
            // ถ้า meetingId ยังไม่มี (เช่นสร้างใหม่)
            setAgendasData({}); // หรือจะกำหนดตามที่ต้องการ
            setMeetingInfo({ meetingDate: '', startTime: '08:00', location: '', detail: '' });
            setSelectedMembers([]);
        }
    }, [meetingId]);

    type AgendaItem = {
        agendaNo: number;
        title?: string;
        description?: string;
        [key: string]: unknown;
    };

    const steps = ['รายละเอียด', 'วาระที่ 1', 'วาระที่ 2', 'วาระที่ 3', 'วาระที่ 4', 'วาระที่ 5'];

    const handleAgendaChange = useCallback(
        (data: AgendaItem | null | undefined): void => {
            console.log('handleAgendaChange called with:', data);
            if (!data || data.agendaNo == null) return;

            setAgendasData((prev: Record<string, AgendaItem>) => {
                const updated = {
                    ...prev,
                    [String(data.agendaNo)]: data,
                };
                console.log('Updated agendasData:', updated);
                return updated;
            });
        },
        []
    );

    useEffect(() => {
        console.log('MeetingId changed:', meetingId);
    }, [meetingId]);

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
            meetingTypeCode: '003',
            meetingDate: meetingInfo.meetingDate || null,
            meetingTime: meetingInfo.startTime ? `${meetingInfo.startTime}:00` : null,
            location: meetingInfo.location,
            description: meetingInfo.detail,
            memberIds: selectedMembers.map((m) => m.id),
            status,
            ...agendasList,
            currentStep: activeStep
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
            skipFetchRef.current = true;
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
                router.push('/Meetings/MillionAssets');
                setIsFinished(true);
            } else {
                setActiveStep((prev) => prev + 1);
            }
        }
    };

    const isStepValid = (step: number) => {
        if (step === 0) {
            return (
                meetingInfo.meetingDate.trim() !== '' &&
                meetingInfo.startTime.trim() !== '' &&
                meetingInfo.location.trim() !== '' &&
                meetingInfo.detail.trim() !== '' &&
                selectedMembers.length > 0
            );
        }

        const raw = agendasData[String(step)];
        if (!raw) return false;

        let data;
        try {
            data = typeof raw === "string" ? JSON.parse(raw) : raw;
        } catch {
            return false;
        }

        if ([1, 2, 3].includes(step)) {
            return (
                Array.isArray(data.subAgendas) &&
                data.subAgendas.length > 0 &&
                data.subAgendas.some((sa: AgendaItem) =>
                    typeof sa.detail === "string" && sa.detail.trim() !== ""
                )
            );
        }

        if ([4, 5].includes(step)) {
            return (
                Array.isArray(data.items) &&
                data.items.length > 0 &&
                data.items.some((item: AgendaItem) =>
                    typeof item.name === "string" && item.name.trim() !== ""
                )
            );
        }

        return true;
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
            router.push('/Meetings/MillionAssets');
        }
    };

    console.log('Before useEffect, activeStep:', activeStep, 'agendasData:', agendasData);
    useEffect(() => {
        if (activeStep === 0) {
            console.log('Current step is 0 (รายละเอียด), no agendasData for this step');
        } else {
            console.log('Current agendasData for step', activeStep, agendasData[String(activeStep)]);
        }
    }, [activeStep, agendasData]);

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
            case 2:
            case 3:
                return (
                    <StepAgendaCommon
                        key={`agenda-${step}`}
                        agendaNumber={step}
                        onDataChange={handleAgendaChange}
                        defaultData={agendasData[String(step)] ?? null}
                    />
                );
            case 4:
                return (
                    <StepAgendaConsideration
                        key="agenda-4" // แนะนำให้ใส่ key กับทุกหน้าเปลี่ยนผ่าน
                        agendaNumber={4}
                        onDataChange={handleAgendaChange}
                    // defaultData={agendasData['4']} // (เปิดใช้บรรทัดนี้ถ้า Component นี้รองรับ defaultData)
                    />
                );
            case 5:
                return (
                    <StepAgendaOther
                        key="agenda-5"
                        agendaNumber={5}
                        onDataChange={handleAgendaChange}
                    // defaultData={agendasData['5']} // (เปิดใช้บรรทัดนี้ถ้า Component นี้รองรับ defaultData)
                    />
                );
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
                                จัดตั้งการประชุมคณะอนุกรรมการตรวจสอบทรัพย์สินเกิน 1 ล้านบาท
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
                                        disabled={!isStepValid(activeStep)}
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

export default function SetupMillionAssetsPage() {
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
            <SetupMillionAssetsContent />
        </Suspense>
    );
}