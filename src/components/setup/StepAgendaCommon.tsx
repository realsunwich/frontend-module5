'use client';

import React from 'react';
import { Paper, Typography, Box, TextField, Stack } from '@mui/material';

interface StepAgendaCommonProps {
    agendaNumber: number;
    title: string;
}

export default function StepAgendaCommon({ agendaNumber, title }: StepAgendaCommonProps) {
    return (
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, mb: 3, boxShadow: '0px 2px 4px rgba(0,0,0,0.05)' }}>
            <Box sx={{ borderBottom: '1px solid #e5e7eb', pb: 2, mb: 3 }}>
                <Typography variant="h6" fontWeight="bold" color="primary">
                    วาระที่ {agendaNumber} {title}
                </Typography>
            </Box>

            <Stack spacing={3}>
                <Box>
                    <Typography variant="body2" fontWeight="600" color="#4b5563" mb={1}>
                        รายละเอียดวาระ
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={6}
                        placeholder={`กรุณาระบุรายละเอียดสำหรับวาระที่ ${agendaNumber}...`}
                        sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                </Box>
            </Stack>
        </Paper>
    );
}