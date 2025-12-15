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
export interface PinkCardScannedData {
    pinkCardNo: string | null;
    firstname_en?: string;
    middlename_en?: string;
    lastname_en?: string;
    birthdate?: string | Date;
    expiryDate?: string | Date;
    nationality?: string;
}

interface PinkCardScannerProps {
    open: boolean;
    onClose: () => void;
    onScanComplete: (data: PinkCardScannedData) => void;
}

export default function PinkCardScanner({ open, onClose, onScanComplete }: PinkCardScannerProps) {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [scannedData, setScannedData] = useState<PinkCardScannedData | null>(null);
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
                    const file = new File([blob], "pinkcard.jpg", { type: "image/jpeg" });
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

    // --- Image Processing (Optimized for Pink Card) ---
    const cropAndEnhance = (
        sourceCanvas: HTMLCanvasElement,
        roi: { x: number, y: number, w: number, h: number }
    ): string => {
        const x = sourceCanvas.width * roi.x;
        const y = sourceCanvas.height * roi.y;
        const w = sourceCanvas.width * roi.w;
        const h = sourceCanvas.height * roi.h;

        const roiCanvas = document.createElement('canvas');
        // Scale up for better OCR
        const scale = 2.5;
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

        // --- Binarization & Contrast Enhancement ---
        // Pink card has pink/reddish background with black text
        // We need to emphasize black text
        const threshold = 110;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Standard Luminance
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;

            // Increase contrast: Darker darks, lighter lights
            // Formula: (Value - 128) * ContrastFactor + 128
            let contrast = (gray - 128) * 2 + 128;
            contrast = Math.max(0, Math.min(255, contrast));

            // Binarize
            const val = contrast > threshold ? 255 : 0;

            data[i] = val;
            data[i + 1] = val;
            data[i + 2] = val;
        }

        ctx.putImageData(imageData, 0, 0);
        return roiCanvas.toDataURL('image/jpeg', 1.0);
    };

    // --- Date Parsing Helper ---
    // Handles formats like: "12 ม.ค. 2568", "12 Jan. 2025", "12/01/2568"
    const parsePinkCardDate = (text: string): string => {
        if (!text) return '';
        const cleanText = text.trim().replace(/\s+/g, ' ');

        // 1. Try Thai Month Abbr (e.g., 31 ส.ค. 2557)
        const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        const thaiPattern = new RegExp(`(\\d{1,2})\\s*(${thaiMonths.join('|')})\\s*(\\d{4})`);
        const thaiMatch = cleanText.match(thaiPattern);

        if (thaiMatch) {
            const day = thaiMatch[1].padStart(2, '0');
            const monthIdx = thaiMonths.indexOf(thaiMatch[2]);
            const month = (monthIdx + 1).toString().padStart(2, '0');
            const year = parseInt(thaiMatch[3]) - 543; // Convert BE to AD
            return `${year}-${month}-${day}`;
        }

        // 2. Try English Month Abbr (e.g., 31 Aug. 2014)
        const engMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const engPattern = new RegExp(`(\\d{1,2})\\s*(${engMonths.join('|')})\\.?\\s*(\\d{4})`, 'i');
        const engMatch = cleanText.match(engPattern);

        if (engMatch) {
            const day = engMatch[1].padStart(2, '0');
            const monthStr = engMatch[2].charAt(0).toUpperCase() + engMatch[2].slice(1).toLowerCase();
            const monthIdx = engMonths.indexOf(monthStr);
            const month = (monthIdx + 1).toString().padStart(2, '0');
            const year = engMatch[3];
            return `${year}-${month}-${day}`;
        }

        // 3. Try Numeric with Slash or Dash (e.g., 31/08/2557)
        const numMatch = cleanText.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (numMatch) {
            const day = numMatch[1].padStart(2, '0');
            const month = numMatch[2].padStart(2, '0');
            let year = parseInt(numMatch[3]);
            if (year > 2400) year -= 543; // Assume BE if > 2400
            return `${year}-${month}-${day}`;
        }

        return '';
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

            // --- 1. Scan ID Area (Top Right) ---
            setStatusText('กำลังอ่านเลขบัตร...');
            const idArea = { x: 0.45, y: 0.12, w: 0.50, h: 0.15 };
            const idImg = cropAndEnhance(mainCanvas, idArea);

            const worker = await Tesseract.createWorker('eng');
            await worker.setParameters({
                tessedit_char_whitelist: '0123456789-',
                tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE
            });
            const { data: { text: idText } } = await worker.recognize(idImg);

            // --- 2. Scan Main Info Area (Middle) ---
            setStatusText('กำลังอ่านข้อมูล...');
            const infoArea = { x: 0.30, y: 0.25, w: 0.65, h: 0.60 };
            const infoImg = cropAndEnhance(mainCanvas, infoArea);

            // Use eng+tha for mixed content
            const workerMulti = await Tesseract.createWorker(['eng', 'tha']);
            await workerMulti.setParameters({
                tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT
            });
            const { data: { text: infoText } } = await workerMulti.recognize(infoImg);
            await worker.terminate();
            await workerMulti.terminate();

            console.log('ID Text:', idText);
            console.log('Info Text:', infoText);

            // --- Parsing Logic ---
            let pinkCardNo = '';
            let firstname_en = '';
            let lastname_en = '';
            let birthdate = '';
            let expiryDate = '';
            let nationality = '';

            // 1. ID Number (Clean spaces and dashes)
            const cleanId = idText.replace(/[^0-9]/g, '');
            if (cleanId.length >= 13) {
                pinkCardNo = cleanId.substring(0, 13);
            }

            // 2. Names (English)
            // Look for "Name Mr. John Doe" or similar
            const nameLines = infoText.split('\n');
            for (const line of nameLines) {
                const nameMatch = line.match(/(?:Name|ชื่อ)\s*(?:Master|Mr\.|Mrs\.|Miss|Ms\.)?\s*([A-Za-z]+)\s+([A-Za-z]+)/i);
                if (nameMatch) {
                    firstname_en = nameMatch[1];
                    lastname_en = nameMatch[2];
                    break;
                }
            }

            // 3. Nationality (สัญชาติ)
            // Keywords: ลาว, LAO, เมียนมา, MYANMAR, กัมพูชา, CAMBODIA
            if (infoText.match(/ลาว|LAO/i)) nationality = 'Lao';
            else if (infoText.match(/เมียนมา|พม่า|MYANMAR/i)) nationality = 'Myanmar';
            else if (infoText.match(/กัมพูชา|CAMBODIA|KHMER/i)) nationality = 'Cambodian';
            else if (infoText.match(/เวียดนาม|VIETNAM/i)) nationality = 'Vietnamese';

            // 4. Dates (Birth & Expiry)
            // Regex to find dates in text block
            // Common patterns: "เกิดวันที่ 9 มี.ค. 2550", "Date of Birth 9 Mar. 2007"
            // "วันบัตรหมดอายุ 31 Aug. 2014", "Date of Expiry..."

            // Birthdate
            const dobMatch = infoText.match(/(?:เกิดวันที่|Date of Birth)[\s:](.*?)(?:\n|$)/i);
            if (dobMatch) {
                birthdate = parsePinkCardDate(dobMatch[1]);
            } else {
                // Try searching for any date line that looks like birth date (often first date)
                // This is a fallback strategy
            }

            // Expiry Date
            // Usually at the bottom, labeled "วันหมดอายุ" or "Date of Expiry"
            const expMatch = infoText.match(/(?:วันบัตรหมดอายุ|Date of Expiry|Valid Until)[\s:](.*?)(?:\n|$)/i);
            if (expMatch) {
                expiryDate = parsePinkCardDate(expMatch[1]);
            } else {
                // Sometimes expiry is the last date found in the text
                const allDates = infoText.match(/\d{1,2}\s+(?:[A-Za-z]{3}|[ก-๙.]{2,4})\.?\s+\d{4}/g);
                if (allDates && allDates.length >= 2) {
                    // Assuming the last one is expiry (often Issued date -> Expiry date)
                    expiryDate = parsePinkCardDate(allDates[allDates.length - 1]);
                }
            }

            if (pinkCardNo || firstname_en || lastname_en) {
                setScannedData({
                    pinkCardNo: pinkCardNo || null,
                    firstname_en: firstname_en,
                    middlename_en: '',
                    lastname_en: lastname_en,
                    nationality: nationality,
                    birthdate: birthdate,
                    expiryDate: expiryDate
                });
            } else {
                setError('ไม่สามารถอ่านข้อมูลบัตรได้ชัดเจน กรุณาถ่ายภาพใหม่');
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
                            สแกนบัตรต่างด้าว (ใบสีชมพู)
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
                                    border: '3px dashed #ec4899', borderRadius: 3, boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Typography sx={{
                                        position: 'absolute', top: -32, left: '50%', transform: 'translateX(-50%)',
                                        color: '#ec4899', fontSize: 13, fontWeight: 'bold', textShadow: '0 0 8px rgba(0,0,0,0.9)',
                                        bgcolor: 'rgba(0,0,0,0.5)', px: 2, py: 0.5, borderRadius: 2
                                    }}>🎯 วางบัตรต่างด้าวให้เต็มกรอบ</Typography>
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
                        <Stack spacing={3} alignItems="center">
                            <Box sx={{ width: '100%', maxWidth: 600, borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', bgcolor: '#000', display: 'flex', justifyContent: 'center' }}>
                                <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain' }} />
                            </Box>

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
                                                    <Typography variant="caption" color="text.secondary">ข้อมูลจากบัตรสีชมพู</Typography>
                                                </Box>
                                            </Stack>

                                            <Stack spacing={2.5}>
                                                {scannedData.pinkCardNo && (
                                                    <TextField label="เลขบัตรต่างด้าว" fullWidth value={scannedData.pinkCardNo} size="small" inputProps={{ readOnly: true }} />
                                                )}
                                                <Stack direction="row" spacing={2}>
                                                    <TextField label="First Name" value={scannedData.firstname_en || ''} size="small" inputProps={{ readOnly: true }} sx={{ flex: 1 }} />
                                                    <TextField label="Last Name" value={scannedData.lastname_en || ''} size="small" inputProps={{ readOnly: true }} sx={{ flex: 1 }} />
                                                </Stack>
                                                <Stack direction="row" spacing={2}>
                                                    <TextField label="Nationality" value={scannedData.nationality || ''} size="small" inputProps={{ readOnly: true }} sx={{ flex: 1 }} />
                                                    <TextField label="Date of Birth" value={scannedData.birthdate || ''} size="small" inputProps={{ readOnly: true }} sx={{ flex: 1 }} />
                                                    <TextField label="Valid Until" value={scannedData.expiryDate || ''} size="small" inputProps={{ readOnly: true }} sx={{ flex: 1 }} />
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
                                        {error ? <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert> : <Typography color="text.secondary">รอการประมวลผล...</Typography>}
                                        {error && <Button onClick={() => setImagePreview(null)} variant="outlined">ลองใหม่อีกครั้ง</Button>}
                                    </Stack>
                                )}
                            </Box>
                        </Stack>
                    </Box>
                ) : (
                    <Box sx={{ flex: 1, p: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <Stack spacing={4} sx={{ width: '100%', maxWidth: 400 }}>
                            <Box textAlign="center">
                                <Typography variant="h6" fontWeight="bold" color="#1E293B">ถ่ายภาพบัตรของคุณ</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    เพื่อให้ระบบอ่านข้อมูลอัตโนมัติ (เลขบัตร, ชื่อ, วันเกิด)
                                </Typography>
                            </Box>

                            <Stack spacing={2}>
                                <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, cursor: 'pointer', transition: 'all 0.2s', '&:hover': { borderColor: '#ec4899', transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(236,72,153,0.1)' } }} onClick={startCamera}>
                                    <Stack direction="row" alignItems="center" p={2.5} spacing={2.5}>
                                        <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: '#fce7f3', color: '#ec4899' }}><CameraIcon fontSize="large" /></Box>
                                        <Box><Typography variant="subtitle1" fontWeight="bold">ถ่ายรูปบัตรต่างด้าว</Typography><Typography variant="caption" color="text.secondary">วางบัตรบนพื้นเรียบ แสงสว่างพอดี</Typography></Box>
                                    </Stack>
                                </Card>
                                <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}><Typography variant="caption" sx={{ bgcolor: '#fff', px: 1, color: '#94A3B8', zIndex: 1 }}>หรือ</Typography><Box sx={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px dashed #E2E8F0', zIndex: 0 }} /></Box>
                                <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, cursor: 'pointer', transition: 'all 0.2s', '&:hover': { borderColor: '#ec4899', transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(236,72,153,0.1)' } }} onClick={() => uploadInputRef.current?.click()}>
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