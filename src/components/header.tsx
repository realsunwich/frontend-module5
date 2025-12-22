'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    AppBar, Toolbar, Typography, Box, Stack, IconButton, Avatar,
    Badge, Menu, List, ListItemText, ListItemAvatar,
    Divider, ListItemButton
} from '@mui/material';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CircleIcon from '@mui/icons-material/Circle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import ChatWidget from '@/components/ChatWidget';

interface NotificationItem {
    id: number;
    type: 'NEW_MEETING' | 'STATUS_CHANGE';
    title: string;
    message: string;
    isRead: boolean;
    timestamp: string;
    meetingId?: number;
    meetingTypeCode?: string;
}

// --- Helper Component: แสดงผล HTML Content ใน Notification ---
const HtmlNotification = ({ content }: { content: string }) => {
    return (
        <Box
            sx={{
                '& p': { m: 0, mb: 0.5 }, // ลบ margin ของ p และเพิ่มช่องว่างนิดหน่อย
                '& strong, & b': { fontWeight: 600, color: '#1e293b' }, // เน้นตัวหนา
                fontSize: '0.85rem',
                color: 'text.primary',
                lineHeight: 1.5,
                wordBreak: 'break-word'
            }}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
};

export default function Header() {
    const router = useRouter();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);

    // 🔥 ใช้ Set เพื่อเก็บ ID ที่อ่านแล้ว (เอาไว้ Override ข้อมูลจาก Server)
    const [localReadIds, setLocalReadIds] = useState<Set<number>>(new Set());

    const open = Boolean(anchorEl);

    // Initial Load: ดึงรายการที่เคยอ่านจาก localStorage มาใส่ State
    useEffect(() => {
        const storedReadIds = localStorage.getItem('readNotificationIds');
        if (storedReadIds) {
            setLocalReadIds(new Set(JSON.parse(storedReadIds)));
        }
    }, []);

    // Helper: บันทึก ID ที่อ่านลง localStorage
    const persistReadId = (id: number) => {
        setLocalReadIds(prev => {
            const newSet = new Set(prev).add(id);
            localStorage.setItem('readNotificationIds', JSON.stringify(Array.from(newSet)));
            return newSet;
        });
    };

    // Helper: บันทึก ID ทั้งหมดลง localStorage
    const persistAllReadIds = (ids: number[]) => {
        setLocalReadIds(prev => {
            const newSet = new Set(prev);
            ids.forEach(id => newSet.add(id));
            localStorage.setItem('readNotificationIds', JSON.stringify(Array.from(newSet)));
            return newSet;
        });
    };

    // คำนวณจำนวนที่ยังไม่ได้อ่าน โดยเช็คทั้งจาก Server และ LocalStorage
    const unreadCount = notifications.filter(n => !n.isRead && !localReadIds.has(n.id)).length;

    // --- Fetch Logic ---
    const fetchNotifications = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/notifications', {
                signal: AbortSignal.timeout(5000)
            });

            if (response.ok) {
                const data: NotificationItem[] = await response.json();

                // Deduplicate
                const uniqueData = Array.from(new Map(data.map(item => [item.id, item])).values());

                // Sort
                const sortedData = uniqueData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                // 🔥 Override ด้วย Local State: ถ้าใน Local บอกว่าอ่านแล้ว ให้เป็น true เสมอ
                setNotifications(sortedData);
            }
        } catch (error) {
            console.warn('Notification API unreachable');
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000);
        return () => clearInterval(interval);
    }, []);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleMarkAsRead = (id: number) => {
        // 1. จำในเครื่องทันที (สำคัญ!)
        persistReadId(id);

        // 2. อัปเดต UI ชั่วคราว
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));

        // 3. ส่งบอก Server (ถ้า Server พัง ก็ไม่เป็นไร เพราะเราจำใน Local แล้ว)
        fetch(`http://localhost:8080/api/notifications/${id}/read`, { method: 'PUT' }).catch(() => { });
    };

    const handleMarkAllRead = () => {
        // 1. จำทุก ID ในเครื่อง
        const allIds = notifications.map(n => n.id);
        persistAllReadIds(allIds);

        // 2. อัปเดต UI
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

        // 3. ส่งบอก Server
        fetch(`http://localhost:8080/api/notifications/read-all`, { method: 'PUT' }).catch(() => { });
    };

    const handleNotificationClick = (item: NotificationItem) => {
        handleMarkAsRead(item.id);
        handleClose();

        if (item.meetingId) {
            let path = 'subCommittee';
            if (item.meetingTypeCode === '003') path = 'MillionAssets';
            else if (item.meetingTypeCode === '002') path = 'AssetsCheck';

            router.push(`/Meetings/${path}/${item.meetingId}`);
        }
    };

    const formatTime = (isoString: string) => {
        if (!isoString) return '';
        try {
            const date = new Date(isoString);
            const isToday = new Date().toDateString() === date.toDateString();
            const timeStr = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
            if (isToday) return timeStr;
            return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) + ' ' + timeStr;
        } catch { return ''; }
    };

    return (
        <>
            <AppBar position="sticky" sx={{ bgcolor: '#141371', boxShadow: 3, zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{ width: 40, height: 40, bgcolor: '#f59e0b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#141371', fontWeight: 'bold' }}>
                            A
                        </Box>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" lineHeight={1.2}>ASLES</Typography>
                            <Typography variant="caption" sx={{ color: '#d1d5db' }}>ระบบตรวจสอบทรัพย์สินและบังคับคดีกองทุน</Typography>
                        </Box>
                    </Stack>

                    <Stack direction="row" spacing={2} alignItems="center">
                        <IconButton
                            sx={{ color: 'white' }}
                            onClick={handleClick}
                        >
                            {/* ใช้ unreadCount ที่คำนวณผ่าน LocalStorage Filter แล้ว */}
                            <Badge badgeContent={unreadCount} color="error">
                                <NotificationsNoneIcon />
                            </Badge>
                        </IconButton>

                        <Menu
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleClose}
                            PaperProps={{
                                elevation: 0,
                                sx: {
                                    overflow: 'visible',
                                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                                    mt: 1.5,
                                    width: 380,
                                    maxHeight: 500,
                                    overflowY: 'auto',
                                    '&:before': {
                                        content: '""',
                                        display: 'block',
                                        position: 'absolute',
                                        top: 0,
                                        right: 14,
                                        width: 10,
                                        height: 10,
                                        bgcolor: 'background.paper',
                                        transform: 'translateY(-50%) rotate(45deg)',
                                        zIndex: 0,
                                    },
                                },
                            }}
                            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                        >
                            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
                                <Typography fontWeight="bold" variant="subtitle1">การแจ้งเตือน</Typography>
                                {unreadCount > 0 && (
                                    <Typography
                                        variant="caption"
                                        sx={{ color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                        onClick={handleMarkAllRead}
                                    >
                                        อ่านทั้งหมด
                                    </Typography>
                                )}
                            </Box>

                            <List sx={{ p: 0 }}>
                                {notifications.length === 0 ? (
                                    <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                                        <Typography variant="body2">ไม่มีการแจ้งเตือนใหม่</Typography>
                                    </Box>
                                ) : (
                                    notifications.map((item) => {
                                        // 🔥 เช็คว่าอ่านหรือยัง โดยดูจากทั้ง Server และ LocalStorage
                                        const isRead = item.isRead || localReadIds.has(item.id);

                                        return (
                                            <React.Fragment key={item.id}>
                                                <ListItemButton
                                                    onClick={() => handleNotificationClick(item)}
                                                    alignItems="flex-start"
                                                    sx={{
                                                        bgcolor: isRead ? 'transparent' : '#f0f9ff',
                                                        '&:hover': { bgcolor: '#e0f2fe' }
                                                    }}
                                                >
                                                    <ListItemAvatar>
                                                        <Avatar sx={{
                                                            bgcolor: item.type === 'NEW_MEETING' ? '#d1fae5' : '#c1cdf9ff',
                                                            color: item.type === 'NEW_MEETING' ? '#059669' : '#0c6ceaff'
                                                        }}>
                                                            {item.type === 'NEW_MEETING' ? <CheckCircleOutlineIcon /> : <AutorenewIcon />}
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary={
                                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                                <Typography variant="subtitle2" fontWeight={isRead ? 'normal' : 'bold'}>
                                                                    {item.title}
                                                                </Typography>
                                                                {!isRead && <CircleIcon sx={{ fontSize: 10, color: 'error.main' }} />}
                                                            </Stack>
                                                        }
                                                        secondary={
                                                            <React.Fragment>
                                                                <HtmlNotification content={item.message} />

                                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                                    {formatTime(item.timestamp)}
                                                                </Typography>
                                                            </React.Fragment>
                                                        }
                                                        // 🔥 เพิ่มบรรทัดนี้: บอก MUI ว่า secondary ให้ใช้ div แทน p
                                                        secondaryTypographyProps={{ component: 'div' }}
                                                    />
                                                </ListItemButton>
                                                <Divider component="li" />
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </List>
                        </Menu>

                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ pl: 2, borderLeft: '1px solid rgba(255,255,255,0.2)' }}>
                            <Avatar src="https://ui-avatars.com/api/?name=Nuntiya+W" sx={{ width: 36, height: 36 }} />
                            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                                <Typography variant="body2" fontWeight="600">Nuntiya Suwannasak</Typography>
                                <Typography variant="caption" color="rgba(255,255,255,0.7)">Full Stack Developer</Typography>
                            </Box>
                            <KeyboardArrowDownIcon />
                        </Stack>
                    </Stack>
                </Toolbar>
            </AppBar>

            <ChatWidget />
        </>
    );
}