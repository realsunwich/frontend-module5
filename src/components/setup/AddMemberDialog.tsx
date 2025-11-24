'use client';

import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Select, MenuItem, FormControl,
    Box, Typography, IconButton, Stack
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FormRow from '@/components/common/FormRow';

interface AddMemberDialogProps {
    open: boolean;
    onClose: () => void;
}

// ข้อมูลคำนำหน้าชื่อ (รวมยศและตำแหน่งทางวิชาการ)
const PRENAME_OPTIONS = [
    // --- บุคคลทั่วไป ---
    { value: 'mr', label: 'นาย' },
    { value: 'mrs', label: 'นาง' },
    { value: 'ms', label: 'นางสาว' },

    // --- วิชาการ ---
    { value: 'dr', label: 'ดร.' },
    { value: 'asst_prof', label: 'ผศ.' },
    { value: 'assoc_prof', label: 'รศ.' },
    { value: 'prof', label: 'ศ.' },
    { value: 'prof_dr', label: 'ศ.ดร.' },

    // --- ตำรวจ ---
    { value: 'pol_gen', label: 'พล.ต.อ.' },
    { value: 'pol_lt_gen', label: 'พล.ต.ท.' },
    { value: 'pol_maj_gen', label: 'พล.ต.ต.' },
    { value: 'pol_col', label: 'พ.ต.อ.' },
    { value: 'pol_lt_col', label: 'พ.ต.ท.' },
    { value: 'pol_maj', label: 'พ.ต.ต.' },
    { value: 'pol_capt', label: 'ร.ต.อ.' },
    { value: 'pol_lt', label: 'ร.ต.ท.' },
    { value: 'pol_sub_lt', label: 'ร.ต.ต.' },

    // --- ทหาร (บก/เรือ/อากาศ - ตัวอย่างยศหลัก) ---
    { value: 'gen', label: 'พล.อ.' },
    { value: 'lt_gen', label: 'พล.ท.' },
    { value: 'maj_gen', label: 'พล.ต.' },
    { value: 'col', label: 'พ.อ.' },
    { value: 'lt_col', label: 'พ.ท.' },
    { value: 'maj', label: 'พ.ต.' },
    { value: 'capt', label: 'ร.อ.' },
    { value: 'lt', label: 'ร.ท.' },
    { value: 'sub_lt', label: 'ร.ต.' },
    { value: 'acting_sub_lt', label: 'ว่าที่ ร.ต.' },

    // --- แพทย์/วิชาชีพ ---
    { value: 'md', label: 'นพ.' },
    { value: 'dr_woman', label: 'พญ.' },

    // --- ฐานันดรศักดิ์ (หม่อมราชวงศ์/หม่อมหลวง) ---
    { value: 'mr_r', label: 'ม.ร.ว.' },
    { value: 'ml', label: 'ม.ล.' },

    // --- อื่นๆ ---
    { value: 'other', label: 'อื่นๆ' },
];

export default function AddMemberDialog({ open, onClose }: AddMemberDialogProps) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3 }
            }}
        >
            {/* Header */}
            <DialogTitle sx={{ m: 0, p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight="bold" component="div">
                    ข้อมูลคณะกรรมการ
                </Typography>
                <IconButton onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            {/* Content Form */}
            <DialogContent dividers sx={{ p: { xs: 2, md: 4 } }}>
                <Stack spacing={3}>
                    {/* Row 1 */}
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                        <Box sx={{ flex: 1 }}>
                            <FormRow label="เลขประจำตัวประชาชน/พาสปอร์ต">
                                <TextField
                                    fullWidth
                                    placeholder="0-0000-00000-00-0"
                                    size="small"
                                    sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                />
                            </FormRow>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <FormRow label="คำนำหน้า">
                                <FormControl fullWidth size="small">
                                    <Select
                                        defaultValue=""
                                        displayEmpty
                                        sx={{ bgcolor: '#fff', borderRadius: 2 }}
                                        MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
                                    >
                                        <MenuItem value="" disabled>
                                            <span style={{ color: '#9ca3af' }}>เลือก</span>
                                        </MenuItem>
                                        {PRENAME_OPTIONS.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </FormRow>
                        </Box>
                    </Stack>

                    {/* Row 2 */}
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                        <Box sx={{ flex: 1 }}>
                            <FormRow label="ชื่อ">
                                <TextField fullWidth size="small" sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                            </FormRow>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <FormRow label="นามสกุล">
                                <TextField fullWidth size="small" sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                            </FormRow>
                        </Box>
                    </Stack>

                    {/* Row 3 */}
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                        <Box sx={{ flex: 1 }}>
                            <FormRow label="สังกัด">
                                <FormControl fullWidth size="small">
                                    <Select defaultValue="" displayEmpty sx={{ bgcolor: '#fff', borderRadius: 2 }}>
                                        <MenuItem value="" disabled><span style={{ color: '#9ca3af' }}>เลือก</span></MenuItem>
                                        <MenuItem value="agency1">สังกัด 1</MenuItem>
                                        <MenuItem value="agency2">สังกัด 2</MenuItem>
                                    </Select>
                                </FormControl>
                            </FormRow>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <FormRow label="หน่วยงาน">
                                <FormControl fullWidth size="small">
                                    <Select defaultValue="" displayEmpty sx={{ bgcolor: '#fff', borderRadius: 2 }}>
                                        <MenuItem value="" disabled><span style={{ color: '#9ca3af' }}>เลือก หน่วยงาน</span></MenuItem>
                                        <MenuItem value="dept1">หน่วยงาน 1</MenuItem>
                                        <MenuItem value="dept2">หน่วยงาน 2</MenuItem>
                                    </Select>
                                </FormControl>
                            </FormRow>
                        </Box>
                    </Stack>

                    {/* Row 4 */}
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                        <Box sx={{ flex: 1 }}>
                            <FormRow label="เบอร์ติดต่อ">
                                <TextField
                                    fullWidth
                                    placeholder="000-000-0000"
                                    size="small"
                                    sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                />
                            </FormRow>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <FormRow label="อีเมล">
                                <TextField
                                    fullWidth
                                    placeholder="example@example.com"
                                    size="small"
                                    sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                />
                            </FormRow>
                        </Box>
                    </Stack>
                </Stack>
            </DialogContent>

            {/* Footer Actions */}
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose} variant="outlined" sx={{ color: '#6b7280', borderColor: '#d1d5db', borderRadius: 2, px: 3 }}>
                    ยกเลิก
                </Button>
                <Button variant="contained" sx={{ bgcolor: '#141371', borderRadius: 2, px: 4, '&:hover': { bgcolor: '#111827' } }}>
                    บันทึก
                </Button>
            </DialogActions>
        </Dialog>
    );
}