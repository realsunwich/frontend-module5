'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Box, Stack, TextField, Select, MenuItem, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Typography,
    Button, SelectChangeEvent, Dialog, DialogTitle, DialogContent, DialogActions,
    Chip, InputAdornment, CircularProgress, Tooltip, Avatar
} from '@mui/material';
import {
    Add as AddIcon,
    Close as CloseIcon,
    Search as SearchIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Badge as BadgeIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    CameraAlt as CameraAltIcon,
    Person as PersonIcon,
    Business as BusinessIcon,
    AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import Header from '@/components/header';
import Sidebar from '@/components/sidebar';
import ThaiIDScanner from '@/components/ThaiIDScanner';

// --- CONSTANTS & TYPES ---
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

// --- Helper Components ---
const StatCard = ({ title, value, icon, color }: { title: string; value: number | string; icon: React.ReactNode; color: string }) => (
    <Paper sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', flex: 1 }}>
        <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 48, height: 48 }}>{icon}</Avatar>
        <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>{title}</Typography>
            <Typography variant="h5" fontWeight={800} color="#1e293b">{value}</Typography>
        </Box>
    </Paper>
);

export default function MemberManagementPage() {
    // --- STATE ---
    const [allMembers, setAllMembers] = useState<Member[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [openScanner, setOpenScanner] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [saving, setSaving] = useState(false);
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
        } catch (error) { console.error('Error:', error); }
        finally { setLoadingMembers(false); }
    };

    useEffect(() => { fetchMembers(); }, []);

    // --- LOGIC ---
    const filteredMembers = useMemo(() => {
        const search = searchText.trim().toLowerCase();
        if (!search) return allMembers;

        const searchDigitsOnly = search.replace(/[^0-9]/g, '');

        return allMembers.filter(m => {
            const fullName = `${m.prename}${m.firstname} ${m.middlename || ''} ${m.lastname}`.toLowerCase();

            const storedIdDigits = (m.citizenId || '').replace(/[^0-9]/g, '');

            return (
                fullName.includes(search) ||
                (m.affiliation || '').toLowerCase().includes(search) ||
                (m.department || '').toLowerCase().includes(search) ||
                (m.email || '').toLowerCase().includes(search) ||
                (m.phone || '').toLowerCase().includes(search) ||
                (searchDigitsOnly.length > 0 && storedIdDigits.includes(searchDigitsOnly))
            );
        });
    }, [allMembers, searchText]);

    const currentDialogDepartments = useMemo(() => {
        const selectedAgency = AGENCY_DATA.find(a => a.name === newMemberData.affiliation);
        return selectedAgency ? selectedAgency.departments : [];
    }, [newMemberData.affiliation]);

    // --- HANDLERS ---
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
        setNewMemberData(prev => ({ ...prev, citizenId: formatCitizenId(scannedId) }));
    };

    const validateForm = () => {
        const cleanId = newMemberData.citizenId.replace(/[^a-zA-Z0-9]/g, '');
        if (!cleanId) { alert('กรุณากรอกเลขบัตรประชาชน หรือ หนังสือเดินทาง'); return false; }
        const isThaiIDFormat = /^[0-9]{13}$/.test(cleanId);
        if (isThaiIDFormat && !checkThaiID(cleanId)) { alert('เลขบัตรประจำตัวประชาชนไม่ถูกต้อง'); return false; }
        if (!isThaiIDFormat && cleanId.length < 6) { alert('เลขหนังสือเดินทางสั้นเกินไป'); return false; }
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
            const url = editingId ? `http://localhost:8080/api/committee-members/${editingId}` : 'http://localhost:8080/api/committee-members';
            const method = editingId ? 'PUT' : 'POST';
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

            if (response.ok) {
                alert(editingId ? 'อัปเดตข้อมูลสำเร็จ!' : 'บันทึกข้อมูลสำเร็จ!');
                setOpenDialog(false);
                setEditingId(null);
                setNewMemberData({ ...EMPTY_FORM });
                fetchMembers();
            } else { alert('เกิดข้อผิดพลาด: ' + response.statusText); }
        } catch (error) { alert('ไม่สามารถติดต่อ Server ได้'); }
        finally { setSaving(false); }
    };

    const handleDeleteMember = async (id: number) => {
        if (!confirm('คุณต้องการลบรายชื่อนี้ใช่หรือไม่?')) return;
        try {
            // const response = await fetch(`http://localhost:8080/api/committee-members/${id}`, { method: 'DELETE' });
            // if (response.ok) fetchMembers();
            setAllMembers(prev => prev.filter(m => m.id !== id)); // Simulation
            alert('ลบรายการเรียบร้อย (Simulation)');
        } catch (error) { alert('เกิดข้อผิดพลาดขณะลบ'); }
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
        if (/^[0-9]+$/.test(rawId) && rawId.length > 0) displayId = formatCitizenId(rawId);

        setNewMemberData({
            citizenId: displayId, prename: member.prename || '', firstname: member.firstname || '',
            middlename: member.middlename || '', lastname: member.lastname || '', affiliation: member.affiliation || '',
            department: member.department || '', phone: member.phone || '', email: member.email || ''
        });
        setOpenDialog(true);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#F8FAFC' }}>
            <Header />
            <Stack direction="row" sx={{ flex: 1, overflow: 'hidden' }}>
                <Sidebar />
                <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, overflowY: 'auto' }}>

                    {/* --- Page Header --- */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" mb={4} spacing={2}>
                        <Box>
                            <Typography variant="h5" fontWeight="800" color="#1E293B">จัดการรายชื่อคณะกรรมการ</Typography>
                            <Typography variant="body2" color="#64748B">ดูแลจัดการข้อมูลสมาชิกคณะอนุกรรมการตรวจสอบทรัพย์สิน</Typography>
                        </Box>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleOpenAddDialog}
                            sx={{
                                bgcolor: '#3140BF', borderRadius: 2.5, px: 3, py: 1.2, textTransform: 'none', fontWeight: 'bold',
                                boxShadow: '0 4px 10px rgba(49, 64, 191, 0.25)', '&:hover': { bgcolor: '#1e1b4b' }
                            }}
                        >
                            เพิ่มรายชื่อใหม่
                        </Button>
                    </Stack>

                    {/* --- Search & Filter --- */}
                    <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <TextField
                            placeholder="ค้นหาชื่อ, สังกัด, เบอร์โทร..."
                            size="small"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            fullWidth
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2, bgcolor: '#fff',
                                    '& fieldset': { borderColor: '#E2E8F0' },
                                    '&:hover fieldset': { borderColor: '#CBD5E1' },
                                    '&.Mui-focused fieldset': { borderColor: '#3140BF' }
                                }
                            }}
                            InputProps={{
                                startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>),
                                endAdornment: searchText && (<IconButton size="small" onClick={() => setSearchText('')}><CloseIcon fontSize="small" /></IconButton>)
                            }}
                        />
                    </Paper>

                    {/* --- Data Table --- */}
                    <Paper sx={{ width: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                        <TableContainer>
                            <Table>
                                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#475569', pl: 3 }}>ชื่อ-นามสกุล</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>สังกัด / หน่วยงาน</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>ข้อมูลติดต่อ</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#475569', textAlign: 'center', width: 120 }}>จัดการ</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loadingMembers ? (
                                        <TableRow><TableCell colSpan={4} align="center" sx={{ py: 8 }}><CircularProgress /></TableCell></TableRow>
                                    ) : filteredMembers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ py: 8, color: '#94a3b8' }}>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.5 }}>
                                                    <SearchIcon sx={{ fontSize: 48, mb: 1, color: '#cbd5e1' }} />
                                                    <Typography>ไม่พบรายชื่อที่ค้นหา</Typography>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredMembers.map((row) => (
                                            <TableRow key={row.id} hover sx={{ '&:last-child td': { borderBottom: 0 }, transition: '0.2s' }}>
                                                <TableCell sx={{ pl: 3 }}>
                                                    <Stack direction="row" spacing={2} alignItems="center">
                                                        <Avatar sx={{ bgcolor: '#EFF6FF', color: '#3140BF', fontWeight: 'bold' }}>{row.firstname[0]}</Avatar>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={600} color="#1E293B">
                                                                {row.prename}{row.firstname} {row.lastname}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">ID: {row.citizenId || '-'}</Typography>
                                                        </Box>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell>
                                                    <Stack alignItems="flex-start" spacing={0.5}>
                                                        <Chip label={row.affiliation || 'ไม่ระบุ'} size="small" sx={{ bgcolor: '#F1F5F9', color: '#475569', fontWeight: 600, borderRadius: 1 }} />
                                                        <Typography variant="caption" color="text.secondary">{row.department || '-'}</Typography>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell>
                                                    <Stack spacing={0.5}>
                                                        <Stack direction="row" alignItems="center" spacing={1}>
                                                            <PhoneIcon sx={{ fontSize: 14, color: '#94A3B8' }} />
                                                            <Typography variant="body2" color="#334155">{row.phone || '-'}</Typography>
                                                        </Stack>
                                                        <Stack direction="row" alignItems="center" spacing={1}>
                                                            <EmailIcon sx={{ fontSize: 14, color: '#94A3B8' }} />
                                                            <Typography variant="body2" color="#334155">{row.email || '-'}</Typography>
                                                        </Stack>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Stack direction="row" justifyContent="center" spacing={1}>
                                                        <Tooltip title="แก้ไข">
                                                            <IconButton size="small" onClick={() => handleOpenEditDialog(row)} sx={{ color: '#F59E0B', '&:hover': { bgcolor: '#FEF3C7' } }}>
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="ลบ">
                                                            <IconButton size="small" onClick={() => handleDeleteMember(row.id)} sx={{ color: '#EF4444', '&:hover': { bgcolor: '#FEE2E2' } }}>
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

                    {/* --- Dialog (Keep Logic as is, Styles handled inside) --- */}
                    <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                        <DialogTitle sx={{ m: 0, p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" fontWeight="bold" component="div">
                                เพิ่มคณะกรรมการใหม่
                            </Typography>

                            <IconButton onClick={() => setOpenDialog(false)}>
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent sx={{ p: 4 }}>
                            <Stack spacing={3}>
                                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
                                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-end">
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle2" fontWeight="bold" mb={1} color="primary">ข้อมูลบัตรประชาชน / หนังสือเดินทาง</Typography>
                                            <TextField
                                                fullWidth size="small" placeholder="กรอกเลขบัตรฯ 13 หลัก"
                                                name="citizenId" value={newMemberData.citizenId} onChange={handleNewMemberFormChange}
                                                inputProps={{ maxLength: 20 }}
                                                sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start"><BadgeIcon color="action" fontSize="small" /></InputAdornment>,
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <Tooltip title="สแกนจากรูปภาพ">
                                                                <IconButton onClick={() => setOpenScanner(true)} color="primary" sx={{ bgcolor: '#e0e7ff', width: 32, height: 32 }}>
                                                                    <CameraAltIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </InputAdornment>
                                                    )
                                                }}
                                            />
                                        </Box>
                                    </Stack>
                                </Box>

                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">คำนำหน้า</Typography>
                                        <Select fullWidth size="small" displayEmpty name="prename" value={newMemberData.prename} onChange={handleNewMemberFormChange} sx={{ bgcolor: '#fff', borderRadius: 1.5 }}>
                                            <MenuItem value="" disabled><span style={{ color: '#9ca3af' }}>เลือก</span></MenuItem>
                                            {PRENAME_OPTIONS.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                                        </Select>
                                    </Box>
                                    <Box sx={{ flex: 2 }}>
                                        <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">ชื่อจริง</Typography>
                                        <TextField fullWidth size="small" name="firstname" value={newMemberData.firstname} onChange={handleNewMemberFormChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                    </Box>
                                    <Box sx={{ flex: 2 }}>
                                        <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">นามสกุล</Typography>
                                        <TextField fullWidth size="small" name="lastname" value={newMemberData.lastname} onChange={handleNewMemberFormChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                    </Box>
                                </Stack>

                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">สังกัด</Typography>
                                        <Select fullWidth size="small" displayEmpty name="affiliation" value={newMemberData.affiliation} onChange={handleNewMemberFormChange} sx={{ bgcolor: '#fff', borderRadius: 1.5 }}>
                                            <MenuItem value="" disabled><span style={{ color: '#9ca3af' }}>เลือกสังกัด</span></MenuItem>
                                            {AGENCY_DATA.map(a => <MenuItem key={a.name} value={a.name}>{a.name}</MenuItem>)}
                                        </Select>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">หน่วยงาน</Typography>
                                        <Select fullWidth size="small" displayEmpty name="department" value={newMemberData.department} onChange={handleNewMemberFormChange} disabled={!newMemberData.affiliation} sx={{ bgcolor: '#fff', borderRadius: 1.5 }}>
                                            <MenuItem value="" disabled><span style={{ color: '#9ca3af' }}>เลือกหน่วยงาน</span></MenuItem>
                                            {currentDialogDepartments.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                                        </Select>
                                    </Box>
                                </Stack>

                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">เบอร์ติดต่อ</Typography>
                                        <TextField fullWidth size="small" placeholder="08x-xxx-xxxx" name="phone" value={newMemberData.phone} onChange={handleNewMemberFormChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" color="action" /></InputAdornment> }} />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">อีเมล</Typography>
                                        <TextField fullWidth size="small" placeholder="example@mail.com" name="email" value={newMemberData.email} onChange={handleNewMemberFormChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" color="action" /></InputAdornment> }} />
                                    </Box>
                                </Stack>
                            </Stack>
                        </DialogContent>
                        <DialogActions sx={{ p: 3, borderTop: '1px solid #f1f5f9', bgcolor: '#f8fafc' }}>
                            <Button onClick={() => setOpenDialog(false)} sx={{ color: '#64748b', fontWeight: 600 }}>ยกเลิก</Button>
                            <Button variant="contained" onClick={handleSaveNewMember} sx={{ bgcolor: '#3140BF', borderRadius: 2, px: 4, boxShadow: 'none', '&:hover': { bgcolor: '#1e1b4b', boxShadow: 'none' } }}>บันทึกข้อมูล</Button>
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