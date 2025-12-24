'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Button, Card, CardContent, Typography, CircularProgress, Alert, Stack,
    Dialog, DialogContent, IconButton, TextField, Tooltip, Chip, Rating, DialogTitle, DialogActions
} from '@mui/material';

// Icons
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DescriptionIcon from '@mui/icons-material/Description';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import ReceiptIcon from '@mui/icons-material/Receipt';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import StorageIcon from '@mui/icons-material/Storage';
import StarIcon from '@mui/icons-material/Star';

import Header from '@/components/header';
import Sidebar from '@/components/sidebar';

// --- Interfaces ---
interface InvoiceData {
    document_type?: string;
    invoice_number?: string;
    issue_date?: string;
    seller?: { name?: string; address?: string; tax_id?: string; };
    buyer?: { name?: string; address?: string; tax_id?: string; };
    payment?: { total_amount?: string; vat_amount?: string; amount_before_tax?: string; };
    items?: Array<{ description?: string; quantity?: string; unit_price?: string; total?: string; }>;
    debug_raw_markdown?: string;
}

interface ValidationItem {
    value: string;
    status: 'success' | 'warning' | 'error';
    message?: string;
    confidence?: number;
    suggestions?: string[];
    alternatives?: string[];
}

interface ValidationMetadata { [key: string]: ValidationItem; }

interface InvoiceResponse {
    data: InvoiceData;
    validation: ValidationMetadata;
    confidence_score: number;
}

// --- Component: EditableValue ---
const EditableValue = ({
    label,
    value,
    onSave,
    validation,
    multiline = false
}: {
    label: string;
    value: string | undefined | null;
    onSave: (newValue: string) => void;
    validation?: ValidationItem;
    multiline?: boolean;
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value || '');

    useEffect(() => {
        setTempValue(value || '');
    }, [value]);

    const handleSave = () => {
        onSave(tempValue);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setTempValue(value || '');
        setIsEditing(false);
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'success': return '#10b981';
            case 'warning': return '#f59e0b';
            case 'error': return '#ef4444';
            default: return '#111827';
        }
    };

    const getStatusIcon = (status?: string) => {
        switch (status) {
            case 'success': return <CheckCircleIcon sx={{ fontSize: 16, color: '#10b981' }} />;
            case 'warning': return <WarningIcon sx={{ fontSize: 16, color: '#f59e0b' }} />;
            case 'error': return <ErrorIcon sx={{ fontSize: 16, color: '#ef4444' }} />;
            default: return null;
        }
    };

    return (
        <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.5 }}>
                {label}
            </Typography>

            {isEditing ? (
                <Stack direction="row" spacing={1} alignItems="flex-start">
                    <TextField
                        fullWidth size="small" multiline={multiline} rows={multiline ? 3 : 1}
                        value={tempValue} onChange={(e) => setTempValue(e.target.value)}
                        autoFocus sx={{ bgcolor: 'white' }}
                    />
                    <IconButton size="small" onClick={handleSave} sx={{ color: '#10b981', bgcolor: '#ecfdf5' }}><CheckCircleIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={handleCancel} sx={{ color: '#ef4444', bgcolor: '#fef2f2' }}><CancelIcon fontSize="small" /></IconButton>
                </Stack>
            ) : (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, '&:hover .edit-icon': { opacity: 1 } }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: getStatusColor(validation?.status), flex: 1, wordBreak: 'break-word' }}>
                        {value && value !== 'null' ? value : '-'}
                    </Typography>
                    {validation && getStatusIcon(validation.status)}
                    <Tooltip title="แก้ไขข้อมูล">
                        <IconButton className="edit-icon" size="small" onClick={() => setIsEditing(true)} sx={{ padding: 0.5, opacity: 0.3, transition: 'opacity 0.2s', color: '#6b7280' }}>
                            <EditIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Tooltip>
                </Box>
            )}

            {!isEditing && validation && validation.message && (
                <Typography variant="caption" sx={{ color: getStatusColor(validation.status), display: 'block', mt: 0.5 }}>{validation.message}</Typography>
            )}

            {isEditing && validation?.suggestions && validation.suggestions.length > 0 && (
                <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {validation.suggestions.map((suggestion, idx) => (
                        <Chip key={idx} label={suggestion} size="small" onClick={() => setTempValue(suggestion)} sx={{ cursor: 'pointer', fontSize: '0.75rem' }} icon={<EditIcon sx={{ fontSize: 12 }} />} />
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default function InvoicePage() {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<InvoiceData | null>(null);
    const [validation, setValidation] = useState<ValidationMetadata | null>(null);
    const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [openImage, setOpenImage] = useState(false);

    // State สำหรับการ Save & Rating
    const [isSaving, setIsSaving] = useState(false);
    const [openSaveDialog, setOpenSaveDialog] = useState(false);
    const [userRating, setUserRating] = useState<number | null>(5);
    const [userFeedback, setUserFeedback] = useState('');

    // State สำหรับการแก้ไขตาราง
    const [editingRowIndex, setEditingRowIndex] = useState<number>(-1);
    const [tempRowData, setTempRowData] = useState<any>(null);

    const handleReset = () => {
        setFile(null); setPreviewUrl(null); setResult(null);
        setValidation(null); setConfidenceScore(null); setError(null);
        setEditingRowIndex(-1);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setError(null); setResult(null); setValidation(null); setConfidenceScore(null);
            const reader = new FileReader();
            reader.onloadend = () => { setPreviewUrl(reader.result as string); };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true); setError(null);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await fetch('http://localhost:8080/api/invoice/analyze-crossvalidate', { method: 'POST', body: formData });
            if (!response.ok) throw new Error(await response.text());
            const fullResponse: InvoiceResponse = await response.json();
            setResult(fullResponse.data);
            setValidation(fullResponse.validation || null);
            setConfidenceScore(fullResponse.confidence_score || null);
        } catch (err: any) {
            setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
        } finally {
            setLoading(false);
        }
    };

    const updateField = (path: string, newValue: string) => {
        if (!result) return;
        const newResult = { ...result } as any;
        const parts = path.split('.');
        if (parts.length === 1) newResult[parts[0]] = newValue;
        else if (parts.length === 2) newResult[parts[0]] = { ...newResult[parts[0]], [parts[1]]: newValue };
        setResult(newResult);
        if (validation && validation[path]) {
            setValidation({ ...validation, [path]: { ...validation[path], status: 'success', message: 'แก้ไขโดยผู้ใช้' } });
        }
    };

    // Table Handlers
    const startEditRow = (index: number, item: any) => { setEditingRowIndex(index); setTempRowData({ ...item }); };
    const cancelEditRow = () => { setEditingRowIndex(-1); setTempRowData(null); };
    const saveEditRow = (index: number) => {
        if (!result || !result.items) return;
        const newItems = [...result.items];
        newItems[index] = tempRowData;
        setResult({ ...result, items: newItems });
        setEditingRowIndex(-1); setTempRowData(null);
    };
    const deleteRow = (index: number) => {
        if (!result || !result.items) return;
        const newItems = result.items.filter((_, i) => i !== index);
        setResult({ ...result, items: newItems });
    };
    const addNewRow = () => {
        if (!result) return;
        const newItem = { description: '', quantity: '1', unit_price: '0.00', total: '0.00' };
        const newItems = [...(result.items || []), newItem];
        setResult({ ...result, items: newItems });
        startEditRow(newItems.length - 1, newItem);
    };

    // --- Save & Rate Logic ---
    const handleOpenSaveDialog = () => {
        setUserRating(5); // Default rating
        setUserFeedback('');
        setOpenSaveDialog(true);
    };

    const handleConfirmSave = async () => {
        if (!result) return;
        setIsSaving(true);

        // ข้อมูลที่จะส่งไป Backend เพื่อบันทึก
        const payload = {
            invoiceNumber: result.invoice_number || null,
            invoiceData: JSON.stringify(result), // แปลงข้อมูล invoice เป็น JSON string
            originalConfidence: confidenceScore, // ความมั่นใจของ AI ตอนแรก (0.0 - 1.0)
            userRating: userRating, // คะแนนที่ user ให้ (1-5)
            userFeedback: userFeedback, // ความเห็น user
            userName: null // สามารถเพิ่มชื่อ user ได้ถ้ามี authentication
        };

        try {
            console.log("Saving Payload to Database:", payload);

            const response = await fetch('http://localhost:8080/api/invoice/rating/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            const responseData = await response.json();

            if (response.ok && responseData.success) {
                alert("บันทึกข้อมูลและคำติชมเรียบร้อยแล้ว! (ID: " + responseData.ratingId + ")");
                setOpenSaveDialog(false);
                // อาจจะ Reset หน้าจอ หรือ Redirect ไปหน้า List
                // handleReset(); // ถ้าต้องการ reset หลังบันทึก
            } else {
                alert("เกิดข้อผิดพลาด: " + (responseData.message || "ไม่สามารถบันทึกได้"));
            }
        } catch (e: any) {
            console.error("Error saving rating:", e);
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
        } finally {
            setIsSaving(false);
        }
    };

    const formatAmount = (amount: string | undefined | null) => {
        if (!amount || amount === 'null') return '0.00';
        try {
            const clean = amount.replace(/,/g, '').replace(/[^\d.-]/g, '');
            const num = parseFloat(clean);
            if (!isNaN(num)) return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } catch (e) { }
        return amount;
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#f9fafb' }}>
            <Header />
            <Stack direction="row" sx={{ flex: 1, overflow: 'hidden' }}>
                <Sidebar />
                <Box sx={{ flex: 1, p: 3, overflowY: 'auto' }}>
                    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>

                        {/* Title & Save Button */}
                        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                                <Typography variant="h5" fontWeight="bold" sx={{ color: '#111827', mb: 0.5 }}>
                                    อ่านใบกำกับภาษี (Cross-Validation AI)
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                                    ตรวจสอบความถูกต้อง แก้ไขข้อมูล และประเมินการทำงานของ AI
                                </Typography>
                            </Box>

                            {result && (
                                <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={<StorageIcon />}
                                    onClick={handleOpenSaveDialog} // เปิด Dialog แทนการ save ทันที
                                    sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' }, boxShadow: 2 }}
                                >
                                    บันทึกข้อมูล
                                </Button>
                            )}
                        </Box>

                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                            {/* Left Column - Upload */}
                            <Box sx={{ width: { xs: '100%', md: result ? '40%' : '100%' }, transition: 'width 0.3s' }}>
                                <Card elevation={0} sx={{ border: '1px solid #e5e7eb', height: 'fit-content' }}>
                                    <CardContent>
                                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: '#111827' }}>อัพโหลดเอกสาร</Typography>
                                        {previewUrl ? (
                                            <Box>
                                                <Box onClick={() => setOpenImage(true)} sx={{ width: '100%', height: 300, bgcolor: '#f9fafb', borderRadius: 2, overflow: 'hidden', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, position: 'relative', cursor: 'pointer', '&:hover .zoom-overlay': { opacity: 1 } }}>
                                                    <Box component="img" src={previewUrl} alt="Preview" sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                                    <Box className="zoom-overlay" sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
                                                        <ZoomInIcon sx={{ color: 'white', fontSize: 40 }} />
                                                    </Box>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, p: 1.5, bgcolor: '#ecfdf5', borderRadius: 1 }}>
                                                    <CheckCircleIcon sx={{ color: '#10b981', fontSize: 18 }} />
                                                    <Typography variant="caption" sx={{ color: '#065f46', flex: 1 }}>{file?.name}</Typography>
                                                </Box>
                                            </Box>
                                        ) : (
                                            <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} fullWidth sx={{ height: 120, borderStyle: 'dashed', borderWidth: 2, borderColor: '#d1d5db', color: '#6b7280', mb: 2, '&:hover': { borderColor: '#1a237e', bgcolor: '#f9fafb' } }}>
                                                เลือกรูปใบกำกับภาษี
                                                <input type="file" hidden onChange={handleFileChange} accept="image/*" />
                                            </Button>
                                        )}
                                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                                        <Stack spacing={2}>
                                            {result ? (
                                                <Button variant="contained" fullWidth onClick={handleReset} startIcon={<RefreshIcon />} sx={{ bgcolor: '#1a237e', py: 1.5, '&:hover': { bgcolor: '#0d1642' } }}>อัพโหลดไฟล์ใหม่</Button>
                                            ) : (
                                                <Stack direction="row" spacing={2}>
                                                    <Button variant="contained" onClick={handleUpload} disabled={!file || loading} sx={{ flex: 1, bgcolor: '#1a237e', py: 1.5, '&:hover': { bgcolor: '#0d1642' }, '&:disabled': { bgcolor: '#e5e7eb', color: '#9ca3af' } }}>
                                                        {loading ? <><CircularProgress size={18} sx={{ mr: 1, color: 'white' }} /> กำลังประมวลผล...</> : 'เริ่มประมวลผล'}
                                                    </Button>
                                                    {file && !loading && (
                                                        <Button variant="outlined" onClick={handleReset} startIcon={<DeleteIcon />} color="error" sx={{ flex: 1, py: 1.5 }}>ยกเลิก</Button>
                                                    )}
                                                </Stack>
                                            )}
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Box>

                            {/* Right Column - Results */}
                            {result && (
                                <Box sx={{ flex: 1, width: '100%' }}>
                                    <Stack spacing={2}>
                                        {/* Confidence Score */}
                                        {confidenceScore !== null && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: confidenceScore >= 0.9 ? '#ecfdf5' : confidenceScore >= 0.7 ? '#fef9e7' : '#fee2e2', borderRadius: 2, border: '1px solid', borderColor: confidenceScore >= 0.9 ? '#10b981' : confidenceScore >= 0.7 ? '#f59e0b' : '#ef4444' }}>
                                                <Box sx={{ bgcolor: confidenceScore >= 0.9 ? '#10b981' : confidenceScore >= 0.7 ? '#f59e0b' : '#ef4444', color: 'white', px: 2, py: 1, borderRadius: 1, fontWeight: 'bold' }}>{(confidenceScore * 100).toFixed(0)}%</Box>
                                                <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>ความมั่นใจในการอ่านข้อมูล</Typography>
                                            </Box>
                                        )}

                                        <Alert icon={<CheckCircleIcon />} severity="success" sx={{ borderRadius: 2 }}>ประมวลผลสำเร็จ</Alert>

                                        {/* Document Info */}
                                        <Card elevation={0} sx={{ border: '1px solid #e5e7eb' }}>
                                            <CardContent>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}><DescriptionIcon sx={{ color: '#1a237e', fontSize: 20 }} /><Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#111827' }}>ข้อมูลเอกสาร</Typography></Box>
                                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                                                    <EditableValue label="วันที่" value={result.issue_date} onSave={(v) => updateField('issue_date', v)} validation={validation?.['issue_date']} />
                                                    <EditableValue label="เลขที่ใบกำกับภาษี" value={result.invoice_number} onSave={(v) => updateField('invoice_number', v)} validation={validation?.['invoice_number']} />
                                                    <Box sx={{ gridColumn: '1 / -1' }}><EditableValue label="ประเภทเอกสาร" value={result.document_type} onSave={(v) => updateField('document_type', v)} validation={validation?.['document_type']} /></Box>
                                                </Box>
                                            </CardContent>
                                        </Card>

                                        {/* Seller & Buyer Info */}
                                        <Card elevation={0} sx={{ border: '1px solid #e5e7eb' }}>
                                            <CardContent>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}><BusinessIcon sx={{ color: '#1a237e', fontSize: 20 }} /><Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#111827' }}>ผู้ขาย</Typography></Box>
                                                <Stack spacing={2}>
                                                    <EditableValue label="ชื่อบริษัท" value={result.seller?.name} onSave={(v) => updateField('seller.name', v)} validation={validation?.['seller.name']} multiline />
                                                    <EditableValue label="เลขประจำตัวผู้เสียภาษี" value={result.seller?.tax_id} onSave={(v) => updateField('seller.tax_id', v)} validation={validation?.['seller.tax_id']} />
                                                    <EditableValue label="ที่อยู่" value={result.seller?.address} onSave={(v) => updateField('seller.address', v)} validation={validation?.['seller.address']} multiline />
                                                </Stack>
                                            </CardContent>
                                        </Card>

                                        <Card elevation={0} sx={{ border: '1px solid #e5e7eb' }}>
                                            <CardContent>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}><PersonIcon sx={{ color: '#1a237e', fontSize: 20 }} /><Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#111827' }}>ผู้ซื้อ</Typography></Box>
                                                <Stack spacing={2}>
                                                    <EditableValue label="ชื่อ" value={result.buyer?.name} onSave={(v) => updateField('buyer.name', v)} validation={validation?.['buyer.name']} multiline />
                                                    <EditableValue label="เลขประจำตัวผู้เสียภาษี" value={result.buyer?.tax_id} onSave={(v) => updateField('buyer.tax_id', v)} validation={validation?.['buyer.tax_id']} />
                                                    <EditableValue label="ที่อยู่" value={result.buyer?.address} onSave={(v) => updateField('buyer.address', v)} validation={validation?.['buyer.address']} multiline />
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    </Stack>
                                </Box>
                            )}
                        </Stack>

                        {/* Items Table */}
                        {result && result.items && (
                            <Card elevation={0} sx={{ border: '1px solid #e5e7eb', mt: 3 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><ReceiptIcon sx={{ color: '#1a237e', fontSize: 20 }} /><Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#111827' }}>รายการสินค้า/บริการ</Typography></Box>
                                        <Button startIcon={<AddCircleIcon />} size="small" onClick={addNewRow}>เพิ่มรายการ</Button>
                                    </Box>
                                    <Box sx={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 1 }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ backgroundColor: '#f9fafb' }}>
                                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', color: '#6b7280', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>รายการ</th>
                                                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, fontSize: '0.75rem', color: '#6b7280', width: '100px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>จำนวน</th>
                                                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, fontSize: '0.75rem', color: '#6b7280', width: '120px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>ราคา/หน่วย</th>
                                                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, fontSize: '0.75rem', color: '#6b7280', width: '150px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>จำนวนเงิน</th>
                                                    <th style={{ padding: '12px 16px', textAlign: 'center', width: '80px', borderBottom: '1px solid #e5e7eb' }}>แก้ไข</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {result.items.length > 0 ? (
                                                    result.items.map((item, index) => {
                                                        const isEditing = editingRowIndex === index;
                                                        return (
                                                            <tr key={index} style={{ backgroundColor: isEditing ? '#f0f9ff' : 'transparent' }}>
                                                                {isEditing ? (
                                                                    <>
                                                                        <td style={{ padding: '8px 16px', borderBottom: '1px solid #f3f4f6' }}><TextField fullWidth size="small" value={tempRowData.description} onChange={(e) => setTempRowData({ ...tempRowData, description: e.target.value })} /></td>
                                                                        <td style={{ padding: '8px 4px', borderBottom: '1px solid #f3f4f6' }}><TextField fullWidth size="small" value={tempRowData.quantity} onChange={(e) => setTempRowData({ ...tempRowData, quantity: e.target.value })} inputProps={{ style: { textAlign: 'center' } }} /></td>
                                                                        <td style={{ padding: '8px 4px', borderBottom: '1px solid #f3f4f6' }}><TextField fullWidth size="small" value={tempRowData.unit_price} onChange={(e) => setTempRowData({ ...tempRowData, unit_price: e.target.value })} inputProps={{ style: { textAlign: 'right' } }} /></td>
                                                                        <td style={{ padding: '8px 4px', borderBottom: '1px solid #f3f4f6' }}><TextField fullWidth size="small" value={tempRowData.total} onChange={(e) => setTempRowData({ ...tempRowData, total: e.target.value })} inputProps={{ style: { textAlign: 'right' } }} /></td>
                                                                        <td style={{ padding: '8px 4px', borderBottom: '1px solid #f3f4f6', textAlign: 'center' }}>
                                                                            <IconButton size="small" color="success" onClick={() => saveEditRow(index)}><CheckCircleIcon fontSize="small" /></IconButton>
                                                                            <IconButton size="small" color="error" onClick={cancelEditRow}><CancelIcon fontSize="small" /></IconButton>
                                                                        </td>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', fontSize: '0.875rem', color: '#111827' }}>{item.description || '-'}</td>
                                                                        <td style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '1px solid #f3f4f6', fontSize: '0.875rem', color: '#111827' }}>{item.quantity || '-'}</td>
                                                                        <td style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid #f3f4f6', fontSize: '0.875rem', color: '#6b7280' }}>{item.unit_price && item.unit_price !== '0.00' ? `฿${formatAmount(item.unit_price)}` : '-'}</td>
                                                                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, borderBottom: '1px solid #f3f4f6', fontSize: '0.875rem', color: '#111827' }}>{item.total && item.total !== '0.00' ? `฿${formatAmount(item.total)}` : '-'}</td>
                                                                        <td style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '1px solid #f3f4f6' }}>
                                                                            <IconButton size="small" onClick={() => startEditRow(index, item)} sx={{ color: '#9ca3af', '&:hover': { color: '#1a237e' } }}><EditIcon fontSize="small" /></IconButton>
                                                                            <IconButton size="small" color="error" onClick={() => deleteRow(index)}><DeleteIcon fontSize="small" /></IconButton>
                                                                        </td>
                                                                    </>
                                                                )}
                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>ไม่พบรายการสินค้า</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </Box>
                                </CardContent>
                            </Card>
                        )}

                        {/* Totals Summary */}
                        {result && result.payment && (
                            <Card elevation={0} sx={{ border: '2px solid #1a237e', bgcolor: 'white', mt: 3 }}>
                                <CardContent>
                                    <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#1a237e', mb: 2 }}>สรุปยอดเงิน</Typography>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f9fafb', borderRadius: 1 }}>
                                            <EditableValue label="มูลค่าก่อนภาษี" value={result.payment.amount_before_tax} onSave={(v) => updateField('payment.amount_before_tax', v)} />
                                        </Box>
                                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f9fafb', borderRadius: 1 }}>
                                            <EditableValue label="ภาษีมูลค่าเพิ่ม" value={result.payment.vat_amount} onSave={(v) => updateField('payment.vat_amount', v)} />
                                        </Box>
                                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#1a237e', borderRadius: 1, '& .MuiTypography-body2': { color: 'white' }, '& .MuiTypography-caption': { color: 'rgba(255,255,255,0.7)' } }}>
                                            <EditableValue label="ยอดรวมสุทธิ" value={result.payment.total_amount} onSave={(v) => updateField('payment.total_amount', v)} />
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        )}

                        {/* Debug */}
                        {result?.debug_raw_markdown && (
                            <Box sx={{ mt: 2 }}><Typography variant="caption" sx={{ color: '#9ca3af', fontStyle: 'italic' }}>💡 Debug: เปิด Console (F12) เพื่อดู raw markdown</Typography></Box>
                        )}
                    </Box>
                </Box>
            </Stack>

            {/* Dialog: Image Preview */}
            <Dialog open={openImage} onClose={() => setOpenImage(false)} maxWidth="xl" PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none' } }}>
                <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}>
                    <IconButton onClick={() => setOpenImage(false)} sx={{ bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'white' } }}><CloseIcon /></IconButton>
                </Box>
                <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {previewUrl && <Box component="img" src={previewUrl} alt="Full Invoice" sx={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 1, boxShadow: 24 }} />}
                </DialogContent>
            </Dialog>

            {/* Dialog: Save & Rate AI */}
            <Dialog open={openSaveDialog} onClose={() => setOpenSaveDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>บันทึกข้อมูลและประเมินผล</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center', py: 2 }}>
                        <Typography variant="body1">คุณพอใจกับผลการอ่านข้อมูลของ AI แค่ไหน?</Typography>

                        <Rating
                            name="ai-rating"
                            value={userRating}
                            onChange={(event, newValue) => setUserRating(newValue)}
                            size="large"
                            icon={<StarIcon fontSize="inherit" />}
                        />

                        <TextField
                            label="ข้อเสนอแนะเพิ่มเติม (ถ้ามี)"
                            multiline
                            rows={3}
                            fullWidth
                            variant="outlined"
                            placeholder="เช่น อ่านชื่อบริษัทผิดบ่อย, แยกรายการสินค้าไม่ครบ..."
                            value={userFeedback}
                            onChange={(e) => setUserFeedback(e.target.value)}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenSaveDialog(false)} color="inherit">ยกเลิก</Button>
                    <Button
                        onClick={handleConfirmSave}
                        variant="contained"
                        color="primary"
                        disabled={isSaving}
                        startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    >
                        {isSaving ? 'กำลังบันทึก...' : 'ยืนยันการบันทึก'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}