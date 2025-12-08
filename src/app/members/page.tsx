'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Box, Stack, TextField, Select, MenuItem, FormControl, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Typography,
    Button, SelectChangeEvent, Dialog, DialogTitle, DialogContent, DialogActions,
    Chip, InputAdornment, CircularProgress, Tooltip, Avatar, Alert
} from '@mui/material';
import {
    Add as AddIcon,
    Close as CloseIcon,
    Search as SearchIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Person as PersonIcon,
    Replay as ReplayIcon
} from '@mui/icons-material';
import FormRow from '@/components/common/FormRow';
import Header from '@/components/header';
import Sidebar from '@/components/sidebar';
import ThaiIDScanner from '@/components/ThaiIDScanner'; // หรือ path ที่ถูกต้องตามที่คุณสร้าง
import { CameraAlt as CameraAltIcon } from '@mui/icons-material';

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
    citizenId?: string;
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

// --- UTILS ---
const checkThaiID = (id: string): boolean => {
    if (id.length !== 13) return false;
    if (!/^[0-9]+$/.test(id)) return false;
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += parseInt(id.charAt(i), 10) * (13 - i);
    const checkDigit = (11 - (sum % 11)) % 10;
    return checkDigit === parseInt(id.charAt(12), 10);
};

const formatCitizenId = (value: string) => {
    const clean = value.replace(/[^0-9]/g, '');
    let formatted = clean;
    if (clean.length > 0) formatted = clean.substring(0, 1);
    if (clean.length > 1) formatted += '-' + clean.substring(1, 5);
    if (clean.length > 5) formatted += '-' + clean.substring(5, 10);
    if (clean.length > 10) formatted += '-' + clean.substring(10, 12);
    if (clean.length > 12) formatted += '-' + clean.substring(12, 13);
    return formatted;
};

export default function MemberManagementPage() {
    // --- STATE ---
    const [allMembers, setAllMembers] = useState<Member[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [openScanner, setOpenScanner] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form Data
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
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoadingMembers(false);
        }
    };

    useEffect(() => { fetchMembers(); }, []);

    const firstLoadRef = useRef(true);
    useEffect(() => {
        if (firstLoadRef.current) { firstLoadRef.current = false; return; }
        if (!openDialog) { fetchMembers(); }
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
            let newValue = value as string;
            if (name === 'citizenId') {
                const isNumericStart = /^[0-9]/.test(newValue);
                if (isNumericStart && !/[a-zA-Z]/.test(newValue)) {
                    newValue = formatCitizenId(newValue);
                }
            }
            if (name === 'affiliation') return { ...prev, [name]: newValue, department: '' };
            return { ...prev, [name]: newValue };
        });
    };

    const handleScanComplete = (scannedId: string) => {
        const formatted = formatCitizenId(scannedId);
        setNewMemberData(prev => ({
            ...prev,
            citizenId: formatted
        }));
    };

    const validateForm = () => {
        const cleanId = newMemberData.citizenId.replace(/[^a-zA-Z0-9]/g, '');
        if (!cleanId) { alert('กรุณากรอกเลขบัตรประชาชน หรือ หนังสือเดินทาง'); return false; }

        const isThaiIDFormat = /^[0-9]{13}$/.test(cleanId);
        if (isThaiIDFormat) {
            if (!checkThaiID(cleanId)) { alert('เลขบัตรประจำตัวประชาชนไม่ถูกต้อง (Check Digit ไม่ผ่าน)'); return false; }
        } else {
            if (cleanId.length < 6) { alert('เลขหนังสือเดินทางสั้นเกินไป (ควรมีอย่างน้อย 6 หลัก)'); return false; }
        }

        if (!newMemberData.prename.trim() || !newMemberData.firstname.trim() || !newMemberData.lastname.trim()) {
            alert('กรุณากรอกคำนำหน้า ชื่อ และนามสกุล'); return false;
        }
        return true;
    };

    const handleSaveNewMember = async () => {
        if (!validateForm()) return;
        setSaving(true);
        try {
            const payload = { ...newMemberData };
            const url = editingId
                ? `http://localhost:8080/api/committee-members/${editingId}`
                : 'http://localhost:8080/api/committee-members';
            const method = editingId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                alert(editingId ? 'อัปเดตข้อมูลสำเร็จ!' : 'บันทึกข้อมูลสำเร็จ!');
                setOpenDialog(false);
                setEditingId(null);
                setNewMemberData({ ...EMPTY_FORM });
            } else {
                alert('เกิดข้อผิดพลาด: ' + response.statusText);
            }
        } catch (error) {
            alert('ไม่สามารถติดต่อ Server ได้');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteMember = async (id: number) => {
        if (!confirm('คุณต้องการลบรายชื่อนี้ใช่หรือไม่?')) return;
        try {
            // const response = await fetch(`http://localhost:8080/api/committee-members/${id}`, { method: 'DELETE' });
            // if (response.ok) fetchMembers();
            setAllMembers(prev => prev.filter(m => m.id !== id)); // Simulation
            alert('ลบรายการเรียบร้อย (Simulation)');
        } catch (error) {
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
        const rawId = member.citizenId || '';
        let displayId = rawId;
        if (/^[0-9]+$/.test(rawId) && rawId.length > 0) {
            displayId = formatCitizenId(rawId);
        }
        setNewMemberData({
            citizenId: displayId,
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
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#F8FAFC' }}>
            <Header />
            <Stack direction="row" sx={{ flex: 1, overflow: 'hidden' }}>
                <Sidebar />
                <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, overflowY: 'auto' }}>

                    {/* Header */}
                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} mb={4} gap={2}>
                        <Box>
                            <Typography variant="h5" fontWeight="800" color="#1E293B" sx={{ letterSpacing: '-0.5px', mb: 0.5 }}>
                                จัดการรายชื่อคณะกรรมการ
                            </Typography>
                            <Typography variant="body2" color="#64748B">
                                จัดการรายชื่อ ข้อมูลติดต่อ และสังกัดของคณะกรรมการ
                            </Typography>
                        </Box>

                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            sx={{
                                bgcolor: '#3B82F6',
                                borderRadius: 2,
                                px: 3,
                                py: 1.2,
                                textTransform: 'none',
                                fontWeight: 'bold',
                                boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)',
                                '&:hover': {
                                    bgcolor: '#2563EB',
                                    boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)'
                                },
                            }}
                            onClick={handleOpenAddDialog}
                        >
                            เพิ่มรายชื่อใหม่
                        </Button>
                    </Stack>

                    {/* Filter & Search */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" mb={3} spacing={2}>
                        <Chip
                            label={`${allMembers.length} รายชื่อทั้งหมด`}
                            color="primary"
                            size="medium"
                            sx={{ bgcolor: '#EFF6FF', color: '#3B82F6', fontWeight: 600, fontSize: '0.875rem' }}
                        />
                        <TextField
                            placeholder="ค้นหาชื่อ, สังกัด, อีเมล..."
                            size="small"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            sx={{
                                width: { xs: '100%', sm: 320 },
                                bgcolor: '#fff',
                                borderRadius: 2,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '& fieldset': { borderColor: '#E2E8F0' },
                                    '&:hover fieldset': { borderColor: '#CBD5E1' },
                                    '&.Mui-focused fieldset': { borderColor: '#3B82F6' }
                                }
                            }}
                            InputProps={{
                                startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>)
                            }}
                        />
                    </Stack>

                    {/* Table */}
                    <Paper sx={{ width: '100%', borderRadius: 3, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', border: '1px solid #E2E8F0', overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <TableContainer sx={{ flex: 1 }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        {[
                                            { label: 'ชื่อ-นามสกุล', width: '25%' },
                                            { label: 'สังกัด', width: '20%' },
                                            { label: 'หน่วยงาน', width: '20%' },
                                            { label: 'เบอร์ติดต่อ', width: '15%' },
                                            { label: 'อีเมล', width: '15%' },
                                            { label: 'จัดการ', width: '5%', align: 'center' }
                                        ].map((col, index) => (
                                            <TableCell
                                                key={index}
                                                align={col.align as any || 'left'}
                                                width={col.width}
                                                sx={{
                                                    bgcolor: '#F8FAFC',
                                                    color: '#475569',
                                                    fontWeight: 700,
                                                    borderBottom: '1px solid #E2E8F0',
                                                    whiteSpace: 'nowrap',
                                                    py: 2
                                                }}
                                            >
                                                {col.label}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {loadingMembers ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                                <CircularProgress />
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredMembers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                                                <Stack alignItems="center" spacing={1}>
                                                    <SearchIcon sx={{ fontSize: 48, color: '#CBD5E1' }} />
                                                    <Typography variant="body1" color="text.secondary">ไม่พบข้อมูลรายชื่อ</Typography>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredMembers.map((row) => (
                                            <TableRow
                                                key={row.id}
                                                hover
                                                sx={{
                                                    transition: 'all 0.15s',
                                                    '&:hover': { bgcolor: '#F1F5F9' },
                                                    '& td': { borderBottom: '1px solid #F1F5F9', py: 2 }
                                                }}
                                            >
                                                <TableCell>
                                                    <Stack direction="row" spacing={2} alignItems="center">
                                                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#DBEAFE', color: '#1E40AF', fontSize: 14, fontWeight: 'bold' }}>
                                                            {row.firstname.charAt(0)}
                                                        </Avatar>
                                                        <Typography variant="body2" color="#1E293B" fontWeight={500}>
                                                            {row.prename}{row.firstname} {row.lastname}
                                                        </Typography>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell sx={{ color: '#475569' }}>{row.affiliation || '-'}</TableCell>
                                                <TableCell sx={{ color: '#475569' }}>{row.department || '-'}</TableCell>
                                                <TableCell sx={{ color: '#475569' }}>{row.phone || '-'}</TableCell>
                                                <TableCell sx={{ color: '#475569' }}>{row.email || '-'}</TableCell>
                                                <TableCell align="center">
                                                    <Stack direction="row" justifyContent="center" spacing={1}>
                                                        <Tooltip title="แก้ไข">
                                                            <IconButton
                                                                size="small"
                                                                sx={{ color: '#F59E0B', '&:hover': { bgcolor: '#FEF3C7' } }}
                                                                onClick={() => handleOpenEditDialog(row)}
                                                            >
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="ลบ">
                                                            <IconButton
                                                                size="small"
                                                                sx={{ color: '#EF4444', '&:hover': { bgcolor: '#FEE2E2' } }}
                                                                onClick={() => handleDeleteMember(row.id)}
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>

                    {/* --- Dialog --- */}
                    <Dialog
                        open={openDialog}
                        onClose={() => setOpenDialog(false)}
                        maxWidth="md"
                        fullWidth
                        PaperProps={{ sx: { borderRadius: 3 } }}
                    >
                        {/* 🔥 แก้ไขจุดที่เป็นปัญหา Hydration Error (เพิ่ม component="div") */}
                        <DialogTitle sx={{ m: 0, p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" fontWeight="bold" component="div">
                                {editingId ? 'แก้ไขข้อมูลสมาชิก' : 'เพิ่มคณะกรรมการใหม่'}
                            </Typography>
                            <IconButton onClick={() => setOpenDialog(false)}><CloseIcon /></IconButton>
                        </DialogTitle>

                        <DialogContent dividers sx={{ p: 4 }}>
                            <Stack spacing={3}>
                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                                    <Box sx={{ flex: 1 }}>
                                        <FormRow label="เลขบัตรประชาชน / หนังสือเดินทาง">
                                            <TextField
                                                fullWidth size="small" placeholder="0-0000-00000-00-0"
                                                name="citizenId" value={newMemberData.citizenId} onChange={handleNewMemberFormChange}
                                                inputProps={{ maxLength: 20 }}
                                                sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                InputProps={{
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <Tooltip title="สแกนจากรูปภาพ">
                                                                <IconButton
                                                                    onClick={() => setOpenScanner(true)}
                                                                    edge="end"
                                                                    color="primary"
                                                                >
                                                                    <CameraAltIcon />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </InputAdornment>
                                                    )
                                                }}
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
                                    <Box sx={{ flex: 1 }}>
                                        <FormRow label="เบอร์ติดต่อ">
                                            <TextField fullWidth size="small" placeholder="000-000-0000" name="phone" value={newMemberData.phone} onChange={handleNewMemberFormChange} sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                                        </FormRow>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <FormRow label="อีเมล">
                                            <TextField fullWidth size="small" placeholder="email@example.com" name="email" value={newMemberData.email} onChange={handleNewMemberFormChange} sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                                        </FormRow>
                                    </Box>
                                </Stack>
                            </Stack>
                        </DialogContent>
                        <DialogActions sx={{ p: 3 }}>
                            <Button onClick={() => setOpenDialog(false)} variant="outlined" sx={{ color: '#64748B', borderColor: '#E2E8F0', borderRadius: 2, px: 3, '&:hover': { borderColor: '#CBD5E1', bgcolor: '#F1F5F9' } }}>ยกเลิก</Button>
                            <Button variant="contained" onClick={handleSaveNewMember} disabled={saving} sx={{ bgcolor: '#3B82F6', borderRadius: 2, px: 4, '&:hover': { bgcolor: '#2563EB' } }}>
                                {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                            </Button>
                        </DialogActions>
                    </Dialog>

                    <ThaiIDScanner
                        open={openScanner}
                        onClose={() => setOpenScanner(false)}
                        onScanComplete={handleScanComplete}
                    />

                </Box>
            </Stack>
        </Box>
    );
}