'use client';

import React from 'react';
import { Paper, Typography, Box, Button, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

export default function StepAgendaConsideration() {
    return (
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, mb: 3, boxShadow: '0px 2px 4px rgba(0,0,0,0.05)' }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight="bold" color="#b45309">
                    วาระที่ 4 เรื่องเสนอเพื่อพิจารณา
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    ส่วนนี้สำหรับบันทึกมติที่ประชุม
                </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, border: '2px dashed #cbd5e1', borderRadius: 2, bgcolor: '#fff7ed' }}>
                <Button variant="outlined" startIcon={<AddIcon />} color="warning">
                    เพิ่มเรื่องพิจารณา
                </Button>
            </Box>
        </Paper>
    );
}