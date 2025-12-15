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
    PhotoLibrary as GalleryIcon,
    Badge as BadgeIcon,
    CreditCard as CardIcon
} from '@mui/icons-material';
import Tesseract from 'tesseract.js';

// --- Interface ---
export interface ScannedData {
    id: string | null;
    firstName: string | null;
    lastName: string | null;
    firstname_en?: string;
    middlename_en?: string;
    lastname_en?: string;
    birthdate?: string | Date;
    laserId?: string;
}

interface ThaiIDScannerProps {
    open: boolean;
    onClose: () => void;
    onScanComplete: (data: ScannedData) => void;
}

export default function ThaiIDScanner({ open, onClose, onScanComplete }: ThaiIDScannerProps) {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [scannedData, setScannedData] = useState<ScannedData | null>(null);
    const [backCardData, setBackCardData] = useState<{ laserId: string | null }>({ laserId: null });
    const [scanSide, setScanSide] = useState<'front' | 'back'>('front');
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
        setBackCardData({ laserId: null });
        setProcessing(false);
        setStatusText('');
        setScanSide('front');
    };

    // --- Validation Helper ---
    const validateThaiID = (id: string): boolean => {
        if (!id || id.length !== 13 || !/^[0-9]+$/.test(id)) return false;

        // เลขบัตรประชาชนไทยห้ามขึ้นต้นด้วย 0
        if (id.charAt(0) === '0') return false;

        // ตรวจสอบ checksum
        let sum = 0;
        for (let i = 0; i < 12; i++) sum += parseFloat(id.charAt(i)) * (13 - i);
        const checkDigit = (11 - sum % 11) % 10;
        return checkDigit === parseFloat(id.charAt(12));
    };

    const validateLaserID = (id: string): boolean => {
        // ตัดขีดออกให้หมดก่อนตรวจ
        const cleanId = id.replace(/-/g, '').replace(/\s/g, '');

        // Pattern: อักษรภาษาอังกฤษ 2-3 ตัว + ตัวเลข 5-12 ตัว (รวม 7-15 ตัวอักษร)
        // รองรับรหัสที่ไม่สมบูรณ์ (อาจขาดส่วนท้าย 2-4 หลัก)
        // เช่น:
        // - JT0075163 (9 ตัว - ขาดส่วนท้าย)
        // - JT007516 (8 ตัว - ขาดมากกว่า)
        // - JT00751631237 (12 ตัว - สมบูรณ์)
        // - ME2135080323 (13 ตัว - สมบูรณ์, ME + 2 + 1350803 + 23)
        const regex = /^[A-Z]{2,3}[0-9]{5,12}$/;

        const isValid = regex.test(cleanId);
        console.log(`  🔍 validateLaserID: "${id}" -> cleaned: "${cleanId}" (${cleanId.length}) -> match: ${isValid}`);
        return isValid;
    };

    // ฟังก์ชันจัดรูปแบบให้สวยงาม
    const formatLaserID = (id: string): string => {
        const clean = id.replace(/[^A-Z0-9]/g, '');

        console.log(`  🎨 formatLaserID: "${id}" -> cleaned: "${clean}" (length: ${clean.length})`);

        // ตรวจสอบว่าขึ้นต้นด้วยกี่ตัวอักษร (รวมถึงกรณีที่มีตัวเลขต่อท้าย เช่น ME2, JT0)
        const prefixMatch = clean.match(/^[A-Z]{2,3}\d?/);
        const prefix = prefixMatch ? prefixMatch[0] : '';
        const prefixLength = prefix.length;

        console.log(`  📝 Prefix: "${prefix}" (length: ${prefixLength})`);

        // ตรวจสอบว่าขึ้นต้นด้วย 2 หรือ 3 ตัวอักษร (ไม่รวมตัวเลข)
        const letterCount = clean.match(/^[A-Z]+/)?.[0]?.length || 0;

        // กรณีพิเศษ: ถ้ามี prefix ยาว (เช่น JT0, ME2) ให้ใช้ prefix นั้น
        if (prefixLength >= 3 && prefixLength <= 4) {
            const remaining = clean.substring(prefixLength);

            // รูปแบบ XXX-#######-## หรือ XX#-#######-## (12-13 ตัว)
            if (clean.length === 12 || clean.length === 13) {
                const middleEnd = remaining.length - 2;
                return `${prefix}-${remaining.substring(0, middleEnd)}-${remaining.substring(middleEnd)}`;
            }
            // รูปแบบ XXX-####### หรือ XX#-####### (10-11 ตัว - ขาดส่วนท้าย)
            else if (clean.length >= 10 && clean.length <= 11) {
                return `${prefix}-${remaining}`;
            }
            // รูปแบบ XXX-###### (9 ตัว - ขาดส่วนท้าย)
            else if (clean.length === 9) {
                return `${prefix}-${remaining}`;
            }
            // รูปแบบ XXX-##### (8 ตัว - ขาดส่วนท้ายมาก)
            else if (clean.length === 8) {
                return `${prefix}-${remaining}`;
            }
            // รูปแบบ XXX-#### (7 ตัว - ขาดส่วนท้ายมากที่สุด)
            else if (clean.length === 7) {
                return `${prefix}-${remaining}`;
            }
        }
        // กรณีปกติ: ตัวอักษร 2-3 ตัวล้วนๆ (ไม่มีตัวเลขปน)
        else if (letterCount === 3) {
            // รูปแบบ XXX-#######-## (12 ตัว) เช่น JT0-0751631-37
            if (clean.length === 12) {
                return `${clean.substring(0, 3)}-${clean.substring(3, 10)}-${clean.substring(10, 12)}`;
            }
            // รูปแบบ XXX-########-## (13 ตัว)
            else if (clean.length === 13) {
                return `${clean.substring(0, 3)}-${clean.substring(3, 11)}-${clean.substring(11, 13)}`;
            }
            // รูปแบบ XXX-####### (10 ตัว - ขาดส่วนท้าย) เช่น JT0-0751631
            else if (clean.length === 10) {
                return `${clean.substring(0, 3)}-${clean.substring(3, 10)}`;
            }
            // รูปแบบ XXX-###### (9 ตัว - ขาดส่วนท้าย) เช่น JT0-075163
            else if (clean.length === 9) {
                return `${clean.substring(0, 3)}-${clean.substring(3, 9)}`;
            }
            // รูปแบบ XXX-##### (8 ตัว - ขาดส่วนท้ายมาก) เช่น JT0-07516
            else if (clean.length === 8) {
                return `${clean.substring(0, 3)}-${clean.substring(3, 8)}`;
            }
            // รูปแบบ XXX-#### (7 ตัว - ขาดส่วนท้ายมากที่สุด) เช่น JT0-0751
            else if (clean.length === 7) {
                return `${clean.substring(0, 3)}-${clean.substring(3, 7)}`;
            }
        } else if (letterCount === 2) {
            // รูปแบบ XX-##########-## (12 ตัว) เช่น ME-21350803-23
            if (clean.length === 12) {
                return `${clean.substring(0, 2)}-${clean.substring(2, 10)}-${clean.substring(10, 12)}`;
            }
            // รูปแบบ XX-#########-## (11 ตัว) เช่น ME-1350803-23
            else if (clean.length === 11) {
                return `${clean.substring(0, 2)}-${clean.substring(2, 9)}-${clean.substring(9, 11)}`;
            }
            // รูปแบบ XX-########-## (10 ตัว)
            else if (clean.length === 10) {
                return `${clean.substring(0, 2)}-${clean.substring(2, 8)}-${clean.substring(8, 10)}`;
            }
            // รูปแบบ XX-####### (9 ตัว - ขาดส่วนท้าย)
            else if (clean.length === 9) {
                return `${clean.substring(0, 2)}-${clean.substring(2, 9)}`;
            }
            // รูปแบบ XX-###### (8 ตัว - ขาดส่วนท้าย)
            else if (clean.length === 8) {
                return `${clean.substring(0, 2)}-${clean.substring(2, 8)}`;
            }
            // รูปแบบ XX-##### (7 ตัว - ขาดส่วนท้ายมาก)
            else if (clean.length === 7) {
                return `${clean.substring(0, 2)}-${clean.substring(2, 7)}`;
            }
        }

        return clean;
    };

    // 🎯 ประเมินความน่าเชื่อถือของเลขบัตร (0-100)
    const getIDLikelihoodScore = (id: string): number => {
        if (id.length !== 13) return 0;

        let score = 50;
        let maxRepeat = 1;
        let currentRepeat = 1;
        for (let i = 1; i < id.length; i++) {
            if (id[i] === id[i - 1]) {
                currentRepeat++;
                maxRepeat = Math.max(maxRepeat, currentRepeat);
            } else {
                currentRepeat = 1;
            }
        }
        if (maxRepeat >= 5) score -= 40;
        else if (maxRepeat >= 4) score -= 25;
        else if (maxRepeat >= 3) score -= 10;

        const uniqueDigits = new Set(id.split('')).size;
        if (uniqueDigits >= 8) score += 20;
        else if (uniqueDigits <= 4) score -= 30;

        let sequential = 0;
        for (let i = 1; i < id.length; i++) {
            const diff = parseInt(id[i]) - parseInt(id[i - 1]);
            if (Math.abs(diff) === 1) sequential++;
        }
        if (sequential >= 8) score -= 35;

        const provinceCode = parseInt(id.substring(1, 3));
        if (provinceCode >= 10 && provinceCode <= 99) score += 15;

        return Math.max(0, Math.min(100, score));
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
                    const file = new File([blob], "snap.jpg", { type: "image/jpeg" });
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

    // --- 🛠️ Image Processing ---
    const cropAndEnhance = (
        sourceCanvas: HTMLCanvasElement,
        roi: { x: number, y: number, w: number, h: number },
        mode: 'text' | 'number' | 'date' | 'laser'
    ): string => {
        const x = sourceCanvas.width * roi.x;
        const y = sourceCanvas.height * roi.y;
        const w = sourceCanvas.width * roi.w;
        const h = sourceCanvas.height * roi.h;

        const roiCanvas = document.createElement('canvas');
        // Scale: 5x สำหรับเลขบัตร, 3x สำหรับ laser (ลดลง เพราะพื้นที่ใหญ่ขึ้น), 4x สำหรับส่วนอื่น
        const scale = mode === 'number' ? 5.0 : mode === 'laser' ? 3.0 : 4.0;
        roiCanvas.width = w * scale;
        roiCanvas.height = h * scale;
        const ctx = roiCanvas.getContext('2d');

        if (!ctx) return '';

        // Fill white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, roiCanvas.width, roiCanvas.height);

        // Draw cropped image
        ctx.drawImage(sourceCanvas, x, y, w, h, 0, 0, roiCanvas.width, roiCanvas.height);

        // ⚡ สำหรับ laser: ใช้ preprocessing แบบเบาๆ เท่านั้น
        if (mode === 'laser') {
            const imageData = ctx.getImageData(0, 0, roiCanvas.width, roiCanvas.height);
            const data = imageData.data;

            // แค่ทำ simple grayscale และ brightness/contrast adjustment
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                // Grayscale
                let gray = 0.299 * r + 0.587 * g + 0.114 * b;

                // เพิ่ม contrast เล็กน้อย
                gray = ((gray - 128) * 1.3) + 128;
                gray = Math.max(0, Math.min(255, gray));

                data[i] = gray;
                data[i + 1] = gray;
                data[i + 2] = gray;
            }

            ctx.putImageData(imageData, 0, 0);
            return roiCanvas.toDataURL('image/jpeg', 1.0);
        }

        // --- Pixel Manipulation ---
        const imageData = ctx.getImageData(0, 0, roiCanvas.width, roiCanvas.height);
        const data = imageData.data;

        // 1. Sharpening Filter (สำหรับ number เท่านั้น)
        if (mode === 'number') {
            const tempData = new Uint8ClampedArray(data);
            const width = roiCanvas.width;
            const height = roiCanvas.height;

            // Kernel สำหรับ Sharpen
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    const i = (y * width + x) * 4;

                    // ใช้ 3x3 Sharpen Kernel
                    const sharpen =
                        tempData[i] * 5 -
                        tempData[i - 4] -
                        tempData[i + 4] -
                        tempData[i - width * 4] -
                        tempData[i + width * 4];

                    data[i] = data[i + 1] = data[i + 2] = Math.max(0, Math.min(255, sharpen));
                }
            }
        }

        // 2. Contrast Stretching (หาจุดมืดสุดและสว่างสุด)
        let min = 255, max = 0;
        for (let i = 0; i < data.length; i += 4) {
            // ใช้ Red Channel เพราะตัดสีฟ้าของบัตรได้ดีที่สุด
            const r = data[i];
            if (r < min) min = r;
            if (r > max) max = r;
        }

        // 3. Adaptive Thresholding - ปรับ ratio ตาม mode
        // สำหรับเลขบัตร: ใช้ Otsu's method แบบง่าย (หาค่า threshold ที่ดีที่สุดอัตโนมัติ)
        let threshold: number;
        if (mode === 'number') {
            // คำนวณ histogram
            const histogram = new Array(256).fill(0);
            for (let i = 0; i < data.length; i += 4) {
                histogram[data[i]]++;
            }

            // Otsu's method - หาค่า threshold ที่แบ่ง foreground/background ได้ดีที่สุด
            const total = roiCanvas.width * roiCanvas.height;
            let sum = 0;
            for (let i = 0; i < 256; i++) sum += i * histogram[i];

            let sumB = 0;
            let wB = 0;
            let wF = 0;
            let maxVariance = 0;
            threshold = 0;

            for (let t = 0; t < 256; t++) {
                wB += histogram[t];
                if (wB === 0) continue;

                wF = total - wB;
                if (wF === 0) break;

                sumB += t * histogram[t];
                const mB = sumB / wB;
                const mF = (sum - sumB) / wF;
                const variance = wB * wF * (mB - mF) * (mB - mF);

                if (variance > maxVariance) {
                    maxVariance = variance;
                    threshold = t;
                }
            }
        } else {
            const thresholdRatio = 0.55;
            threshold = min + (max - min) * thresholdRatio;
        }

        for (let i = 0; i < data.length; i += 4) {
            let r = data[i];

            // Normalize
            let norm = (r - min) * (255 / (max - min));

            // Apply Gamma Correction (สำหรับ number)
            if (mode === 'number') {
                norm = Math.pow(norm / 255, 0.85) * 255;
            }

            // Binarize (ขาว-ดำ)
            const val = norm < threshold ? 0 : 255;

            data[i] = val;     // R
            data[i + 1] = val; // G
            data[i + 2] = val; // B
        }

        ctx.putImageData(imageData, 0, 0);

        return roiCanvas.toDataURL('image/jpeg', 1.0);
    };

    // --- 🧠 Intelligent Parsing Logic ---
    const correctDigits = (text: string): string => {
        return text
            .replace(/O/g, '0')      // O → 0
            .replace(/o/g, '0')      // o → 0
            .replace(/I/g, '1')      // I → 1
            .replace(/l/g, '1')      // l → 1
            .replace(/S/g, '5')      // S → 5
            .replace(/s/g, '5')      // s → 5
            .replace(/Z/g, '2')      // Z → 2
            .replace(/B/g, '8')      // B → 8
            .replace(/G/g, '6')      // G → 6
            .replace(/D/g, '0');     // D → 0
    };

    // 🧠 Smart Auto-Correct: แก้ตัวเลข 1 ตัวให้ Checksum ผ่าน
    const tryAutoCorrectID = (id: string): string | null => {
        if (id.length !== 13 || !/^[0-9]+$/.test(id)) return null;
        const confusablePairs = [
            ['0', '8'], ['8', '0'], // 0 กับ 8 มักสลับกัน
            ['0', '6'], ['6', '0'], // 0 กับ 6
            ['5', '8'], ['8', '5'], // 5 กับ 8
            ['1', '7'], ['7', '1'], // 1 กับ 7
            ['3', '8'], ['8', '3'], // 3 กับ 8
            ['2', '7'], ['7', '2'], // 2 กับ 7
            ['5', '6'], ['6', '5'], // 5 กับ 6
            ['9', '4'], ['4', '9'], // 9 กับ 4
        ];

        for (let i = 0; i < 13; i++) {
            const currentChar = id[i];
            for (const [from, to] of confusablePairs) {
                if (currentChar === from) {
                    const testID = id.substring(0, i) + to + id.substring(i + 1);
                    if (validateThaiID(testID)) {
                        return testID;
                    }
                }
            }
        }

        return null;
    };

    const normalizeMonth = (raw: string): string => {
        const text = raw.toLowerCase().replace(/[^a-z]/g, '');
        const monthMap: Record<string, string> = {
            'jan': 'Jan', 'ian': 'Jan', 'jon': 'Jan',
            'feb': 'Feb', 'fob': 'Feb',
            'mar': 'Mar', 'mer': 'Mar', 'har': 'Mar',
            'apr': 'Apr', 'api': 'Apr',
            'may': 'May', 'nay': 'May',
            'jun': 'Jun', 'lun': 'Jun', 'jnn': 'Jun',
            'jul': 'Jul', 'jui': 'Jul', 'lul': 'Jul',
            'aug': 'Aug', 'auq': 'Aug', 'qug': 'Aug',
            'sep': 'Sep', 'sap': 'Sep',
            'oct': 'Oct', 'oci': 'Oct', '0ct': 'Oct',
            'nov': 'Nov', 'hov': 'Nov', 'noy': 'Nov',
            'dec': 'Dec', 'doc': 'Dec', 'dac': 'Dec'
        };
        const found = Object.keys(monthMap).find(k => text.startsWith(k.substring(0, 3)));
        return found ? monthMap[found] : text;
    };

    // อ่านพื้นที่ใหญ่ๆ แล้วแยกข้อมูลตาม label
    const scanLargeArea = async (
        canvas: HTMLCanvasElement,
        area: { x: number, y: number, w: number, h: number }
    ): Promise<string> => {
        const areaImg = cropAndEnhance(canvas, area, 'text');
        const result = await Tesseract.recognize(areaImg, 'eng', {
            // @ts-ignore
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .:-'
        });
        return result.data.text;
    };

    // --- Process Back of ID Card (Laser Code) ---
    const processBackCard = async (imageFile: File) => {
        setProcessing(true);
        setStatusText('กำลังอ่านรหัสหลังบัตร...');
        setError(null);
        setBackCardData({ laserId: null });

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

            setStatusText('กำลังอ่าน Laser Code...');

            // สแกนหลายพื้นที่เพื่อหา Laser Code (เน้นพื้นที่กว้าง เพื่อไม่ให้ภาพเล็กเกินไป)
            const laserScanConfigs = [
                // ⭐ Priority 1: ตำแหน่ง Laser Code โดยตรง (ตรงกลางล่างของบัตร)
                { area: { x: 0.15, y: 0.48, w: 0.70, h: 0.12 }, psm: 7, name: 'Laser-Direct' },
                { area: { x: 0.10, y: 0.45, w: 0.80, h: 0.15 }, psm: 6, name: 'Laser-Wide' },

                // ⭐ Priority 2: สแกนทั้งส่วนล่างของบัตร (กว้างๆ)
                { area: { x: 0.0, y: 0.35, w: 1.0, h: 0.30 }, psm: 6, name: 'Full-Lower-Half' },
                { area: { x: 0.05, y: 0.40, w: 0.90, h: 0.25 }, psm: 6, name: 'Wide-Center' },

                // ⭐ Priority 3: ตำแหน่งกลางบัตร
                { area: { x: 0.10, y: 0.42, w: 0.80, h: 0.20 }, psm: 7, name: 'Center-Block' },
                { area: { x: 0.12, y: 0.45, w: 0.76, h: 0.15 }, psm: 13, name: 'Center-Raw' },

                // ⭐ Priority 4: Sparse text mode (ดีสำหรับ laser code ที่จาง)
                { area: { x: 0.0, y: 0.30, w: 1.0, h: 0.40 }, psm: 11, name: 'Full-Sparse' },
                { area: { x: 0.08, y: 0.38, w: 0.84, h: 0.24 }, psm: 11, name: 'Wide-Sparse' },

                // ⭐ Priority 5: Auto mode (fallback)
                { area: { x: 0.0, y: 0.25, w: 1.0, h: 0.50 }, psm: 3, name: 'Full-Auto' },
            ];

            let bestLaserId = '';
            let bestScore = 0;

            for (let idx = 0; idx < laserScanConfigs.length; idx++) {
                const config = laserScanConfigs[idx];
                setStatusText(`กำลังอ่าน Laser Code... (${idx + 1}/${laserScanConfigs.length})`);

                const laserImg = cropAndEnhance(mainCanvas, config.area, 'laser');

                const result = await Tesseract.recognize(laserImg, 'eng', {
                    // @ts-ignore
                    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-= ',
                    tessedit_pageseg_mode: config.psm
                });

                let text = result.data.text.replace(/\n/g, ' ').trim();

                text = text.replace(/—/g, '-').replace(/–/g, '-').replace(/‐/g, '-').replace(/=/g, '-');

                text = text.replace(/JTO/g, 'JT0');

                console.log(`[${config.name}] Laser scan: "${text}" (conf: ${result.data.confidence?.toFixed(1)}%)`);

                const laserPatternWithDash = /([A-Z]{2,3}\d?)\s*-\s*(\d{4,10})(?:\s*-\s*(\d{2,3}))?/g;
                let match;

                while ((match = laserPatternWithDash.exec(text)) !== null) {
                    const candidate = `${match[1]}${match[2]}${match[3] || ''}`.replace(/\s/g, '');
                    console.log(`  📍 Found candidate (with dash): ${candidate} (from: "${match[0]}")`);
                    console.log(`    Parts: [${match[1]}] [${match[2]}] [${match[3] || 'missing'}]`);

                    if (validateLaserID(candidate)) {
                        const formatted = formatLaserID(candidate);
                        let score = (result.data.confidence || 0) + 100; // เพิ่มคะแนนถ้า validate ผ่าน

                        // เพิ่มคะแนนถ้าใช้ PSM ที่เหมาะสม
                        if (config.psm === 7) score += 30; // Single line mode ดีที่สุดสำหรับ Laser Code
                        if (config.psm === 6) score += 15;

                        // เพิ่มคะแนนถ้าความยาวใกล้เคียงกับรูปแบบมาตรฐาน
                        if (candidate.length >= 11) score += 20; // รหัสเกือบครบ
                        else if (candidate.length >= 9) score += 10; // รหัสพอใช้ได้

                        if (score > bestScore) {
                            bestLaserId = formatted;
                            bestScore = score;
                            console.log(`  ✓ Valid Laser ID: ${formatted} (score: ${score.toFixed(1)})`);
                        }
                    }
                }

                // Pattern 2: รูปแบบที่ไม่มีขีด หรือมี = แทน - เช่น JT0=075163 หรือ ME2=1350803
                const laserPatternNoDash = /([A-Z]{2,3}\d?)\s*[=]?\s*(\d{4,10})(?:\s*[=\-]?\s*(\d{2,3}))?/g;

                while ((match = laserPatternNoDash.exec(text)) !== null) {
                    // รวมทุก group (group 3 อาจเป็น undefined)
                    const candidate = `${match[1]}${match[2]}${match[3] || ''}`.replace(/\s/g, '');
                    console.log(`  📍 Found candidate (no dash): ${candidate} (from: "${match[0]}")`);
                    console.log(`    Parts: [${match[1]}] [${match[2]}] [${match[3] || 'missing'}]`);

                    if (validateLaserID(candidate)) {
                        const formatted = formatLaserID(candidate);
                        let score = (result.data.confidence || 0) + 100; // เพิ่มคะแนนถ้า validate ผ่าน

                        // เพิ่มคะแนนถ้าใช้ PSM ที่เหมาะสม
                        if (config.psm === 7) score += 30; // Single line mode ดีที่สุดสำหรับ Laser Code
                        if (config.psm === 6) score += 15;

                        // เพิ่มคะแนนถ้าความยาวใกล้เคียงกับรูปแบบมาตรฐาน
                        if (candidate.length >= 11) score += 20; // รหัสเกือบครบ
                        else if (candidate.length >= 9) score += 10; // รหัสพอใช้ได้

                        if (score > bestScore) {
                            bestLaserId = formatted;
                            bestScore = score;
                            console.log(`  ✓ Valid Laser ID: ${formatted} (score: ${score.toFixed(1)})`);
                        }
                    }
                }

                const rawPattern = /[A-Z]{2,3}\d{6,12}/g;
                const rawMatches = text.match(rawPattern);

                if (rawMatches) {
                    console.log(`  🔎 Raw pattern matches: [${rawMatches.join(', ')}]`);
                }

                if (rawMatches) {
                    for (const raw of rawMatches) {
                        if (validateLaserID(raw)) {
                            const formatted = formatLaserID(raw);
                            let score = (result.data.confidence || 0) + 100;

                            if (config.psm === 7) score += 30;
                            if (config.psm === 6) score += 15;

                            // เพิ่มคะแนนถ้าความยาวใกล้เคียงกับรูปแบบมาตรฐาน
                            if (raw.length >= 11) score += 20; // รหัสเกือบครบ
                            else if (raw.length >= 9) score += 10; // รหัสพอใช้ได้

                            if (score > bestScore) {
                                bestLaserId = formatted;
                                bestScore = score;
                                console.log(`  ✓ Valid Laser ID (raw): ${formatted} (score: ${score.toFixed(1)})`);
                            }
                        }
                    }
                }
            }

            console.log(`🏆 Final Laser ID: "${bestLaserId}"`);

            if (bestLaserId) {
                setBackCardData({ laserId: bestLaserId });
            } else {
                setError('ไม่พบรหัสหลังบัตร กรุณาถ่ายภาพใหม่ให้ชัดเจน');
            }

        } catch (err) {
            console.error(err);
            setError('เกิดข้อผิดพลาดในการประมวลผลภาพ');
        } finally {
            setProcessing(false);
            setStatusText('');
        }
    };

    // --- Main Processor ---
    const processImage = async (imageFile: File) => {
        // ตรวจสอบว่าเป็นหน้าไหนของบัตร
        if (scanSide === 'back') {
            return processBackCard(imageFile);
        }

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

            // --- 1. สแกนเลขบัตร (Modern AI Approach) ---
            setStatusText('กำลังอ่านเลขบัตร...');

            // Strategy: สแกนหลายพื้นที่ด้วย configs ต่างกัน แล้วหาเลข 13 หลักที่ดีที่สุด
            const scanConfigs = [
                // ⭐ Priority 1: ตำแหน่งเลขบัตรมาตรฐาน (ใต้ Identification Number)
                { area: { x: 0.24, y: 0.055, w: 0.72, h: 0.075 }, psm: 7, name: 'Standard-Line' },
                { area: { x: 0.24, y: 0.055, w: 0.72, h: 0.075 }, psm: 13, name: 'Standard-Raw' },

                // ⭐ Priority 2: พื้นที่กว้าง (รองรับบัตรเอียง/ไม่ตรง)
                { area: { x: 0.20, y: 0.04, w: 0.76, h: 0.10 }, psm: 6, name: 'Wide-Block' },
                { area: { x: 0.20, y: 0.04, w: 0.76, h: 0.10 }, psm: 7, name: 'Wide-Line' },

                // ⭐ Priority 3: Shifted positions (กรณีถ่ายไม่ตรงกลาง)
                { area: { x: 0.18, y: 0.05, w: 0.70, h: 0.085 }, psm: 7, name: 'Left-Shifted' },
                { area: { x: 0.28, y: 0.05, w: 0.70, h: 0.085 }, psm: 7, name: 'Right-Shifted' },

                // ⭐ Priority 4: Vertical variations (บัตรถ่ายใกล้/ไกล)
                { area: { x: 0.22, y: 0.03, w: 0.74, h: 0.09 }, psm: 7, name: 'Upper-Shifted' },
                { area: { x: 0.22, y: 0.07, w: 0.74, h: 0.09 }, psm: 7, name: 'Lower-Shifted' },

                // ⭐ Priority 5: Full scan (สำรอง)
                { area: { x: 0.0, y: 0.0, w: 1.0, h: 0.30 }, psm: 11, name: 'FullScan-Sparse' },
                { area: { x: 0.0, y: 0.0, w: 1.0, h: 0.30 }, psm: 3, name: 'FullScan-Auto' },
            ];

            let bestIdResult = '';
            let bestIdScore = 0;
            const allCandidates: Array<{ id: string; score: number; source: string }> = [];

            for (let idx = 0; idx < scanConfigs.length; idx++) {
                const config = scanConfigs[idx];
                setStatusText(`กำลังอ่านเลขบัตร... (${idx + 1}/${scanConfigs.length})`);

                const idImg = cropAndEnhance(mainCanvas, config.area, 'number');

                if (idx === 0) {
                    console.log(`🖼️ Processed Image Preview (${config.name}):`, idImg.substring(0, 100) + '...');
                }

                const idResult = await Tesseract.recognize(idImg, 'eng', {
                    // @ts-ignore - PSM modes: 3=auto, 6=uniform block, 7=single line, 11=sparse text
                    tessedit_pageseg_mode: config.psm,
                    tessedit_char_whitelist: '0123456789OoIlSsZBGD- '
                });

                let text = correctDigits(idResult.data.text);

                const textWithSpaces = text.replace(/[^0-9\s]/g, '');

                text = textWithSpaces.replace(/\s/g, '');

                const spacedPattern = /(\d)\s+(\d{4})\s+(\d{5})\s+(\d{2})\s+(\d)/;
                const spacedMatch = textWithSpaces.match(spacedPattern);
                if (spacedMatch) {
                    const reconstructed = spacedMatch[1] + spacedMatch[2] + spacedMatch[3] + spacedMatch[4] + spacedMatch[5];
                    console.log(`  📐 Found spaced ID: "${textWithSpaces}" → ${reconstructed}`);
                    if (reconstructed.length === 13) {
                        text = reconstructed;
                    }
                }

                console.log(`[${config.name}] Raw: "${text}" (conf: ${idResult.data.confidence?.toFixed(1)}%)`);

                for (let i = 0; i <= text.length - 13; i++) {
                    const candidate = text.substring(i, i + 13);
                    let finalCandidate = candidate;
                    let isValid = validateThaiID(candidate);
                    let wasAutoCorrected = false;

                    if (!isValid) {
                        const corrected = tryAutoCorrectID(candidate);
                        if (corrected) {
                            finalCandidate = corrected;
                            isValid = true;
                            wasAutoCorrected = true;
                        }
                    }

                    let score = idResult.data.confidence || 0;
                    if (isValid) score += 150;
                    if (wasAutoCorrected) score -= 30;

                    const likelihoodScore = getIDLikelihoodScore(finalCandidate);
                    score += likelihoodScore * 0.5;
                    const firstDigit = parseInt(finalCandidate.charAt(0));
                    if (firstDigit >= 1 && firstDigit <= 8) score += 40;

                    if (firstDigit === 9) score -= 20;

                    if (config.psm === 7) score += 20;
                    if (config.psm === 13) score += 25;
                    if (config.psm === 6) score += 10;

                    allCandidates.push({ id: finalCandidate, score, source: config.name });

                    if (score > bestIdScore) {
                        bestIdResult = finalCandidate;
                        bestIdScore = score;
                        const tag = wasAutoCorrected ? '🔧' : '✓';
                        console.log(`  ${tag} New best: ${finalCandidate} (score: ${score.toFixed(1)}, valid: ${isValid}${wasAutoCorrected ? ', auto-corrected' : ''})`);
                    }
                }

                if (text.length === 13 && !bestIdResult) {
                    let finalText = text;
                    let isValid = validateThaiID(text);
                    let wasAutoCorrected = false;

                    if (!isValid) {
                        const corrected = tryAutoCorrectID(text);
                        if (corrected) {
                            finalText = corrected;
                            isValid = true;
                            wasAutoCorrected = true;
                        }
                    }

                    let score = (idResult.data.confidence || 0) + (isValid ? 150 : 0);
                    if (wasAutoCorrected) score -= 30;

                    const firstDigit = parseInt(finalText.charAt(0));
                    if (firstDigit >= 1 && firstDigit <= 8) score += 40;
                    if (firstDigit === 9) score -= 20;

                    allCandidates.push({ id: finalText, score, source: config.name });

                    if (score > bestIdScore) {
                        bestIdResult = finalText;
                        bestIdScore = score;
                        const tag = wasAutoCorrected ? '🔧' : '✓';
                        console.log(`  ${tag} Exact 13 digits: ${finalText} (score: ${score.toFixed(1)}, valid: ${isValid}${wasAutoCorrected ? ', auto-corrected' : ''})`);
                    }
                }
            }
            console.log('\n📊 All Candidates:', allCandidates.slice(0, 10));
            console.log(`🏆 Final ID: "${bestIdResult}" (score: ${bestIdScore.toFixed(1)})\n`);

            setStatusText('กำลังอ่านชื่อ-นามสกุล...');
            const nameArea = { x: 0.12, y: 0.28, w: 0.75, h: 0.28 };
            const fullNameText = await scanLargeArea(mainCanvas, nameArea);

            setStatusText('กำลังอ่านวันเกิด...');
            const dobArea = { x: 0.30, y: 0.50, w: 0.50, h: 0.15 };
            const dobImg = cropAndEnhance(mainCanvas, dobArea, 'date');
            const dobResult = await Tesseract.recognize(dobImg, 'eng', {
                // @ts-ignore
                tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz. '
            });
            const finalId = bestIdResult;

            setStatusText('กำลังประมวลผลชื่อ...');

            let firstname_en = '';
            let lastname_en = '';
            let middlename_en = '';

            console.log('Full Name Text:', fullNameText);

            // ลำดับความสำคัญในการหา firstname:
            // 1. หาจาก "Mr./Miss/Mrs/Ms + ชื่อ" (อยู่บรรทัดเดียวกันกับคำนำหน้า)
            // 2. หาจาก "Name" label (แต่ต้องไม่ใช่ "Last name")

            // หา lastname จาก "Last name" ก่อน (เพราะชัดเจนที่สุด)
            const lastnameMatch = fullNameText.match(/Last\s*name\s+([A-Z][a-z]+)/i);
            if (lastnameMatch) {
                lastname_en = lastnameMatch[1].trim();
                console.log('Found lastname:', lastname_en);
            }

            // หา firstname จากคำนำหน้าชื่อ (Mr./Miss/Mrs/Ms)
            const titleMatch = fullNameText.match(/(?:Mr|Miss|Mrs|Ms)\.?\s+([A-Z][a-z]+)/i);
            if (titleMatch) {
                firstname_en = titleMatch[1].trim();
                console.log('Found firstname from title:', firstname_en);
            }

            // ถ้ายังไม่เจอ firstname ลองหาจาก "Name" label (แต่ต้องไม่ติดกับ "Last")
            if (!firstname_en) {
                // ใช้ negative lookbehind เพื่อไม่ให้จับ "Last name"
                const nameOnlyMatch = fullNameText.match(/(?<!Last\s)Name\s+(?:(?:Miss|Mrs?|Ms)\.?\s+)?([A-Z][a-z]+)/i);
                if (nameOnlyMatch) {
                    firstname_en = nameOnlyMatch[1].trim();
                    console.log('Found firstname from Name label:', firstname_en);
                }
            }

            if (!firstname_en && !lastname_en) {
                const words = fullNameText.match(/\b[A-Z][a-z]{2,}\b/g) || [];
                const validWords = words.filter(w =>
                    !['Name', 'Last', 'Miss', 'Mrs', 'Ms'].includes(w)
                );

                if (validWords.length >= 2) {
                    firstname_en = validWords[0];
                    lastname_en = validWords[validWords.length - 1];
                    if (validWords.length > 2) {
                        middlename_en = validWords.slice(1, -1).join(' ');
                    }
                    console.log('Found from word extraction:', { firstname_en, lastname_en, middlename_en });
                } else if (validWords.length === 1) {
                    firstname_en = validWords[0];
                }
            }

            const dobText = dobResult.data.text.replace(/\n/g, ' ').trim();
            const dobRegex = /(\d{1,2})\s+([A-Za-z]{3,4}\.?|[A-Za-z]{3,4})\s+(\d{4})/;
            const dobMatch = dobText.match(dobRegex);
            let finalDob = '';

            if (dobMatch) {
                const day = dobMatch[1];
                const month = normalizeMonth(dobMatch[2]);
                const year = dobMatch[3];
                finalDob = `${day} ${month} ${year}`;
            }

            const hasId = !!finalId && finalId.length === 13;
            const hasFirstName = !!firstname_en;
            const hasLastName = !!lastname_en;
            const hasDob = !!finalDob;

            const missingFields = [];
            if (!hasId) missingFields.push('เลขบัตรประชาชน');
            if (!hasFirstName) missingFields.push('ชื่อ');
            if (!hasLastName) missingFields.push('นามสกุล');
            if (!hasDob) missingFields.push('วันเกิด');

            if (hasId || hasFirstName || hasLastName || hasDob) {
                setScannedData({
                    id: finalId || null,
                    firstName: firstname_en,
                    lastName: lastname_en,
                    firstname_en: firstname_en,
                    middlename_en: middlename_en,
                    lastname_en: lastname_en,
                    birthdate: finalDob
                });
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
            // รวมข้อมูลจากหลังบัตรด้วย (ถ้ามี)
            const finalData = {
                ...scannedData,
                laserId: backCardData.laserId || scannedData.laserId
            };
            onScanComplete(finalData);
            handleClose();
        } else if (backCardData.laserId) {
            // กรณีอ่านเฉพาะหลังบัตร
            onScanComplete({
                id: null,
                firstName: null,
                lastName: null,
                laserId: backCardData.laserId
            });
            handleClose();
        }
    };

    const handleClose = () => { stopCamera(); onClose(); };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm" // ✅ ปรับให้กว้างขึ้นตามที่ต้องการ
            fullWidth
            PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden', bgcolor: isCameraOpen ? '#000' : '#fff' } }}
        >
            {!isCameraOpen && (
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 2.5, borderBottom: '1px solid #F1F5F9' }}>
                    <Box>
                        <Typography variant="h6" fontWeight="800" color="#1E293B">
                            สแกนบัตรประชาชน ({scanSide === 'front' ? 'ด้านหน้า' : 'ด้านหลัง'})
                        </Typography>
                        <Typography variant="body2" color="#64748B">ระบบอ่านข้อมูลอัตโนมัติ (AI OCR)</Typography>
                        <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.5 }}>
                            ⚠️ กรุณาตรวจสอบความถูกต้องของข้อมูลก่อนยืนยัน
                        </Typography>
                    </Box>
                    <IconButton onClick={handleClose}><CloseIcon /></IconButton>
                </Stack>
            )}

            <DialogContent sx={{ p: 0, minHeight: 450, display: 'flex', flexDirection: 'column' }}>
                {isCameraOpen ? (
                    <Box sx={{ position: 'relative', flex: 1, bgcolor: '#000', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
                            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                            {/* --- Overlay Guides --- */}
                            <Box sx={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
                                {/* Card Frame */}
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
                                    }}>
                                        🎯 วางบัตร{scanSide === 'front' ? 'ด้านหน้า' : 'ด้านหลัง'}ให้เต็มกรอบ
                                    </Typography>
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
                                ) : (scannedData || backCardData.laserId) ? (
                                    <Fade in>
                                        <Card elevation={0} sx={{ border: '1px solid #E2E8F0', p: 3, borderRadius: 3 }}>
                                            <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                                                <VerifiedIcon color="success" fontSize="large" />
                                                <Box>
                                                    <Typography variant="h6" fontWeight="bold">ตรวจสอบข้อมูล</Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        ข้อมูลจากบัตร{scanSide === 'front' ? 'ด้านหน้า' : 'ด้านหลัง'}
                                                    </Typography>
                                                </Box>
                                            </Stack>

                                            <Stack spacing={2.5}>
                                                {scanSide === 'front' && scannedData && (
                                                    <>
                                                        <TextField
                                                            label="เลขบัตรประชาชน"
                                                            fullWidth value={scannedData.id || ''}
                                                            size="small" inputProps={{ readOnly: true }}
                                                        />
                                                        <Stack direction="row" spacing={2}>
                                                            <TextField label="First Name (EN)" value={scannedData.firstname_en || ''} size="small" inputProps={{ readOnly: true }} sx={{ flex: 1 }} />
                                                            <TextField label="Last Name (EN)" value={scannedData.lastname_en || ''} size="small" inputProps={{ readOnly: true }} sx={{ flex: 1 }} />
                                                        </Stack>
                                                        {scannedData.birthdate && (
                                                            <TextField label="Date of Birth" fullWidth value={scannedData.birthdate || ''} size="small" inputProps={{ readOnly: true }} />
                                                        )}
                                                    </>
                                                )}

                                                {scanSide === 'back' && backCardData.laserId && (
                                                    <TextField
                                                        label="Laser Code (หลังบัตร)"
                                                        fullWidth
                                                        value={backCardData.laserId}
                                                        size="small" inputProps={{ readOnly: true }}
                                                        placeholder="ME0-xxxxxxx-xx"
                                                    />
                                                )}
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
                                        {error && <Button onClick={() => setImagePreview(null)} variant="outlined">ลองใหม่อีกครั้ง</Button>}
                                    </Stack>
                                )}
                            </Box>
                        </Stack>
                    </Box>
                ) : (
                    // หน้าจอเริ่มต้น (เลือกด้าน + วิธีถ่ายภาพ)
                    <Box sx={{ flex: 1, p: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <Stack spacing={4} sx={{ width: '100%', maxWidth: 450 }}>
                            <Box textAlign="center">
                                <Typography variant="h6" fontWeight="bold" color="#1E293B">ถ่ายภาพบัตรประชาชน</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    เลือกด้านที่ต้องการสแกน
                                </Typography>
                            </Box>

                            {/* ตัวเลือกด้านหน้า/หลัง */}
                            <Stack direction="row" spacing={2}>
                                <Button
                                    variant={scanSide === 'front' ? 'contained' : 'outlined'}
                                    onClick={() => setScanSide('front')}
                                    fullWidth sx={{ py: 1.5, borderRadius: 2, border: scanSide === 'front' ? 'none' : '1px solid #E2E8F0' }}
                                    startIcon={<BadgeIcon />}
                                >
                                    ด้านหน้า (ข้อมูล)
                                </Button>
                                <Button
                                    variant={scanSide === 'back' ? 'contained' : 'outlined'}
                                    onClick={() => setScanSide('back')}
                                    fullWidth sx={{ py: 1.5, borderRadius: 2, border: scanSide === 'back' ? 'none' : '1px solid #E2E8F0' }}
                                    startIcon={<CardIcon />}
                                >
                                    ด้านหลัง (Laser ID)
                                </Button>
                            </Stack>

                            <Stack spacing={2}>
                                <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, cursor: 'pointer', transition: 'all 0.2s', '&:hover': { borderColor: '#3140BF', transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(49,64,191,0.1)' } }} onClick={startCamera}>
                                    <Stack direction="row" alignItems="center" p={2.5} spacing={2.5}>
                                        <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: '#e0e7ff', color: '#3140BF' }}><CameraIcon fontSize="large" /></Box>
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight="bold">ถ่ายภาพด้วยกล้อง</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {scanSide === 'front' ? 'วางบัตรด้านหน้าให้ชัดเจน' : 'วางบัตรด้านหลังให้เห็นรหัส Laser'}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Card>
                                <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                                    <Typography variant="caption" sx={{ bgcolor: '#fff', px: 1, color: '#94A3B8', zIndex: 1 }}>หรือ</Typography>
                                    <Box sx={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px dashed #E2E8F0', zIndex: 0 }} />
                                </Box>
                                <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, cursor: 'pointer', transition: 'all 0.2s', '&:hover': { borderColor: '#3140BF', transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(49,64,191,0.1)' } }} onClick={() => uploadInputRef.current?.click()}>
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