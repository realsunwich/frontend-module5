'use client';

import React from 'react';
import { Stack, Typography, Box } from '@mui/material';

interface FormRowProps {
    label: string;
    children: React.ReactNode;
    required?: boolean;
}

export default function FormRow({ label, children, required = false }: FormRowProps) {
    return (
        <Stack
            direction={{ xs: 'column', xl: 'row' }}
            spacing={{ xs: 1, xl: 2 }}
            alignItems={{ xs: 'stretch', xl: 'center' }}
            sx={{ width: '100%' }}
        >
            <Typography
                variant="body2"
                sx={{
                    minWidth: { xl: '140px' },
                    fontWeight: 600,
                    color: '#4b5563',
                    mb: { xs: 0.5, xl: 0 }
                }}
            >
                {label} {required && <span style={{ color: 'red' }}>*</span>}
            </Typography>
            <Box sx={{ flex: 1 }}>
                {children}
            </Box>
        </Stack>
    );
}