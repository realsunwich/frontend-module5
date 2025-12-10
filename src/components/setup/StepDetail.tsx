'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Box, Stack, TextField, Select, MenuItem,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, IconButton, Typography, Button, SelectChangeEvent,
    Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete, Chip,
    InputAdornment, Tooltip, Divider, Avatar
} from '@mui/material';
import {
    Close as CloseIcon,
    Search as SearchIcon,
    Delete as DeleteIcon,
    CameraAlt as CameraAltIcon,
    DateRange as DateIcon,
    AccessTime as TimeIcon,
    Place as PlaceIcon,
    PersonAdd as PersonAddIcon,
    EditNote as EditNoteIcon,
    Group as GroupIcon,
    Badge as BadgeIcon,
    Phone as PhoneIcon,
    Email as EmailIcon
} from '@mui/icons-material';
import FormRow from '@/components/common/FormRow';

import ThaiIDScanner from '@/components/ThaiIDScanner';

// --- Tiptap Imports ---
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';

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
    { value: 'พลตำรวจเอก', label: 'พลตำรวจเอก' }, { value: 'พลตำรวจโท', label: 'พลตำรวจโท' }, { value: 'พลตำรวจตรี', label: 'พลตำรวจตรี' }, { value: 'พันตำรวจเอก', label: 'พันตำรวจเอก' }, { value: 'พันตำรวจโท', label: 'พันตำรวจโท' }, { value: 'พันตำรวจตรี', label: 'พันตำรวจตรี' }, { value: 'ร้อยตำรวจเอก', label: 'ร้อยตำรวจเอก' }, { value: 'ร้อยตำรวจโท', label: 'ร้อยตำรวจโท' }, { value: 'ร้อยตำรวจตรี', label: 'ร้อยตำรวจตรี' },
    { value: 'พลเอก', label: 'พลเอก' }, { value: 'พลโท', label: 'พลโท' }, { value: 'พลตรี', label: 'พลตรี' },
    { value: 'นายแพทย์', label: 'นายแพทย์' }, { value: 'แพทย์หญิง', label: 'แพทย์หญิง' },
    { value: 'อื่นๆ', label: 'อื่นๆ' },
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

// --- Helper Functions ---
const checkThaiID = (id: string): boolean => {
    if (id.length !== 13) return false;
    if (!/^[0-9]+$/.test(id)) return false;
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(id.charAt(i), 10) * (13 - i);
    }
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

// --- Tiptap Editor Components ---
const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) return null;
    return (
        <Stack direction="row" spacing={0.5} sx={{ borderBottom: '1px solid #e2e8f0', p: 1, bgcolor: '#f8fafc' }}>
            <IconButton size="small" onClick={() => editor.chain().focus().toggleBold().run()} sx={{ color: editor.isActive('bold') ? '#3140BF' : '#64748b', bgcolor: editor.isActive('bold') ? '#e0e7ff' : 'transparent' }}><FormatBoldIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={() => editor.chain().focus().toggleItalic().run()} sx={{ color: editor.isActive('italic') ? '#3140BF' : '#64748b', bgcolor: editor.isActive('italic') ? '#e0e7ff' : 'transparent' }}><FormatItalicIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={() => editor.chain().focus().toggleUnderline().run()} sx={{ color: editor.isActive('underline') ? '#3140BF' : '#64748b', bgcolor: editor.isActive('underline') ? '#e0e7ff' : 'transparent' }}><FormatUnderlinedIcon fontSize="small" /></IconButton>
            <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 20, alignSelf: 'center' }} />
            <IconButton size="small" onClick={() => editor.chain().focus().toggleBulletList().run()} sx={{ color: editor.isActive('bulletList') ? '#3140BF' : '#64748b', bgcolor: editor.isActive('bulletList') ? '#e0e7ff' : 'transparent' }}><FormatListBulletedIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={() => editor.chain().focus().toggleOrderedList().run()} sx={{ color: editor.isActive('orderedList') ? '#3140BF' : '#64748b', bgcolor: editor.isActive('orderedList') ? '#e0e7ff' : 'transparent' }}><FormatListNumberedIcon fontSize="small" /></IconButton>
        </Stack>
    );
};

const TiptapEditor = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const editor = useEditor({
        extensions: [StarterKit, Underline],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: { class: 'focus:outline-none' },
        },
        immediatelyRender: false
    });

    useEffect(() => {
        if (!editor) return;
        if (value !== editor.getHTML()) {
            const isEditorEmpty = editor.getText().trim() === '' && editor.getHTML() === '<p></p>';
            const isValueEmpty = value === '' || value === '<p></p>';
            if (isEditorEmpty && isValueEmpty) return;
            setTimeout(() => { if (!editor.isDestroyed) editor.commands.setContent(value); }, 0);
        }
    }, [value, editor]);

    return (
        <Box sx={{
            border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden', bgcolor: '#fff',
            transition: 'all 0.2s', '&:hover': { borderColor: '#94a3b8' }, '&:focus-within': { borderColor: '#3140BF', boxShadow: '0 0 0 3px rgba(49, 64, 191, 0.1)' },
            '& .ProseMirror': {
                minHeight: '120px', padding: '16px', outline: 'none', fontSize: '0.95rem', lineHeight: 1.6, color: '#334155',
                '& p': { margin: '0 0 8px 0' }, '& ul, & ol': { paddingLeft: '24px', margin: '8px 0' },
                '& li': { marginBottom: '4px', '& p': { margin: 0 } }
            }
        }}>
            <MenuBar editor={editor} />
            <EditorContent editor={editor} />
        </Box>
    );
};

// --- Main Component ---
export default function StepDetail({ meetingInfo, setMeetingInfo, selectedMembers, setSelectedMembers }: StepDetailProps) {
    const [openDialog, setOpenDialog] = useState(false);
    const [openScanner, setOpenScanner] = useState(false);
    const [allMembers, setAllMembers] = useState<Member[]>([]);
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

    const handleNewMemberFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
        const { name, value } = e.target;
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
        setNewMemberData(prev => ({ ...prev, citizenId: formatted }));
    };

    const handleSaveNewMember = async () => {
        // ... (Logic Validation เดิม) ...
        const cleanId = newMemberData.citizenId.replace(/[^a-zA-Z0-9]/g, '');
        if (!cleanId) { alert('กรุณากรอกเลขบัตรประชาชน'); return; }
        // ... (Check Logic) ...

        try {
            const response = await fetch('http://localhost:8080/api/committee-members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMemberData),
            });
            if (response.ok) {
                const createdMember = await response.json();
                alert("บันทึกสำเร็จ!");
                setOpenDialog(false);
                setNewMemberData({ citizenId: '', prename: '', firstname: '', middlename: '', lastname: '', affiliation: '', department: '', phone: '', email: '' });
                if (createdMember && createdMember.id) setSelectedMembers(prev => [...prev, createdMember]);
                else fetchMembers();
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

            {/* --- SECTION 1: ข้อมูลการประชุม --- */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                    <Avatar sx={{ bgcolor: '#eff6ff', color: '#3140BF' }}><EditNoteIcon /></Avatar>
                    <Typography variant="h6" fontWeight="bold" color="#1e293b">ข้อมูลการประชุม</Typography>
                </Stack>

                <Stack spacing={3}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                        <Box sx={{ flex: 1 }}>
                            <FormRow label="วันที่ประชุม" required>
                                <TextField
                                    fullWidth type="date" size="small"
                                    name="meetingDate" value={meetingInfo.meetingDate} onChange={handleMeetingInfoChange}
                                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fff' } }}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><DateIcon color="action" fontSize="small" /></InputAdornment> }}
                                />
                            </FormRow>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <FormRow label="เวลา" required>
                                <TextField
                                    fullWidth type="time" size="small"
                                    name="startTime" value={meetingInfo.startTime} onChange={handleMeetingInfoChange}
                                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fff' } }}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><TimeIcon color="action" fontSize="small" /></InputAdornment> }}
                                />
                            </FormRow>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <FormRow label="สถานที่ประชุม" required>
                                <Select
                                    fullWidth size="small" displayEmpty
                                    name="location" value={meetingInfo.location} onChange={handleMeetingInfoChange}
                                    sx={{ bgcolor: '#fff' }}
                                    startAdornment={<InputAdornment position="start" sx={{ ml: 1 }}><PlaceIcon color="action" fontSize="small" /></InputAdornment>}
                                >
                                    <MenuItem value="" disabled><span style={{ color: '#9ca3af' }}>เลือกสถานที่</span></MenuItem>
                                    <MenuItem value="ห้องประชุม 1">ห้องประชุม 1</MenuItem>
                                    <MenuItem value="ห้องประชุม 2">ห้องประชุม 2</MenuItem>
                                    <MenuItem value="ห้องประชุม 3">ห้องประชุม 3</MenuItem>
                                    <MenuItem value="ออนไลน์ (Ms Team/Google Meet ฯลฯ)">ออนไลน์ (Ms Team/Google Meet ฯลฯ)</MenuItem>
                                </Select>
                            </FormRow>
                        </Box>
                    </Stack>

                    <Box>
                        <FormRow label="รายละเอียดเพิ่มเติม">
                            {/* ใช้ TiptapEditor */}
                            <TiptapEditor
                                value={meetingInfo.detail}
                                onChange={(val) => setMeetingInfo(prev => ({ ...prev, detail: val }))}
                            />
                        </FormRow>
                    </Box>
                </Stack>
            </Paper>

            {/* --- SECTION 2: คณะอนุกรรมการ --- */}
            <Paper elevation={0} sx={{ p: 0, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
                <Box sx={{ p: 3, bgcolor: '#fff', borderBottom: '1px solid #f1f5f9' }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Avatar sx={{ bgcolor: '#eff6ff', color: '#3140BF' }}><GroupIcon /></Avatar>
                            <Box>
                                <Typography variant="h6" fontWeight="bold" color="#1e293b" sx={{ lineHeight: 1.2 }}>คณะอนุกรรมการ</Typography>
                                <Typography variant="caption" color="text.secondary">ผู้เข้าร่วมการประชุมครั้งนี้</Typography>
                            </Box>
                            <Chip label={`${selectedMembers.length} ท่าน`} size="small" sx={{ bgcolor: '#3140BF', color: '#fff', fontWeight: 'bold', ml: 1 }} />
                        </Stack>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: { xs: '100%', md: 'auto' } }}>
                            <Autocomplete
                                options={allMembers}
                                getOptionLabel={(option) => `${option.prename}${option.firstname} ${option.lastname}`}
                                value={null}
                                inputValue={searchText}
                                onInputChange={(event, newInputValue) => setSearchText(newInputValue)}
                                onChange={(event, newValue) => {
                                    if (newValue) handleSelectMemberAutocomplete(newValue);
                                    setSearchText("");
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="ค้นหาชื่อเพื่อเพิ่ม..."
                                        size="small"
                                        sx={{ bgcolor: '#f8fafc', borderRadius: 2, minWidth: 280, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: (<><SearchIcon color="action" fontSize="small" sx={{ ml: 1, mr: -0.5 }} />{params.InputProps.startAdornment}</>)
                                        }}
                                    />
                                )}
                            />
                            <Button
                                variant="contained"
                                startIcon={<PersonAddIcon />}
                                onClick={() => setOpenDialog(true)}
                                sx={{ bgcolor: '#3140BF', borderRadius: 2, textTransform: 'none', boxShadow: 'none', fontWeight: 600, px: 3, '&:hover': { bgcolor: '#1e1b4b', boxShadow: 'none' } }}
                            >
                                สร้างใหม่
                            </Button>
                        </Stack>
                    </Stack>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b', pl: 3 }}>ชื่อ-นามสกุล</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>สังกัด</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>หน่วยงาน</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>เบอร์ติดต่อ</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b', textAlign: 'center' }}>จัดการ</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {selectedMembers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.4 }}>
                                            <PersonAddIcon sx={{ fontSize: 48, mb: 1, color: '#cbd5e1' }} />
                                            <Typography color="text.secondary">ยังไม่มีรายชื่อผู้เข้าร่วม</Typography>
                                            <Typography variant="caption" color="text.disabled">กรุณาค้นหาหรือสร้างใหม่จากด้านบน</Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                selectedMembers.map((row, index) => (
                                    <TableRow key={index} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell sx={{ pl: 3 }}>
                                            <Typography variant="body2" fontWeight={600} color="#1e293b">
                                                {row.prename}{row.firstname} {row.lastname}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">{row.email}</Typography>
                                        </TableCell>
                                        <TableCell><Chip label={row.affiliation || '-'} size="small" variant="outlined" sx={{ borderColor: '#e2e8f0', color: '#64748b' }} /></TableCell>
                                        <TableCell sx={{ color: '#475569' }}>{row.department || '-'}</TableCell>
                                        <TableCell sx={{ color: '#475569' }}>{row.phone || '-'}</TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="ลบรายชื่อ">
                                                <IconButton size="small" onClick={() => handleRemoveMember(row.id)} sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444', bgcolor: '#fee2e2' } }}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* --- Dialog: สร้างสมาชิกใหม่ --- */}
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
    );
}