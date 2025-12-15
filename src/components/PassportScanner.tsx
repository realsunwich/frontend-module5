'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Dialog, DialogContent, IconButton, Box, Typography, Stack,
    Card, Button, Fade, Alert, CircularProgress,
    TextField
} from '@mui/material';
import {
    Close as CloseIcon,
    CameraAltRounded as CameraIcon,
    FlipCameraIos as FlipCameraIcon,
    VerifiedUserRounded as VerifiedIcon,
    PhotoLibrary as GalleryIcon
} from '@mui/icons-material';
import Tesseract from 'tesseract.js';

// --- Interface ---
export interface PassportScannedData {
    passportNo: string | null;
    firstname_en?: string;
    middlename_en?: string;
    lastname_en?: string;
    nationality?: string;
    birthdate?: string | Date;
    expiryDate?: string | Date;
}

interface PassportScannerProps {
    open: boolean;
    onClose: () => void;
    onScanComplete: (data: PassportScannedData) => void;
}

export default function PassportScanner({ open, onClose, onScanComplete }: PassportScannerProps) {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [scannedData, setScannedData] = useState<PassportScannedData | null>(null);
    const [statusText, setStatusText] = useState<string>('');

    // Camera State
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

    const uploadInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        if (!open) {
            stopCamera();
            setTimeout(() => { resetState(); }, 300);
        }
    }, [open]);

    const resetState = () => {
        setImagePreview(null);
        setIsCameraOpen(false);
        setError(null);
        setScannedData(null);
        setProcessing(false);
        setStatusText('');
    };

    const startCamera = async () => {
        setError(null);
        setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } }
            });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            setError('ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการเข้าถึงกล้อง');
            setIsCameraOpen(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const switchCamera = () => {
        stopCamera();
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
        setTimeout(startCamera, 300);
    };

    const capturePhoto = () => {
        if (!videoRef.current) return;
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0);
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], "passport.jpg", { type: "image/jpeg" });
                    setImagePreview(canvas.toDataURL('image/jpeg'));
                    stopCamera();
                    setIsCameraOpen(false);
                    processImage(file);
                }
            }, 'image/jpeg', 0.95);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImagePreview(URL.createObjectURL(file));
            processImage(file);
        }
        e.target.value = '';
    };

    // --- Image Processing (Optimized for OCR) ---
    const cropAndEnhance = (
        sourceCanvas: HTMLCanvasElement,
        roi: { x: number, y: number, w: number, h: number }
    ): string => {
        const x = sourceCanvas.width * roi.x;
        const y = sourceCanvas.height * roi.y;
        const w = sourceCanvas.width * roi.w;
        const h = sourceCanvas.height * roi.h;

        const roiCanvas = document.createElement('canvas');
        // เพิ่ม Scale เป็น 3.0 เพื่อให้ตัวอักษรใหญ่และคมชัดขึ้น (ช่วยแยก < ออกจาก L)
        const scale = 3.0;
        roiCanvas.width = w * scale;
        roiCanvas.height = h * scale;
        const ctx = roiCanvas.getContext('2d');

        if (!ctx) return '';

        // Fill white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, roiCanvas.width, roiCanvas.height);

        // Draw scaled image
        ctx.drawImage(sourceCanvas, x, y, w, h, 0, 0, roiCanvas.width, roiCanvas.height);

        const imageData = ctx.getImageData(0, 0, roiCanvas.width, roiCanvas.height);
        const data = imageData.data;

        // --- Aggressive Binarization ---
        // ปรับ Threshold ให้เหมาะสมกับ Text สีดำบนพื้นขาว (MRZ)
        const threshold = 120;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Grayscale (Luminance)
            const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;

            // Contrast Stretching: ดึงดำให้ดำสนิท ดึงขาวให้ขาวสนิท
            const contrast = (gray - 128) * 2 + 128; // เพิ่ม contrast 2 เท่า
            const val = contrast > threshold ? 255 : 0;

            data[i] = val;
            data[i + 1] = val;
            data[i + 2] = val;
        }

        ctx.putImageData(imageData, 0, 0);
        return roiCanvas.toDataURL('image/jpeg', 1.0);
    };

    // --- Helper: Clean Name Garbage ---
    // ฟังก์ชันสำหรับลบตัวอักษรขยะท้ายชื่อ (เช่น LLLL, KKKK ที่เกิดจากการอ่าน < ผิด)
    const cleanMRZName = (name: string): string => {
        if (!name) return '';
        let cleaned = name.trim();

        // 1. ลบตัวอักษรที่ซ้ำกัน 3 ตัวขึ้นไปที่อยู่ท้ายประโยค (เช่น LLL, KKK)
        cleaned = cleaned.replace(/([A-Z<])\1{2,}$/, '');

        // 2. ลบกลุ่มตัวอักษรที่เป็น Noise ของ MRZ filler ท้ายประโยค (L, K, M, I, E often read from <)
        // Regex นี้จะลบกลุ่มตัวอักษรพวกนี้ถ้ามันอยู่ท้ายสุดและยาวเกิน 2 ตัว
        cleaned = cleaned.replace(/[KLMIE]{3,}$/, '');

        return cleaned.trim();
    };

    const processImage = async (imageFile: File) => {
        setProcessing(true);
        setStatusText('กำลังเตรียมภาพ...');
        setError(null);
        setScannedData(null);

        try {
            const img = new Image();
            img.src = URL.createObjectURL(imageFile);
            await new Promise((resolve) => { img.onload = resolve; });

            const mainCanvas = document.createElement('canvas');
            mainCanvas.width = img.width;
            mainCanvas.height = img.height;
            const ctx = mainCanvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(img, 0, 0);

            // --- Focus on MRZ Area (Bottom 25%) ---
            setStatusText('กำลังอ่านรหัส MRZ...');
            const mrzArea = { x: 0.02, y: 0.75, w: 0.96, h: 0.23 };
            const mrzImg = cropAndEnhance(mainCanvas, mrzArea);

            // --- Tesseract Configuration ---
            const worker = await Tesseract.createWorker('eng');
            await worker.setParameters({
                tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',

                // ❌ แก้บรรทัดนี้: จาก '6' เป็น Tesseract.PSM.SINGLE_BLOCK
                tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
            });

            const { data: { text: mrzText } } = await worker.recognize(mrzImg);
            await worker.terminate();

            console.log('Raw MRZ Text:', mrzText);

            // --- Logic การแกะข้อมูล MRZ ---
            let passportNo = '';
            let firstname_en = '';
            let lastname_en = '';
            let nationality = '';
            let birthdate = '';
            let expiryDate = '';

            const lines = mrzText.split('\n')
                .map(l => l.replace(/ /g, '').trim()) // ลบ Space ออก เพราะ MRZ ไม่มี Space (มีแต่ <)
                .filter(l => l.length > 30);

            // ค้นหาบรรทัด 1 (เริ่มด้วย P) และบรรทัด 2 (มีตัวเลข)
            const line1 = lines.find(l => l.startsWith('P'));
            const line2 = lines.find(l => !l.startsWith('P') && /\d/.test(l) && l.length > 20);

            if (line1) {
                // Line 1: P<THA...
                // แทนที่ Space ที่อาจหลุดรอดมาด้วย < ให้หมด เพื่อความชัวร์
                const safeLine1 = line1.replace(/ /g, '<');

                // Nationality (Pos 2-5) -> P<THA...
                nationality = safeLine1.substring(2, 5).replace(/</g, '');

                // Names: ตัดส่วนหน้าออก (P<THA) แล้วแบ่งด้วย <<
                const nameSection = safeLine1.substring(5);
                const nameParts = nameSection.split('<<');

                if (nameParts.length >= 1) {
                    // Surname
                    lastname_en = cleanMRZName(nameParts[0].replace(/</g, ' '));
                }

                if (nameParts.length >= 2) {
                    // Given Names
                    // ส่วนนี้มักจะมี Filler (<<<<) ต่อท้าย ซึ่งชอบอ่านผิดเป็น LLLL
                    // เราจะใช้ cleanMRZName ช่วย
                    const rawGivenName = nameParts[1];
                    // แยกด้วย < แล้ว filter ตัวว่างออก แล้ว join ด้วย space
                    const givenNames = rawGivenName.split('<').filter(n => n.length > 0).join(' ');
                    firstname_en = cleanMRZName(givenNames);
                }
            }

            if (line2) {
                // Line 2: PassportNo + DOB + Expiry
                // ลบ < ออกจากเลขพาสปอร์ต
                const rawPassport = line2.substring(0, 9).replace(/</g, '');
                passportNo = rawPassport;

                // Date of Birth (YYMMDD) at pos 13
                let rawDob = line2.substring(13, 19);
                if (/^\d{6}$/.test(rawDob)) {
                    const yy = parseInt(rawDob.substring(0, 2));
                    const mm = rawDob.substring(2, 4);
                    const dd = rawDob.substring(4, 6);
                    const year = yy > 50 ? 1900 + yy : 2000 + yy;
                    birthdate = `${dd}/${mm}/${year}`;
                }

                // Expiry Date (YYMMDD) at pos 21
                let rawExp = line2.substring(21, 27);
                if (/^\d{6}$/.test(rawExp)) {
                    const yy = parseInt(rawExp.substring(0, 2));
                    const mm = rawExp.substring(2, 4);
                    const dd = rawExp.substring(4, 6);
                    const year = 2000 + yy;
                    expiryDate = `${dd}/${mm}/${year}`;
                }
            }

            if (passportNo || firstname_en || lastname_en) {
                setScannedData({
                    passportNo: passportNo || null,
                    firstname_en: firstname_en,
                    middlename_en: '',
                    lastname_en: lastname_en,
                    nationality: nationality,
                    birthdate: birthdate,
                    expiryDate: expiryDate
                });
            } else {
                setError('ไม่สามารถอ่านข้อมูล MRZ ได้ชัดเจน กรุณาถ่ายภาพให้เห็นแถวตัวอักษรด้านล่างชัดๆ');
            }

        } catch (err) {
            console.error(err);
            setError('เกิดข้อผิดพลาดในการประมวลผลภาพ');
        } finally {
            setProcessing(false);
            setStatusText('');
        }
    };

    const handleConfirm = () => {
        if (scannedData) {
            onScanComplete(scannedData);
            handleClose();
        }
    };

    const handleClose = () => { stopCamera(); onClose(); };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden', bgcolor: isCameraOpen ? '#000' : '#fff' } }}
        >
            {!isCameraOpen && (
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 2.5, borderBottom: '1px solid #F1F5F9' }}>
                    <Box>
                        <Typography variant="h6" fontWeight="800" color="#1E293B">
                            สแกนพาสปอร์ต (Passport)
                        </Typography>
                        <Typography variant="body2" color="#64748B">ระบบอ่านข้อมูลอัตโนมัติ (AI OCR)</Typography>
                    </Box>
                    <IconButton onClick={handleClose}><CloseIcon /></IconButton>
                </Stack>
            )}

            <DialogContent sx={{ p: 0, minHeight: 450, display: 'flex', flexDirection: 'column' }}>
                {isCameraOpen ? (
                    <Box sx={{ position: 'relative', flex: 1, bgcolor: '#000', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
                            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                            {/* Overlay Guides */}
                            <Box sx={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
                                <Box sx={{
                                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                    width: '80%', maxWidth: 600, aspectRatio: '1.58/1',
                                    border: '3px dashed #4ade80', borderRadius: 3, boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Typography sx={{
                                        position: 'absolute', top: -32, left: '50%', transform: 'translateX(-50%)',
                                        color: '#4ade80', fontSize: 13, fontWeight: 'bold', textShadow: '0 0 8px rgba(0,0,0,0.9)',
                                        bgcolor: 'rgba(0,0,0,0.5)', px: 2, py: 0.5, borderRadius: 2
                                    }}>🎯 วางพาสปอร์ตให้เต็มกรอบ (หน้าข้อมูล)</Typography>
                                </Box>
                            </Box>
                        </Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ height: 100, px: 4, bgcolor: '#000', zIndex: 20 }}>
                            <IconButton onClick={() => setIsCameraOpen(false)} sx={{ color: '#fff' }}><CloseIcon /></IconButton>
                            <IconButton onClick={capturePhoto} sx={{ p: 0 }}>
                                <Box sx={{ width: 72, height: 72, borderRadius: '50%', border: '4px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', '&:active': { transform: 'scale(0.95)' } }}>
                                    <Box sx={{ width: 60, height: 60, bgcolor: '#fff', borderRadius: '50%' }} />
                                </Box>
                            </IconButton>
                            <IconButton onClick={switchCamera} sx={{ color: '#fff' }}><FlipCameraIcon /></IconButton>
                        </Stack>
                    </Box>
                ) : imagePreview ? (
                    <Box sx={{ flex: 1, bgcolor: '#F8FAFC', display: 'flex', flexDirection: 'column', p: 3, overflowY: 'auto' }}>

                        {/* --- Layout แบบ Stack แนวตั้ง (รูปบน ฟอร์มล่าง) --- */}
                        <Stack spacing={3} alignItems="center">

                            {/* ส่วนแสดงรูปภาพ */}
                            <Box sx={{
                                width: '100%',
                                maxWidth: 600,
                                borderRadius: 2,
                                overflow: 'hidden',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                bgcolor: '#000',
                                display: 'flex', justifyContent: 'center'
                            }}>
                                <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain' }} />
                            </Box>

                            {/* ส่วนแสดงผลลัพธ์ */}
                            <Box sx={{ width: '100%' }}>
                                {processing ? (
                                    <Stack alignItems="center" justifyContent="center" sx={{ py: 4 }}>
                                        <CircularProgress size={40} />
                                        <Typography sx={{ mt: 2, color: 'text.secondary' }}>{statusText}</Typography>
                                    </Stack>
                                ) : scannedData ? (
                                    <Fade in>
                                        <Card elevation={0} sx={{ border: '1px solid #E2E8F0', p: 3, borderRadius: 3 }}>
                                            <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                                                <VerifiedIcon color="success" fontSize="large" />
                                                <Box>
                                                    <Typography variant="h6" fontWeight="bold">ตรวจสอบข้อมูล</Typography>
                                                    <Typography variant="caption" color="text.secondary">ข้อมูลที่อ่านได้จากภาพ</Typography>
                                                </Box>
                                            </Stack>

                                            <Stack spacing={2.5}>
                                                {/* Passport Number */}
                                                <TextField
                                                    label="Passport Number"
                                                    fullWidth value={scannedData.passportNo || ''}
                                                    size="small" inputProps={{ readOnly: true }}
                                                />

                                                {/* Names */}
                                                <Stack direction="row" spacing={2}>
                                                    <TextField label="First Name" value={scannedData.firstname_en || ''} size="small" inputProps={{ readOnly: true }} sx={{ flex: 1 }} />
                                                    <TextField label="Last Name" value={scannedData.lastname_en || ''} size="small" inputProps={{ readOnly: true }} sx={{ flex: 1 }} />
                                                </Stack>

                                                {/* Other Info */}
                                                <Stack direction="row" spacing={2}>
                                                    {scannedData.nationality && (
                                                        <TextField label="Nationality" value={scannedData.nationality} size="small" inputProps={{ readOnly: true }} sx={{ flex: 1 }} />
                                                    )}
                                                    {scannedData.birthdate && (
                                                        <TextField label="Date of Birth" value={scannedData.birthdate} size="small" inputProps={{ readOnly: true }} sx={{ flex: 1 }} />
                                                    )}
                                                    {scannedData.expiryDate && (
                                                        <TextField label="Date of Expiry" value={scannedData.expiryDate} size="small" inputProps={{ readOnly: true }} sx={{ flex: 1 }} />
                                                    )}
                                                </Stack>
                                            </Stack>

                                            <Alert severity="info" sx={{ mt: 2, fontSize: '0.85rem' }} icon={false}>
                                                <Typography variant="caption" display="block" fontWeight="600" mb={0.5}>
                                                    💡 คุณสามารถแก้ไขข้อมูลได้ในฟอร์มหลัง
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    หากพบข้อมูลไม่ถูกต้องหรือไม่ครบถ้วน สามารถแก้ไขเพิ่มเติมได้ในฟอร์มกรอกข้อมูลหลังจากกดยืนยัน
                                                </Typography>
                                            </Alert>

                                            <Stack direction="row" spacing={2} mt={3}>
                                                <Button fullWidth variant="outlined" color="inherit" onClick={() => { setImagePreview(null); setError(null); }}>ถ่ายใหม่</Button>
                                                <Button fullWidth variant="contained" size="large" onClick={handleConfirm} sx={{ py: 1.2 }}>
                                                    ยืนยันข้อมูล
                                                </Button>
                                            </Stack>
                                        </Card>
                                    </Fade>
                                ) : (
                                    <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ py: 4 }}>
                                        {error ? (
                                            <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>
                                        ) : (
                                            <Typography color="text.secondary">รอการประมวลผล...</Typography>
                                        )}
                                    </Stack>
                                )}
                            </Box>
                        </Stack>
                    </Box>
                ) : (
                    // หน้าจอเริ่มต้น (เลือกวิธีถ่ายภาพ)
                    <Box sx={{ flex: 1, p: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <Stack spacing={4} sx={{ width: '100%', maxWidth: 400 }}>
                            <Box textAlign="center">
                                <Typography variant="h6" fontWeight="bold" color="#1E293B">ถ่ายภาพพาสปอร์ตของคุณ</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    เพื่อให้ระบบอ่านข้อมูลอัตโนมัติ (เลขพาสปอร์ต, ชื่อ, วันเกิด)
                                </Typography>
                            </Box>

                            <Stack spacing={2}>
                                <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, cursor: 'pointer', transition: 'all 0.2s', '&:hover': { borderColor: '#3B82F6', transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(59,130,246,0.1)' } }} onClick={startCamera}>
                                    <Stack direction="row" alignItems="center" p={2.5} spacing={2.5}>
                                        <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: '#EFF6FF', color: '#3B82F6' }}><CameraIcon fontSize="large" /></Box>
                                        <Box><Typography variant="subtitle1" fontWeight="bold">ถ่ายรูปพาสปอร์ต</Typography><Typography variant="caption" color="text.secondary">วางพาสปอร์ตบนพื้นเรียบ แสงสว่างพอดี</Typography></Box>
                                    </Stack>
                                </Card>
                                <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                                    <Typography variant="caption" sx={{ bgcolor: '#fff', px: 1, color: '#94A3B8', zIndex: 1 }}>หรือ</Typography>
                                    <Box sx={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px dashed #E2E8F0', zIndex: 0 }} />
                                </Box>
                                <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, cursor: 'pointer', transition: 'all 0.2s', '&:hover': { borderColor: '#3B82F6', transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(59,130,246,0.1)' } }} onClick={() => uploadInputRef.current?.click()}>
                                    <Stack direction="row" alignItems="center" p={2.5} spacing={2.5}>
                                        <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: '#F1F5F9', color: '#64748B' }}><GalleryIcon fontSize="large" /></Box>
                                        <Box><Typography variant="subtitle1" fontWeight="bold">เลือกจากอัลบั้ม</Typography><Typography variant="caption" color="text.secondary">รูปภาพชัดเจน ไม่เบลอ</Typography></Box>
                                    </Stack>
                                </Card>
                            </Stack>
                        </Stack>
                        <input type="file" accept="image/*" hidden ref={uploadInputRef} onChange={handleFileChange} />
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}