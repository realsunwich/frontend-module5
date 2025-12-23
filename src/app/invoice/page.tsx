'use client';

import React, { useState } from 'react';
import { Box, Button, Card, CardContent, Typography, CircularProgress, Alert, Stack, Dialog, DialogContent, IconButton } from '@mui/material';
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

import Header from '@/components/header';
import Sidebar from '@/components/sidebar';

// --- 1. ปรับ Interface ให้ตรงกับ JSON หลังบ้านเป๊ะๆ ---
interface InvoiceData {
    document_type?: string;
    invoice_number?: string;
    issue_date?: string;
    seller?: {
        name?: string;
        address?: string;
        tax_id?: string;
    };
    buyer?: {
        name?: string;
        address?: string;
        tax_id?: string;
    };
    payment?: {
        total_amount?: string;
        vat_amount?: string;
        amount_before_tax?: string;
    };
    items?: Array<{
        description?: string;
        quantity?: string;
        unit_price?: string;
        total?: string;
    }>;
    debug_raw_markdown?: string; // เพิ่ม field สำหรับ debug
}

// Helper Components
const InfoRow = ({ label, value }: { label: string; value: string | undefined | null }) => (
    <Box>
        <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.5 }}>
            {label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827' }}>
            {value && value !== 'null' ? value : '-'}
        </Typography>
    </Box>
);

export default function InvoicePage() {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<InvoiceData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [openImage, setOpenImage] = useState(false);

    const handleReset = () => {
        setFile(null);
        setPreviewUrl(null);
        setResult(null);
        setError(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setError(null);
            setResult(null);

            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);
        const formData = new FormData();
        formData.append('file', file);

        try {
            // URL Backend
            const response = await fetch('http://localhost:8080/api/invoice/analyze', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Server Error: ${response.status}`);
            }

            const data = await response.json();
            console.log("API Response:", data);
            console.log("Parsed data structure:", {
                document_type: data.document_type,
                invoice_number: data.invoice_number,
                issue_date: data.issue_date,
                seller: data.seller,
                buyer: data.buyer,
                payment: data.payment,
                items: data.items
            });
            setResult(data);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
        } finally {
            setLoading(false);
        }
    };

    // Helper: จัด Format ตัวเลขเงิน
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

                        {/* Title */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h5" fontWeight="bold" sx={{ color: '#111827', mb: 0.5 }}>
                                อ่านใบกำกับภาษี (Typhoon OCR)
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#6b7280' }}>
                                อัพโหลดรูปใบกำกับภาษีเพื่อแยกข้อมูลอัตโนมัติด้วย AI
                            </Typography>
                        </Box>

                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                            {/* Left Column - Upload Zone */}
                            <Box sx={{ width: { xs: '100%', md: result ? '40%' : '100%' }, transition: 'width 0.3s' }}>
                                <Card elevation={0} sx={{ border: '1px solid #e5e7eb', height: 'fit-content' }}>
                                    <CardContent>
                                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: '#111827' }}>
                                            อัพโหลดเอกสาร
                                        </Typography>

                                        {previewUrl ? (
                                            <Box>
                                                <Box
                                                    onClick={() => setOpenImage(true)}
                                                    sx={{
                                                        width: '100%', height: 300, bgcolor: '#f9fafb', borderRadius: 2,
                                                        overflow: 'hidden', border: '1px solid #e5e7eb',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2,
                                                        position: 'relative', cursor: 'pointer',
                                                        '&:hover .zoom-overlay': { opacity: 1 }
                                                    }}
                                                >
                                                    <Box component="img" src={previewUrl} alt="Preview"
                                                        sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                                    />
                                                    <Box className="zoom-overlay" sx={{
                                                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                                        bgcolor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        opacity: 0, transition: 'opacity 0.2s'
                                                    }}>
                                                        <ZoomInIcon sx={{ color: 'white', fontSize: 40 }} />
                                                    </Box>
                                                </Box>

                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, p: 1.5, bgcolor: '#ecfdf5', borderRadius: 1 }}>
                                                    <CheckCircleIcon sx={{ color: '#10b981', fontSize: 18 }} />
                                                    <Typography variant="caption" sx={{ color: '#065f46', flex: 1 }}>
                                                        {file?.name}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        ) : (
                                            <Button
                                                component="label" variant="outlined" startIcon={<CloudUploadIcon />} fullWidth
                                                sx={{
                                                    height: 120, borderStyle: 'dashed', borderWidth: 2, borderColor: '#d1d5db', color: '#6b7280', mb: 2,
                                                    '&:hover': { borderColor: '#1a237e', bgcolor: '#f9fafb' }
                                                }}
                                            >
                                                เลือกรูปใบกำกับภาษี
                                                <input type="file" hidden onChange={handleFileChange} accept="image/*" />
                                            </Button>
                                        )}

                                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                                        <Stack spacing={2}>
                                            {result ? (
                                                <Button
                                                    variant="contained" fullWidth onClick={handleReset} startIcon={<RefreshIcon />}
                                                    sx={{ bgcolor: '#1a237e', py: 1.5, '&:hover': { bgcolor: '#0d1642' } }}
                                                >
                                                    อัพโหลดไฟล์ใหม่
                                                </Button>
                                            ) : (
                                                <Stack direction="row" spacing={2}>
                                                    <Button
                                                        variant="contained" onClick={handleUpload} disabled={!file || loading}
                                                        sx={{
                                                            flex: 1, bgcolor: '#1a237e', py: 1.5,
                                                            '&:hover': { bgcolor: '#0d1642' },
                                                            '&:disabled': { bgcolor: '#e5e7eb', color: '#9ca3af' }
                                                        }}
                                                    >
                                                        {loading ? <><CircularProgress size={18} sx={{ mr: 1, color: 'white' }} /> กำลังประมวลผล...</> : 'เริ่มประมวลผล'}
                                                    </Button>
                                                    {file && !loading && (
                                                        <Button
                                                            variant="outlined" onClick={handleReset} startIcon={<DeleteIcon />} color="error"
                                                            sx={{ flex: 1, py: 1.5 }}
                                                        >
                                                            ยกเลิก
                                                        </Button>
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
                                        <Alert icon={<CheckCircleIcon />} severity="success" sx={{ borderRadius: 2 }}>
                                            ประมวลผลสำเร็จ
                                        </Alert>

                                        {/* 1. Document Info */}
                                        <Card elevation={0} sx={{ border: '1px solid #e5e7eb' }}>
                                            <CardContent>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                                    <DescriptionIcon sx={{ color: '#1a237e', fontSize: 20 }} />
                                                    <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#111827' }}>
                                                        ข้อมูลเอกสาร
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                                                    <InfoRow label="วันที่" value={result.issue_date} />
                                                    <InfoRow label="เลขที่ใบกำกับภาษี" value={result.invoice_number} />
                                                    <Box sx={{ gridColumn: '1 / -1' }}>
                                                        <InfoRow label="ประเภทเอกสาร" value={result.document_type} />
                                                    </Box>
                                                </Box>
                                            </CardContent>
                                        </Card>

                                        {/* 2. Seller Info */}
                                        <Card elevation={0} sx={{ border: '1px solid #e5e7eb' }}>
                                            <CardContent>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                                    <BusinessIcon sx={{ color: '#1a237e', fontSize: 20 }} />
                                                    <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#111827' }}>ผู้ขาย</Typography>
                                                </Box>
                                                <Stack spacing={2}>
                                                    <InfoRow label="ชื่อบริษัท" value={result.seller?.name} />
                                                    <InfoRow label="เลขประจำตัวผู้เสียภาษี" value={result.seller?.tax_id} />
                                                    <InfoRow label="ที่อยู่" value={result.seller?.address} />
                                                </Stack>
                                            </CardContent>
                                        </Card>

                                        {/* 3. Buyer Info */}
                                        <Card elevation={0} sx={{ border: '1px solid #e5e7eb' }}>
                                            <CardContent>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                                    <PersonIcon sx={{ color: '#1a237e', fontSize: 20 }} />
                                                    <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#111827' }}>ผู้ซื้อ</Typography>
                                                </Box>
                                                <Stack spacing={2}>
                                                    <InfoRow label="ชื่อ" value={result.buyer?.name} />
                                                    <InfoRow label="เลขประจำตัวผู้เสียภาษี" value={result.buyer?.tax_id} />
                                                    <InfoRow label="ที่อยู่" value={result.buyer?.address} />
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    </Stack>
                                </Box>
                            )}
                        </Stack>

                        {/* 4. Items Table (Full Width) */}
                        {result && result.items && result.items.length > 0 && (
                            <Card elevation={0} sx={{ border: '1px solid #e5e7eb', mt: 3 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                        <ReceiptIcon sx={{ color: '#1a237e', fontSize: 20 }} />
                                        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#111827' }}>รายการสินค้า/บริการ</Typography>
                                    </Box>
                                    <Box sx={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 1 }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ backgroundColor: '#f9fafb' }}>
                                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', color: '#6b7280', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>รายการ</th>
                                                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, fontSize: '0.75rem', color: '#6b7280', width: '100px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>จำนวน</th>
                                                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, fontSize: '0.75rem', color: '#6b7280', width: '120px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>ราคา/หน่วย</th>
                                                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, fontSize: '0.75rem', color: '#6b7280', width: '150px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>จำนวนเงิน</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {result.items.length > 0 ? (
                                                    result.items.map((item, index) => (
                                                        <tr key={index}>
                                                            <td style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', fontSize: '0.875rem', color: '#111827' }}>
                                                                {item.description || '-'}
                                                            </td>
                                                            <td style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '1px solid #f3f4f6', fontSize: '0.875rem', color: '#111827' }}>
                                                                {item.quantity || '-'}
                                                            </td>
                                                            <td style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid #f3f4f6', fontSize: '0.875rem', color: '#6b7280' }}>
                                                                {item.unit_price && item.unit_price !== '0.00' ? `฿${formatAmount(item.unit_price)}` : '-'}
                                                            </td>
                                                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, borderBottom: '1px solid #f3f4f6', fontSize: '0.875rem', color: '#111827' }}>
                                                                {item.total && item.total !== '0.00' ? `฿${formatAmount(item.total)}` : '-'}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
                                                            ไม่พบรายการสินค้า
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </Box>
                                </CardContent>
                            </Card>
                        )}

                        {/* 5. Totals Summary */}
                        {result && result.payment && (
                            <Card elevation={0} sx={{ border: '2px solid #1a237e', bgcolor: 'white', mt: 3 }}>
                                <CardContent>
                                    <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#1a237e', mb: 2 }}>สรุปยอดเงิน</Typography>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f9fafb', borderRadius: 1 }}>
                                            <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 1 }}>มูลค่าก่อนภาษี</Typography>
                                            <Typography variant="h6" fontWeight="bold" sx={{ color: '#111827' }}>
                                                ฿{formatAmount(result.payment.amount_before_tax)}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f9fafb', borderRadius: 1 }}>
                                            <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 1 }}>ภาษีมูลค่าเพิ่ม</Typography>
                                            <Typography variant="h6" fontWeight="bold" sx={{ color: '#111827' }}>
                                                ฿{formatAmount(result.payment.vat_amount)}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#1a237e', borderRadius: 1 }}>
                                            <Typography variant="caption" sx={{ color: 'white', opacity: 0.9, display: 'block', mb: 1 }}>ยอดรวมสุทธิ</Typography>
                                            <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
                                                ฿{formatAmount(result.payment.total_amount)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        )}

                        {/* 6. Debug Panel (ซ่อนไว้ - เปิดใน Console) */}
                        {result?.debug_raw_markdown && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="caption" sx={{ color: '#9ca3af', fontStyle: 'italic' }}>
                                    💡 Debug: เปิด Console (F12) เพื่อดู raw markdown
                                </Typography>
                            </Box>
                        )}

                    </Box>
                </Box>
            </Stack>

            {/* Dialog Image Preview */}
            <Dialog
                open={openImage}
                onClose={() => setOpenImage(false)}
                maxWidth="xl"
                PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none' } }}
            >
                <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}>
                    <IconButton onClick={() => setOpenImage(false)} sx={{ bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'white' } }}>
                        <CloseIcon />
                    </IconButton>
                </Box>
                <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {previewUrl && (
                        <Box
                            component="img"
                            src={previewUrl}
                            alt="Full Invoice"
                            sx={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 1, boxShadow: 24 }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
}