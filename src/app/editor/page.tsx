"use client"

import React, { Suspense } from 'react';
import MeetingEditor from '@/components/MeetingPdfEditorPage';
import Header from '@/components/header';
import Sidebar from '@/components/sidebar';
import { Box, Stack, CircularProgress } from '@mui/material';

export default function EditorPage() {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#f8fafc' }}>
            <Header />
            <Stack direction="row" sx={{ flex: 1, overflow: 'hidden' }}>
                <Sidebar />

                <Box component="main" sx={{ flexGrow: 1, overflow: 'hidden', position: 'relative', p: 0 }}>
                    <Suspense fallback={
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <CircularProgress />
                        </Box>
                    }>
                        <MeetingEditor />
                    </Suspense>
                </Box>
            </Stack>
        </Box>
    );
}