'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Stack, TextField, Select, MenuItem, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Typography,
    Button, SelectChangeEvent, Dialog, DialogTitle, DialogContent, DialogActions,
    Chip, InputAdornment, CircularProgress, Tooltip, Avatar, Snackbar, Alert
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

// Import Scanners
import ThaiIDScanner from '@/components/ThaiIDScanner';
import PassportScanner, { PassportScannedData } from '@/components/PassportScanner';
import PinkCardScanner, { PinkCardScannedData } from '@/components/PinkCardScanner';

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

// ตัวเลือกภาษาอังกฤษ
const PRENAME_OPTIONS_EN = [
    { value: 'Mr.', label: 'Mr.' },
    { value: 'Mrs.', label: 'Mrs.' },
    { value: 'Miss', label: 'Miss' },
    { value: 'Ms.', label: 'Ms.' },
    { value: 'Dr.', label: 'Dr.' },
    { value: 'Asst. Prof.', label: 'Asst. Prof.' },
    { value: 'Assoc. Prof.', label: 'Assoc. Prof.' },
    { value: 'Prof.', label: 'Prof.' },
    { value: 'Pol. Gen.', label: 'Pol. Gen.' },
    { value: 'Pol. Lt. Gen.', label: 'Pol. Lt. Gen.' },
    { value: 'Pol. Maj. Gen.', label: 'Pol. Maj. Gen.' },
    { value: 'Pol. Col.', label: 'Pol. Col.' },
    { value: 'Pol. Lt. Col.', label: 'Pol. Lt. Col.' },
    { value: 'Pol. Maj.', label: 'Pol. Maj.' },
    { value: 'Pol. Capt.', label: 'Pol. Capt.' },
    { value: 'Pol. Lt.', label: 'Pol. Lt.' },
    { value: 'Pol. Sub-Lt.', label: 'Pol. Sub-Lt.' },
    { value: 'Gen.', label: 'Gen.' },
    { value: 'Lt. Gen.', label: 'Lt. Gen.' },
    { value: 'Maj. Gen.', label: 'Maj. Gen.' },
    { value: 'Other', label: 'Other' }
];

// Map ไทย -> อังกฤษ
const PRENAME_MAP_TH_TO_EN: { [key: string]: string } = {
    'นาย': 'Mr.', 'นาง': 'Mrs.', 'นางสาว': 'Miss', 'ด็อกเตอร์': 'Dr.',
    'ผู้ช่วยศาสตราจารย์': 'Asst. Prof.', 'รองศาสตราจารย์': 'Assoc. Prof.', 'ศาสตราจารย์': 'Prof.',
    'พลตำรวจเอก': 'Pol. Gen.', 'พลตำรวจโท': 'Pol. Lt. Gen.', 'พลตำรวจตรี': 'Pol. Maj. Gen.',
    'พันตำรวจเอก': 'Pol. Col.', 'พันตำรวจโท': 'Pol. Lt. Col.', 'พันตำรวจตรี': 'Pol. Maj.',
    'ร้อยตำรวจเอก': 'Pol. Capt.', 'ร้อยตำรวจโท': 'Pol. Lt.', 'ร้อยตำรวจตรี': 'Pol. Sub-Lt.',
    'พลเอก': 'Gen.', 'พลโท': 'Lt. Gen.', 'พลตรี': 'Maj. Gen.',
    'นายแพทย์': 'Dr.', 'แพทย์หญิง': 'Dr.', 'อื่นๆ': 'Other'
};

// --- TYPES ---
export interface Member {
    id: number;
    citizenId: string; // ใช้เก็บทั้งเลขบัตร ปชช และ Passport No.
    laserId?: string;

    // ข้อมูลภาษาไทย
    prename: string;
    firstname: string;
    middlename?: string;
    lastname: string;

    // ข้อมูลภาษาอังกฤษ
    prenameEn?: string;
    firstnameEn?: string;
    middlenameEn?: string;
    lastnameEn?: string;

    // ข้อมูลทั่วไป
    birthdate?: string | Date;
    affiliation: string;
    department: string;
    phone: string;
    email: string;

    // ข้อมูลเอกสารเพิ่มเติม
    documentType?: 'thai-id' | 'passport' | 'pink-card';
    nationality?: string;
    documentExpiryDate?: string | Date;
}

const EMPTY_FORM = {
    citizenId: '',
    laserId: '',
    prename: '',
    firstname: '',
    middlename: '',
    lastname: '',
    prenameEn: '',
    firstnameEn: '',
    middlenameEn: '',
    lastnameEn: '',
    birthdate: '',
    affiliation: '',
    department: '',
    phone: '',
    email: '',
    documentType: 'thai-id',
    nationality: '',
    documentExpiryDate: ''
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

// ✅ ปรับปรุงฟังก์ชันแปลงวันที่ให้รองรับทั้ง DD Mon YYYY และ DD/MM/YYYY
const convertScannedDateToISO = (dateStr: string | null | undefined | Date) => {
    if (!dateStr) return '';
    if (dateStr instanceof Date) return dateStr.toISOString().split('T')[0];

    try {
        const str = dateStr.toString();

        // Case 1: "12 Jan. 2025" or "12 Jan 2025" (Thai ID style)
        const months: { [key: string]: string } = {
            Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
            Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
        };
        const textMatch = str.match(/(\d{1,2})\s+([A-Za-z.]+)\s+(\d{4})/);
        if (textMatch) {
            const day = textMatch[1].padStart(2, '0');
            const monthText = textMatch[2].replace('.', '');
            const monthKey = Object.keys(months).find(k => monthText.startsWith(k));
            const month = monthKey ? months[monthKey] : '01';
            const year = textMatch[3];
            return `${year}-${month}-${day}`;
        }

        // Case 2: "25/08/1995" (Passport style)
        const slashMatch = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (slashMatch) {
            const day = slashMatch[1].padStart(2, '0');
            const month = slashMatch[2].padStart(2, '0');
            const year = slashMatch[3];
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

    // Scanner Dialog States
    const [openScanner, setOpenScanner] = useState(false);
    const [openPassportScanner, setOpenPassportScanner] = useState(false);
    const [openPinkCardScanner, setOpenPinkCardScanner] = useState(false);

    const [documentType, setDocumentType] = useState<'thai-id' | 'passport' | 'pink-card'>('thai-id');
    const [searchText, setSearchText] = useState('');
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [saving, setSaving] = useState(false);

    // Snackbar notification state
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'info' | 'warning';
    }>({ open: false, message: '', severity: 'info' });

    const [newMemberData, setNewMemberData] = useState({ ...EMPTY_FORM });
    const [editingId, setEditingId] = useState<number | null>(null);

    const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

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
            const updatedData: any = { ...prev, [name]: value };

            if (name === 'citizenId' && prev.documentType === 'thai-id') {
                const isNumericStart = /^[0-9]/.test(value);
                if (isNumericStart && !/[a-zA-Z]/.test(value)) {
                    updatedData.citizenId = formatCitizenId(value);
                }
            }

            if (name === 'affiliation') {
                updatedData.department = '';
            }

            if (name === 'prename') {
                const mappedEn = PRENAME_MAP_TH_TO_EN[value];
                if (mappedEn) {
                    updatedData.prenameEn = mappedEn;
                }
            }

            return updatedData;
        });
    };

    // --- SCANNER HANDLERS ---

    // 1. Thai ID Handler (ปรับปรุง)
    const handleScanComplete = (data: any) => {
        // ถ้าเป็นการสแกนด้านหลัง (มี Laser Code แต่ไม่มีข้อมูลหน้าบัตร)
        if (data.laserId && !data.id && !data.firstname_en) {
            setNewMemberData(prev => ({
                ...prev,
                // อัปเดตเฉพาะ Laser ID, ส่วนอื่นคงเดิม
                laserId: data.laserId,
                // ตรวจสอบว่ามีข้อมูลเดิมอยู่ไหม ถ้ามีก็ไม่ต้องเปลี่ยน documentType
                documentType: prev.documentType || 'thai-id'
            }));
            showNotification('อัปเดต Laser Code เรียบร้อย!', 'success');
            setOpenScanner(false);
            return;
        }

        // ถ้าเป็นการสแกนด้านหน้า (มีข้อมูลหน้าบัตร)
        const formattedDate = convertScannedDateToISO(data.birthdate);

        setNewMemberData(prev => ({
            ...prev,
            // อัปเดตข้อมูลหน้าบัตร
            citizenId: formatCitizenId(data.id || prev.citizenId), // ถ้า scan ไม่เจอ id ให้ใช้ของเดิม
            prename: prev.prename, // คงค่าเดิม หรือจะ map จาก data ถ้า scanner ส่งมา

            // Map เข้าตัวแปร camelCase (ถ้า data ใหม่เป็นค่าว่าง ให้ใช้ค่าเดิม prev... เพื่อกันข้อมูลหาย)
            firstnameEn: data.firstname_en || prev.firstnameEn || '',
            middlenameEn: data.middlename_en || prev.middlenameEn || '',
            lastnameEn: data.lastname_en || prev.lastnameEn || '',

            birthdate: formattedDate || prev.birthdate || '',

            // ถ้า data.laserId ส่งมาด้วย (กรณีสแกนพร้อมกัน) ก็อัปเดต ถ้าไม่ส่งมาให้ใช้ค่าเดิม
            laserId: data.laserId || prev.laserId || '',

            documentType: 'thai-id'
        }));

        setOpenScanner(false);
        showNotification('สแกนบัตรประชาชนสำเร็จ!', 'success');
    };

    // 2. Passport Handler (Updated)
    const handlePassportScanComplete = (data: PassportScannedData) => {
        const formattedDate = convertScannedDateToISO(data.birthdate);
        const formattedExpiryDate = convertScannedDateToISO(data.expiryDate);

        setDocumentType('passport');

        setNewMemberData(prev => ({
            ...prev,
            citizenId: data.passportNo || prev.citizenId, // Passport No goes to citizenId
            laserId: '', // Passport has no laser ID

            // Map snake_case from scanner to camelCase in form
            firstnameEn: data.firstname_en || '',
            middlenameEn: data.middlename_en || '',
            lastnameEn: data.lastname_en || '',

            // Passport-specific fields
            documentType: 'passport',
            nationality: data.nationality || '',
            documentExpiryDate: formattedExpiryDate,

            // General fields
            birthdate: formattedDate,

            // Reset Thai fields because Passport gives English primarily
            // prename: '', firstname: '', lastname: '' // Optional: clear if needed
        }));
        setOpenPassportScanner(false);
        showNotification('สแกนพาสปอร์ตสำเร็จ!', 'success');
    };

    // 3. Pink Card Handler
    const handlePinkCardScanComplete = (data: PinkCardScannedData) => {
        const formattedDate = convertScannedDateToISO(data.birthdate);
        const formattedExpiryDate = convertScannedDateToISO(data.expiryDate);

        setDocumentType('pink-card');

        setNewMemberData(prev => ({
            ...prev,
            citizenId: data.pinkCardNo || prev.citizenId,
            laserId: '',
            firstnameEn: data.firstname_en || '',
            middlenameEn: data.middlename_en || '',
            lastnameEn: data.lastname_en || '',
            birthdate: formattedDate,
            documentType: 'pink-card',
            nationality: data.nationality || '',
            documentExpiryDate: formattedExpiryDate
        }));
        setOpenPinkCardScanner(false);
        showNotification('สแกนบัตรชมพูสำเร็จ!', 'success');
    };

    const validateForm = () => {
        const cleanId = newMemberData.citizenId.replace(/[^a-zA-Z0-9]/g, '');
        if (!cleanId) {
            showNotification('กรุณากรอกเลขบัตรประชาชนหรือหนังสือเดินทาง', 'error');
            return false;
        }
        if (documentType === 'thai-id') {
            if (!newMemberData.prename) { showNotification('กรุณาเลือกคำนำหน้าภาษาไทย', 'error'); return false; }
            if (!newMemberData.firstname.trim()) { showNotification('กรุณากรอกชื่อจริงภาษาไทย', 'error'); return false; }
            if (!newMemberData.lastname.trim()) { showNotification('กรุณากรอกนามสกุลภาษาไทย', 'error'); return false; }
        } else {
            // For passport, English name is crucial
            if (!newMemberData.firstnameEn?.trim()) { showNotification('กรุณากรอกชื่อภาษาอังกฤษ', 'error'); return false; }
            if (!newMemberData.lastnameEn?.trim()) { showNotification('กรุณากรอกนามสกุลภาษาอังกฤษ', 'error'); return false; }
        }

        if (!newMemberData.birthdate) { showNotification('กรุณาเลือกวันเกิด', 'error'); return false; }
        if (!newMemberData.affiliation) { showNotification('กรุณาเลือกสังกัด', 'error'); return false; }
        if (!newMemberData.department) { showNotification('กรุณาเลือกหน่วยงาน', 'error'); return false; }
        // ... (Other validations as needed)

        // Validate Thai ID checksum only if it is Thai ID type
        if (documentType === 'thai-id' && /^[0-9]+$/.test(cleanId) && cleanId.length === 13) {
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
                showNotification(editingId ? 'อัปเดตข้อมูลสำเร็จ!' : 'บันทึกข้อมูลสำเร็จ!', 'success');
                setOpenDialog(false);
                setEditingId(null);
                setNewMemberData({ ...EMPTY_FORM });
                fetchMembers();
            } else {
                showNotification('เกิดข้อผิดพลาด: ' + response.statusText, 'error');
            }
        } catch (error) {
            showNotification('ไม่สามารถติดต่อ Server ได้', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteMember = async (id: number) => {
        if (!confirm('คุณต้องการลบรายชื่อนี้ใช่หรือไม่?')) return;
        try {
            // await fetch(...);
            setAllMembers(prev => prev.filter(m => m.id !== id));
            showNotification('ลบรายการเรียบร้อย (Simulation)', 'success');
        } catch (error) {
            showNotification('เกิดข้อผิดพลาดขณะลบ', 'error');
        }
    };

    const handleDocumentTypeChange = (newType: 'thai-id' | 'passport' | 'pink-card') => {
        setDocumentType(newType);
        setNewMemberData(prev => ({
            ...prev,
            documentType: newType,
            ...(newType === 'thai-id' ? { nationality: '', documentExpiryDate: '' } : { laserId: '' })
        }));
    };

    const handleOpenAddDialog = () => {
        setEditingId(null);
        setNewMemberData({ ...EMPTY_FORM });
        setDocumentType('thai-id');
        setOpenDialog(true);
    };

    const handleOpenEditDialog = (member: Member) => {
        setEditingId(member.id);
        const rawId = member.citizenId || '';
        let displayId = rawId;
        // Format ID only if it's Thai ID format
        if (member.documentType === 'thai-id' || (/^[0-9]+$/.test(rawId) && rawId.length === 13)) {
            displayId = formatCitizenId(rawId);
        }

        let birthdateStr = '';
        if (member.birthdate) {
            const d = new Date(member.birthdate);
            if (!isNaN(d.getTime())) {
                birthdateStr = d.toISOString().split('T')[0];
            }
        }

        let expiryDateStr = '';
        if (member.documentExpiryDate) {
            const d = new Date(member.documentExpiryDate);
            if (!isNaN(d.getTime())) {
                expiryDateStr = d.toISOString().split('T')[0];
            }
        }

        setNewMemberData({
            citizenId: displayId,
            laserId: member.laserId || '',
            prename: member.prename || '',
            firstname: member.firstname || '',
            middlename: member.middlename || '',
            lastname: member.lastname || '',
            prenameEn: member.prenameEn || '',
            firstnameEn: member.firstnameEn || '',
            middlenameEn: member.middlenameEn || '',
            lastnameEn: member.lastnameEn || '',
            birthdate: birthdateStr,
            affiliation: member.affiliation || '',
            department: member.department || '',
            phone: member.phone || '',
            email: member.email || '',
            documentType: member.documentType || 'thai-id',
            nationality: member.nationality || '',
            documentExpiryDate: expiryDateStr
        });
        setDocumentType(member.documentType || 'thai-id');
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
                            sx={{ bgcolor: '#3140BF', borderRadius: 2.5, px: 3, py: 1.2, textTransform: 'none', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(49, 64, 191, 0.25)', '&:hover': { bgcolor: '#1e1b4b' } }}
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
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fff', '& fieldset': { borderColor: '#E2E8F0' }, '&:hover fieldset': { borderColor: '#CBD5E1' }, '&.Mui-focused fieldset': { borderColor: '#3140BF' } } }}
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
                    <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3, maxHeight: '90vh' } }}>
                        <DialogTitle sx={{ m: 0, p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" fontWeight="bold" component="div">
                                {editingId ? 'แก้ไขข้อมูลคณะกรรมการ' : 'เพิ่มคณะกรรมการใหม่'}
                            </Typography>
                            <IconButton onClick={() => setOpenDialog(false)}><CloseIcon /></IconButton>
                        </DialogTitle>
                        <DialogContent sx={{ p: 4, overflowY: 'auto', maxHeight: 'calc(90vh - 180px)' }}>
                            <Stack spacing={3}>
                                {/* 1. ข้อมูลบัตรประชาชน / พาสปอร์ต */}
                                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
                                    <Typography variant="subtitle2" fontWeight="bold" mb={2} color="primary">ข้อมูลเอกสารระบุตัวตน</Typography>
                                    <Stack direction="row" spacing={1} mb={2}>
                                        <Button variant={documentType === 'thai-id' ? 'contained' : 'outlined'} size="small" onClick={() => handleDocumentTypeChange('thai-id')} sx={{ flex: 1, textTransform: 'none' }}>🪪 บัตรประชาชน</Button>
                                        <Button variant={documentType === 'passport' ? 'contained' : 'outlined'} size="small" onClick={() => handleDocumentTypeChange('passport')} sx={{ flex: 1, textTransform: 'none' }}>🛂 พาสปอร์ต</Button>
                                        <Button variant={documentType === 'pink-card' ? 'contained' : 'outlined'} size="small" onClick={() => handleDocumentTypeChange('pink-card')} sx={{ flex: 1, textTransform: 'none' }}>🪪 ใบต่างด้าว</Button>
                                    </Stack>
                                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-end">
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">
                                                {documentType === 'thai-id' ? 'เลขบัตรประชาชน' : documentType === 'passport' ? 'เลขพาสปอร์ต' : 'เลขบัตรต่างด้าว'}
                                            </Typography>
                                            <TextField
                                                fullWidth size="small"
                                                placeholder={documentType === 'thai-id' ? 'กรอกเลขบัตรฯ 13 หลัก' : documentType === 'passport' ? 'เช่น AC1062346' : 'กรอกเลขบัตรต่างด้าว'}
                                                name="citizenId" value={newMemberData.citizenId || ''} onChange={handleNewMemberFormChange}
                                                inputProps={{ maxLength: 20 }}
                                                sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                                InputProps={{ startAdornment: <InputAdornment position="start"><BadgeIcon color="action" fontSize="small" /></InputAdornment> }}
                                            />
                                        </Box>
                                        {documentType === 'thai-id' && (
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">Laser Code (ด้านหลัง)</Typography>
                                                <TextField
                                                    fullWidth size="small" placeholder="เช่น LS0-1234567-12"
                                                    name="laserId" value={newMemberData.laserId || ''} onChange={handleNewMemberFormChange}
                                                    sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 1.5 }, '& input': { fontFamily: 'monospace', letterSpacing: '0.5px' } }}
                                                    InputProps={{ startAdornment: <InputAdornment position="start"><Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>🔖</Typography></InputAdornment> }}
                                                />
                                            </Box>
                                        )}
                                        <Box>
                                            <Tooltip title={documentType === 'thai-id' ? 'สแกนบัตรประชาชน' : documentType === 'passport' ? 'สแกนพาสปอร์ต' : 'สแกนบัตรชมพู'}>
                                                <IconButton
                                                    onClick={() => {
                                                        if (documentType === 'thai-id') setOpenScanner(true);
                                                        else if (documentType === 'passport') setOpenPassportScanner(true);
                                                        else setOpenPinkCardScanner(true);
                                                    }}
                                                    color="primary"
                                                    sx={{ bgcolor: documentType === 'passport' ? '#dbeafe' : documentType === 'pink-card' ? '#fce7f3' : '#e0e7ff', width: 40, height: 40, '&:hover': { bgcolor: documentType === 'passport' ? '#bfdbfe' : documentType === 'pink-card' ? '#fbcfe8' : '#c7d2fe' } }}
                                                >
                                                    <CameraAltIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Stack>
                                </Box>

                                {/* 2. ข้อมูลภาษาไทย */}
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
                                            <TextField fullWidth size="small" name="middlename" value={newMemberData.middlename || ''} onChange={handleNewMemberFormChange} placeholder="ชื่องกลาง" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
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
                                            <Select fullWidth size="small" displayEmpty name="prenameEn" value={newMemberData.prenameEn || ''} onChange={handleNewMemberFormChange} sx={{ bgcolor: '#fff', borderRadius: 1.5 }}>
                                                <MenuItem value="" disabled><span style={{ color: '#9ca3af' }}>Select</span></MenuItem>
                                                {PRENAME_OPTIONS_EN.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                                            </Select>
                                        </Box>
                                        <Box sx={{ flex: 2 }}>
                                            <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">First Name</Typography>
                                            <TextField fullWidth size="small" placeholder="First Name" name="firstnameEn" value={newMemberData.firstnameEn || ''} onChange={handleNewMemberFormChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                        </Box>
                                        <Box sx={{ flex: 1.5 }}>
                                            <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">Middle Name</Typography>
                                            <TextField fullWidth size="small" placeholder="Middle Name" name="middlenameEn" value={newMemberData.middlenameEn || ''} onChange={handleNewMemberFormChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                        </Box>
                                        <Box sx={{ flex: 2 }}>
                                            <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">Last Name</Typography>
                                            <TextField fullWidth size="small" placeholder="Last Name" name="lastnameEn" value={newMemberData.lastnameEn || ''} onChange={handleNewMemberFormChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                        </Box>
                                    </Stack>
                                </Box>

                                {/* 4. วันเกิด, สัญชาติ */}
                                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
                                    <Typography variant="subtitle2" fontWeight="bold" mb={2} color="primary">ข้อมูลเพิ่มเติม</Typography>
                                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">วันเกิด (Date of Birth)</Typography>
                                            <TextField fullWidth size="small" type="date" name="birthdate" value={newMemberData.birthdate || ''} onChange={handleNewMemberFormChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} InputLabelProps={{ shrink: true }} />
                                        </Box>
                                        {(documentType === 'passport' || documentType === 'pink-card') && (
                                            <>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">สัญชาติ (Nationality)</Typography>
                                                    <TextField fullWidth size="small" placeholder="เช่น Myanmar" name="nationality" value={newMemberData.nationality || ''} onChange={handleNewMemberFormChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                                </Box>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">วันหมดอายุเอกสาร</Typography>
                                                    <TextField fullWidth size="small" type="date" name="documentExpiryDate" value={newMemberData.documentExpiryDate || ''} onChange={handleNewMemberFormChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} InputLabelProps={{ shrink: true }} />
                                                </Box>
                                            </>
                                        )}
                                    </Stack>
                                </Box>

                                {/* 5. สังกัด/ติดต่อ */}
                                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
                                    <Typography variant="subtitle2" fontWeight="bold" mb={2} color="primary">สังกัดและข้อมูลติดต่อ</Typography>
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
                                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mt={2}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">เบอร์ติดต่อ</Typography>
                                            <TextField fullWidth size="small" placeholder="08x-xxx-xxxx" name="phone" value={newMemberData.phone || ''} onChange={handleNewMemberFormChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" color="action" /></InputAdornment> }} />
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={0.5} display="block">อีเมล</Typography>
                                            <TextField fullWidth size="small" placeholder="example@mail.com" name="email" value={newMemberData.email || ''} onChange={handleNewMemberFormChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" color="action" /></InputAdornment> }} />
                                        </Box>
                                    </Stack>
                                </Box>
                            </Stack>
                        </DialogContent>
                        <DialogActions sx={{ p: 3, borderTop: '1px solid #f1f5f9', bgcolor: '#f8fafc' }}>
                            <Button onClick={() => setOpenDialog(false)} sx={{ color: '#64748b', fontWeight: 600 }}>ยกเลิก</Button>
                            <Button variant="contained" onClick={handleSaveNewMember} sx={{ bgcolor: '#3140BF', borderRadius: 2, px: 4, boxShadow: 'none', '&:hover': { bgcolor: '#1e1b4b', boxShadow: 'none' } }}>บันทึกข้อมูล</Button>
                        </DialogActions>
                    </Dialog>

                    {/* Scanners */}
                    <ThaiIDScanner open={openScanner} onClose={() => setOpenScanner(false)} onScanComplete={handleScanComplete} />
                    <PassportScanner open={openPassportScanner} onClose={() => setOpenPassportScanner(false)} onScanComplete={handlePassportScanComplete} />
                    <PinkCardScanner open={openPinkCardScanner} onClose={() => setOpenPinkCardScanner(false)} onScanComplete={handlePinkCardScanComplete} />

                    {/* Notification */}
                    <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                        <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity} variant="filled" sx={{ width: '100%', boxShadow: 3 }}>{snackbar.message}</Alert>
                    </Snackbar>

                </Box>
            </Stack>
        </Box>
    );
}