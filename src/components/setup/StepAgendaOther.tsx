'use client';

import React from 'react';
import { Paper, Typography, TextField } from '@mui/material';

export default function StepAgendaOther() {
    return (
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, boxShadow: '0px 2px 4px rgba(0,0,0,0.05)' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
                วาระที่ 5 เรื่องอื่นๆ
            </Typography>
            <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="บันทึกข้อเสนอแนะเพิ่มเติม"
                sx={{ mt: 2, bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
        </Paper>
    );
}