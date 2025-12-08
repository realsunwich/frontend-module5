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
    VerifiedUserRounded as VerifiedIcon // ไอคอนยืนยันความถูกต้อง
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

    // --- 🧠 Logic: ตรวจสอบความถูกต้องของเลขบัตรไทย (Check Digit) ---
    const validateThaiID = (id: string): boolean => {
        if (!id || id.length !== 13 || !/^[0-9]+$/.test(id)) return false;

        let sum = 0;
        for (let i = 0; i < 12; i++) {
            sum += parseFloat(id.charAt(i)) * (13 - i);
        }

        const checkDigit = (11 - sum % 11) % 10;

        // เปรียบเทียบหลักสุดท้ายว่าตรงกับสูตรคำนวณไหม
        return checkDigit === parseFloat(id.charAt(12));
    };

    // --- Camera Functions ---
    const startCamera = async () => {
        setError(null);
        setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
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
            const previewUrl = canvas.toDataURL('image/jpeg');

            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], "camera-snap.jpg", { type: "image/jpeg" });
                    setImagePreview(previewUrl);
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
            const imageUrl = URL.createObjectURL(file);
            setImagePreview(imageUrl);
            processImage(file);
        }
        e.target.value = '';
    };

    const preprocessImage = (imageFile: File): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = URL.createObjectURL(imageFile);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) { resolve(img.src); return; }

                const cropX = img.width * 0.35;
                const cropY = 0;
                const cropWidth = img.width * 0.60;
                const cropHeight = img.height * 0.25;

                const scaleFactor = 2.5;
                canvas.width = cropWidth * scaleFactor;
                canvas.height = cropHeight * scaleFactor;

                ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                const len = data.length;

                // Adaptive Threshold Logic
                let totalBrightness = 0;
                for (let i = 0; i < len; i += 4) {
                    const brightness = (0.299 * data[i]) + (0.587 * data[i + 1]) + (0.114 * data[i + 2]);
                    totalBrightness += brightness;
                }
                const avgBrightness = totalBrightness / (len / 4);
                const dynamicThreshold = avgBrightness * 0.85;

                for (let i = 0; i < len; i += 4) {
                    const gray = (0.299 * data[i]) + (0.587 * data[i + 1]) + (0.114 * data[i + 2]);
                    const val = gray < dynamicThreshold ? 0 : 255;
                    data[i] = val;
                    data[i + 1] = val;
                    data[i + 2] = val;
                }

                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL('image/jpeg'));
            };
        });
    };

    // --- Main Processing ---
    const processImage = async (imageFile: File) => {
        setProcessing(true);
        setError(null);
        setSuccessMsg(null);

        try {
            const processedImageUrl = await preprocessImage(imageFile);

            const { data: { text } } = await Tesseract.recognize(
                processedImageUrl,
                'eng',
                {
                    // @ts-ignore
                    tessedit_char_whitelist: '0123456789 ',
                    tessedit_pageseg_mode: '7'
                }
            );

            console.log("Raw Text:", text);
            const cleanText = text.replace(/[^0-9]/g, '');

            // 🧠 Smart Logic: หาตัวเลข 13 หลัก และเช็ค Checksum
            // AI อาจอ่านเกินมา (เช่น 14 ตัว) เราจะลองตัดดูว่าชุดไหนถูกต้อง
            let validID = null;

            // วิธีที่ 1: หา 13 หลักเป๊ะๆ
            const exactMatches = cleanText.matchAll(/(\d{13})/g);
            for (const match of exactMatches) {
                if (validateThaiID(match[0])) {
                    validID = match[0];
                    break;
                }
            }

            // วิธีที่ 2: ถ้าไม่เจอ ลองตัดหัวตัดท้าย (เผื่อ AI อ่านจุดรบกวนมาเป็นเลข)
            if (!validID && cleanText.length > 13) {
                // ลองตัดตัวแรกออก
                const sub1 = cleanText.substring(1, 14);
                if (validateThaiID(sub1)) validID = sub1;

                // ลองตัดตัวท้ายออก (ถ้ามันยาว 14)
                if (!validID) {
                    const sub2 = cleanText.substring(0, 13);
                    if (validateThaiID(sub2)) validID = sub2;
                }
            }

            if (validID) {
                setSuccessMsg(`ตรวจสอบแล้ว: ถูกต้องตามหลักเลขบัตรฯ (${validID})`);
                // หน่วงเวลานิดนึงให้เห็นข้อความ Success
                setTimeout(() => {
                    onScanComplete(validID as string);
                    handleClose();
                }, 1000);
            } else {
                // ถ้าอ่านได้ 13 ตัวแต่ Checksum ผิด
                if (cleanText.length === 13) {
                    setError(`อ่านได้ ${cleanText} แต่ไม่ผ่านการตรวจสอบ (เลขผิด) กรุณาถ่ายใหม่ให้ชัดเจน`);
                } else {
                    setError(`อ่านได้ไม่ชัดเจน (${cleanText}) กรุณาถ่ายใหม่ให้ตัวเลขอยู่ในกรอบ`);
                }
            }

        } catch (err) {
            setError('เกิดข้อผิดพลาดในการประมวลผล');
        } finally {
            setProcessing(false);
        }
    };

    const handleClose = () => {
        stopCamera();
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    overflow: 'hidden',
                    bgcolor: isCameraOpen ? '#000' : '#fff',
                    transition: 'background-color 0.3s ease'
                }
            }}
        >
            {!isCameraOpen && (
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 2.5, borderBottom: '1px solid #F1F5F9' }}>
                    <Box>
                        <Typography variant="h6" fontWeight="800" color="#1E293B">สแกนบัตรประชาชน</Typography>
                        <Typography variant="body2" color="#64748B">AI Validation Enabled</Typography>
                    </Box>
                    <IconButton onClick={handleClose} sx={{ color: '#94A3B8', bgcolor: '#F8FAFC', '&:hover': { bgcolor: '#F1F5F9' } }}>
                        <CloseIcon />
                    </IconButton>
                </Stack>
            )}

            <DialogContent sx={{ p: 0, minHeight: 400, display: 'flex', flexDirection: 'column' }}>
                {isCameraOpen ? (
                    <Box sx={{ position: 'relative', flex: 1, bgcolor: '#000', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
                            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <Box sx={{
                                position: 'absolute', top: '5%', right: '5%', width: '65%', height: '22%',
                                border: '2px dashed #ef4444',
                                bgcolor: 'rgba(239, 68, 68, 0.1)',
                                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
                                zIndex: 10,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderRadius: 1
                            }}>
                                <Typography variant="caption" sx={{ color: '#fff', bgcolor: '#ef4444', px: 1, borderRadius: 0.5 }}>
                                    เลข 13 หลัก
                                </Typography>
                            </Box>
                        </Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ height: 120, px: 4, bgcolor: '#000', zIndex: 20 }}>
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
                    <Box sx={{ flex: 1, bgcolor: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3 }}>
                        <Box sx={{ position: 'relative', width: '100%', maxWidth: 400, borderRadius: 3, overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                            <img src={imagePreview} alt="Preview" style={{ width: '100%', display: 'block' }} />

                            {/* Loading State */}
                            {processing && (
                                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <CircularProgress size={40} thickness={4} sx={{ color: '#fff' }} />
                                    <Typography sx={{ mt: 2, color: '#fff', fontWeight: 600 }}>กำลังอ่านและตรวจสอบ...</Typography>
                                </Box>
                            )}

                            {/* Success State */}
                            {successMsg && !processing && (
                                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(22, 163, 74, 0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3, textAlign: 'center' }}>
                                    <VerifiedIcon sx={{ fontSize: 60, color: '#fff', mb: 2 }} />
                                    <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '1.1rem' }}>{successMsg}</Typography>
                                </Box>
                            )}
                        </Box>

                        {error && (
                            <Fade in><Alert severity="error" sx={{ mt: 3, width: '100%', maxWidth: 400 }}>{error}</Alert></Fade>
                        )}
                        {!processing && !successMsg && (
                            <Button onClick={() => setImagePreview(null)} variant="outlined" color="inherit" startIcon={<CloseIcon />} sx={{ mt: 3, bgcolor: '#fff' }}>ถ่ายใหม่</Button>
                        )}
                    </Box>
                ) : (
                    <Box sx={{ flex: 1, p: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Typography variant="body1" textAlign="center" color="text.secondary" mb={4}>
                            เลือกวิธีนำเข้ารูปภาพบัตรประชาชน <br />ระบบจะตรวจสอบความถูกต้องอัตโนมัติ
                        </Typography>
                        <Stack spacing={2}>
                            <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, '&:hover': { borderColor: '#3B82F6', boxShadow: '0 4px 12px rgba(59,130,246,0.1)' } }}>
                                <CardActionArea onClick={startCamera} sx={{ p: 2 }}>
                                    <Stack direction="row" alignItems="center" spacing={2}>
                                        <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: '#EFF6FF', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CameraIcon fontSize="large" /></Box>
                                        <Box><Typography variant="subtitle1" fontWeight="bold">ถ่ายรูปบัตร</Typography><Typography variant="body2" color="text.secondary">เปิดกล้องทันที</Typography></Box>
                                    </Stack>
                                </CardActionArea>
                            </Card>
                            <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}><Typography variant="caption" sx={{ bgcolor: '#fff', px: 1, color: '#94A3B8', zIndex: 1 }}>หรือ</Typography><Box sx={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px dashed #E2E8F0', zIndex: 0 }} /></Box>
                            <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, '&:hover': { borderColor: '#3B82F6', boxShadow: '0 4px 12px rgba(59,130,246,0.1)' } }}>
                                <CardActionArea onClick={() => uploadInputRef.current?.click()} sx={{ p: 2 }}>
                                    <Stack direction="row" alignItems="center" spacing={2}>
                                        <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: '#F1F5F9', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><GalleryIcon fontSize="large" /></Box>
                                        <Box><Typography variant="subtitle1" fontWeight="bold">เลือกจากอัลบั้ม</Typography><Typography variant="body2" color="text.secondary">อัปโหลดไฟล์รูปภาพ</Typography></Box>
                                    </Stack>
                                </CardActionArea>
                            </Card>
                        </Stack>
                        <input type="file" accept="image/*" hidden ref={uploadInputRef} onChange={handleFileChange} />
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}