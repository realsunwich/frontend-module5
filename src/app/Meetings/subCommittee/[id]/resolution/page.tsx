'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
    Box, Typography, Paper, Button, Stack, CircularProgress,
    Divider, Alert, Snackbar, Container, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip, Chip
} from '@mui/material';
import {
    Save as SaveIcon,
    ArrowBack as ArrowBackIcon,
    ArrowForward as ArrowForwardIcon,
    Check as CheckIcon,
    CloudUpload as CloudUploadIcon,
    AttachFile as AttachFileIcon,
    DeleteOutline as DeleteOutlineIcon
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

// Component: แสดงผล HTML
const HtmlContent = ({ content }: { content: string }) => {
    if (!content) return null;
    return (
        <Box
            sx={{
                '& p': { mb: 0.5, mt: 0 },
                '& ul, & ol': { pl: 3, mb: 1, mt: 0 },
                '& ul': { listStyleType: 'disc' },
                '& ol': { listStyleType: 'decimal' },
                '& strong': { fontWeight: 600 },
                fontSize: '0.875rem',
                color: 'text.secondary'
            }}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
};

// Component: MenuBar ของ Editor
const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) return null;
    return (
        <Stack direction="row" spacing={0.5} sx={{ borderBottom: '1px solid #cbd5e1', p: 1, bgcolor: '#f8fafc' }}>
            <IconButton size="small" onClick={() => editor.chain().focus().toggleBold().run()} color={editor.isActive('bold') ? 'primary' : 'default'} sx={{ bgcolor: editor.isActive('bold') ? '#eff6ff' : 'transparent' }}><FormatBoldIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={() => editor.chain().focus().toggleItalic().run()} color={editor.isActive('italic') ? 'primary' : 'default'} sx={{ bgcolor: editor.isActive('italic') ? '#eff6ff' : 'transparent' }}><FormatItalicIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={() => editor.chain().focus().toggleUnderline().run()} color={editor.isActive('underline') ? 'primary' : 'default'} sx={{ bgcolor: editor.isActive('underline') ? '#eff6ff' : 'transparent' }}><FormatUnderlinedIcon fontSize="small" /></IconButton>
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            <IconButton size="small" onClick={() => editor.chain().focus().toggleBulletList().run()} color={editor.isActive('bulletList') ? 'primary' : 'default'} sx={{ bgcolor: editor.isActive('bulletList') ? '#eff6ff' : 'transparent' }}><FormatListBulletedIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={() => editor.chain().focus().toggleOrderedList().run()} color={editor.isActive('orderedList') ? 'primary' : 'default'} sx={{ bgcolor: editor.isActive('orderedList') ? '#eff6ff' : 'transparent' }}><FormatListNumberedIcon fontSize="small" /></IconButton>
        </Stack>
    );
};

// Component: Tiptap Editor
const TiptapEditor = ({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder?: string }) => {
    const editor = useEditor({
        extensions: [StarterKit, Underline],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'focus:outline-none',
            },
        },
        immediatelyRender: false
    });

    useEffect(() => {
        if (!editor) return;
        if (value !== editor.getHTML()) {
            const isEditorEmpty = editor.getText().trim() === '' && editor.getHTML() === '<p></p>';
            const isValueEmpty = value === '' || value === '<p></p>';
            if (isEditorEmpty && isValueEmpty) return;

            setTimeout(() => {
                if (!editor.isDestroyed) {
                    editor.commands.setContent(value);
                }
            }, 0);
        }
    }, [value, editor]);

    return (
        <Box sx={{
            border: '1px solid #cbd5e1',
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: '#fff',
            '&:hover': { borderColor: '#94a3b8' },
            '&:focus-within': { borderColor: '#3140BF', borderWidth: '1px' },

            // ✅ เพิ่ม CSS ให้แสดงผล List ถูกต้องใน Editor
            '& .ProseMirror': {
                minHeight: '150px',
                padding: '16px',
                outline: 'none',
                fontSize: '1rem',
                lineHeight: 1.6,
                color: '#334155',
                '& p': { margin: '0 0 10px 0' },
                '& ul': { listStyleType: 'disc', paddingLeft: '24px', margin: '10px 0' },
                '& ol': { listStyleType: 'decimal', paddingLeft: '24px', margin: '10px 0' },
                '& li': { marginBottom: '4px', '& p': { margin: 0 } },
            }
        }}>
            <MenuBar editor={editor} />
            <EditorContent editor={editor} />
        </Box>
    );
};

// --- Main Page Component ---

export default function MeetingResolutionPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [meetingNo, setMeetingNo] = useState<string>('');

    const [agendas, setAgendas] = useState<any>({});

    // State สำหรับเก็บข้อมูล (ใช้สำหรับทั้ง Create และ Edit)
    const [resolutions, setResolutions] = useState({
        resolutionDetail: '',
        attachedFiles: [] as FileData[],
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

            setMeetingNo(data.meetingNo || '');

            setAgendas({
                agenda4: parseJson(data.agendaFourData),
                agenda5: parseJson(data.agendaFiveData),
            });

            // Logic การดึงข้อมูลเก่ามาใส่ State
            let detailText = '';
            let files: FileData[] = [];

            if (data.resolutionDetail) {
                try {
                    const parsed = JSON.parse(data.resolutionDetail);
                    if (typeof parsed === 'object') {
                        detailText = parsed.detail || '';
                        if (parsed.files && Array.isArray(parsed.files)) {
                            files = parsed.files;
                        } else if (parsed.file) {
                            files = [{ name: 'Attached File', url: parsed.file }];
                        }
                    } else {
                        detailText = data.resolutionDetail;
                    }
                } catch {
                    detailText = data.resolutionDetail;
                }
            }

            setResolutions({
                resolutionDetail: detailText,
                attachedFiles: files,
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

    const handleSave = async (isPublish?: boolean) => {
        setSaving(true);
        try {
            const resolutionDetailJson = JSON.stringify({
                detail: resolutions.resolutionDetail,
                files: resolutions.attachedFiles
            });

            const payload = {
                resolutionDetail: resolutionDetailJson,
                resolutionFourData: resolutions.res4,
                resolutionFiveData: resolutions.res5,
                ...(isPublish && { status: 'PUBLISH' })
            };

            const res = await fetch(`http://localhost:8080/api/meetings/${id}/resolutions`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Save failed');

            if (isPublish) {
                setToast({ open: true, message: 'บันทึกผลการประชุมเรียบร้อยแล้ว', severity: 'success' });
                setTimeout(() => router.back(), 1500);
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

    const handleNext = () => {
        if (activeStep === STEPS.length - 1) {
            handleSave(true);
        } else {
            handleSave(false);
            setActiveStep(prev => prev + 1);
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
                    attachedFiles={resolutions.attachedFiles}
                    onDetailChange={(v: string) => setResolutions(prev => ({ ...prev, resolutionDetail: v }))}
                    onFilesChange={(files: FileData[]) => setResolutions(prev => ({ ...prev, attachedFiles: files }))}
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
                                {meetingNo ? `บันทึก/แก้ไขผลการประชุม ${meetingNo}` : 'บันทึก/แก้ไขผลการประชุม'}
                            </Typography>
                        </Stack>
                        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
                            <StepLabel
                                steps={STEPS}
                                activeStep={activeStep}
                                onStepClick={(idx: number) => setActiveStep(idx)}
                            />
                        </Box>
                    </Box>

                    <Box sx={{ flex: 1, p: 4, overflowY: 'auto' }}>
                        <Container maxWidth="md">
                            {renderStepContent(activeStep)}
                        </Container>
                    </Box>

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
                                    <Button variant="contained" endIcon={activeStep === STEPS.length - 1 ? <CheckIcon /> : <ArrowForwardIcon />} onClick={handleNext} disabled={saving} sx={{ bgcolor: '#141371', '&:hover': { bgcolor: '#0f0e5a' } }}>
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

// 1. OverallResolutionInput
interface OverallProps {
    detail: string;
    attachedFiles: FileData[];
    onDetailChange: (v: string) => void;
    onFilesChange: (files: FileData[]) => void;
}

const OverallResolutionInput = ({ detail, attachedFiles, onDetailChange, onFilesChange }: OverallProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const handleFileClick = () => fileInputRef.current?.click();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const selectedFiles = Array.from(e.target.files);
        const validFiles: File[] = [];

        // Validation Loop
        for (const file of selectedFiles) {
            if (file.type !== 'application/pdf') {
                alert(`ไฟล์ "${file.name}" ไม่ได้รับอนุญาต (ต้องเป็นไฟล์ .pdf เท่านั้น)`);
                continue;
            }
            if (file.size > MAX_FILE_SIZE) {
                alert(`ไฟล์ "${file.name}" มีขนาดใหญ่เกิน 10 MB`);
                continue;
            }
            validFiles.push(file);
        }

        if (validFiles.length === 0) {
            if (e.target) e.target.value = '';
            return;
        }

        setUploading(true);
        const newUploadedFiles: FileData[] = [];

        try {
            await Promise.all(validFiles.map(async (file) => {
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch('http://localhost:8080/api/upload', { method: 'POST', body: formData });
                if (!res.ok) throw new Error(`Upload failed for ${file.name}`);
                const data = await res.json();
                newUploadedFiles.push({ name: file.name, url: data.url });
            }));
            onFilesChange([...attachedFiles, ...newUploadedFiles]);
        } catch (error) {
            console.error(error);
            alert('บางไฟล์อัปโหลดไม่สำเร็จ');
        } finally {
            setUploading(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleRemoveFile = (indexToRemove: number) => {
        const newFiles = attachedFiles.filter((_, index) => index !== indexToRemove);
        onFilesChange(newFiles);
    };

    return (
        <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', p: 3 }}>
            <Typography variant="h6" fontWeight="bold" color="#1e293b" mb={2}>สรุปผลการประชุม</Typography>
            <Divider sx={{ mb: 3 }} />
            <Stack spacing={3}>
                <Box>
                    <Typography variant="subtitle2" fontWeight="bold" mb={1}>รายละเอียด</Typography>
                    <TiptapEditor
                        value={detail}
                        onChange={onDetailChange}
                        placeholder="ระบุรายละเอียดผลการประชุม..."
                    />
                </Box>
                <Box>
                    <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                        <Typography variant="subtitle2" fontWeight="bold">เอกสารแนบ</Typography>
                        <Typography variant="caption" color="text.secondary">(เฉพาะ .pdf ขนาดไม่เกิน 10 MB)</Typography>
                    </Stack>

                    <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} accept=".pdf" multiple />

                    <Stack direction="row" spacing={0} mb={2}>
                        <Box onClick={!uploading ? handleFileClick : undefined} sx={{ flex: 1, border: '1px solid #cbd5e1', borderRight: 'none', borderRadius: '8px 0 0 8px', display: 'flex', alignItems: 'center', px: 2, py: 1.5, cursor: uploading ? 'wait' : 'pointer', bgcolor: '#fff', color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}>
                            <Typography variant="body2" noWrap>
                                {uploading ? 'กำลังอัปโหลด...' : `แนบไฟล์แล้ว ${attachedFiles.length} รายการ (คลิกเพื่อเพิ่ม)`}
                            </Typography>
                        </Box>
                        <Button onClick={handleFileClick} disabled={uploading} variant="contained" disableElevation startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />} sx={{ borderRadius: '0 8px 8px 0', bgcolor: '#3140BF', textTransform: 'none', px: 3 }}>
                            เลือก
                        </Button>
                    </Stack>

                    {attachedFiles.length > 0 && (
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>ชื่อไฟล์</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold', width: 80 }}>จัดการ</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {attachedFiles.map((file, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <AttachFileIcon fontSize="small" color="primary" />
                                                    <Typography variant="body2" component="a" href={`http://localhost:8080${file.url}`} target="_blank" sx={{ textDecoration: 'underline', color: '#3140BF', cursor: 'pointer' }}>
                                                        {file.name || file.url.split('/').pop()}
                                                    </Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="ลบไฟล์">
                                                    <IconButton size="small" color="error" onClick={() => handleRemoveFile(index)}>
                                                        <DeleteOutlineIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Box>
            </Stack>
        </Paper>
    );
};

// 2. ResolutionInput
interface ResolutionInputProps {
    agendaNo: number;
    agendaData: any;
    value: string;
    onChange: (value: string) => void;
    isTable?: boolean;
}

const ResolutionInput = ({ agendaNo, agendaData, value, onChange, isTable = false }: ResolutionInputProps) => {

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

    const renderTableData = (data: any) => {
        if (!data || (!data.items && !data.dialogData)) return <Typography variant="body2" color="text.disabled">- ไม่มีข้อมูลตาราง -</Typography>;
        return (
            <Stack spacing={3}>
                {data.items && data.items.length > 0 && (
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead sx={{ bgcolor: '#f5f5f5' }}><TableRow><TableCell sx={{ fontWeight: 'bold' }}>ลำดับ</TableCell><TableCell sx={{ fontWeight: 'bold' }}>ชื่อ-นามสกุล</TableCell><TableCell sx={{ fontWeight: 'bold' }}>สังกัด</TableCell></TableRow></TableHead>
                            <TableBody>{data.items.map((row: any, i: number) => (<TableRow key={i}><TableCell>{row.order}</TableCell><TableCell>{row.name}</TableCell><TableCell>{row.region}</TableCell></TableRow>))}</TableBody>
                        </Table>
                    </TableContainer>
                )}
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
                                <ul style={{ margin: 0, paddingLeft: 20 }}>
                                    {agendaData.subAgendas.map((sub: any, i: number) => (
                                        <li key={i}>
                                            <HtmlContent content={sub.detail} />
                                        </li>
                                    ))}
                                </ul>
                            ) : (<Typography variant="body2" color="text.disabled">- ไม่มีข้อมูล -</Typography>)
                        )}
                    </Box>
                </Box>
            </Box>
            <Box sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" mb={1} color="primary">มติที่ประชุม / ผลการพิจารณา</Typography>
                <TiptapEditor
                    value={value}
                    onChange={onChange}
                    placeholder={`กรุณาระบุผลการประชุม หรือมติคณะอนุกรรมการ สำหรับวาระที่ ${agendaNo}...`}
                />
            </Box>
        </Paper>
    );
};