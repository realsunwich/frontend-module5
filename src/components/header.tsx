'use client';

import React from 'react';
import { AppBar, Toolbar, Typography, Box, Stack, IconButton, Avatar } from '@mui/material';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

export default function Header() {
    return (
        <AppBar position="sticky" sx={{ bgcolor: '#141371', boxShadow: 3, zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar sx={{ justifyContent: 'space-between' }}>
                {/* Left: Logo & Title */}
                <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ width: 40, height: 40, bgcolor: '#f59e0b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#141371', fontWeight: 'bold' }}>
                        A
                    </Box>
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold" lineHeight={1.2}>ASLES</Typography>
                        <Typography variant="caption" sx={{ color: '#d1d5db' }}>ระบบตรวจสอบทรัพย์สินและบังคับคดีกองทุน</Typography>
                    </Box>
                </Stack>

                {/* Right: Actions & Profile */}
                <Stack direction="row" spacing={2} alignItems="center">
                    <IconButton sx={{ color: 'white' }}><MailOutlineIcon /></IconButton>
                    <IconButton sx={{ color: 'white' }}><NotificationsNoneIcon /></IconButton>

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
    );
}