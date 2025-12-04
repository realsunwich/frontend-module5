'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
    Box, Typography, Paper, Button, Stack, TextField, CircularProgress,
    Divider, Alert, Snackbar, Container, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip, Chip
} from '@mui/material';
import {
    Save as SaveIcon,
    ArrowBack as ArrowBackIcon,
    ArrowForward as ArrowForwardIcon,
    Check as CheckIcon,
    CloudUpload as CloudUploadIcon,
    AttachFile as AttachFileIcon,
    DeleteOutline as DeleteOutlineIcon,
    ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/header';
import Sidebar from '@/components/sidebar';
import StepLabel from '@/components/StepLabel';

const STEPS = ['ผลการประชุม (ภาพรวม)', 'วาระที่ 4', 'วาระที่ 5'];

export default function MeetingResolutionPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeStep, setActiveStep] = useState(0);

    // เพิ่ม state เพื่อเก็บเลขที่การประชุม
    const [meetingNo, setMeetingNo] = useState<string>('');

    const [agendas, setAgendas] = useState<any>({});
    const [resolutions, setResolutions] = useState({
        resolutionDetail: '',
        attachedFile: '',
        res4: '',
        res5: ''
    });

    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8080/api/meetings/${id}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();

            // เก็บเลขที่การประชุม
            setMeetingNo(data.meetingNo || '');

            setAgendas({
                agenda4: parseJson(data.agendaFourData),
                agenda5: parseJson(data.agendaFiveData),
            });

            let detailText = '';
            let fileUrl = '';
            if (data.resolutionDetail) {
                try {
                    const parsed = JSON.parse(data.resolutionDetail);
                    if (typeof parsed === 'object') {
                        detailText = parsed.detail || '';
                        fileUrl = parsed.file || '';
                    } else {
                        detailText = data.resolutionDetail;
                    }
                } catch {
                    detailText = data.resolutionDetail;
                }
            }

            setResolutions({
                resolutionDetail: detailText,
                attachedFile: fileUrl,
                res4: data.resolutionFourData || '',
                res5: data.resolutionFiveData || '',
            });

        } catch (error) {
            console.error(error);
            setToast({ open: true, message: 'ไม่สามารถดึงข้อมูลได้', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const parseJson = (str: string) => {
        try { return JSON.parse(str); } catch { return null; }
    };

    const handleSave = async (nextStep?: boolean) => {
        setSaving(true);
        try {
            const currentRes = await fetch(`http://localhost:8080/api/meetings/${id}`);
            const currentData = await currentRes.json();

            const resolutionDetailJson = JSON.stringify({
                detail: resolutions.resolutionDetail,
                file: resolutions.attachedFile
            });

            let newStatus = currentData.status;
            if (nextStep && activeStep === STEPS.length - 1) {
                newStatus = 'PUBLISH';
            }

            const payload = {
                ...currentData,
                status: newStatus,
                meetingTime: currentData.meetingTime ? (currentData.meetingTime.length > 5 ? currentData.meetingTime : currentData.meetingTime + ":00") : null,
                resolutionDetail: resolutionDetailJson,
                resolutionFourData: resolutions.res4,
                resolutionFiveData: resolutions.res5,
                memberIds: currentData.members ? currentData.members.map((m: any) => m.id) : []
            };

            const res = await fetch(`http://localhost:8080/api/meetings/${id}/resolutions`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Save failed');

            if (nextStep) {
                if (activeStep === STEPS.length - 1) {
                    setToast({ open: true, message: 'บันทึกผลการประชุมเรียบร้อยแล้ว', severity: 'success' });
                    setTimeout(() => router.back(), 1500);
                } else {
                    setActiveStep(prev => prev + 1);
                }
            } else {
                setToast({ open: true, message: 'บันทึกร่างเรียบร้อย', severity: 'success' });
            }

        } catch (error) {
            console.error(error);
            setToast({ open: true, message: 'เกิดข้อผิดพลาดในการบันทึก', severity: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleBack = () => {
        if (activeStep > 0) {
            setActiveStep(prev => prev - 1);
        } else {
            router.back();
        }
    };

    const renderStepContent = (step: number) => {
        if (step === 0) {
            return (
                <OverallResolutionInput
                    detail={resolutions.resolutionDetail}
                    attachedFile={resolutions.attachedFile}
                    onDetailChange={(v: string) => setResolutions(prev => ({ ...prev, resolutionDetail: v }))}
                    onFileChange={(v: string) => setResolutions(prev => ({ ...prev, attachedFile: v }))}
                />
            );
        } else if (step === 1) {
            return (
                <ResolutionInput
                    agendaNo={4}
                    agendaData={agendas.agenda4}
                    value={resolutions.res4}
                    onChange={(v: string) => setResolutions(prev => ({ ...prev, res4: v }))}
                    isTable={true}
                />
            );
        } else if (step === 2) {
            return (
                <ResolutionInput
                    agendaNo={5}
                    agendaData={agendas.agenda5}
                    value={resolutions.res5}
                    onChange={(v: string) => setResolutions(prev => ({ ...prev, res5: v }))}
                    isTable={true}
                />
            );
        }
        return null;
    };

    if (loading) return <Box sx={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}><CircularProgress /></Box>;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f4f6f8' }}>
            <Header />
            <Stack direction="row" sx={{ flex: 1, overflow: 'hidden' }}>
                <Sidebar />
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <Box sx={{ bgcolor: '#fff', px: 4, py: 3, borderBottom: '1px solid #e0e0e0' }}>
                        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                            <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()} sx={{ color: 'text.secondary' }}>
                                กลับหน้าหลัก
                            </Button>
                            <Typography variant="h5" fontWeight="bold" color="primary.main">
                                บันทึกผลการประชุม {meetingNo}
                            </Typography>
                        </Stack>
                        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
                            <StepLabel steps={STEPS} activeStep={activeStep} onStepClick={setActiveStep} />
                        </Box>
                    </Box>

                    {/* Content */}
                    <Box sx={{ flex: 1, p: 4, overflowY: 'auto' }}>
                        <Container maxWidth="md">
                            {renderStepContent(activeStep)}
                        </Container>
                    </Box>

                    {/* Bottom Actions */}
                    <Box sx={{ bgcolor: '#fff', px: 4, py: 2, borderTop: '1px solid #e0e0e0' }}>
                        <Container maxWidth="md">
                            <Stack direction="row" justifyContent="space-between">
                                <Button variant="outlined" onClick={handleBack} disabled={saving}>
                                    {activeStep === 0 ? 'ยกเลิก' : 'ย้อนกลับ'}
                                </Button>
                                <Stack direction="row" spacing={2}>
                                    <Button variant="outlined" startIcon={<SaveIcon />} onClick={() => handleSave(false)} disabled={saving}>
                                        บันทึกร่าง
                                    </Button>
                                    <Button variant="contained" endIcon={activeStep === STEPS.length - 1 ? <CheckIcon /> : <ArrowForwardIcon />} onClick={() => handleSave(true)} disabled={saving} sx={{ bgcolor: '#141371', '&:hover': { bgcolor: '#0f0e5a' } }}>
                                        {activeStep === STEPS.length - 1 ? 'บันทึกและเสร็จสิ้น' : 'ถัดไป'}
                                    </Button>
                                </Stack>
                            </Stack>
                        </Container>
                    </Box>

                </Box>
            </Stack>
            <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast({ ...toast, open: false })}>
                <Alert severity={toast.severity}>{toast.message}</Alert>
            </Snackbar>
        </Box>
    );
}

// --- Sub Components ---

// 1. OverallResolutionInput (เหมือนเดิม)
interface OverallProps { detail: string; attachedFile: string; onDetailChange: (v: string) => void; onFileChange: (v: string) => void; }
const OverallResolutionInput = ({ detail, attachedFile, onDetailChange, onFileChange }: OverallProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const handleFileClick = () => fileInputRef.current?.click();
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('http://localhost:8080/api/upload', { method: 'POST', body: formData });
            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            onFileChange(data.url);
        } catch (error) { alert('อัปโหลดไม่สำเร็จ'); } finally { setUploading(false); if (e.target) e.target.value = ''; }
    };
    return (
        <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', p: 3 }}>
            <Typography variant="h6" fontWeight="bold" color="#1e293b" mb={2}>สรุปผลการประชุม</Typography>
            <Divider sx={{ mb: 3 }} />
            <Stack spacing={3}>
                <Box><Typography variant="subtitle2" fontWeight="bold" mb={1}>รายละเอียด</Typography><TextField fullWidth multiline minRows={6} placeholder="ระบุรายละเอียดผลการประชุม..." value={detail} onChange={(e) => onDetailChange(e.target.value)} sx={{ bgcolor: '#fff' }} /></Box>
                <Box><Typography variant="subtitle2" fontWeight="bold" mb={1}>ไฟล์แนบ (ถ้ามี)</Typography><input type="file" hidden ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />
                    <Stack direction="row" spacing={0} mb={2}><Box onClick={!uploading ? handleFileClick : undefined} sx={{ flex: 1, border: '1px solid #cbd5e1', borderRight: 'none', borderRadius: '8px 0 0 8px', display: 'flex', alignItems: 'center', px: 2, py: 1.5, cursor: uploading ? 'wait' : 'pointer', bgcolor: '#fff', color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}><Typography variant="body2" noWrap>{uploading ? 'กำลังอัปโหลด...' : 'คลิกเพื่อเลือกไฟล์ .pdf หรือ .jpg'}</Typography></Box><Button onClick={handleFileClick} disabled={uploading} variant="contained" disableElevation startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />} sx={{ borderRadius: '0 8px 8px 0', bgcolor: '#3140BF', textTransform: 'none', px: 3 }}>เลือก</Button></Stack>
                    {attachedFile && (<TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}><Table size="small"><TableHead sx={{ bgcolor: '#f8fafc' }}><TableRow><TableCell sx={{ fontWeight: 'bold' }}>ชื่อไฟล์</TableCell><TableCell align="right" sx={{ fontWeight: 'bold', width: 80 }}>จัดการ</TableCell></TableRow></TableHead><TableBody><TableRow><TableCell><Stack direction="row" alignItems="center" spacing={1}><AttachFileIcon fontSize="small" color="primary" /><Typography variant="body2" component="a" href={`http://localhost:8080${attachedFile}`} target="_blank" sx={{ textDecoration: 'underline', color: '#3140BF', cursor: 'pointer' }}>{attachedFile.split('/').pop()}</Typography></Stack></TableCell><TableCell align="right"><Tooltip title="ลบไฟล์"><IconButton size="small" color="error" onClick={() => onFileChange('')}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip></TableCell></TableRow></TableBody></Table></TableContainer>)}
                </Box>
            </Stack>
        </Paper>
    );
};

// 2. ResolutionInput (Updated: รองรับ Table Display)
interface ResolutionInputProps {
    agendaNo: number;
    agendaData: any;
    value: string;
    onChange: (value: string) => void;
    isTable?: boolean;
}

const ResolutionInput = ({ agendaNo, agendaData, value, onChange, isTable = false }: ResolutionInputProps) => {

    // Helper: Chip Status
    const getStatusChip = (status: string) => {
        let color: "default" | "success" | "warning" | "error" = "default";
        let label = status;
        switch (status) {
            case 'seize': color = 'success'; label = 'ยึดทรัพย์'; break;
            case 'pending': color = 'warning'; label = 'รอตรวจสอบ'; break;
            case 'reject': color = 'error'; label = 'ยกคำร้อง'; break;
        }
        return <Chip label={label} color={color} size="small" variant={status === 'pending' ? 'outlined' : 'filled'} sx={{ fontWeight: 600, minWidth: 80 }} />;
    };

    // Helper: Render Table Data
    const renderTableData = (data: any) => {
        if (!data || (!data.items && !data.dialogData)) return <Typography variant="body2" color="text.disabled">- ไม่มีข้อมูลตาราง -</Typography>;
        return (
            <Stack spacing={3}>
                {/* Table 1: Items */}
                {data.items && data.items.length > 0 && (
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead sx={{ bgcolor: '#f5f5f5' }}><TableRow><TableCell sx={{ fontWeight: 'bold' }}>ลำดับ</TableCell><TableCell sx={{ fontWeight: 'bold' }}>ชื่อ-นามสกุล</TableCell><TableCell sx={{ fontWeight: 'bold' }}>สังกัด</TableCell></TableRow></TableHead>
                            <TableBody>{data.items.map((row: any, i: number) => (<TableRow key={i}><TableCell>{row.order}</TableCell><TableCell>{row.name}</TableCell><TableCell>{row.region}</TableCell></TableRow>))}</TableBody>
                        </Table>
                    </TableContainer>
                )}
                {/* Table 2: Details */}
                {data.dialogData && data.dialogData.length > 0 && (
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead sx={{ bgcolor: '#f5f5f5' }}><TableRow><TableCell sx={{ fontWeight: 'bold' }}>เลขที่เอกสาร</TableCell><TableCell sx={{ fontWeight: 'bold' }}>ทรัพย์สิน</TableCell><TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>มูลค่า</TableCell><TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>สถานะ</TableCell></TableRow></TableHead>
                            <TableBody>{data.dialogData.map((row: any, i: number) => (<TableRow key={i}><TableCell>{row.fileNo}</TableCell><TableCell>{row.asset}</TableCell><TableCell align="right">{row.amount}</TableCell><TableCell align="center">{getStatusChip(row.status)}</TableCell></TableRow>))}</TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Stack>
        );
    };

    return (
        <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Box sx={{ bgcolor: '#f8fafc', p: 3, borderBottom: '1px solid #e2e8f0' }}>
                <Typography variant="h6" fontWeight="bold" color="#1e293b" gutterBottom>วาระที่ {agendaNo}</Typography>
                <Box sx={{ mt: 2, p: 2, bgcolor: '#fff', border: '1px solid #e2e8f0', borderRadius: 2 }}>
                    <Typography variant="caption" fontWeight="bold" color="text.secondary" display="block" mb={1}>รายละเอียดวาระ (เพื่อประกอบการพิจารณา):</Typography>
                    <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                        {isTable ? renderTableData(agendaData) : (
                            agendaData && agendaData.subAgendas ? (
                                <ul style={{ margin: 0, paddingLeft: 20 }}>{agendaData.subAgendas.map((sub: any, i: number) => (<li key={i}><Typography variant="body2" sx={{ my: 0.5 }}>{sub.detail}</Typography></li>))}</ul>
                            ) : (<Typography variant="body2" color="text.disabled">- ไม่มีข้อมูล -</Typography>)
                        )}
                    </Box>
                </Box>
            </Box>
            <Box sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" mb={1} color="primary">มติที่ประชุม / ผลการพิจารณา</Typography>
                <TextField fullWidth multiline minRows={6} placeholder={`กรุณาระบุผลการประชุม หรือมติคณะอนุกรรมการ สำหรับวาระที่ ${agendaNo}...`} value={value} onChange={(e) => onChange(e.target.value)} sx={{ bgcolor: '#fff' }} />
            </Box>
        </Paper>
    );
}