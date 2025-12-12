'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
    CameraAlt as CameraAltIcon
} from '@mui/icons-material';
import Header from '@/components/header';
import Sidebar from '@/components/sidebar';
import ThaiIDScanner from '@/components/ThaiIDScanner';

// --- CONSTANTS ---
const AGENCY_DATA = [
    { name: 'กระทรวงยุติธรรม', departments: ['สำนักงานปลัดกระทรวงยุติธรรม', 'กรมบังคับคดี', 'กรมคุมประพฤติ', 'กรมราชทัณฑ์', 'กรมสอบสวนคดีพิเศษ (DSI)'] },
    { name: 'กระทรวงการคลัง', departments: ['สำนักงานปลัดกระทรวงการคลัง', 'กรมบัญชีกลาง', 'กรมสรรพากร', 'กรมศุลกากร', 'สำนักงานเศรษฐกิจการคลัง'] },
    { name: 'สำนักงานตำรวจแห่งชาติ', departments: ['สำนักงานผู้บัญชาการตำรวจแห่งชาติ', 'กองบัญชาการตำรวจนครบาล', 'กองบัญชาการตำรวจสอบสวนกลาง'] },
    { name: 'หน่วยงานอิสระ', departments: ['สำนักงาน ป.ป.ช.', 'สำนักงาน ป.ป.ท.', 'สำนักงานการตรวจเงินแผ่นดิน'] }
];

// ตัวเลือกภาษาไทย
const PRENAME_OPTIONS = [
    { value: 'นาย', label: 'นาย' },
    { value: 'นาง', label: 'นาง' },
    { value: 'นางสาว', label: 'นางสาว' },
    { value: 'ด็อกเตอร์', label: 'ด็อกเตอร์' },
    { value: 'ผู้ช่วยศาสตราจารย์', label: 'ผู้ช่วยศาสตราจารย์' },
    { value: 'รองศาสตราจารย์', label: 'รองศาสตราจารย์' },
    { value: 'ศาสตราจารย์', label: 'ศาสตราจารย์' },
    { value: 'พลตำรวจเอก', label: 'พลตำรวจเอก' },
    { value: 'พลตำรวจโท', label: 'พลตำรวจโท' },
    { value: 'พลตำรวจตรี', label: 'พลตำรวจตรี' },
    { value: 'พันตำรวจเอก', label: 'พันตำรวจเอก' },
    { value: 'พันตำรวจโท', label: 'พันตำรวจโท' },
    { value: 'พันตำรวจตรี', label: 'พันตำรวจตรี' },
    { value: 'ร้อยตำรวจเอก', label: 'ร้อยตำรวจเอก' },
    { value: 'ร้อยตำรวจโท', label: 'ร้อยตำรวจโท' },
    { value: 'ร้อยตำรวจตรี', label: 'ร้อยตำรวจตรี' },
    { value: 'พลเอก', label: 'พลเอก' },
    { value: 'พลโท', label: 'พลโท' },
    { value: 'พลตรี', label: 'พลตรี' },
    { value: 'นายแพทย์', label: 'นายแพทย์' },
    { value: 'แพทย์หญิง', label: 'แพทย์หญิง' },
    { value: 'อื่นๆ', label: 'อื่นๆ' }
];

// ตัวเลือกภาษาอังกฤษ (Mapping ให้ตรงกับไทย)
const PRENAME_OPTIONS_EN = [
    { value: 'Mr.', label: 'Mr.' },
    { value: 'Mrs.', label: 'Mrs.' },
    { value: 'Miss', label: 'Miss' },
    { value: 'Ms.', label: 'Ms.' },
    { value: 'Dr.', label: 'Dr.' },
    { value: 'Asst. Prof.', label: 'Asst. Prof.' },
    { value: 'Assoc. Prof.', label: 'Assoc. Prof.' },
    { value: 'Prof.', label: 'Prof.' },
    // Police
    { value: 'Pol. Gen.', label: 'Pol. Gen.' },
    { value: 'Pol. Lt. Gen.', label: 'Pol. Lt. Gen.' },
    { value: 'Pol. Maj. Gen.', label: 'Pol. Maj. Gen.' },
    { value: 'Pol. Col.', label: 'Pol. Col.' },
    { value: 'Pol. Lt. Col.', label: 'Pol. Lt. Col.' },
    { value: 'Pol. Maj.', label: 'Pol. Maj.' },
    { value: 'Pol. Capt.', label: 'Pol. Capt.' },
    { value: 'Pol. Lt.', label: 'Pol. Lt.' },
    { value: 'Pol. Sub-Lt.', label: 'Pol. Sub-Lt.' },
    // Military
    { value: 'Gen.', label: 'Gen.' },
    { value: 'Lt. Gen.', label: 'Lt. Gen.' },
    { value: 'Maj. Gen.', label: 'Maj. Gen.' },
    { value: 'Other', label: 'Other' }
];

// Map ไทย -> อังกฤษ
const PRENAME_MAP_TH_TO_EN: { [key: string]: string } = {
    'นาย': 'Mr.',
    'นาง': 'Mrs.',
    'นางสาว': 'Miss',
    'ด็อกเตอร์': 'Dr.',
    'ผู้ช่วยศาสตราจารย์': 'Asst. Prof.',
    'รองศาสตราจารย์': 'Assoc. Prof.',
    'ศาสตราจารย์': 'Prof.',
    'พลตำรวจเอก': 'Pol. Gen.',
    'พลตำรวจโท': 'Pol. Lt. Gen.',
    'พลตำรวจตรี': 'Pol. Maj. Gen.',
    'พันตำรวจเอก': 'Pol. Col.',
    'พันตำรวจโท': 'Pol. Lt. Col.',
    'พันตำรวจตรี': 'Pol. Maj.',
    'ร้อยตำรวจเอก': 'Pol. Capt.',
    'ร้อยตำรวจโท': 'Pol. Lt.',
    'ร้อยตำรวจตรี': 'Pol. Sub-Lt.',
    'พลเอก': 'Gen.',
    'พลโท': 'Lt. Gen.',
    'พลตรี': 'Maj. Gen.',
    'นายแพทย์': 'Dr.',
    'แพทย์หญิง': 'Dr.',
    'อื่นๆ': 'Other'
};

// --- TYPES ---
export interface Member {
    id: number;
    citizenId?: string;
    laserId?: string; // Laser Code หลังบัตร
    prename: string;
    firstname: string;
    middlename?: string;
    lastname: string;
    prename_en?: string;
    firstname_en?: string;
    middlename_en?: string;
    lastname_en?: string;
    birthdate?: string | Date;
    affiliation: string;
    department: string;
    phone: string;
    email: string;
}

// *** จุดสำคัญแก้ไข Error Uncontrolled ***
// ต้องกำหนดค่าเริ่มต้นให้ครบทุก field ห้ามเป็น undefined
const EMPTY_FORM = {
    citizenId: '',
    laserId: '', // Laser Code หลังบัตร
    prename: '',
    firstname: '',
    middlename: '',
    lastname: '',
    prename_en: '', // ต้องมีค่าเริ่มต้น
    firstname_en: '',
    middlename_en: '',
    lastname_en: '',
    birthdate: '',
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

const convertScannedDateToISO = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
        const months: { [key: string]: string } = {
            Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
            Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
        };
        const parts = dateStr.match(/(\d{1,2})\s+([A-Za-z.]+)\s+(\d{4})/);
        if (parts) {
            const day = parts[1].padStart(2, '0');
            const monthText = parts[2].replace('.', '');
            const monthKey = Object.keys(months).find(k => monthText.startsWith(k));
            const month = monthKey ? months[monthKey] : '01';
            const year = parts[3];
            return `${year}-${month}-${day}`;
        }
        return '';
    } catch (e) {
        return '';
    }
};

export default function MemberManagementPage() {
    const [allMembers, setAllMembers] = useState<Member[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [openScanner, setOpenScanner] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [saving, setSaving] = useState(false);

    // Initialize State ด้วย EMPTY_FORM ที่ครบถ้วน
    const [newMemberData, setNewMemberData] = useState({ ...EMPTY_FORM });
    const [editingId, setEditingId] = useState<number | null>(null);

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

    const handleNewMemberFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
        const { name, value } = e.target as HTMLInputElement;

        setNewMemberData(prev => {
            let newValue = value as string;
            // Create copy
            const updatedData = { ...prev, [name]: newValue };

            // Logic Format Citizen ID
            if (name === 'citizenId') {
                const isNumericStart = /^[0-9]/.test(newValue);
                if (isNumericStart && !/[a-zA-Z]/.test(newValue)) {
                    updatedData.citizenId = formatCitizenId(newValue);
                }
            }

            // Logic Clear Department when Affiliation changes
            if (name === 'affiliation') {
                updatedData.department = '';
            }

            // Logic Auto-Map Thai Prename to English
            if (name === 'prename') {
                const mappedEn = PRENAME_MAP_TH_TO_EN[newValue];
                if (mappedEn) {
                    updatedData.prename_en = mappedEn;
                }
            }

            return updatedData;
        });
    };

    const handleScanComplete = (data: any) => {
        const formattedDate = convertScannedDateToISO(data.birthdate);
        setNewMemberData(prev => ({
            ...prev,
            citizenId: formatCitizenId(data.id || prev.citizenId),
            laserId: data.laserId || prev.laserId, // รับค่า Laser Code จาก scanner
            firstname_en: data.firstname_en || data.firstName || '',
            middlename_en: data.middlename_en || '',
            lastname_en: data.lastname_en || data.lastName || '',
            birthdate: formattedDate
        }));
        setOpenScanner(false); // ปิด scanner อัตโนมัติหลังสแกนเสร็จ
    };

    const validateForm = () => {
        // 1. ตรวจสอบเลขบัตรประชาชน/หนังสือเดินทาง
        const cleanId = newMemberData.citizenId.replace(/[^a-zA-Z0-9]/g, '');
        if (!cleanId) {
            alert('❌ กรุณากรอกเลขบัตรประชาชนหรือหนังสือเดินทาง');
            return false;
        }

        // 2. ตรวจสอบคำนำหน้าภาษาไทย
        if (!newMemberData.prename) {
            alert('❌ กรุณาเลือกคำนำหน้าภาษาไทย');
            return false;
        }

        // 3. ตรวจสอบชื่อและนามสกุลภาษาไทย
        if (!newMemberData.firstname.trim()) {
            alert('❌ กรุณากรอกชื่อจริงภาษาไทย');
            return false;
        }
        if (!newMemberData.lastname.trim()) {
            alert('❌ กรุณากรอกนามสกุลภาษาไทย');
            return false;
        }

        // 4. ตรวจสอบข้อมูลภาษาอังกฤษ
        if (!newMemberData.prename_en) {
            alert('❌ กรุณาเลือก Title ภาษาอังกฤษ');
            return false;
        }
        if (!newMemberData.firstname_en.trim()) {
            alert('❌ กรุณากรอก First Name ภาษาอังกฤษ');
            return false;
        }
        if (!newMemberData.lastname_en.trim()) {
            alert('❌ กรุณากรอก Last Name ภาษาอังกฤษ');
            return false;
        }

        // 5. ตรวจสอบวันเกิด
        if (!newMemberData.birthdate) {
            alert('❌ กรุณาเลือกวันเกิด');
            return false;
        }

        // 6. ตรวจสอบสังกัดและหน่วยงาน
        if (!newMemberData.affiliation) {
            alert('❌ กรุณาเลือกสังกัด');
            return false;
        }
        if (!newMemberData.department) {
            alert('❌ กรุณาเลือกหน่วยงาน');
            return false;
        }

        // 7. ตรวจสอบเบอร์โทรศัพท์
        if (!newMemberData.phone.trim()) {
            alert('❌ กรุณากรอกเบอร์ติดต่อ');
            return false;
        }
        // ตรวจสอบรูปแบบเบอร์โทร (ต้องเป็นตัวเลข 9-10 หลัก)
        const cleanPhone = newMemberData.phone.replace(/[^0-9]/g, '');
        if (cleanPhone.length < 9 || cleanPhone.length > 10) {
            alert('❌ เบอร์โทรศัพท์ไม่ถูกต้อง (ต้องเป็นตัวเลข 9-10 หลัก)');
            return false;
        }

        // 8. ตรวจสอบอีเมล
        if (!newMemberData.email.trim()) {
            alert('❌ กรุณากรอกอีเมล');
            return false;
        }
        // ตรวจสอบรูปแบบอีเมล
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newMemberData.email)) {
            alert('❌ รูปแบบอีเมลไม่ถูกต้อง');
            return false;
        }

        // 9. ตรวจสอบเลขบัตรประชาชนไทย (ถ้าเป็นตัวเลข 13 หลัก)
        if (/^[0-9]+$/.test(cleanId) && cleanId.length === 13) {
            if (!checkThaiID(cleanId)) {
                const confirmInvalid = confirm('⚠️ เลขบัตรประชาชนไม่ถูกต้องตามหลักการตรวจสอบ\nต้องการบันทึกต่อหรือไม่?');
                if (!confirmInvalid) return false;
            }
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
            setAllMembers(prev => prev.filter(m => m.id !== id));
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

        let birthdateStr = '';
        if (member.birthdate) {
            const d = new Date(member.birthdate);
            if (!isNaN(d.getTime())) {
                birthdateStr = d.toISOString().split('T')[0];
            }
        }

        // Map ข้อมูลเข้า State (ใช้ || '' เพื่อป้องกัน undefined/null)
        setNewMemberData({
            citizenId: displayId,
            laserId: member.laserId || '',
            prename: member.prename || '',
            firstname: member.firstname || '',
            middlename: member.middlename || '',
            lastname: member.lastname || '',
            // --- Map English Fields ---
            prename_en: member.prename_en || '',
            firstname_en: member.firstname_en || '',
            middlename_en: member.middlename_en || '',
            lastname_en: member.lastname_en || '',
            birthdate: birthdateStr,
            // --------------------------
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

                    {/* --- Dialog --- */}
                    <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                        <DialogTitle sx={{ m: 0, p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" fontWeight="bold" component="div">
                                {editingId ? 'แก้ไขข้อมูลคณะกรรมการ' : 'เพิ่มคณะกรรมการใหม่'}
                            </Typography>
                            <IconButton onClick={() => setOpenDialog(false)}>
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent sx={{ p: 4 }}>
                            <Stack spacing={3}>
                                {/* 1. ข้อมูลบัตรประชาชน */}
                                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
                                    <Typography variant="subtitle2" fontWeight="bold" mb={2} color="primary">ข้อมูลบัตรประชาชน / หนังสือเดินทาง</Typography>
                                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-end">
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">เลขบัตรประชาชน (ด้านหน้า)</Typography>
                                            <TextField
                                                fullWidth size="small" placeholder="กรอกเลขบัตรฯ 13 หลัก"
                                                name="citizenId" value={newMemberData.citizenId || ''} onChange={handleNewMemberFormChange}
                                                inputProps={{ maxLength: 20 }}
                                                sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start"><BadgeIcon color="action" fontSize="small" /></InputAdornment>
                                                }}
                                            />
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">
                                                Laser Code (ด้านหลัง)
                                                <Typography component="span" variant="caption" color="text.disabled" ml={0.5}>ไม่บังคับ</Typography>
                                            </Typography>
                                            <TextField
                                                fullWidth size="small" placeholder="เช่น LS0-1234567-12"
                                                name="laserId" value={newMemberData.laserId || ''} onChange={handleNewMemberFormChange}
                                                inputProps={{ maxLength: 20 }}
                                                sx={{
                                                    bgcolor: '#fff',
                                                    '& .MuiOutlinedInput-root': { borderRadius: 1.5 },
                                                    '& input': { fontFamily: 'monospace', letterSpacing: '0.5px' }
                                                }}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>🔖</Typography>
                                                        </InputAdornment>
                                                    )
                                                }}
                                            />
                                        </Box>
                                        <Box>
                                            <Tooltip title="สแกนบัตรประชาชน (ด้านหน้า/หลัง)">
                                                <IconButton onClick={() => setOpenScanner(true)} color="primary" sx={{ bgcolor: '#e0e7ff', width: 40, height: 40, '&:hover': { bgcolor: '#c7d2fe' } }}>
                                                    <CameraAltIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Stack>
                                </Box>

                                {/* 2. ชื่อภาษาไทย */}
                                <Box>
                                    <Typography variant="subtitle2" fontWeight="bold" mb={2} color="primary">ข้อมูลภาษาไทย</Typography>
                                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">คำนำหน้า</Typography>
                                            <Select fullWidth size="small" displayEmpty name="prename" value={newMemberData.prename || ''} onChange={handleNewMemberFormChange} sx={{ bgcolor: '#fff', borderRadius: 1.5 }}>
                                                <MenuItem value="" disabled><span style={{ color: '#9ca3af' }}>เลือก</span></MenuItem>
                                                {PRENAME_OPTIONS.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                                            </Select>
                                        </Box>
                                        <Box sx={{ flex: 2 }}>
                                            <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">ชื่อจริง</Typography>
                                            <TextField fullWidth size="small" placeholder="ชื่อจริง" name="firstname" value={newMemberData.firstname || ''} onChange={handleNewMemberFormChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                        </Box>
                                        <Box sx={{ flex: 1.5 }}>
                                            <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">ชื่อกลาง (ถ้ามี)</Typography>
                                            <TextField
                                                fullWidth size="small" name="middlename" value={newMemberData.middlename || ''} onChange={handleNewMemberFormChange} placeholder="ชื่องกลาง"
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }}
                                            />
                                        </Box>
                                        <Box sx={{ flex: 2 }}>
                                            <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">นามสกุล</Typography>
                                            <TextField fullWidth size="small" placeholder="นามสกุล" name="lastname" value={newMemberData.lastname || ''} onChange={handleNewMemberFormChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                        </Box>
                                    </Stack>
                                </Box>

                                {/* 3. ข้อมูลภาษาอังกฤษ */}
                                <Box>
                                    <Typography variant="subtitle2" fontWeight="bold" mb={2} color="primary">ข้อมูลภาษาอังกฤษ</Typography>
                                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">Title</Typography>
                                            <Select
                                                fullWidth size="small" displayEmpty name="prename_en" value={newMemberData.prename_en || ''} onChange={handleNewMemberFormChange}
                                                sx={{ bgcolor: '#fff', borderRadius: 1.5 }}
                                            >
                                                <MenuItem value="" disabled><span style={{ color: '#9ca3af' }}>Select</span></MenuItem>
                                                {PRENAME_OPTIONS_EN.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                                            </Select>
                                        </Box>
                                        <Box sx={{ flex: 2 }}>
                                            <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">First Name</Typography>
                                            <TextField
                                                fullWidth size="small" placeholder="First Name" name="firstname_en" value={newMemberData.firstname_en || ''} onChange={handleNewMemberFormChange}
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }}
                                            />
                                        </Box>
                                        <Box sx={{ flex: 1.5 }}>
                                            <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">Middle Name (Optional)</Typography>
                                            <TextField
                                                fullWidth size="small" placeholder="Middle Name" name="middlename_en" value={newMemberData.middlename_en || ''} onChange={handleNewMemberFormChange}
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }}
                                            />
                                        </Box>
                                        <Box sx={{ flex: 2 }}>
                                            <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">Last Name</Typography>
                                            <TextField
                                                fullWidth size="small" placeholder="Last Name" name="lastname_en" value={newMemberData.lastname_en || ''} onChange={handleNewMemberFormChange}
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }}
                                            />
                                        </Box>
                                    </Stack>
                                </Box>

                                {/* 4. วันเกิด (แยกออกมา) */}
                                <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                                    <Typography variant="subtitle2" fontWeight="bold" mb={2} color="primary">วันเกิด (Date of Birth)</Typography>
                                    <TextField
                                        fullWidth size="small" type="date"
                                        name="birthdate" value={newMemberData.birthdate || ''} onChange={handleNewMemberFormChange}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Box>

                                {/* 5. สังกัดและหน่วยงาน */}
                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">สังกัด</Typography>
                                        <Select fullWidth size="small" displayEmpty name="affiliation" value={newMemberData.affiliation || ''} onChange={handleNewMemberFormChange} sx={{ bgcolor: '#fff', borderRadius: 1.5 }}>
                                            <MenuItem value="" disabled><span style={{ color: '#9ca3af' }}>เลือกสังกัด</span></MenuItem>
                                            {AGENCY_DATA.map(a => <MenuItem key={a.name} value={a.name}>{a.name}</MenuItem>)}
                                        </Select>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">หน่วยงาน</Typography>
                                        <Select fullWidth size="small" displayEmpty name="department" value={newMemberData.department || ''} onChange={handleNewMemberFormChange} disabled={!newMemberData.affiliation} sx={{ bgcolor: '#fff', borderRadius: 1.5 }}>
                                            <MenuItem value="" disabled><span style={{ color: '#9ca3af' }}>เลือกหน่วยงาน</span></MenuItem>
                                            {currentDialogDepartments.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                                        </Select>
                                    </Box>
                                </Stack>

                                {/* 6. ข้อมูลติดต่อ */}
                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">เบอร์ติดต่อ</Typography>
                                        <TextField fullWidth size="small" placeholder="08x-xxx-xxxx" name="phone" value={newMemberData.phone || ''} onChange={handleNewMemberFormChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" color="action" /></InputAdornment> }} />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">อีเมล</Typography>
                                        <TextField fullWidth size="small" placeholder="example@mail.com" name="email" value={newMemberData.email || ''} onChange={handleNewMemberFormChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" color="action" /></InputAdornment> }} />
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