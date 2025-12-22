'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
    Box, Typography, Button, Stack, CircularProgress, Alert, Snackbar, Container, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, IconButton, Chip, Avatar
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    CloudUpload as CloudUploadIcon,
    InsertDriveFileOutlined as FileIcon,
    Close as CloseIcon,
    Segment as SegmentIcon
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/header';
import Sidebar from '@/components/sidebar';
import StepLabel from '@/components/StepLabel';

// --- Tiptap Imports ---
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';

const STEPS = ['ผลการประชุม (ภาพรวม)', 'วาระที่ 4', 'วาระที่ 5'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Types
type FileData = {
    name: string;
    url: string;
};

// --- Helper Components ---

const HtmlContent = ({ content }: { content: string }) => {
    if (!content) return null;
    return (
        <Box
            sx={{
                '& p': { mb: 1, mt: 0, lineHeight: 1.6, color: 'text.secondary' },
                '& ul, & ol': { pl: 3, mb: 1.5, mt: 0, color: 'text.secondary' },
                fontSize: '0.9rem',
            }}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
};

// Minimal Menu Bar
const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) return null;

    const iconStyle = (active: boolean) => ({
        color: active ? '#0f172a' : '#94a3b8',
        p: 0.5,
        '&:hover': { color: '#0f172a', bgcolor: 'transparent' }
    });

    return (
        <Stack direction="row" spacing={1} sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f1f5f9' }}>
            <IconButton size="small" onClick={() => editor.chain().focus().toggleBold().run()} sx={iconStyle(editor.isActive('bold'))}><FormatBoldIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={() => editor.chain().focus().toggleItalic().run()} sx={iconStyle(editor.isActive('italic'))}><FormatItalicIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={() => editor.chain().focus().toggleUnderline().run()} sx={iconStyle(editor.isActive('underline'))}><FormatUnderlinedIcon fontSize="small" /></IconButton>
            <Box sx={{ width: 1, height: 20, bgcolor: '#e2e8f0', alignSelf: 'center' }} />
            <IconButton size="small" onClick={() => editor.chain().focus().toggleBulletList().run()} sx={iconStyle(editor.isActive('bulletList'))}><FormatListBulletedIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={() => editor.chain().focus().toggleOrderedList().run()} sx={iconStyle(editor.isActive('orderedList'))}><FormatListNumberedIcon fontSize="small" /></IconButton>
        </Stack>
    );
};

const TiptapEditor = ({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder?: string }) => {
    const editor = useEditor({
        extensions: [StarterKit, Underline],
        content: value,
        onUpdate: ({ editor }) => onChange(editor.getHTML()),
        editorProps: { attributes: { class: 'focus:outline-none' } },
        immediatelyRender: false
    });

    useEffect(() => {
        if (!editor || value === editor.getHTML()) return;
        const isEditorEmpty = editor.getText().trim() === '' && editor.getHTML() === '<p></p>';
        const isValueEmpty = value === '' || value === '<p></p>';
        if (isEditorEmpty && isValueEmpty) return;
        setTimeout(() => { if (!editor.isDestroyed) editor.commands.setContent(value); }, 0);
    }, [value, editor]);

    return (
        <Box sx={{
            border: '1px solid #e2e8f0',
            borderRadius: 2,
            bgcolor: '#fff',
            transition: 'border-color 0.2s',
            '&:focus-within': { borderColor: '#94a3b8' },
            '& .ProseMirror': {
                minHeight: '160px',
                padding: '20px',
                outline: 'none',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                color: '#334155',
                '& p.is-editor-empty:first-child::before': {
                    color: '#cbd5e1',
                    content: `"${placeholder}"`,
                    float: 'left',
                    height: 0,
                    pointerEvents: 'none',
                },
            }
        }}>
            <MenuBar editor={editor} />
            <EditorContent editor={editor} />
        </Box>
    );
};

// --- Main Component ---

export default function MeetingResolutionPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [meetingNo, setMeetingNo] = useState<string>('');
    const [agendas, setAgendas] = useState<any>({});
    const [resolutions, setResolutions] = useState({ resolutionDetail: '', attachedFiles: [] as FileData[], res4: '', res5: '' });
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    useEffect(() => { if (id) fetchData(); }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8080/api/meetings/${id}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();

            setMeetingNo(data.meetingNo || '');
            setAgendas({ agenda4: parseJson(data.agendaFourData), agenda5: parseJson(data.agendaFiveData) });

            let detailText = '';
            let files: FileData[] = [];
            if (data.resolutionDetail) {
                try {
                    const parsed = JSON.parse(data.resolutionDetail);
                    if (typeof parsed === 'object') {
                        detailText = parsed.detail || '';
                        files = parsed.files && Array.isArray(parsed.files) ? parsed.files : (parsed.file ? [{ name: 'Attached File', url: parsed.file }] : []);
                    } else { detailText = data.resolutionDetail; }
                } catch { detailText = data.resolutionDetail; }
            }
            setResolutions({ resolutionDetail: detailText, attachedFiles: files, res4: data.resolutionFourData || '', res5: data.resolutionFiveData || '' });
        } catch (error) { setToast({ open: true, message: 'โหลดข้อมูลไม่สำเร็จ', severity: 'error' }); } finally { setLoading(false); }
    };

    const parseJson = (str: string) => { try { return JSON.parse(str); } catch { return null; } };

    const handleSave = async (isPublish?: boolean) => {
        setSaving(true);
        try {
            const payload = {
                resolutionDetail: JSON.stringify({ detail: resolutions.resolutionDetail, files: resolutions.attachedFiles }),
                resolutionFourData: resolutions.res4,
                resolutionFiveData: resolutions.res5,
                ...(isPublish && { status: 'PUBLISH', currentStep: 2 })
            };
            const res = await fetch(`http://localhost:8080/api/meetings/${id}/resolutions`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!res.ok) throw new Error('Save failed');

            setToast({ open: true, message: isPublish ? 'บันทึกเรียบร้อย' : 'บันทึกร่างแล้ว', severity: 'success' });
            if (isPublish) setTimeout(() => router.back(), 1500);
        } catch (error) { setToast({ open: true, message: 'เกิดข้อผิดพลาด', severity: 'error' }); } finally { setSaving(false); }
    };

    const handleNext = () => (activeStep === STEPS.length - 1) ? handleSave(true) : (handleSave(false), setActiveStep(p => p + 1));
    const handleBack = () => (activeStep > 0) ? setActiveStep(p => p - 1) : router.back();

    if (loading) return <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress size={40} sx={{ color: '#0f172a' }} /></Box>;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#fff' }}>
            <Header />
            <Stack direction="row" sx={{ flex: 1, overflow: 'hidden' }}>
                <Sidebar />
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                    {/* Minimal Header */}
                    <Box sx={{ px: 5, py: 3, borderBottom: '1px solid #f1f5f9' }}>
                        <Container maxWidth="lg">
                            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                                <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()} sx={{ color: '#64748b', minWidth: 0, p: 0, '&:hover': { bgcolor: 'transparent', color: '#0f172a' } }}>กลับ</Button>
                                <Typography color="#cbd5e1">/</Typography>
                                <Typography variant="body2" color="text.secondary">บันทึกผลการประชุมคณะอนุกรรมการตรวจสอบทรัพย์สิน</Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
                                <Box>
                                    <Typography variant="h5" fontWeight="600" color="#0f172a" letterSpacing="-0.5px">
                                        {meetingNo ? `การประชุมครั้งที่ ${meetingNo}` : 'บันทึกผลการประชุม'}
                                    </Typography>
                                </Box>
                                <Box sx={{ width: 400 }}>
                                    <StepLabel steps={STEPS} activeStep={activeStep} onStepClick={setActiveStep} />
                                </Box>
                            </Stack>
                        </Container>
                    </Box>

                    {/* Content */}
                    <Box sx={{ overflowY: 'auto', py: 4, pb: 2 }}>
                        <Container maxWidth="md">
                            {activeStep === 0 && <OverallResolutionInput
                                detail={resolutions.resolutionDetail} attachedFiles={resolutions.attachedFiles}
                                onDetailChange={(v: string) => setResolutions(p => ({ ...p, resolutionDetail: v }))}
                                onFilesChange={(f: FileData[]) => setResolutions(p => ({ ...p, attachedFiles: f }))}
                            />}
                            {activeStep === 1 && <ResolutionInput agendaNo={4} agendaData={agendas.agenda4} value={resolutions.res4} onChange={(v: string) => setResolutions(p => ({ ...p, res4: v }))} isTable />}
                            {activeStep === 2 && <ResolutionInput agendaNo={5} agendaData={agendas.agenda5} value={resolutions.res5} onChange={(v: string) => setResolutions(p => ({ ...p, res5: v }))} isTable />}
                        </Container>
                    </Box>

                    {/* Minimal Footer */}
                    <Box sx={{ px: 5, py: 2, borderTop: '1px solid #f1f5f9', bgcolor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}>
                        <Container maxWidth="lg">
                            <Stack direction="row" justifyContent="space-between">
                                <Button onClick={handleBack} disabled={saving} sx={{ color: '#64748b' }}>{activeStep === 0 ? 'ยกเลิก' : 'ย้อนกลับ'}</Button>
                                <Stack direction="row" spacing={2}>
                                    <Button onClick={() => handleSave(false)} disabled={saving} variant="outlined" sx={{ borderColor: '#e2e8f0', color: '#475569', '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' } }}>บันทึกร่าง</Button>
                                    <Button variant="contained" onClick={handleNext} disabled={saving} sx={{ bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' }, px: 3, boxShadow: 'none' }}>
                                        {activeStep === STEPS.length - 1 ? 'เสร็จสิ้น' : 'ถัดไป'}
                                    </Button>
                                </Stack>
                            </Stack>
                        </Container>
                    </Box>

                </Box>
            </Stack>
            <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast({ ...toast, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={toast.severity} variant="filled" sx={{ borderRadius: 5 }}>{toast.message}</Alert>
            </Snackbar>
        </Box>
    );
}

// --- Sub Components ---

const OverallResolutionInput = ({ detail, attachedFiles, onDetailChange, onFilesChange }: any) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setUploading(true);
        const validFiles = Array.from(e.target.files).filter(f => f.type === 'application/pdf' && f.size <= MAX_FILE_SIZE);
        if (!validFiles.length) { alert('Invalid files'); setUploading(false); return; }

        try {
            const newFiles = await Promise.all(validFiles.map(async (f) => {
                const fd = new FormData(); fd.append('file', f);
                const res = await fetch('http://localhost:8080/api/upload', { method: 'POST', body: fd });
                if (!res.ok) throw new Error();
                const d = await res.json();
                return { name: f.name, url: d.url };
            }));
            onFilesChange([...attachedFiles, ...newFiles]);
        } catch { alert('Upload failed'); } finally { setUploading(false); if (e.target) e.target.value = ''; }
    };

    return (
        <Stack spacing={4}>
            <Box>
                <Typography variant="h6" fontWeight="600" color="#1e293b" gutterBottom>รายละเอียดผลการประชุม</Typography>
                <TiptapEditor value={detail} onChange={onDetailChange} placeholder="พิมพ์รายละเอียด..." />
            </Box>

            <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle2" fontWeight="600" color="#1e293b">เอกสารแนบ ({attachedFiles.length})</Typography>
                    <Button size="small" startIcon={uploading ? <CircularProgress size={14} /> : <CloudUploadIcon />} onClick={() => fileInputRef.current?.click()} sx={{ textTransform: 'none', color: '#3b82f6' }}>อัปโหลดไฟล์</Button>
                    <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} accept=".pdf" multiple />
                </Stack>

                {attachedFiles.length > 0 ? (
                    <Stack spacing={1}>
                        {attachedFiles.map((file: FileData, i: number) => (
                            <Stack key={i} direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 1.5, border: '1px solid #f1f5f9', borderRadius: 2, bgcolor: '#fff' }}>
                                <Stack direction="row" alignItems="center" spacing={2} overflow="hidden">
                                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#f1f5f9', color: '#ef4444' }}><FileIcon sx={{ fontSize: 18 }} /></Avatar>
                                    <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>{file.name}</Typography>
                                </Stack>
                                <IconButton size="small" onClick={() => onFilesChange(attachedFiles.filter((_: any, idx: number) => idx !== i))} sx={{ color: '#cbd5e1', '&:hover': { color: '#ef4444' } }}><CloseIcon fontSize="small" /></IconButton>
                            </Stack>
                        ))}
                    </Stack>
                ) : (
                    <Box sx={{ py: 4, border: '1px dashed #e2e8f0', borderRadius: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">ยังไม่มีเอกสารแนบ</Typography>
                    </Box>
                )}
            </Box>
        </Stack>
    );
};

const ResolutionInput = ({ agendaNo, agendaData, value, onChange, isTable }: any) => {

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

    const renderTable = (data: any) => {
        if (!data?.items && !data?.dialogData) return <Typography variant="caption" color="text.disabled" display="block" textAlign="center" py={2}>ไม่มีข้อมูล</Typography>;
        return (
            <Stack spacing={2} mt={2}>
                {data.items?.length > 0 && (
                    <TableContainer sx={{ border: '1px solid #f1f5f9', borderRadius: 2 }}>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: '#f8fafc' }}><TableRow><TableCell>ลำดับ</TableCell><TableCell>ชื่อ-นามสกุล</TableCell><TableCell>สังกัด</TableCell></TableRow></TableHead>
                            <TableBody>{data.items.map((r: any, i: number) => (<TableRow key={i}><TableCell>{r.order}</TableCell><TableCell>{r.name}</TableCell><TableCell sx={{ color: 'text.secondary' }}>{r.region}</TableCell></TableRow>))}</TableBody>
                        </Table>
                    </TableContainer>
                )}
                {data.dialogData?.length > 0 && (
                    <TableContainer sx={{ border: '1px solid #f1f5f9', borderRadius: 2 }}>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: '#f8fafc' }}><TableRow><TableCell>เลขที่</TableCell><TableCell>ทรัพย์สิน</TableCell><TableCell align="right">มูลค่า</TableCell><TableCell align="center">สถานะ</TableCell></TableRow></TableHead>
                            <TableBody>{data.dialogData.map((r: any, i: number) => (
                                <TableRow key={i}>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.fileNo}</TableCell>
                                    <TableCell>{r.asset}</TableCell>
                                    <TableCell align="right">{r.amount}</TableCell>
                                    <TableCell align="center">{getStatusChip(r.status)}</TableCell>
                                </TableRow>
                            ))}</TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Stack>
        );
    };

    return (
        <Stack spacing={4}>
            <Box>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <SegmentIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                    <Typography variant="subtitle2" fontWeight="600" color="#64748b">ข้อมูลวาระที่ {agendaNo}</Typography>
                </Stack>
                <Box sx={{ p: 2, bgcolor: '#fafafa', borderRadius: 2 }}>
                    {isTable ? renderTable(agendaData) : (agendaData?.subAgendas ? <ul style={{ margin: 0, paddingLeft: 20 }}>{agendaData.subAgendas.map((s: any, i: number) => <li key={i}><HtmlContent content={s.detail} /></li>)}</ul> : <Typography variant="caption">-</Typography>)}
                </Box>
            </Box>
            <Box>
                <Typography variant="h6" fontWeight="600" color="#1e293b" gutterBottom>มติที่ประชุม</Typography>
                <TiptapEditor value={value} onChange={onChange} placeholder="ระบุมติที่ประชุม..." />
            </Box>
        </Stack>
    );
};