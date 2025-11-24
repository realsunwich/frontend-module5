'use client';

import React from 'react';
import { Paper, Box } from '@mui/material';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import SearchIcon from '@mui/icons-material/Search';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';

// Helper Component (เก็บไว้ในไฟล์นี้ได้เลย เพราะใช้แค่ที่นี่)
function SidebarIcon({ icon, active = false }: { icon: React.ReactNode, active?: boolean }) {
    return (
        <Box
            sx={{
                p: 1.5, borderRadius: 2, cursor: 'pointer',
                color: active ? 'white' : '#9ca3af',
                bgcolor: active ? '#141371' : 'transparent',
                transition: 'all 0.2s',
                '&:hover': {
                    bgcolor: active ? '#141371' : '#f3f4f6',
                    color: active ? 'white' : '#4b5563',
                }
            }}
        >
            {icon}
        </Box>
    );
}

export default function Sidebar() {
    return (
        <Paper
            elevation={3}
            sx={{
                width: 80, display: { xs: 'none', md: 'flex' }, flexDirection: 'column', alignItems: 'center',
                py: 3, gap: 3, borderRadius: 0, zIndex: 10
            }}
        >
            <SidebarIcon icon={<HomeOutlinedIcon />} />
            <SidebarIcon icon={<SearchIcon />} />
            <SidebarIcon icon={<GroupOutlinedIcon />} />
            <SidebarIcon icon={<WorkOutlineIcon />} active />
            <SidebarIcon icon={<DescriptionOutlinedIcon />} />
            <Box sx={{ mt: 'auto' }}>
                <SidebarIcon icon={<LogoutOutlinedIcon />} />
            </Box>
        </Paper>
    );
}