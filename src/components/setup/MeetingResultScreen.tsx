'use client';

import React, { useState, useRef } from 'react';
import {
    Box, Stack, Button, Typography, Paper, TextField, IconButton
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MoreVertIcon from '@mui/icons-material/MoreVert';

// --- Helper Component for Stepper ---
const StepperItem = ({ number, label, active }: { number: number, label: string, active?: boolean }) => (
    <Stack alignItems="center" spacing={1} sx={{ position: 'relative', zIndex: 1 }}>
        <Box
            sx={{
                width: 40, height: 40, borderRadius: '50%',
                bgcolor: active ? '#141371' : '#fff',
                border: active ? 'none' : '1px solid #e0e0e0',
                color: active ? '#fff' : '#9ca3af',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 'bold', fontSize: '1.2rem',
                boxShadow: active ? '0px 4px 10px rgba(20, 19, 113, 0.3)' : 'none'
            }}
        >
            {number}
        </Box>
        <Typography variant="caption" color={active ? '#1e293b' : '#64748b'} fontWeight={active ? 'bold' : 'normal'}>
            {label}
        </Typography>
    </Stack>
);

export default function MeetingResultScreen() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState<string>('');

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) setFileName(file.name);
    };

    return (
        <Box sx={{ width: '100%', maxWidth: 1000, mx: 'auto', py: 4 }}>
            {/* Header & Stepper */}
            <Typography variant="h4" align="center" fontWeight="bold" sx={{ mb: 4, color: '#000' }}>
                ผลการประชุม
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', mb: 5, position: 'relative' }}>
                {/* Lines */}
                <Box sx={{ position: 'absolute', top: 20, left: '35%', right: '35%', height: 1, borderTop: '2px dotted #3140BF', zIndex: 0 }} />

                <Stack direction="row" spacing={10} alignItems="flex-start">
                    <StepperItem number={1} label="ผลการประชุม" active />
                    <StepperItem number={2} label="วาระที่ 4" />
                    <StepperItem number={3} label="วาระที่ 5" />
                </Stack>
            </Box>

            {/* Main Content Card */}
            <Paper elevation={0} sx={{ p: 0, borderRadius: 2, border: '1px solid #e0e0e0', overflow: 'hidden', mb: 3 }}>
                <Box sx={{ p: 2, borderBottom: '1px solid #000' }}>
                    <Typography fontWeight="bold" variant="h6">ผลการประชุม</Typography>
                </Box>

                <Box sx={{ p: 4 }}>
                    <Stack spacing={2}>
                        <Typography fontWeight="bold" variant="body1">รายละเอียด</Typography>
                        <TextField
                            multiline
                            rows={6}
                            fullWidth
                            sx={{
                                bgcolor: '#fff',
                                '& .MuiOutlinedInput-root': { borderRadius: 1, borderColor: '#e0e0e0' }
                            }}
                        />
                    </Stack>
                </Box>

                {/* File Upload & List */}
                <Box sx={{ px: 4, pb: 4 }}>
                    <Stack direction="row" spacing={0} sx={{ mb: 3 }}>
                        <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} />
                        <Box
                            onClick={handleFileClick}
                            sx={{
                                flex: 1, border: '1px solid #e0e0e0', borderRight: 'none',
                                borderRadius: '4px 0 0 4px', display: 'flex', alignItems: 'center', px: 2, py: 1,
                                color: '#9ca3af', cursor: 'pointer', bgcolor: '#fff'
                            }}
                        >
                            {fileName || 'กรุณาเลือกไฟล์ .pdf .jpg'}
                        </Box>
                        <Button
                            onClick={handleFileClick}
                            variant="contained"
                            disableElevation
                            sx={{ borderRadius: '0 4px 4px 0', bgcolor: '#3140BF', px: 4 }}
                        >
                            เลือก
                        </Button>
                    </Stack>

                    {/* Table Section */}
                    <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}>
                        <Box sx={{ p: 1.5, borderBottom: '1px solid #000' }}>
                            <Typography variant="subtitle2" fontWeight="bold">ลำดับ</Typography>
                        </Box>
                        <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2">00</Typography>
                            <IconButton size="small"><MoreVertIcon fontSize="small" /></IconButton>
                        </Box>
                    </Box>
                </Box>
            </Paper>

            {/* Bottom Buttons */}
            <Stack direction="row" justifyContent="flex-end" spacing={2}>
                <Button variant="outlined" sx={{ color: '#3140BF', borderColor: '#3140BF', px: 4 }}>
                    บันทึกร่าง
                </Button>
                <Button
                    variant="contained"
                    endIcon={<ArrowForwardIcon />}
                    sx={{ bgcolor: '#141371', px: 4, '&:hover': { bgcolor: '#0f0e5c' } }}
                >
                    ถัดไป
                </Button>
            </Stack>
        </Box>
    );
}