'use client';

import React, { useEffect, useState } from 'react';
import { Box, Stack, Typography, Paper, CircularProgress } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Header from '@/components/header';
import Sidebar from '@/components/sidebar';

export default function DashboardPage() {
    const [memberCount, setMemberCount] = useState<number | null>(null);
    const [draftCount, setDraftCount] = useState<number | null>(null);
    const [activeCount, setActiveCount] = useState<number | null>(null);
    const [publishedCount, setPublishedCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchMemberCount = async () => {
        try {
            const res = await fetch('http://localhost:8080/api/committee-members');
            if (res.ok) {
                const data = await res.json();
                setMemberCount(data.length);
            } else {
                setMemberCount(0);
            }
        } catch (error) {
            console.error('Error fetching member count:', error);
            setMemberCount(0);
        }
    };

    const fetchMeetingCounts = async () => {
        try {
            const res = await fetch('http://localhost:8080/api/meetings', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                },
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();

            // ตรวจสอบว่าข้อมูลเป็น array
            if (!Array.isArray(data)) {
                console.warn('API /meetings ไม่ได้ส่งข้อมูลเป็น array:', data);
                setDraftCount(0);
                setActiveCount(0);
                setPublishedCount(0);
                return;
            }

            const draft = data.filter((m: any) => m?.status === 'DRAFT').length;
            const active = data.filter((m: any) => m?.status === 'ACTIVE').length;
            const published = data.filter((m: any) => m?.status === 'PUBLISH').length;

            setDraftCount(draft);
            setActiveCount(active);
            setPublishedCount(published);
        } catch (error) {
            console.error('Error fetching meeting counts:', error);
            setDraftCount(0);
            setActiveCount(0);
            setPublishedCount(0);
        }
    };

    const fetchAllData = async () => {
        setLoading(true);
        await Promise.all([fetchMemberCount(), fetchMeetingCounts()]);
        setLoading(false);
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // ปรับสไตล์ Paper ให้มีลูกเล่นและสีสันมากขึ้น
    const paperStyle = (bgGradient: string, iconColor: string) => ({
        p: 3,
        borderRadius: 4,
        background: bgGradient,
        color: '#fff',
        minWidth: 280,
        flexGrow: 1,
        maxWidth: 420,
        cursor: 'default',
        boxShadow: '0 4px 15px rgba(0,0,0,0.15), 0 8px 30px rgba(0,0,0,0.1)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        userSelect: 'none',
        '&:hover': {
            boxShadow: '0 10px 40px rgba(0,0,0,0.25), 0 15px 50px rgba(0,0,0,0.2)',
            transform: 'translateY(-6px)',
        },
        '& .MuiTypography-subtitle1': {
            opacity: 0.85,
        },
        '& .MuiTypography-h3': {
            textShadow: '1px 1px 5px rgba(0,0,0,0.3)',
        },
        // สีไอคอน
        '& svg': {
            fontSize: 56,
            color: iconColor,
            opacity: 0.9,
            filter: 'drop-shadow(0 0 4px rgba(255 255 255 / 0.4))',
            flexShrink: 0,
        },
    });

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            <Header />
            <Stack direction="row" sx={{ flex: 1, overflow: 'hidden' }}>
                <Sidebar />

                <Box component="main" sx={{ flexGrow: 1, p: 4, overflowY: 'auto' }}>
                    <Typography variant="h4" fontWeight="bold" mb={4} color="#1e293b">
                        ภาพรวมระบบ
                    </Typography>

                    <Stack direction="row" spacing={4} flexWrap="wrap" justifyContent="start">
                        {/* สมาชิกคณะกรรมการ */}
                        <Paper
                            sx={paperStyle(
                                'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                                '#e0f2fe'
                            )}
                        >
                            <PeopleIcon />
                            <Box>
                                <Typography variant="subtitle1" gutterBottom>
                                    จำนวนสมาชิกคณะกรรมการทั้งหมด
                                </Typography>
                                {loading ? (
                                    <CircularProgress sx={{ color: 'rgba(255 255 255 / 0.8)' }} size={28} />
                                ) : (
                                    <Typography variant="h3" fontWeight="bold">
                                        {memberCount !== null ? memberCount : '-'}
                                    </Typography>
                                )}
                            </Box>
                        </Paper>

                        <Paper
                            sx={paperStyle(
                                'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
                                '#fff7ed'
                            )}
                        >
                            <InsertDriveFileOutlinedIcon />
                            <Box>
                                <Typography variant="subtitle1" gutterBottom>
                                    จำนวนการประชุมที่เป็นแบบร่าง
                                </Typography>
                                {loading ? (
                                    <CircularProgress sx={{ color: 'rgba(255 255 255 / 0.8)' }} size={28} />
                                ) : (
                                    <Typography variant="h3" fontWeight="bold">
                                        {draftCount !== null ? draftCount : '-'}
                                    </Typography>
                                )}
                            </Box>
                        </Paper>

                        <Paper
                            sx={paperStyle(
                                'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                                '#d1fae5'
                            )}
                        >
                            <AccessTimeFilledIcon />
                            <Box>
                                <Typography variant="subtitle1" gutterBottom>
                                    จำนวนการประชุมที่รอลงมติประชุม
                                </Typography>
                                {loading ? (
                                    <CircularProgress sx={{ color: 'rgba(255 255 255 / 0.8)' }} size={28} />
                                ) : (
                                    <Typography variant="h3" fontWeight="bold">
                                        {activeCount !== null ? activeCount : '-'}
                                    </Typography>
                                )}
                            </Box>
                        </Paper>

                        <Paper
                            sx={paperStyle(
                                'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                                '#ede9fe'
                            )}
                        >
                            <CheckCircleIcon />
                            <Box>
                                <Typography variant="subtitle1" gutterBottom>
                                    จำนวนการประชุมที่สรุปผลการประชุมแล้ว
                                </Typography>
                                {loading ? (
                                    <CircularProgress sx={{ color: 'rgba(255 255 255 / 0.8)' }} size={28} />
                                ) : (
                                    <Typography variant="h3" fontWeight="bold">
                                        {publishedCount !== null ? publishedCount : '-'}
                                    </Typography>
                                )}
                            </Box>
                        </Paper>
                    </Stack>
                </Box>
            </Stack>
        </Box>
    );
}