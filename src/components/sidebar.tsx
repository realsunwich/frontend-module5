'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Paper, Box, Typography, IconButton, Tooltip, Collapse } from '@mui/material';
// Icons
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import CircleIcon from '@mui/icons-material/Circle';

// --- Data Structures ---
interface SubMenuItem {
    label: string;
    href: string;
}

interface MenuItem {
    label: string;
    icon: React.ReactNode;
    href?: string;
    subMenus?: SubMenuItem[];
}

const menuItems: MenuItem[] = [
    {
        label: "หน้าหลัก",
        icon: <HomeOutlinedIcon />,
        href: "/dashboard"
    },
    {
        label: "รายชื่อ",
        icon: <GroupOutlinedIcon />,
        href: "/members"
    },
    {
        label: "การประชุม",
        icon: <WorkOutlineIcon />,
        subMenus: [
            { label: "การประชุมอนุกรรมการ (ภาค/กทม.)", href: "/subCommittee/setup" },
            { label: "การประชุมกรรมการตรวจสอบทรัพย์สิน", href: "/auditCommittee" },
            { label: "การประชุมอนุกรรมเกิน 1 ล้านบาท", href: "/specialCommittee" }
        ]
    },
];

// --- Sidebar Item Component ---
interface SidebarItemProps {
    item: MenuItem;
    sidebarExpanded: boolean;
    onForceExpand: () => void;
}

function SidebarItem({ item, sidebarExpanded, onForceExpand }: SidebarItemProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    const hasSubMenu = item.subMenus && item.subMenus.length > 0;

    // เช็คว่าเมนูนี้ (หรือลูก) Active อยู่หรือไม่
    const isMainActive = item.href ? pathname === item.href : false;
    const isChildActive = item.subMenus ? item.subMenus.some(sub => sub.href === pathname) : false;
    const isActive = isMainActive || isChildActive;

    // Effect: ถ้า Sidebar กางอยู่ และเราอยู่ในหน้าลูก ให้เปิดเมนูออโต้
    useEffect(() => {
        if (isChildActive && sidebarExpanded) {
            setOpen(true);
        }
    }, [isChildActive, sidebarExpanded]);

    const handleClick = () => {
        if (hasSubMenu) {
            if (!sidebarExpanded) {
                // ถ้า Sidebar หุบอยู่: ให้ขยายออก และสั่งเปิดเมนูนี้ทันที
                onForceExpand();
                setOpen(true);
            } else {
                // ถ้า Sidebar กางอยู่แล้ว: แค่สลับเปิด/ปิด
                setOpen(!open);
            }
        } else if (item.href) {
            router.push(item.href);
        }
    };

    return (
        <>
            <Tooltip title={!sidebarExpanded ? item.label : ""} placement="right">
                <Box
                    onClick={handleClick}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: sidebarExpanded ? 'space-between' : 'center',
                        p: 1.5,
                        borderRadius: 2,
                        cursor: 'pointer',
                        color: isActive ? 'white' : '#9ca3af',
                        bgcolor: isActive ? '#141371' : 'transparent',
                        width: '100%',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        '&:hover': {
                            bgcolor: isActive ? '#141371' : '#f3f4f6',
                            color: isActive ? 'white' : '#4b5563',
                        }
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', minWidth: '24px', justifyContent: 'center' }}>
                            {item.icon}
                        </Box>
                        {/* Label */}
                        <Box
                            sx={{
                                ml: sidebarExpanded ? 2 : 0,
                                opacity: sidebarExpanded ? 1 : 0,
                                width: sidebarExpanded ? 'auto' : 0,
                                transition: 'opacity 0.2s, margin 0.2s',
                            }}
                        >
                            <Typography variant="body2" fontWeight="medium">
                                {item.label}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Arrow Icon */}
                    {hasSubMenu && sidebarExpanded && (
                        <Box sx={{ display: 'flex' }}>
                            {(open) ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                        </Box>
                    )}
                </Box>
            </Tooltip>

            {/* Sub Menu Collapse */}
            {hasSubMenu && (
                <Collapse in={open && sidebarExpanded} timeout="auto" unmountOnExit>
                    <Box sx={{ display: 'flex', flexDirection: 'column', pl: 2, mt: 0.5, gap: 0.5 }}>
                        {item.subMenus?.map((sub, index) => {
                            const isSubItemActive = pathname === sub.href;
                            return (
                                <Box
                                    key={index}
                                    onClick={(e) => {
                                        e.stopPropagation(); // ป้องกัน Event ชนกัน
                                        router.push(sub.href);
                                    }}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        p: 1,
                                        pl: 2,
                                        borderRadius: 2,
                                        cursor: 'pointer',
                                        color: isSubItemActive ? '#141371' : '#6b7280',
                                        bgcolor: isSubItemActive ? '#e0e7ff' : 'transparent',
                                        fontWeight: isSubItemActive ? 'bold' : 'normal',
                                        '&:hover': {
                                            bgcolor: '#f3f4f6',
                                            color: '#141371',
                                        }
                                    }}
                                >
                                    <CircleIcon sx={{ fontSize: 6, mr: 2, color: isSubItemActive ? '#141371' : '#d1d5db' }} />
                                    <Typography variant="body2" fontSize="0.85rem">
                                        {sub.label}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Box>
                </Collapse>
            )}
        </>
    );
}

// --- Main Sidebar Component ---
export default function Sidebar() {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleSidebar = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <Paper
            elevation={3}
            sx={{
                width: isExpanded ? 280 : 80,
                display: { xs: 'none', md: 'flex' },
                flexDirection: 'column',
                alignItems: 'center',
                py: 2, px: 2, gap: 2,
                borderRadius: 0, zIndex: 10,
                transition: 'width 0.3s ease-in-out',
                overflowX: 'hidden',
                height: '100vh',
            }}
        >
            {/* Header Toggle */}
            <Box sx={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isExpanded ? 'space-between' : 'center',
                mb: 1,
                px: isExpanded ? 1 : 0,
                transition: 'padding 0.2s'
            }}>
                {isExpanded && (
                    <Typography variant="subtitle1" fontWeight="bold" color="#4b5563" noWrap>
                        เมนูการใช้งาน
                    </Typography>
                )}
                <IconButton onClick={toggleSidebar}>
                    {isExpanded ? <ChevronLeftIcon /> : <MenuIcon />}
                </IconButton>
            </Box>

            {/* Menu Items */}
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
                {menuItems.map((item, index) => (
                    <SidebarItem
                        key={index}
                        item={item}
                        sidebarExpanded={isExpanded}
                        onForceExpand={() => setIsExpanded(true)}
                    />
                ))}
            </Box>

            {/* Footer Item */}
            <Box sx={{ mt: 'auto', width: '100%' }}>
                <SidebarItem
                    item={{ label: "ออกจากระบบ", icon: <LogoutOutlinedIcon /> }}
                    sidebarExpanded={isExpanded}
                    onForceExpand={() => setIsExpanded(true)}
                />
            </Box>
        </Paper>
    );
}