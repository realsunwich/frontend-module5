'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box, Stack, Typography, Paper, TextField, InputAdornment,
    Card, CardContent, Chip, IconButton, Divider, Fade, Skeleton, Button, Alert, Avatar
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import EventNoteIcon from '@mui/icons-material/EventNote';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import Grid3x3Icon from '@mui/icons-material/Grid3x3';
import ReplayIcon from '@mui/icons-material/Replay';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import VerifiedIcon from '@mui/icons-material/Verified';
import GavelIcon from '@mui/icons-material/Gavel';
import Header from '@/components/header';
import Sidebar from '@/components/sidebar';

// --- Interfaces ---
interface Member {
    id: number;
    firstname: string;
    lastname: string;
    affiliation: string;
    email: string;
    phone: string;
    citizenId?: string;
}

type Meeting = {
    id: number;
    meetingNo: string;
    createdAt: string;
    meetingTypeCode?: string;
    location?: string;
    description?: string;
    status?: string;
    meetingDate?: string;
    meetingTime?: string;
};

interface Asset {
    id?: number;
    name: string;
    description: string;
    latitude: number;
    longitude: number;
    assetType?: string;
    quantity?: number;
    status?: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN';
    checkedInAt?: string;
}

const HtmlContent = ({ content, maxLines = 2 }: { content: string, maxLines?: number }) => {
    if (!content) return <Typography variant="body2" color="text.secondary">ไม่มีรายละเอียด</Typography>;

    return (
        <Box
            sx={{
                // Reset CSS ของ HTML ที่ติดมาเพื่อให้เข้ากับ Card
                '& p': { m: 0, display: 'inline' },
                '& strong, & b': { fontWeight: 600, color: '#1E293B' },
                fontSize: '1rem',
                color: '#1E293B',
                lineHeight: 1.5,
                // เทคนิคการตัดคำ (Truncate) หลายบรรทัด
                display: '-webkit-box',
                WebkitLineClamp: maxLines,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                height: `${maxLines * 1.5}em` // กำหนดความสูงให้คงที่ตามจำนวนบรรทัด
            }}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
};

export default function DashboardPage() {
    const router = useRouter();
    const [allMembers, setAllMembers] = useState<Member[]>([]);
    const [allMeetings, setAllMeetings] = useState<Meeting[]>([]);
    const [allAssets, setAllAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchText, setSearchText] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchText);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchText]);

    const fetchAllData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [resMembers, resMeetings, resAssets] = await Promise.all([
                fetch('http://localhost:8080/api/committee-members'),
                fetch('http://localhost:8080/api/meetings'),
                fetch('http://localhost:8080/api/assets')
            ]);

            if (!resMembers.ok || !resMeetings.ok || !resAssets.ok) {
                throw new Error('ไม่สามารถดึงข้อมูลได้');
            }

            const membersData = await resMembers.json();
            const meetingsData = await resMeetings.json();
            const assetsData = await resAssets.json();

            setAllMembers(membersData);
            if (Array.isArray(meetingsData)) {
                setAllMeetings(meetingsData);
            }
            if (Array.isArray(assetsData)) {
                setAllAssets(assetsData);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError('เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAllData(); }, []);

    const normalizeText = (text: string) => text ? text.replace(/[^a-zA-Z0-9ก-๙]/g, '').toLowerCase() : '';

    const searchResults = useMemo(() => {
        if (!debouncedSearch.trim()) return { members: [], meetings: [], assets: [] };

        const query = debouncedSearch.toLowerCase();
        const normalizedQuery = normalizeText(debouncedSearch); // คำค้นที่ตัดอักขระพิเศษออกแล้ว

        // Logic การค้นหาสถานะการประชุม
        const statusKeywords: string[] = [];
        if ('แบบร่าง'.includes(query) || 'draft'.includes(query)) statusKeywords.push('DRAFT');
        if ('รอลงมติ'.includes(query) || 'active'.includes(query)) statusKeywords.push('ACTIVE');
        if ('สรุปผลแล้ว'.includes(query) || 'สรุป'.includes(query) || 'เผยแพร่'.includes(query) || 'publish'.includes(query)) statusKeywords.push('PUBLISH');

        // Logic การค้นหาสถานะหลักฐาน
        const assetStatusKeywords: string[] = [];
        if ('รอตรวจสอบ'.includes(query) || 'รอ'.includes(query) || 'pending'.includes(query)) assetStatusKeywords.push('PENDING');
        if ('พบแล้ว'.includes(query) || 'พบ'.includes(query) || 'confirmed'.includes(query)) assetStatusKeywords.push('CONFIRMED');
        if ('ยึดแล้ว'.includes(query) || 'ยึด'.includes(query) || 'checked'.includes(query)) assetStatusKeywords.push('CHECKED_IN');

        return {
            members: allMembers.filter(m => {
                // ค้นหาชื่อ/อีเมล/สังกัด (แบบปกติ)
                const basicMatch =
                    `${m.firstname} ${m.lastname}`.toLowerCase().includes(query) ||
                    (m.affiliation || '').toLowerCase().includes(query) ||
                    (m.email || '').toLowerCase().includes(query);

                // 🔥 ค้นหาเลขบัตร (แบบพิเศษ: ตัดขีดออกก่อนเทียบ)
                const citizenIdClean = normalizeText(m.citizenId || '');
                const citizenIdMatch = citizenIdClean.includes(normalizedQuery);

                return basicMatch || citizenIdMatch;
            }),
            meetings: allMeetings.filter(m =>
                (m.meetingNo || '').toLowerCase().includes(query) ||
                (m.meetingTypeCode || '').toLowerCase().includes(query) ||
                (m.description || '').toLowerCase().includes(query) ||
                (m.location || '').toLowerCase().includes(query) ||
                (m.status || '').toLowerCase().includes(query) ||
                (m.status && statusKeywords.includes(m.status))
            ),
            assets: allAssets.filter(a =>
                (a.name || '').toLowerCase().includes(query) ||
                (a.description || '').toLowerCase().includes(query) ||
                (a.assetType || '').toLowerCase().includes(query) ||
                (a.status || '').toLowerCase().includes(query) ||
                (a.status && assetStatusKeywords.includes(a.status))
            )
        };
    }, [debouncedSearch, allMembers, allMeetings, allAssets]);

    const counts = useMemo(() => {
        if (loading) return {
            member: null,
            draft: null,
            active: null,
            published: null,
            assetPending: null,
            assetConfirmed: null,
            assetCheckedIn: null,
            totalAssets: null
        };
        return {
            member: allMembers.length,
            draft: allMeetings.filter((m) => m.status === 'DRAFT').length,
            active: allMeetings.filter((m) => m.status === 'ACTIVE').length,
            published: allMeetings.filter((m) => m.status === 'PUBLISH').length,
            assetPending: allAssets.filter((a) => a.status === 'PENDING').length,
            assetConfirmed: allAssets.filter((a) => a.status === 'CONFIRMED').length,
            assetCheckedIn: allAssets.filter((a) => a.status === 'CHECKED_IN').length,
            totalAssets: allAssets.length
        };
    }, [allMembers, allMeetings, allAssets, loading]);

    const handleMeetingClick = (meeting: Meeting) => {
        const typeCode = meeting.meetingTypeCode || '';
        let path = 'subCommittee';

        if (typeCode.startsWith('003') || typeCode.includes('Mil')) {
            path = 'MillionAssets';
        } else if (typeCode.startsWith('002') || typeCode.includes('Check')) {
            path = 'AssetsCheck';
        }
        router.push(`/Meetings/${path}/${meeting.id}`);
    };

    const StatCard = ({ icon, label, value, gradient, bg }: any) => (
        <Paper sx={{
            p: 3, borderRadius: 4, background: gradient, color: '#fff',
            minWidth: 280, flex: '1 1 280px', cursor: 'default',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex', alignItems: 'center', gap: 3,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' },
            '& svg': { fontSize: 48, color: bg, opacity: 0.9, filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))' },
        }}>
            <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}>
                {icon}
            </Box>
            <Box>
                <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500, mb: 0.5 }}>{label}</Typography>
                {loading ? (
                    <Skeleton variant="text" width={80} height={48} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
                ) : (
                    <Typography variant="h3" fontWeight="800" sx={{ lineHeight: 1 }}>{value ?? '-'}</Typography>
                )}
            </Box>
        </Paper>
    );

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'DRAFT': return { bg: '#FEF3C7', color: '#D97706', label: 'แบบร่าง', border: '#FCD34D' };
            case 'ACTIVE': return { bg: '#D1FAE5', color: '#059669', label: 'รอลงมติ', border: '#6EE7B7' };
            case 'PUBLISH': return { bg: '#DBEAFE', color: '#2563EB', label: 'สรุปผลแล้ว', border: '#93C5FD' };
            default: return { bg: '#F3F4F6', color: '#4B5563', label: status || 'Unknown', border: '#E5E7EB' };
        }
    };

    const formatDateTime = (date?: string, time?: string) => {
        if (!date) return 'ไม่ระบุวันที่';
        const d = new Date(date).toLocaleDateString('th-TH', { dateStyle: 'medium' });
        const t = time ? ` • ${time.substring(0, 5)} น.` : '';
        return `${d}${t}`;
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#F8FAFC' }}>
            <Header />
            <Stack direction="row" sx={{ flex: 1, overflow: 'hidden' }}>
                <Sidebar />

                <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, overflowY: 'auto' }}>

                    {/* Header & Search */}
                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} gap={3} mb={5}>
                        <Box>
                            <Typography variant="h4" fontWeight="800" color="#1E293B" sx={{ letterSpacing: '-0.5px', mb: 0.5 }}>
                                Dashboard Overview
                            </Typography>
                            <Typography variant="body2" color="#64748B">
                                ภาพรวมข้อมูลและการจัดการการประชุมทั้งหมด
                            </Typography>
                        </Box>

                        <TextField
                            // 3. ✅ แก้ไข Placeholder ให้สื่อความหมาย
                            placeholder="ค้นหาเลขบัตรประชาชน, รหัส, ชื่อ, สถานะ..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            sx={{
                                width: { xs: '100%', md: 420 },
                                bgcolor: '#fff',
                                borderRadius: 4,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 4,
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                                    '& fieldset': { borderColor: 'transparent' },
                                    '&:hover fieldset': { borderColor: '#E2E8F0' },
                                    '&.Mui-focused fieldset': { borderColor: '#3B82F6', borderWidth: 2 },
                                    pl: 2
                                }
                            }}
                            InputProps={{
                                startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: '#94A3B8' }} /></InputAdornment>),
                                endAdornment: searchText && (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setSearchText('')}><CloseIcon fontSize="small" /></IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Stack>

                    {/* Error State */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }} action={
                            <Button color="inherit" size="small" startIcon={<ReplayIcon />} onClick={fetchAllData}>ลองใหม่</Button>
                        }>
                            {error}
                        </Alert>
                    )}

                    {/* Content */}
                    {debouncedSearch ? (
                        <Fade in={true}>
                            <Box>
                                <Typography variant="h6" color="#334155" fontWeight="600" mb={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    ผลการค้นหาสำหรับ <Box component="span" sx={{ color: '#3B82F6', bgcolor: '#EFF6FF', px: 1.5, py: 0.5, borderRadius: 2 }}>"{debouncedSearch}"</Box>
                                </Typography>

                                {searchResults.members.length === 0 && searchResults.meetings.length === 0 && searchResults.assets.length === 0 && (
                                    <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 4, bgcolor: '#fff', border: '1px dashed #E2E8F0', boxShadow: 'none' }}>
                                        <SearchIcon sx={{ fontSize: 64, color: '#CBD5E1', mb: 2 }} />
                                        <Typography variant="h6" color="#64748B" fontWeight="500">ไม่พบข้อมูลที่ตรงกัน</Typography>
                                        <Typography variant="body2" color="#94A3B8">ลองตรวจสอบคำค้นหา หรือใช้คำค้นอื่นดูนะครับ</Typography>
                                    </Paper>
                                )}

                                {/* Meetings Search Results */}
                                {searchResults.meetings.length > 0 && (
                                    <Box mb={5}>
                                        <Typography variant="subtitle1" fontWeight="700" mb={2} color="#475569" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, letterSpacing: 0.5 }}>
                                            <EventNoteIcon fontSize="small" color="primary" /> รายงานการประชุม <Chip label={searchResults.meetings.length} size="small" color="primary" sx={{ height: 20, fontWeight: 'bold' }} />
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5 }}>
                                            {searchResults.meetings.map((meeting) => {
                                                const status = getStatusColor(meeting.status);
                                                return (
                                                    <Card key={meeting.id}
                                                        sx={{
                                                            flex: '1 1 300px', maxWidth: { md: '360px' },
                                                            borderRadius: 4, border: '1px solid #E2E8F0',
                                                            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                                                            cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                            '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', borderColor: '#3B82F6' }
                                                        }}
                                                        onClick={() => handleMeetingClick(meeting)}
                                                    >
                                                        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                                                <Chip
                                                                    icon={<Grid3x3Icon sx={{ fontSize: '14px !important', color: '#64748B' }} />}
                                                                    label={meeting.meetingNo || meeting.meetingTypeCode || `ID: ${meeting.id}`}
                                                                    size="small"
                                                                    sx={{ bgcolor: '#F1F5F9', color: '#475569', fontWeight: 600, borderRadius: 1.5, border: '1px solid #E2E8F0' }}
                                                                />
                                                                <Chip
                                                                    label={status.label}
                                                                    size="small"
                                                                    sx={{ bgcolor: status.bg, color: status.color, fontWeight: 'bold', borderRadius: 1.5, border: `1px solid ${status.border}` }}
                                                                />
                                                            </Stack>
                                                            <Box mb={2} sx={{ minHeight: 48 }}>
                                                                <HtmlContent content={meeting.description || ''} maxLines={2} />
                                                            </Box>
                                                            <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />
                                                            <Stack spacing={1}>
                                                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                                                    <AccessTimeFilledIcon fontSize="small" sx={{ color: '#94A3B8', fontSize: 18 }} />
                                                                    <Typography variant="caption" color="#475569" fontWeight="500">
                                                                        {formatDateTime(meeting.meetingDate, meeting.meetingTime)}
                                                                    </Typography>
                                                                </Stack>
                                                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                                                    <LocationOnIcon fontSize="small" sx={{ color: '#94A3B8', fontSize: 18 }} />
                                                                    <Typography variant="caption" color="#475569" fontWeight="500" noWrap>
                                                                        {meeting.location || '-'}
                                                                    </Typography>
                                                                </Stack>
                                                            </Stack>
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })}
                                        </Box>
                                    </Box>
                                )}

                                {/* Members Search Results */}
                                {searchResults.members.length > 0 && (
                                    <Box mb={5}>
                                        {searchResults.meetings.length > 0 && <Divider sx={{ my: 4 }} />}
                                        <Typography variant="subtitle1" fontWeight="700" mb={2} color="#475569" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, letterSpacing: 0.5 }}>
                                            <PeopleIcon fontSize="small" color="secondary" /> สมาชิก <Chip label={searchResults.members.length} size="small" color="secondary" sx={{ height: 20, fontWeight: 'bold' }} />
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5 }}>
                                            {searchResults.members.map((member) => (
                                                <Card key={member.id} sx={{ flex: '1 1 300px', maxWidth: { md: '360px' }, borderRadius: 4, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)', transition: '0.2s', '&:hover': { borderColor: '#8B5CF6', transform: 'translateY(-2px)' } }}>
                                                    <CardContent sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', '&:last-child': { pb: 2 } }}>
                                                        <Avatar
                                                            sx={{
                                                                width: 56, height: 56,
                                                                bgcolor: '#F3E8FF', color: '#7C3AED',
                                                                fontWeight: 'bold', fontSize: 20
                                                            }}
                                                        >
                                                            {member.firstname.charAt(0)}
                                                        </Avatar>
                                                        <Box sx={{ overflow: 'hidden', flex: 1 }}>
                                                            <Typography variant="body1" fontWeight="700" color="#1E293B" noWrap>{member.firstname} {member.lastname}</Typography>
                                                            <Typography variant="caption" display="block" color="#64748B" fontWeight="500" noWrap sx={{ mt: 0.5 }}>{member.affiliation || '-'}</Typography>
                                                            {/* แสดงเลขบัตรประชาชนถ้ามี */}
                                                            {member.citizenId && <Typography variant="caption" display="block" color="#94A3B8" noWrap>ID: {member.citizenId}</Typography>}
                                                            <Typography variant="caption" display="block" color="#94A3B8" noWrap>{member.email}</Typography>
                                                        </Box>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </Box>
                                    </Box>
                                )}

                                {/* Assets Search Results */}
                                {searchResults.assets.length > 0 && (
                                    <Box>
                                        {(searchResults.meetings.length > 0 || searchResults.members.length > 0) && <Divider sx={{ my: 4 }} />}
                                        <Typography variant="subtitle1" fontWeight="700" mb={2} color="#475569" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, letterSpacing: 0.5 }}>
                                            <Inventory2Icon fontSize="small" sx={{ color: '#8b5cf6' }} /> หลักฐาน/ทรัพย์สิน <Chip label={searchResults.assets.length} size="small" sx={{ bgcolor: '#F3E8FF', color: '#7C3AED', height: 20, fontWeight: 'bold' }} />
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5 }}>
                                            {searchResults.assets.map((asset) => {
                                                const getAssetStatusColor = (status?: string) => {
                                                    switch (status) {
                                                        case 'PENDING': return { bg: '#FEF3C7', color: '#D97706', label: 'รอตรวจสอบ', border: '#FCD34D' };
                                                        case 'CONFIRMED': return { bg: '#DBEAFE', color: '#2563EB', label: 'พบแล้ว', border: '#93C5FD' };
                                                        case 'CHECKED_IN': return { bg: '#D1FAE5', color: '#059669', label: 'ยึดแล้ว', border: '#6EE7B7' };
                                                        default: return { bg: '#F3F4F6', color: '#4B5563', label: status || 'Unknown', border: '#E5E7EB' };
                                                    }
                                                };
                                                const assetStatus = getAssetStatusColor(asset.status);

                                                return (
                                                    <Card key={asset.id || Math.random()} sx={{
                                                        flex: '1 1 300px', maxWidth: { md: '360px' },
                                                        borderRadius: 4, border: '1px solid #E2E8F0',
                                                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', borderColor: '#8B5CF6' }
                                                    }}>
                                                        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                                                <Box sx={{ flex: 1, overflow: 'hidden', mr: 1 }}>
                                                                    <Typography variant="body1" fontWeight="700" color="#1E293B" noWrap>
                                                                        {asset.name}
                                                                    </Typography>
                                                                    {asset.assetType && (
                                                                        <Chip
                                                                            label={asset.assetType}
                                                                            size="small"
                                                                            sx={{
                                                                                mt: 0.5,
                                                                                bgcolor: '#F1F5F9',
                                                                                color: '#475569',
                                                                                fontWeight: 600,
                                                                                fontSize: '0.7rem',
                                                                                height: 20
                                                                            }}
                                                                        />
                                                                    )}
                                                                </Box>
                                                                <Chip
                                                                    label={assetStatus.label}
                                                                    size="small"
                                                                    sx={{
                                                                        bgcolor: assetStatus.bg,
                                                                        color: assetStatus.color,
                                                                        fontWeight: 'bold',
                                                                        borderRadius: 1.5,
                                                                        border: `1px solid ${assetStatus.border}`,
                                                                        flexShrink: 0
                                                                    }}
                                                                />
                                                            </Stack>

                                                            <Typography
                                                                variant="body2"
                                                                color="#64748B"
                                                                sx={{
                                                                    mb: 2,
                                                                    display: '-webkit-box',
                                                                    WebkitLineClamp: 2,
                                                                    WebkitBoxOrient: 'vertical',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    minHeight: '2.5em'
                                                                }}
                                                            >
                                                                {asset.description || 'ไม่มีรายละเอียด'}
                                                            </Typography>

                                                            <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />

                                                            <Stack spacing={1}>
                                                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                                                    <LocationOnIcon fontSize="small" sx={{ color: '#94A3B8', fontSize: 18 }} />
                                                                    <Typography variant="caption" color="#475569" fontWeight="500">
                                                                        {asset.latitude && asset.longitude
                                                                            ? `${asset.latitude.toFixed(6)}, ${asset.longitude.toFixed(6)}`
                                                                            : 'ไม่ระบุพิกัด'
                                                                        }
                                                                    </Typography>
                                                                </Stack>
                                                                {asset.quantity !== undefined && (
                                                                    <Stack direction="row" alignItems="center" spacing={1.5}>
                                                                        <Grid3x3Icon fontSize="small" sx={{ color: '#94A3B8', fontSize: 18 }} />
                                                                        <Typography variant="caption" color="#475569" fontWeight="500">
                                                                            จำนวน: {asset.quantity}
                                                                        </Typography>
                                                                    </Stack>
                                                                )}
                                                                {asset.checkedInAt && (
                                                                    <Stack direction="row" alignItems="center" spacing={1.5}>
                                                                        <AccessTimeFilledIcon fontSize="small" sx={{ color: '#94A3B8', fontSize: 18 }} />
                                                                        <Typography variant="caption" color="#475569" fontWeight="500">
                                                                            ยึดเมื่อ: {new Date(asset.checkedInAt).toLocaleDateString('th-TH', { dateStyle: 'medium' })}
                                                                        </Typography>
                                                                    </Stack>
                                                                )}
                                                            </Stack>
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })}
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        </Fade>
                    ) : (
                        // Default Dashboard
                        <Fade in={!debouncedSearch}>
                            <Box>
                                {/* Meeting Stats */}
                                <Typography variant="h6" fontWeight="700" mb={2} color="#334155">
                                    สถิติการประชุม
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 5 }}>
                                    <StatCard
                                        icon={<PeopleIcon />} label="จำนวนสมาชิกคณะกรรมการทั้งหมด" value={counts.member}
                                        gradient="linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" bg="#e0e7ff"
                                    />
                                    <StatCard
                                        icon={<InsertDriveFileOutlinedIcon />} label="จำนวนการประชุมที่เป็นแบบร่าง" value={counts.draft}
                                        gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" bg="#fef3c7"
                                    />
                                    <StatCard
                                        icon={<AccessTimeFilledIcon />} label="จำนวนการประชุมที่รอลงมติประชุม" value={counts.active}
                                        gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)" bg="#d1fae5"
                                    />
                                    <StatCard
                                        icon={<CheckCircleIcon />} label="จำนวนการประชุมที่สรุปผลการประชุมแล้ว" value={counts.published}
                                        gradient="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" bg="#dbeafe"
                                    />
                                </Box>

                                {/* Asset Stats */}
                                <Typography variant="h6" fontWeight="700" mb={2} color="#334155">
                                    สถิติหลักฐาน/ทรัพย์สิน
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                    <StatCard
                                        icon={<Inventory2Icon />} label="ทรัพย์สินทั้งหมด" value={counts.totalAssets}
                                        gradient="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" bg="#f3e8ff"
                                    />
                                    <StatCard
                                        icon={<PendingActionsIcon />} label="รอตรวจสอบ" value={counts.assetPending}
                                        gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" bg="#fef3c7"
                                    />
                                    <StatCard
                                        icon={<VerifiedIcon />} label="พบแล้ว" value={counts.assetConfirmed}
                                        gradient="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" bg="#dbeafe"
                                    />
                                    <StatCard
                                        icon={<GavelIcon />} label="ยึดแล้ว" value={counts.assetCheckedIn}
                                        gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)" bg="#d1fae5"
                                    />
                                </Box>
                            </Box>
                        </Fade>
                    )}
                </Box>
            </Stack>
        </Box>
    );
}