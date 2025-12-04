'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Box, Stack, TextField, Select, MenuItem, FormControl, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Typography, Button, SelectChangeEvent, Dialog, DialogTitle, DialogContent, DialogActions, Chip, InputAdornment, CircularProgress, } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit'; // เพิ่ม Icon แก้ไขเผื่อไว้
import FormRow from '@/components/common/FormRow';
import Header from '@/components/header';
import Sidebar from '@/components/sidebar';

// --- CONSTANTS ---
const AGENCY_DATA = [
    { name: 'กระทรวงยุติธรรม', departments: ['สำนักงานปลัดกระทรวงยุติธรรม', 'กรมบังคับคดี', 'กรมคุมประพฤติ', 'กรมราชทัณฑ์', 'กรมสอบสวนคดีพิเศษ (DSI)'] },
    { name: 'กระทรวงการคลัง', departments: ['สำนักงานปลัดกระทรวงการคลัง', 'กรมบัญชีกลาง', 'กรมสรรพากร', 'กรมศุลกากร', 'สำนักงานเศรษฐกิจการคลัง'] },
    { name: 'สำนักงานตำรวจแห่งชาติ', departments: ['สำนักงานผู้บัญชาการตำรวจแห่งชาติ', 'กองบัญชาการตำรวจนครบาล', 'กองบัญชาการตำรวจสอบสวนกลาง'] },
    { name: 'หน่วยงานอิสระ', departments: ['สำนักงาน ป.ป.ช.', 'สำนักงาน ป.ป.ท.', 'สำนักงานการตรวจเงินแผ่นดิน'] }
];

const PRENAME_OPTIONS = [
    { value: 'นาย', label: 'นาย' }, { value: 'นาง', label: 'นาง' }, { value: 'นางสาว', label: 'นางสาว' },
    { value: 'ด็อกเตอร์', label: 'ด็อกเตอร์' }, { value: 'ผู้ช่วยศาสตราจารย์', label: 'ผู้ช่วยศาสตราจารย์' }, { value: 'รองศาสตราจารย์', label: 'รองศาสตราจารย์' }, { value: 'ศาสตราจารย์', label: 'ศาสตราจารย์' },
    { value: 'พลตำรวจเอก', label: 'พลตำรวจเอก' }, { value: 'พลตำรวจโท', label: 'พลตำรวจโท' }, { value: 'พลตำรวจตรี', label: 'พลตำรวจตรี' },
    { value: 'พันตำรวจเอก', label: 'พันตำรวจเอก' }, { value: 'พันตำรวจโท', label: 'พันตำรวจโท' }, { value: 'พันตำรวจตรี', label: 'พันตำรวจตรี' },
    { value: 'ร้อยตำรวจเอก', label: 'ร้อยตำรวจเอก' }, { value: 'ร้อยตำรวจโท', label: 'ร้อยตำรวจโท' }, { value: 'ร้อยตำรวจตรี', label: 'ร้อยตำรวจตรี' },
    { value: 'พลเอก', label: 'พลเอก' }, { value: 'พลโท', label: 'พลโท' }, { value: 'พลตรี', label: 'พลตรี' },
    { value: 'นายแพทย์', label: 'นายแพทย์' }, { value: 'แพทย์หญิง', label: 'แพทย์หญิง' },
    { value: 'อื่นๆ', label: 'อื่นๆ' }
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

const EMPTY_FORM = {
    citizenId: '',
    prename: '',
    firstname: '',
    middlename: '',
    lastname: '',
    affiliation: '',
    department: '',
    phone: '',
    email: ''
};

export default function MemberManagementPage() {
    // --- STATE ---
    const [allMembers, setAllMembers] = useState<Member[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form Data สำหรับสร้าง/แก้ไข
    const [newMemberData, setNewMemberData] = useState({ ...EMPTY_FORM });
    const [editingId, setEditingId] = useState<number | null>(null);

    // --- FETCH DATA ---
    const fetchMembers = async () => {
        setLoadingMembers(true);
        try {
            const response = await fetch('http://localhost:8080/api/committee-members');
            if (response.ok) {
                const data = await response.json();
                setAllMembers(data);
            } else {
                console.error('Fetch members failed:', response.statusText);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoadingMembers(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    // Refetch เมื่อปิด Dialog (กรณีมีการเพิ่ม/แก้ไขข้อมูล)
    const firstLoadRef = useRef(true);
    useEffect(() => {
        if (firstLoadRef.current) {
            firstLoadRef.current = false;
            return;
        }
        if (!openDialog) {
            fetchMembers();
        }
    }, [openDialog]);

    // --- LOGIC ---
    const filteredMembers = useMemo(() => {
        const search = searchText.trim().toLowerCase();
        if (!search) return allMembers;
        return allMembers.filter(m => {
            const fullName = `${m.prename}${m.firstname} ${m.middlename} ${m.lastname}`.toLowerCase();
            return (
                fullName.includes(search) ||
                (m.affiliation || '').toLowerCase().includes(search) ||
                (m.department || '').toLowerCase().includes(search) ||
                (m.email || '').toLowerCase().includes(search) ||
                (m.phone || '').toLowerCase().includes(search)
            );
        });
    }, [allMembers, searchText]);

    const currentDialogDepartments = useMemo(() => {
        const selectedAgency = AGENCY_DATA.find(a => a.name === newMemberData.affiliation);
        return selectedAgency ? selectedAgency.departments : [];
    }, [newMemberData.affiliation]);

    const handleNewMemberFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
        const { name, value } = e.target as HTMLInputElement;
        setNewMemberData(prev => {
            if (name === 'affiliation') return { ...prev, [name]: value, department: '' };
            return { ...prev, [name]: value as string };
        });
    };

    // Basic validation
    const validateForm = () => {
        if (!newMemberData.citizenId.trim()) {
            alert('กรุณากรอกเลขประจำตัวประชาชน');
            return false;
        }
        if (!newMemberData.prename.trim() || !newMemberData.firstname.trim() || !newMemberData.lastname.trim()) {
            alert('กรุณากรอกคำนำหน้า ชื่อ และนามสกุล');
            return false;
        }
        return true;
    };

    const handleSaveNewMember = async () => {
        if (!validateForm()) return;
        setSaving(true);
        try {
            const payload = { ...newMemberData };
            if (editingId) {
                // Update existing member
                const response = await fetch(`http://localhost:8080/api/committee-members/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (response.ok) {
                    alert('อัปเดตข้อมูลสมาชิกสำเร็จ!');
                    setOpenDialog(false);
                    setEditingId(null);
                    setNewMemberData({ ...EMPTY_FORM });
                } else {
                    alert('เกิดข้อผิดพลาด: ' + response.statusText);
                }
            } else {
                // Create new member
                const response = await fetch('http://localhost:8080/api/committee-members', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (response.ok) {
                    alert('บันทึกข้อมูลสมาชิกสำเร็จ!');
                    setOpenDialog(false);
                    setNewMemberData({ ...EMPTY_FORM });
                } else {
                    alert('เกิดข้อผิดพลาด: ' + response.statusText);
                }
            }
        } catch (error) {
            console.error('Error:', error);
            alert('ไม่สามารถติดต่อ Server ได้');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteMember = async (id: number) => {
        if (!confirm('คุณต้องการลบรายชื่อนี้ใช่หรือไม่?')) return;

        try {
            // ตัวอย่างเรียก API Delete — เปิดใช้งานถ้ามี
            // const response = await fetch(`http://localhost:8080/api/committee-members/${id}`, { method: 'DELETE' });
            // if (response.ok) { fetchMembers(); }

            // ถ้า API ยังไม่พร้อม ให้ลบจำลองที่ฝั่ง client
            setAllMembers(prev => prev.filter(m => m.id !== id));
            alert('ลบรายการเรียบร้อย (Simulation)');
        } catch (error) {
            console.error('Error deleting:', error);
            alert('เกิดข้อผิดพลาดขณะลบ');
        }
    };

    const handleOpenAddDialog = () => {
        setEditingId(null);
        setNewMemberData({ ...EMPTY_FORM });
        setOpenDialog(true);
    };

    const handleOpenEditDialog = (member: Member) => {
        setEditingId(member.id);
        setNewMemberData({
            citizenId: (member as any).citizenId || '',
            prename: member.prename || '',
            firstname: member.firstname || '',
            middlename: member.middlename || '',
            lastname: member.lastname || '',
            affiliation: member.affiliation || '',
            department: member.department || '',
            phone: member.phone || '',
            email: member.email || ''
        });
        setOpenDialog(true);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#f5f5f5' }}>
            <Header />

            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <Sidebar />

                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        p: 4,
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                        bgcolor: '#f9fafb'
                    }}
                >
                    {/* หัวเรื่อง + ปุ่มเพิ่ม */}
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        spacing={{ xs: 1, sm: 2 }}
                    >
                        <Typography variant="h4" fontWeight="bold" color="#1e293b">
                            จัดการรายชื่อคณะกรรมการ
                        </Typography>

                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleOpenAddDialog}
                            sx={{
                                bgcolor: '#3140BF',
                                borderRadius: 2,
                                px: 3,
                                py: 1,
                                fontSize: '1rem',
                                textTransform: 'none',
                                boxShadow: '0 4px 12px rgba(49, 64, 191, 0.2)',
                                '&:hover': { bgcolor: '#1e1b4b' }
                            }}
                        >
                            เพิ่มรายชื่อใหม่
                        </Button>
                    </Stack>

                    {/* Search bar และจำนวนสมาชิก */}
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        spacing={{ xs: 1, sm: 2 }}
                    >
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="h6" fontWeight="bold" color="#1e293b">
                                รายชื่อทั้งหมด
                            </Typography>
                            <Chip label={`${allMembers.length} ท่าน`} size="small" color="primary" sx={{ bgcolor: '#e0e7ff', color: '#3140BF', fontWeight: 'bold' }} />
                        </Stack>

                        <TextField
                            placeholder="ค้นหาชื่อ, สังกัด, อีเมล..."
                            size="small"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            sx={{ minWidth: 280, bgcolor: '#fff', borderRadius: 2, boxShadow: '0 1px 3px rgb(0 0 0 / 0.05)', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Stack>

                    {/* ตารางสมาชิก */}
                    <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0px 4px 20px rgba(0,0,0,0.05)', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <TableContainer sx={{ flexGrow: 1, overflow: 'auto' }}>
                            <Table stickyHeader sx={{ minWidth: 800 }}>
                                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#64748b', pl: 3 }}>ชื่อ-นามสกุล</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>สังกัด</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>หน่วยงาน</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>เบอร์ติดต่อ</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>อีเมล</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#64748b', textAlign: 'center' }}>จัดการ</TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {loadingMembers ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                                <CircularProgress />
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredMembers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.6 }}>
                                                    <SearchIcon sx={{ fontSize: 48, mb: 1, color: '#cbd5e1' }} />
                                                    <Typography color="text.secondary">ไม่พบข้อมูลรายชื่อ</Typography>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredMembers.map((row) => (
                                            <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 }, transition: 'background-color 0.1s' }}>
                                                <TableCell sx={{ color: '#334155', fontWeight: 500, pl: 3 }}>
                                                    {row.prename}{row.firstname} {row.lastname}
                                                </TableCell>
                                                <TableCell sx={{ color: '#475569' }}>{row.affiliation || '-'}</TableCell>
                                                <TableCell sx={{ color: '#475569' }}>{row.department || '-'}</TableCell>
                                                <TableCell sx={{ color: '#475569' }}>{row.phone || '-'}</TableCell>
                                                <TableCell sx={{ color: '#475569' }}>{row.email || '-'}</TableCell>
                                                <TableCell align="center">
                                                    <Stack direction="row" justifyContent="center" spacing={1}>
                                                        <IconButton size="small" sx={{ color: '#f59e0b', '&:hover': { bgcolor: '#fef3c7' } }} onClick={() => handleOpenEditDialog(row)}>
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>

                                                        <IconButton
                                                            size="small"
                                                            sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fee2e2' } }}
                                                            onClick={() => handleDeleteMember(row.id)}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>

                    {/* --- Dialog เพิ่ม/แก้ไขสมาชิก --- */}
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
                </Box>
            </Box>
        </Box>
    );
}
