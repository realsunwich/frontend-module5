'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Dialog, DialogContent, IconButton, Box, Typography, Stack,
    Card, CardActionArea, Button, useTheme, useMediaQuery, Fade, Alert, CircularProgress
} from '@mui/material';
import {
    Close as CloseIcon,
    CameraAltRounded as CameraIcon,
    AddPhotoAlternateRounded as GalleryIcon,
    FlipCameraIos as FlipCameraIcon,
    VerifiedUserRounded as VerifiedIcon
} from '@mui/icons-material';
import Tesseract from 'tesseract.js';

interface ThaiIDScannerProps {
    open: boolean;
    onClose: () => void;
    onScanComplete: (id: string) => void;
}

export default function ThaiIDScanner({ open, onClose, onScanComplete }: ThaiIDScannerProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Camera State
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

    const uploadInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        if (!open) {
            stopCamera();
            setTimeout(() => {
                setImagePreview(null);
                setIsCameraOpen(false);
                setError(null);
                setSuccessMsg(null);
                setProcessing(false);
            }, 300);
        }
    }, [open]);

    // --- Logic ตรวจสอบเลขบัตร ---
    const validateThaiID = (id: string): boolean => {
        if (!id || id.length !== 13 || !/^[0-9]+$/.test(id)) return false;
        let sum = 0;
        for (let i = 0; i < 12; i++) sum += parseFloat(id.charAt(i)) * (13 - i);
        const checkDigit = (11 - sum % 11) % 10;
        return checkDigit === parseFloat(id.charAt(12));
    };

    // --- Camera Functions ---
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
            console.error("Camera Error:", err);
            setError('ไม่สามารถเปิดกล้องได้');
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
                    const file = new File([blob], "camera-snap.jpg", { type: "image/jpeg" });
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

    // --- 🔥🔥 ULTIMATE PREPROCESSING (สูตรเฉพาะบัตรไทย) 🔥🔥 ---
    const applyKernel = (ctx: CanvasRenderingContext2D, width: number, height: number, kernel: number[]) => {
        const imageData = ctx.getImageData(0, 0, width, height);
        const pixels = imageData.data;
        const side = Math.round(Math.sqrt(kernel.length));
        const halfSide = Math.floor(side / 2);
        const output = ctx.createImageData(width, height);
        const outputData = output.data;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const dstOff = (y * width + x) * 4;
                let r = 0, g = 0, b = 0;
                for (let cy = 0; cy < side; cy++) {
                    for (let cx = 0; cx < side; cx++) {
                        const scy = y + cy - halfSide;
                        const scx = x + cx - halfSide;
                        if (scy >= 0 && scy < height && scx >= 0 && scx < width) {
                            const srcOff = (scy * width + scx) * 4;
                            const wt = kernel[cy * side + cx];
                            r += pixels[srcOff] * wt;
                            g += pixels[srcOff + 1] * wt;
                            b += pixels[srcOff + 2] * wt;
                        }
                    }
                }
                outputData[dstOff] = r; outputData[dstOff + 1] = g; outputData[dstOff + 2] = b; outputData[dstOff + 3] = pixels[dstOff + 3];
            }
        }
        return output;
    };

    const preprocessImage = (imageFile: File): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = URL.createObjectURL(imageFile);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) { resolve(img.src); return; }

                // 1. Crop เฉพาะโซนเลข (ขยายพื้นที่ซ้าย-ขวานิดหน่อยเผื่อบัตรเอียง)
                // - เริ่ม X ที่ 30% เพื่อข้ามตราครุฑ
                // - ความกว้าง 65% เพื่อให้คลุมเลขทั้งหมด
                // - ความสูง 25% บนสุด
                const cropX = img.width * 0.30;
                const cropY = 0;
                const cropWidth = img.width * 0.65;
                const cropHeight = img.height * 0.25;

                // 2. Upscaling (ขยาย 3.5 เท่า)
                const scaleFactor = 3.5;
                canvas.width = cropWidth * scaleFactor;
                canvas.height = cropHeight * scaleFactor;
                ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);

                // 3. Sharpening (ทำขอบให้คม)
                const sharpenKernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
                const sharpenedData = applyKernel(ctx, canvas.width, canvas.height, sharpenKernel);
                ctx.putImageData(sharpenedData, 0, 0);

                // 4. Red Channel Grayscale & Normalization
                let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                let data = imageData.data;
                const len = data.length;

                // หาค่ามืดสุด/สว่างสุด (Min/Max) ของ Red Channel
                // ใช้ Red Channel เพราะบัตรเป็นสีฟ้า(Blue/Green) -> Red Channel จะทำให้พื้นหลังสว่างและตัวหนังสือดำชัดสุด
                let min = 255;
                let max = 0;
                for (let i = 0; i < len; i += 4) {
                    const r = data[i]; // เอาแค่ค่าสีแดง!
                    if (r < min) min = r;
                    if (r > max) max = r;
                }

                // Normalization (ยืดกราฟแสง)
                // สูตร: new_val = (val - min) * (255 / (max - min))
                for (let i = 0; i < len; i += 4) {
                    let r = data[i]; // Red Channel

                    // Normalize
                    let norm = (r - min) * (255 / (max - min));

                    // Thresholding แบบนุ่มนวล (ถ้าเข้มมากให้ดำเลย ถ้าจางให้ขาวเลย)
                    // ค่า 160 คือจุดตัด (ปรับขึ้นถ้าอยากให้ขาวง่ายขึ้น)
                    const finalVal = norm < 160 ? 0 : 255;

                    data[i] = finalVal;
                    data[i + 1] = finalVal;
                    data[i + 2] = finalVal;
                }
                ctx.putImageData(imageData, 0, 0);

                resolve(canvas.toDataURL('image/jpeg', 1.0));
            };
        });
    };

    // --- Main Processing ---
    const processImage = async (imageFile: File) => {
        setProcessing(true);
        setError(null);
        setSuccessMsg(null);

        try {
            // เรียกใช้ Preprocessing สูตรเฉพาะ
            const processedImageUrl = await preprocessImage(imageFile);

            const { data: { text } } = await Tesseract.recognize(
                processedImageUrl,
                'eng', // ใช้ eng อ่านตัวเลขได้ดี
                {
                    // @ts-ignore
                    tessedit_char_whitelist: '0123456789 ',
                    tessedit_pageseg_mode: '7' // Single line mode
                }
            );

            console.log(`OCR Output: ${text}`);
            const cleanText = text.replace(/[^0-9]/g, '');

            // 🧠 Smart ID Finder Algorithm
            let validID = null;

            // Step 1: หา 13 หลักที่ถูกต้องตาม Checksum
            // วนลูปหาทุกความเป็นไปได้ (Sliding Window)
            if (cleanText.length >= 13) {
                for (let i = 0; i <= cleanText.length - 13; i++) {
                    const chunk = cleanText.substr(i, 13);
                    if (validateThaiID(chunk)) {
                        validID = chunk;
                        break;
                    }
                }
            }

            // Step 2: ถ้าไม่เจอ Checksum ที่ถูก แต่เจอเลข 13 หลักพอดีเป๊ะ ก็อนุโลม (อาจอ่านผิดบางตัว)
            if (!validID && cleanText.length === 13) {
                // แจ้งเตือนว่า Checksum ไม่ผ่าน แต่ยอมรับค่ามาแก้ไข
                console.warn("Checksum failed but length is 13");
                // validID = cleanText; // ถ้าอยากให้ผ่านเลยให้ uncomment บรรทัดนี้
            }

            if (validID) {
                setSuccessMsg(`ตรวจสอบแล้ว: ถูกต้อง (${validID})`);
                setTimeout(() => { onScanComplete(validID as string); handleClose(); }, 1000);
            } else {
                if (cleanText.length < 10) {
                    setError('ภาพไม่ชัดเจน กรุณาถ่ายใหม่ให้เห็นตัวเลขชัดๆ');
                } else {
                    setError(`อ่านค่าได้ ${cleanText} (ไม่ผ่านการตรวจสอบ) ลองขยับกล้องเข้าใกล้อีกนิด`);
                }
            }

        } catch (err) {
            setError('เกิดข้อผิดพลาดในการประมวลผล');
        } finally {
            setProcessing(false);
        }
    };

    const handleClose = () => { stopCamera(); onClose(); };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden', bgcolor: isCameraOpen ? '#000' : '#fff', transition: 'background-color 0.3s ease' } }}>
            {!isCameraOpen && (
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 2.5, borderBottom: '1px solid #F1F5F9' }}>
                    <Box><Typography variant="h6" fontWeight="800" color="#1E293B">สแกนบัตรประชาชน</Typography><Typography variant="body2" color="#64748B">Ultimate AI Scanner</Typography></Box>
                    <IconButton onClick={handleClose} sx={{ color: '#94A3B8', bgcolor: '#F8FAFC', '&:hover': { bgcolor: '#F1F5F9' } }}><CloseIcon /></IconButton>
                </Stack>
            )}
            <DialogContent sx={{ p: 0, minHeight: 400, display: 'flex', flexDirection: 'column' }}>
                {isCameraOpen ? (
                    <Box sx={{ position: 'relative', flex: 1, bgcolor: '#000', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
                            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            {/* กรอบเล็งปรับตำแหน่งให้ตรงกับ Crop Area (30% ซ้าย, 0% บน) */}
                            <Box sx={{ position: 'absolute', top: '5%', right: '5%', width: '65%', height: '22%', border: '2px dashed #ef4444', bgcolor: 'rgba(239, 68, 68, 0.1)', boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1 }}>
                                <Typography variant="caption" sx={{ color: '#fff', bgcolor: '#ef4444', px: 1, borderRadius: 0.5 }}>เลข 13 หลัก</Typography>
                            </Box>
                        </Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ height: 120, px: 4, bgcolor: '#000', zIndex: 20 }}>
                            <IconButton onClick={() => setIsCameraOpen(false)} sx={{ color: '#fff' }}><CloseIcon /></IconButton>
                            <IconButton onClick={capturePhoto} sx={{ p: 0 }}><Box sx={{ width: 72, height: 72, borderRadius: '50%', border: '4px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', '&:active': { transform: 'scale(0.95)' } }}><Box sx={{ width: 60, height: 60, bgcolor: '#fff', borderRadius: '50%' }} /></Box></IconButton>
                            <IconButton onClick={switchCamera} sx={{ color: '#fff' }}><FlipCameraIcon /></IconButton>
                        </Stack>
                    </Box>
                ) : imagePreview ? (
                    <Box sx={{ flex: 1, bgcolor: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3 }}>
                        <Box sx={{ position: 'relative', width: '100%', maxWidth: 400, borderRadius: 3, overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                            <img src={imagePreview} alt="Preview" style={{ width: '100%', display: 'block' }} />
                            {processing && (
                                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <CircularProgress size={40} thickness={4} sx={{ color: '#fff' }} />
                                    <Typography sx={{ mt: 2, color: '#fff', fontWeight: 600 }}>กำลังอ่านตัวเลข...</Typography>
                                </Box>
                            )}
                            {successMsg && !processing && (
                                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(22, 163, 74, 0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3, textAlign: 'center' }}>
                                    <VerifiedIcon sx={{ fontSize: 60, color: '#fff', mb: 2 }} /><Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '1.1rem' }}>{successMsg}</Typography>
                                </Box>
                            )}
                        </Box>
                        {error && <Fade in><Alert severity="error" sx={{ mt: 3, width: '100%', maxWidth: 400 }}>{error}</Alert></Fade>}
                        {!processing && !successMsg && <Button onClick={() => setImagePreview(null)} variant="outlined" color="inherit" startIcon={<CloseIcon />} sx={{ mt: 3, bgcolor: '#fff' }}>ถ่ายใหม่</Button>}
                    </Box>
                ) : (
                    <Box sx={{ flex: 1, p: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Typography variant="body1" textAlign="center" color="text.secondary" mb={4}>เลือกวิธีนำเข้ารูปภาพบัตรประชาชน <br />ระบบจะตรวจสอบความถูกต้องอัตโนมัติ</Typography>
                        <Stack spacing={2}>
                            <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, '&:hover': { borderColor: '#3B82F6', boxShadow: '0 4px 12px rgba(59,130,246,0.1)' } }}><CardActionArea onClick={startCamera} sx={{ p: 2 }}><Stack direction="row" alignItems="center" spacing={2}><Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: '#EFF6FF', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CameraIcon fontSize="large" /></Box><Box><Typography variant="subtitle1" fontWeight="bold">ถ่ายรูปบัตร</Typography><Typography variant="body2" color="text.secondary">เปิดกล้องทันที</Typography></Box></Stack></CardActionArea></Card>
                            <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}><Typography variant="caption" sx={{ bgcolor: '#fff', px: 1, color: '#94A3B8', zIndex: 1 }}>หรือ</Typography><Box sx={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px dashed #E2E8F0', zIndex: 0 }} /></Box>
                            <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, '&:hover': { borderColor: '#3B82F6', boxShadow: '0 4px 12px rgba(59,130,246,0.1)' } }}><CardActionArea onClick={() => uploadInputRef.current?.click()} sx={{ p: 2 }}><Stack direction="row" alignItems="center" spacing={2}><Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: '#F1F5F9', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><GalleryIcon fontSize="large" /></Box><Box><Typography variant="subtitle1" fontWeight="bold">เลือกจากอัลบั้ม</Typography><Typography variant="body2" color="text.secondary">อัปโหลดไฟล์รูปภาพ</Typography></Box></Stack></CardActionArea></Card>
                        </Stack>
                        <input type="file" accept="image/*" hidden ref={uploadInputRef} onChange={handleFileChange} />
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}