'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Box, Stack, TextField, Select, MenuItem, FormControl,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    OutlinedInput, Paper, IconButton, Typography, Button, SelectChangeEvent,
    Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import FormRow from '@/components/common/FormRow';

// --- CONSTANTS ---
const AGENCY_DATA = [
    { name: 'กระทรวงยุติธรรม', departments: ['สำนักงานปลัดกระทรวงยุติธรรม', 'กรมบังคับคดี', 'กรมคุมประพฤติ', 'กรมราชทัณฑ์', 'กรมสอบสวนคดีพิเศษ (DSI)'] },
    { name: 'กระทรวงการคลัง', departments: ['สำนักงานปลัดกระทรวงการคลัง', 'กรมบัญชีกลาง', 'กรมสรรพากร', 'กรมศุลกากร', 'สำนักงานเศรษฐกิจการคลัง'] },
    { name: 'สำนักงานตำรวจแห่งชาติ', departments: ['สำนักงานผู้บัญชาการตำรวจแห่งชาติ', 'กองบัญชาการตำรวจนครบาล', 'กองบัญชาการตำรวจสอบสวนกลาง'] },
    { name: 'หน่วยงานอิสระ', departments: ['สำนักงาน ป.ป.ช.', 'สำนักงาน ป.ป.ท.', 'สำนักงานการตรวจเงินแผ่นดิน'] }
];

const PRENAME_OPTIONS = [
    // บุคคลทั่วไป
    { value: 'นาย', label: 'นาย' }, { value: 'นาง', label: 'นาง' }, { value: 'นางสาว', label: 'นางสาว' },
    // วุฒิการศึกษา / ตำแหน่งทางวิชาการ
    { value: 'ด็อกเตอร์', label: 'ด็อกเตอร์' }, { value: 'ผู้ช่วยศาสตราจารย์', label: 'ผู้ช่วยศาสตราจารย์' }, { value: 'รองศาสตราจารย์', label: 'รองศาสตราจารย์' }, { value: 'ศาสตราจารย์', label: 'ศาสตราจารย์' },
    // ยศตำรวจ
    { value: 'พลตำรวจเอก', label: 'พลตำรวจเอก' }, { value: 'พลตำรวจโท', label: 'พลตำรวจโท' }, { value: 'พลตำรวจตรี', label: 'พลตำรวจตรี' }, { value: 'พันตำรวจเอก', label: 'พันตำรวจเอก' }, { value: 'พันตำรวจโท', label: 'พันตำรวจโท' }, { value: 'พันตำรวจตรี', label: 'พันตำรวจตรี' }, { value: 'ร้อยตำรวจเอก', label: 'ร้อยตำรวจเอก' }, { value: 'ร้อยตำรวจโท', label: 'ร้อยตำรวจโท' }, { value: 'ร้อยตำรวจตรี', label: 'ร้อยตำรวจตรี' },
    // ยศทหาร (สายยศพลเอก - กองทัพบก)
    { value: 'พลเอก', label: 'พลเอก' }, { value: 'พลโท', label: 'พลโท' }, { value: 'พลตรี', label: 'พลตรี' },
    // วิชาชีพแพทย์
    { value: 'นายแพทย์', label: 'นายแพทย์' }, { value: 'แพทย์หญิง', label: 'แพทย์หญิง' },
    // อื่นๆ
    { value: 'อื่นๆ', label: 'อื่นๆ' },
];

export interface Member {
    id: number;
    firstname: string;
    middlename?: string;
    lastname: string;
    prename: string;
    affiliation: string;
    department: string;
    phone: string;
    email: string;
}

interface StepDetailProps {
    meetingInfo: {
        meetingDate: string;
        startTime: string;
        location: string;
        detail: string;
    };
    setMeetingInfo: React.Dispatch<React.SetStateAction<{
        meetingDate: string;
        startTime: string;
        location: string;
        detail: string;
    }>>;
    selectedMembers: Member[];
    setSelectedMembers: React.Dispatch<React.SetStateAction<Member[]>>;
}

export default function StepDetail({ meetingInfo, setMeetingInfo, selectedMembers, setSelectedMembers }: StepDetailProps) {
    const [openDialog, setOpenDialog] = useState(false);
    const [allMembers, setAllMembers] = useState<Member[]>([]);
    const [currentSelectedId, setCurrentSelectedId] = useState<string>('');
    const [searchText, setSearchText] = useState("");
    const [newMemberData, setNewMemberData] = useState({
        citizenId: '', prename: '', firstname: '', middlename: '', lastname: '',
        affiliation: '', department: '', phone: '', email: ''
    });

    const currentDialogDepartments = useMemo(() => {
        const selectedAgency = AGENCY_DATA.find(a => a.name === newMemberData.affiliation);
        return selectedAgency ? selectedAgency.departments : [];
    }, [newMemberData.affiliation]);

    const fetchMembers = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/committee-members');
            if (response.ok) {
                const data = await response.json();
                setAllMembers(data);
            }
        } catch (error) { console.error("Error:", error); }
    };

    useEffect(() => { fetchMembers(); }, []);

    const firstLoadRef = useRef(true);
    useEffect(() => {
        if (firstLoadRef.current) { firstLoadRef.current = false; return; }
        if (!openDialog) { fetchMembers(); }
    }, [openDialog]);

    const handleSelectMemberAutocomplete = (member: Member | null) => {
        if (!member) return;

        const isAlreadySelected = selectedMembers.some(m => m.id === member.id);
        if (!isAlreadySelected) {
            setSelectedMembers(prev => [...prev, member]);
        } else {
            alert("รายชื่อนี้ถูกเลือกไปแล้ว");
        }
    };

    const handleRemoveMember = (id: number) => {
        setSelectedMembers(prev => prev.filter(m => m.id !== id));
    };

    // Form ใน Dialog
    const handleNewMemberFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
        const { name, value } = e.target;
        setNewMemberData(prev => {
            if (name === 'affiliation') return { ...prev, [name]: value, department: '' };
            return { ...prev, [name]: value as string };
        });
    };

    const handleSaveNewMember = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/committee-members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMemberData),
            });
            if (response.ok) {
                alert("บันทึกข้อมูลสมาชิกสำเร็จ!");
                setOpenDialog(false);
                setNewMemberData({ citizenId: '', prename: '', firstname: '', middlename: '', lastname: '', affiliation: '', department: '', phone: '', email: '' });
            } else {
                alert("เกิดข้อผิดพลาด: " + response.statusText);
            }
        } catch (error) { console.error("Error:", error); alert("ไม่สามารถติดต่อ Server ได้"); }
    };

    const handleMeetingInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
        const { name, value } = e.target;
        setMeetingInfo(prev => ({ ...prev, [name]: value }));
    };

    return (
        <>
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ m: 0, p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" component="div">เพิ่มคณะกรรมการใหม่</Typography>
                    <IconButton onClick={() => setOpenDialog(false)}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: { xs: 2, md: 4 } }}>
                    <Stack spacing={3}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                            <Box sx={{ flex: 1 }}>
                                <FormRow label="เลขบัตรประชาชน / หนังสือเดินทาง">
                                    <TextField
                                        fullWidth size="small" placeholder="0-0000-00000-00-0"
                                        name="citizenId" value={newMemberData.citizenId} onChange={handleNewMemberFormChange}
                                        inputProps={{ maxLength: 13 }}
                                        sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </FormRow>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <FormRow label="คำนำหน้า">
                                    <FormControl fullWidth size="small">
                                        <Select displayEmpty name="prename" value={newMemberData.prename} onChange={handleNewMemberFormChange} sx={{ bgcolor: '#fff', borderRadius: 2 }} MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}>
                                            <MenuItem value="" disabled><span style={{ color: '#9ca3af' }}>เลือก</span></MenuItem>
                                            {PRENAME_OPTIONS.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </FormRow>
                            </Box>
                        </Stack>

                        <Stack
                            direction={{ xs: 'column', md: 'row' }}
                            spacing={3} sx={{ borderRadius: 2, }}
                        >
                            {/* Firstname */}
                            <Box sx={{ flex: 1 }}>
                                <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 600, color: '#4b5563', mb: 0.8 }}
                                >
                                    ชื่อจริง
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    name="firstname"
                                    value={newMemberData.firstname}
                                    onChange={handleNewMemberFormChange}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            bgcolor: '#fff'
                                        }
                                    }}
                                />
                            </Box>

                            {/* Middlename */}
                            <Box sx={{ width: { xs: '100%', md: 220 } }}>
                                <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 600, color: '#4b5563', mb: 0.8 }}
                                >
                                    ชื่อกลาง (ถ้ามี)
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    name="middlename"
                                    value={newMemberData.middlename}
                                    onChange={handleNewMemberFormChange}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            bgcolor: '#fff'
                                        }
                                    }}
                                />
                            </Box>

                            {/* Lastname */}
                            <Box sx={{ flex: 1 }}>
                                <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 600, color: '#4b5563', mb: 0.8 }}
                                >
                                    นามสกุล
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    name="lastname"
                                    value={newMemberData.lastname}
                                    onChange={handleNewMemberFormChange}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            bgcolor: '#fff'
                                        }
                                    }}
                                />
                            </Box>
                        </Stack>

                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                            <Box sx={{ flex: 1 }}>
                                <FormRow label="สังกัด">
                                    <FormControl fullWidth size="small">
                                        <Select displayEmpty name="affiliation" value={newMemberData.affiliation} onChange={handleNewMemberFormChange} sx={{ bgcolor: '#fff', borderRadius: 2 }}>
                                            <MenuItem value="" disabled><span style={{ color: '#9ca3af' }}>เลือกสังกัด</span></MenuItem>
                                            {AGENCY_DATA.map(a => <MenuItem key={a.name} value={a.name}>{a.name}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </FormRow>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <FormRow label="หน่วยงาน">
                                    <FormControl fullWidth size="small">
                                        <Select displayEmpty name="department" value={newMemberData.department} onChange={handleNewMemberFormChange} disabled={!newMemberData.affiliation} sx={{ bgcolor: '#fff', borderRadius: 2 }}>
                                            <MenuItem value="" disabled><span style={{ color: '#9ca3af' }}>เลือกหน่วยงาน</span></MenuItem>
                                            {currentDialogDepartments.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </FormRow>
                            </Box>
                        </Stack>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                            <Box sx={{ flex: 1 }}><FormRow label="เบอร์ติดต่อ"><TextField fullWidth size="small" placeholder="000-000-0000" name="phone" value={newMemberData.phone} onChange={handleNewMemberFormChange} sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }} /></FormRow></Box>
                            <Box sx={{ flex: 1 }}><FormRow label="อีเมล"><TextField fullWidth size="small" placeholder="email@example.com" name="email" value={newMemberData.email} onChange={handleNewMemberFormChange} sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }} /></FormRow></Box>
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpenDialog(false)} variant="outlined" sx={{ color: '#6b7280', borderColor: '#d1d5db', borderRadius: 2, px: 3 }}>ยกเลิก</Button>
                    <Button variant="contained" onClick={handleSaveNewMember} sx={{ bgcolor: '#141371', borderRadius: 2, px: 4, '&:hover': { bgcolor: '#111827' } }}>บันทึก</Button>
                </DialogActions>
            </Dialog>

            {/* ส่วน Input ข้อมูลการประชุม */}
            <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, mb: 1, boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}>
                <Typography variant="h6" fontWeight="bold" mb={3} color="primary">ข้อมูลการประชุม</Typography>
                <Stack spacing={3}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                        <Box sx={{ flex: 1 }}><FormRow label="เลขที่การประชุม"><TextField fullWidth placeholder="สร้างอัตโนมัติ" disabled size="small" sx={{ bgcolor: '#f9fafb', borderRadius: 1 }} /></FormRow></Box>
                        <Box sx={{ flex: 1 }}>
                            <FormRow label="วันที่ประชุม" required>
                                <FormControl fullWidth size="small">
                                    <OutlinedInput
                                        type="date" size="small" name="meetingDate"
                                        value={meetingInfo.meetingDate} onChange={handleMeetingInfoChange}
                                        sx={{ bgcolor: '#fff', borderRadius: 1 }}
                                    />
                                </FormControl>
                            </FormRow>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <FormRow label="เวลา" required>
                                <TextField
                                    fullWidth type="time" size="small" name="startTime"
                                    value={meetingInfo.startTime} onChange={handleMeetingInfoChange}
                                    sx={{ bgcolor: '#fff', borderRadius: 1 }}
                                />
                            </FormRow>
                        </Box>
                    </Stack>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                        <Box sx={{ flex: 1 }}>
                            <FormRow label="สถานที่ประชุม" required>
                                <FormControl fullWidth size="small">
                                    <Select
                                        displayEmpty name="location"
                                        value={meetingInfo.location} onChange={handleMeetingInfoChange}
                                        sx={{ bgcolor: '#fff', borderRadius: 1 }}
                                    >
                                        <MenuItem value="" disabled><span style={{ color: '#9ca3af' }}>เลือกสถานที่</span></MenuItem>
                                        <MenuItem value="ห้องประชุม 1">ห้องประชุม 1</MenuItem>
                                        <MenuItem value="ห้องประชุม 2">ห้องประชุม 2</MenuItem>
                                        <MenuItem value="ห้องประชุม 3">ห้องประชุม 3</MenuItem>
                                        <MenuItem value="ออนไลน์ (Ms Team/Google Meet ฯลฯ)">ออนไลน์ (Ms Team/Google Meet ฯลฯ)</MenuItem>
                                    </Select>
                                </FormControl>
                            </FormRow>
                        </Box>
                        <Box sx={{ flex: 2 }}>
                            <FormRow label="รายละเอียด">
                                <TextField
                                    fullWidth size="small" placeholder="ระบุรายละเอียดเพิ่มเติม" name="detail"
                                    value={meetingInfo.detail} onChange={handleMeetingInfoChange}
                                    sx={{ bgcolor: '#fff', borderRadius: 1 }}
                                />
                            </FormRow>
                        </Box>
                    </Stack>
                </Stack>
            </Paper>

            <Paper sx={{ p: 0, borderRadius: 3, minHeight: 200, boxShadow: '0px 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <Box sx={{ p: 3, bgcolor: '#fff', borderBottom: '1px solid #f0f0f0' }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="h6" fontWeight="bold" color="#1e293b">คณะอนุกรรมการ</Typography>
                            <Chip label={`${selectedMembers.length} ท่าน`} size="small" color="primary" sx={{ bgcolor: '#e0e7ff', color: '#3140BF', fontWeight: 'bold' }} />
                        </Stack>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', md: 'auto' } }}>
                            <Autocomplete
                                options={allMembers}
                                getOptionLabel={(option) => `${option.prename}${option.firstname} ${option.lastname}`}
                                value={null}
                                inputValue={searchText}
                                onInputChange={(event, newInputValue) => {
                                    setSearchText(newInputValue);
                                }}
                                onChange={(event, newValue) => {
                                    if (newValue) {
                                        handleSelectMemberAutocomplete(newValue);
                                    }
                                    setSearchText("");
                                }}
                                renderOption={(props, option) => (
                                    <li {...props} key={option.id}>
                                        <Box>
                                            <Typography>
                                                {option.prename}{option.firstname} {option.lastname}
                                            </Typography>
                                        </Box>
                                    </li>
                                )}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="ค้นหารายชื่ออนุกรรมการเพื่อเพิ่ม"
                                        size="small"
                                        sx={{
                                            bgcolor: '#f8fafc',
                                            borderRadius: 2,
                                            '& .MuiOutlinedInput-root': { borderRadius: 2 }
                                        }}
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: (
                                                <>
                                                    <SearchIcon color="action" fontSize="small" sx={{ ml: 1, mr: -0.5 }} />
                                                    {params.InputProps.startAdornment}
                                                </>
                                            )
                                        }}
                                    />
                                )}
                                sx={{ minWidth: 300 }}
                            />
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)} sx={{ bgcolor: '#3140BF', borderRadius: 2, textTransform: 'none', boxShadow: 'none', '&:hover': { bgcolor: '#1e1b4b', boxShadow: 'none' } }}>สร้างใหม่</Button>
                        </Stack>
                    </Stack>
                </Box>

                <TableContainer>
                    <Table sx={{ minWidth: 800 }}>
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>ชื่อ-นามสกุล</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>สังกัด</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>หน่วยงาน</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>เบอร์ติดต่อ</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>อีเมล</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b', textAlign: "center" }}>จัดการบันทึก</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {selectedMembers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 2 }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.5 }}>
                                            <AddIcon sx={{ fontSize: 48, mb: 1, color: '#cbd5e1' }} />
                                            <Typography color="text.secondary">กรุณาเลือกรายชื่อจากด้านบน</Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                selectedMembers.map((row, index) => (
                                    <TableRow key={index} hover sx={{ '&:last-child td, &:last-child th': { border: 0 }, transition: 'background-color 0.2s' }}>
                                        <TableCell sx={{ color: '#475569' }}>{row.prename}{row.firstname} {row.lastname}</TableCell>
                                        <TableCell sx={{ color: '#475569' }}>{row.affiliation || '-'}</TableCell>
                                        <TableCell sx={{ color: '#475569' }}>{row.department || '-'}</TableCell>
                                        <TableCell sx={{ color: '#475569' }}>{row.phone || '-'}</TableCell>
                                        <TableCell sx={{ color: '#475569' }}>{row.email || '-'}</TableCell>
                                        <TableCell align="center">
                                            <IconButton size="small" sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fee2e2' } }} onClick={() => handleRemoveMember(row.id)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </>
    );
}