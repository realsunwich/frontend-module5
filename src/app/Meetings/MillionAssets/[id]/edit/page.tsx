'use client';

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Box, Stack, Button, Typography, CircularProgress } from '@mui/material';
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
import StepAgendaCommon, { AgendaItem } from '@/components/setup/StepAgendaCommon';
import StepAgendaConsideration from '@/components/setup/StepAgendaConsideration';
import StepAgendaOther from '@/components/setup/StepAgendaOther';

function EditMillionAssetsContent() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [activeStep, setActiveStep] = useState(0);
    const [meetingId, setMeetingId] = useState<number | null>(Number(id));

    // State ข้อมูล
    const [meetingInfo, setMeetingInfo] = useState({
        meetingDate: '',
        startTime: '08:00',
        location: '',
        detail: '',
    });
    const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
    const [agendasData, setAgendasData] = useState<Record<string, any>>({});

    const steps = ['รายละเอียด', 'วาระที่ 1', 'วาระที่ 2', 'วาระที่ 3', 'วาระที่ 4', 'วาระที่ 5'];

    // 1. Fetch Data
    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`http://localhost:8080/api/meetings/${id}`);
                if (!res.ok) throw new Error('Failed to fetch data');

                const data = await res.json();

                // 1.1 Map ข้อมูลทั่วไป
                setMeetingInfo({
                    meetingDate: data.meetingDate || '',
                    startTime: data.meetingTime ? data.meetingTime.slice(0, 5) : '08:00',
                    location: data.location || '',
                    detail: data.description || '',
                });

                // 1.2 Map สมาชิก (Attendees) - แก้ไขตรงนี้
                // เช็คว่า Backend ส่งมาในชื่อ 'attendees' หรือ 'members'
                const membersData = data.attendees || data.members;
                if (Array.isArray(membersData)) {
                    setSelectedMembers(membersData.map((m: any) => ({
                        id: m.id,
                        firstname: m.firstname,
                        lastname: m.lastname,
                        prename: m.prename,
                        affiliation: m.affiliation,
                        department: m.department,
                        phone: m.phone,
                        email: m.email
                    })));
                }

                // 1.3 Map วาระ
                const newAgendasData: Record<string, any> = {};
                const agendaMapping = [
                    { field: 'agendaOneData', no: '1' },
                    { field: 'agendaTwoData', no: '2' },
                    { field: 'agendaThreeData', no: '3' },
                    { field: 'agendaFourData', no: '4' },
                    { field: 'agendaFiveData', no: '5' },
                ];

                agendaMapping.forEach(({ field, no }) => {
                    if (data[field]) {
                        try {
                            const parsed = JSON.parse(data[field]);
                            newAgendasData[no] = {
                                agendaNo: Number(no),
                                ...parsed
                            };
                        } catch (e) {
                            console.error(`Error parsing ${field}`, e);
                        }
                    }
                });

                setAgendasData(newAgendasData);

            } catch (error) {
                console.error("Error fetching meeting:", error);
                alert("ไม่สามารถดึงข้อมูลการประชุมได้");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    // Update Agenda Data
    const handleAgendaChange = useCallback((data: AgendaItem | null): void => {
        if (!data || data.agendaNo === undefined) return;

        setAgendasData((prev) => ({
            ...prev,
            [String(data.agendaNo)]: data,
        }));
    }, []);

    const handleSaveData = async (status: 'DRAFT' | 'ACTIVE' | 'PUBLISHED') => {
        const payload: any = {
            meetingTypeCode: '003',
            meetingDate: meetingInfo.meetingDate || null,
            meetingTime: meetingInfo.startTime ? `${meetingInfo.startTime}:00` : null,
            location: meetingInfo.location,
            description: meetingInfo.detail,
            status: status,
            memberIds: selectedMembers.map((m) => m.id),
        };

        if (agendasData['1']) payload['agenda_1_data'] = JSON.stringify(agendasData['1']);
        if (agendasData['2']) payload['agenda_2_data'] = JSON.stringify(agendasData['2']);
        if (agendasData['3']) payload['agenda_3_data'] = JSON.stringify(agendasData['3']);
        if (agendasData['4']) payload['agenda_4_data'] = JSON.stringify(agendasData['4']);
        if (agendasData['5']) payload['agenda_5_data'] = JSON.stringify(agendasData['5']);

        console.log('Sending Payload:', payload);

        try {
            const response = await fetch(`http://localhost:8080/api/meetings/${meetingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.message || 'บันทึกไม่สำเร็จ');
            }
            return true;
        } catch (error) {
            console.error("Error saving:", error);
            alert(`เกิดข้อผิดพลาดในการบันทึก: ${error}`);
            return false;
        }
    };

    const handleNext = async () => {
        const success = await handleSaveData('ACTIVE');
        if (success) {
            if (activeStep === steps.length - 1) {
                alert('บันทึกการแก้ไขเรียบร้อยแล้ว');
                router.push('/Meetings/MillionAssets');
            } else {
                setActiveStep((prev) => prev + 1);
            }
        }
    };

    const handleSaveDraft = async () => {
        const success = await handleSaveData('DRAFT');
        if (success) alert('บันทึกแบบร่างสำเร็จ');
    };

    const handleBack = () => {
        if (activeStep > 0) {
            setActiveStep((prev) => prev - 1);
        } else {
            router.back();
        }
    };

    const handleOpenEbook = () => {
        alert('เปิดหน้า E-Book (Preview)');
    };

    // Render Logic
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
                        defaultData={agendasData[String(step)]}
                    />
                );
            case 4:
                return (
                    <StepAgendaConsideration
                        key="agenda-4"
                        agendaNumber={4}
                        onDataChange={handleAgendaChange}
                    // defaultData={agendasData['4']} 
                    />
                );
            case 5:
                return (
                    <StepAgendaOther
                        key="agenda-5"
                        agendaNumber={5}
                        onDataChange={handleAgendaChange}
                    // defaultData={agendasData['5']} 
                    />
                );
            default:
                return <Typography>ไม่พบข้อมูล</Typography>;
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#f9fafb' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f9fafb', flexDirection: 'column' }}>
            <Header />
            <Stack direction="row" sx={{ flex: 1, overflow: 'hidden' }}>
                <Sidebar />
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: '#f3f4f6' }}>

                    {/* Top Section */}
                    <Box sx={{ zIndex: 1, pt: 3, px: { xs: 2, md: 4 } }}>
                        <Box sx={{ maxWidth: 1450, mx: 'auto' }}>
                            <Typography variant="h5" fontWeight="bold" align="center" sx={{ mb: 4, color: '#111827' }}>
                                แก้ไขการประชุมคณะอนุกรรมการ
                            </Typography>
                            <StepLabel steps={steps} activeStep={activeStep} onStepClick={setActiveStep} />
                        </Box>
                    </Box>

                    {/* Main Content */}
                    <Box component="main" sx={{ flex: 1, p: 2, pt: 2, overflowY: 'auto' }}>
                        <Box sx={{ maxWidth: 1450, mx: 'auto', pb: 10 }}>
                            {renderStepContent(activeStep)}

                            {/* Navigation Buttons */}
                            <Stack direction={{ xs: 'column-reverse', sm: 'row' }} justifyContent="space-between" alignItems="stretch" spacing={2} mt={3}>
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
                                            sx={{ color: '#d97706', borderColor: '#d97706', px: 4, py: 1, textTransform: 'none', '&:hover': { bgcolor: '#fffbeb' } }}
                                        >
                                            E-Book
                                        </Button>
                                    )}

                                    <Button
                                        onClick={handleNext}
                                        variant="contained"
                                        endIcon={activeStep === steps.length - 1 ? <CheckIcon /> : <ArrowForwardIcon />}
                                        sx={{ bgcolor: '#141371', '&:hover': { bgcolor: '#111827' }, px: 4, py: 1, textTransform: 'none' }}
                                    >
                                        {activeStep === steps.length - 1 ? 'บันทึกเสร็จสิ้น' : 'บันทึกและถัดไป'}
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

export default function EditMillionAssetsPage() {
    return (
        <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>}>
            <EditMillionAssetsContent />
        </Suspense>
    );
}