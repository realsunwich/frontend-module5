'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Dialog, DialogContent, IconButton, Box, Typography, Stack,
    Card, Button, useTheme, Fade, Alert, CircularProgress,
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
export interface ScannedData {
    id: string | null;
    firstName: string | null;
    lastName: string | null;
    firstname_en?: string;
    middlename_en?: string;
    lastname_en?: string;
    birthdate?: string | Date;
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

    // 🎯 ประเมินความน่าเชื่อถือของเลขบัตร (0-100)
    const getIDLikelihoodScore = (id: string): number => {
        if (id.length !== 13) return 0;

        let score = 50; // Base score

        // 1. ตรวจสอบตัวเลขซ้ำกันติดกันมากเกินไป (เช่น 111, 000, 555)
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
        if (maxRepeat >= 5) score -= 40; // มีตัวเลขซ้ำ 5 ตัวขึ้นไป น่าสงสัยมาก
        else if (maxRepeat >= 4) score -= 25;
        else if (maxRepeat >= 3) score -= 10;

        // 2. ตรวจสอบรูปแบบที่ดูเป็นธรรมชาติ (มีตัวเลขหลากหลาย)
        const uniqueDigits = new Set(id.split('')).size;
        if (uniqueDigits >= 8) score += 20; // มีตัวเลขหลากหลาย
        else if (uniqueDigits <= 4) score -= 30; // ตัวเลขซ้ำกันมาก

        // 3. ตรวจสอบ Pattern ที่น่าสงสัย (เลขเรียงกัน เช่น 12345, 54321)
        let sequential = 0;
        for (let i = 1; i < id.length; i++) {
            const diff = parseInt(id[i]) - parseInt(id[i - 1]);
            if (Math.abs(diff) === 1) sequential++;
        }
        if (sequential >= 8) score -= 35; // เลขเรียงกันมากเกินไป

        // 4. ตรวจสอบตัวเลขหลัก 2-5 (รหัสจังหวัดมักเป็น 10-99)
        const provinceCode = parseInt(id.substring(1, 3));
        if (provinceCode >= 10 && provinceCode <= 99) score += 15;

        return Math.max(0, Math.min(100, score));
    };

    // --- Camera Control ---
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
        mode: 'text' | 'number' | 'date'
    ): string => {
        const x = sourceCanvas.width * roi.x;
        const y = sourceCanvas.height * roi.y;
        const w = sourceCanvas.width * roi.w;
        const h = sourceCanvas.height * roi.h;

        const roiCanvas = document.createElement('canvas');
        // Scale 5x สำหรับเลขบัตร, 4x สำหรับส่วนอื่น
        const scale = mode === 'number' ? 5.0 : 4.0;
        roiCanvas.width = w * scale;
        roiCanvas.height = h * scale;
        const ctx = roiCanvas.getContext('2d');

        if (!ctx) return '';

        // Fill white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, roiCanvas.width, roiCanvas.height);

        // Draw cropped image
        ctx.drawImage(sourceCanvas, x, y, w, h, 0, 0, roiCanvas.width, roiCanvas.height);

        // --- Pixel Manipulation ---
        const imageData = ctx.getImageData(0, 0, roiCanvas.width, roiCanvas.height);
        const data = imageData.data;

        // 1. Sharpening Filter (เฉพาะโหมด number)
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

            // Apply Gamma Correction (เฉพาะโหมด number - ลดลงเล็กน้อย)
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

    // แก้ไขตัวเลขที่ OCR มักอ่านผิด
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

        // ตัวเลขที่มักจะอ่านผิด (เรียงตาม priority)
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

        // ลองแทนที่ทีละตัว
        for (let i = 0; i < 13; i++) {
            const currentChar = id[i];

            // ลองเปลี่ยนเป็นตัวเลขที่คล้ายกัน
            for (const [from, to] of confusablePairs) {
                if (currentChar === from) {
                    const testID = id.substring(0, i) + to + id.substring(i + 1);
                    if (validateThaiID(testID)) {
                        console.log(`✅ Auto-corrected: ${id} → ${testID} (pos ${i}: ${from}→${to})`);
                        return testID;
                    }
                }
            }
        }

        return null; // แก้ไม่ได้
    };

    // แก้ไขคำผิดสำหรับเดือน
    const normalizeMonth = (raw: string): string => {
        const text = raw.toLowerCase().replace(/[^a-z]/g, ''); // ตัดจุด ตัดเลขทิ้ง
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
        // หาเดือนที่ตรงกับ 3 ตัวแรกมากที่สุด
        const found = Object.keys(monthMap).find(k => text.startsWith(k.substring(0, 3)));
        return found ? monthMap[found] : text; // ถ้าไม่เจอคืนค่าเดิม
    };

    // --- 🎯 Smart Label-based Text Extraction ---
    const extractTextAfterLabel = (fullText: string, label: string): string => {
        // หาตำแหน่งของ label และเอาข้อความหลังจาก label
        const regex = new RegExp(`${label}\\s*[:.]?\\s*([^\\n]+)`, 'i');
        const match = fullText.match(regex);
        return match ? match[1].trim() : '';
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

    // --- Main Processor ---
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

            // --- 1. สแกนเลขบัตร (Modern AI Approach) ---
            setStatusText('กำลังอ่านเลขบัตรประชาชน...');

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

                // 🔍 Debug: แสดงภาพที่ประมวลผลแล้ว (สำหรับ config แรก)
                if (idx === 0) {
                    console.log(`🖼️ Processed Image Preview (${config.name}):`, idImg.substring(0, 100) + '...');
                    // สามารถ copy link นี้ไปวางใน browser ได้เพื่อดูภาพ
                }

                // Tesseract recognize with PSM
                const idResult = await Tesseract.recognize(idImg, 'eng', {
                    // @ts-ignore - PSM modes: 3=auto, 6=uniform block, 7=single line, 11=sparse text
                    tessedit_pageseg_mode: config.psm,
                    tessedit_char_whitelist: '0123456789OoIlSsZBGD- '
                });

                // แก้ไขตัวอักษรที่อ่านผิด
                let text = correctDigits(idResult.data.text);

                // ลบทุกอย่างที่ไม่ใช่ตัวเลขและช่องว่าง (เก็บช่องว่างไว้ก่อน)
                const textWithSpaces = text.replace(/[^0-9\s]/g, '');

                // ลบช่องว่าง
                text = textWithSpaces.replace(/\s/g, '');

                // 🔍 ตรวจสอบ Pattern เลขบัตรที่มีช่องว่าง (X XXXX XXXXX XX X)
                const spacedPattern = /(\d)\s+(\d{4})\s+(\d{5})\s+(\d{2})\s+(\d)/;
                const spacedMatch = textWithSpaces.match(spacedPattern);
                if (spacedMatch) {
                    const reconstructed = spacedMatch[1] + spacedMatch[2] + spacedMatch[3] + spacedMatch[4] + spacedMatch[5];
                    console.log(`  📐 Found spaced ID: "${textWithSpaces}" → ${reconstructed}`);
                    // เพิ่ม candidate พิเศษนี้เข้าไปด้วย
                    if (reconstructed.length === 13) {
                        text = reconstructed; // ใช้ตัวนี้แทน
                    }
                }

                console.log(`[${config.name}] Raw: "${text}" (conf: ${idResult.data.confidence?.toFixed(1)}%)`);

                // หาเลข 13 หลักทุกตำแหน่งที่เป็นไปได้
                for (let i = 0; i <= text.length - 13; i++) {
                    const candidate = text.substring(i, i + 13);
                    let finalCandidate = candidate;
                    let isValid = validateThaiID(candidate);
                    let wasAutoCorrected = false;

                    // 🧠 ถ้า checksum ไม่ผ่าน ลอง auto-correct
                    if (!isValid) {
                        const corrected = tryAutoCorrectID(candidate);
                        if (corrected) {
                            finalCandidate = corrected;
                            isValid = true;
                            wasAutoCorrected = true;
                        }
                    }

                    // คำนวณ score
                    let score = idResult.data.confidence || 0;
                    if (isValid) score += 150; // Bonus มากสำหรับ checksum ถูก
                    if (wasAutoCorrected) score -= 30; // ลด score เล็กน้อยเพราะแก้ไข

                    // 🎯 ประเมินความน่าเชื่อถือของเลขบัตร
                    const likelihoodScore = getIDLikelihoodScore(finalCandidate);
                    score += likelihoodScore * 0.5; // เพิ่ม 0-50 คะแนน ตามความน่าเชื่อถือ

                    // Bonus สำหรับเลขที่ขึ้นต้นด้วย 1-8 (เลขบัตรจริงมักขึ้นต้นด้วยเลข 1-8)
                    const firstDigit = parseInt(finalCandidate.charAt(0));
                    if (firstDigit >= 1 && firstDigit <= 8) score += 40;

                    // Penalty สำหรับเลขที่ขึ้นต้นด้วย 9 (น้อยมาก)
                    if (firstDigit === 9) score -= 20;

                    // Bonus สำหรับ PSM ที่เหมาะกับเลขบัตร
                    if (config.psm === 7) score += 20; // Single line
                    if (config.psm === 13) score += 25; // Raw line (best for ID numbers)
                    if (config.psm === 6) score += 10; // Uniform block

                    allCandidates.push({ id: finalCandidate, score, source: config.name });

                    if (score > bestIdScore) {
                        bestIdResult = finalCandidate;
                        bestIdScore = score;
                        const tag = wasAutoCorrected ? '🔧' : '✓';
                        console.log(`  ${tag} New best: ${finalCandidate} (score: ${score.toFixed(1)}, valid: ${isValid}${wasAutoCorrected ? ', auto-corrected' : ''})`);
                    }
                }

                // ถ้าพบตัวเลขแค่ 13 หลักพอดี
                if (text.length === 13 && !bestIdResult) {
                    let finalText = text;
                    let isValid = validateThaiID(text);
                    let wasAutoCorrected = false;

                    // 🧠 ลอง auto-correct
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

                    // Bonus/Penalty ตามหลักแรก
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

            // Log all candidates
            console.log('\n📊 All Candidates:', allCandidates.slice(0, 10));
            console.log(`🏆 Final ID: "${bestIdResult}" (score: ${bestIdScore.toFixed(1)})\n`);

            // --- 2. สแกนส่วนข้อมูลชื่อ (อ่านพื้นที่ใหญ่ที่มี Name และ Last name) ---
            setStatusText('กำลังอ่านชื่อ-นามสกุล...');
            // ขยายพื้นที่สแกนให้ครอบคลุมมากขึ้น
            const nameArea = { x: 0.12, y: 0.28, w: 0.75, h: 0.28 };
            const fullNameText = await scanLargeArea(mainCanvas, nameArea);

            // --- 3. สแกนวันเกิด (Date of Birth) ---
            setStatusText('กำลังอ่านวันเกิด...');
            const dobArea = { x: 0.30, y: 0.50, w: 0.50, h: 0.15 };
            const dobImg = cropAndEnhance(mainCanvas, dobArea, 'date');
            const dobResult = await Tesseract.recognize(dobImg, 'eng', {
                // @ts-ignore
                tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz. '
            });

            // --- 4. Parse & Clean Results ---

            // ใช้ bestIdResult จากการสแกนด้านบน
            const finalId = bestIdResult;

            // --- Name Parsing (ใช้ Label-based extraction) ---
            setStatusText('กำลังประมวลผลชื่อ...');

            // แยกหา "Name" และ "Last name" จาก fullNameText
            let firstname_en = '';
            let lastname_en = '';
            let middlename_en = '';

            console.log('Full Name Text:', fullNameText); // Debug

            // Method 1: หาจาก pattern "Name <Title> <ชื่อ>" เช่น "Name Mrs. Wanpen"
            // รองรับทั้งแบบมี title และไม่มี title
            const nameMatch = fullNameText.match(/Name\s+(?:(?:Miss|Mrs?|Ms)\.?\s+)?([A-Z][a-z]+)/i);
            const lastnameMatch = fullNameText.match(/Last\s*name\s+([A-Z][a-z]+)/i);

            if (nameMatch) {
                firstname_en = nameMatch[1].trim();
                console.log('Found firstname:', firstname_en);
            }

            if (lastnameMatch) {
                lastname_en = lastnameMatch[1].trim();
                console.log('Found lastname:', lastname_en);
            }

            // Method 2: Fallback - ถ้าไม่เจอ Name label ให้หาจาก Title
            if (!firstname_en) {
                // หา Miss/Mr/Mrs ที่ไม่มีคำว่า Name นำหน้า
                const titleOnlyMatch = fullNameText.match(/(?:Miss|Mrs?|Ms)\.?\s+([A-Z][a-z]+)/i);
                if (titleOnlyMatch) {
                    firstname_en = titleOnlyMatch[1].trim();
                    console.log('Found firstname from title:', firstname_en);
                }
            }

            // Method 3: Fallback สุดท้าย - ถ้ายังไม่เจอ ลองหาชื่อที่ขึ้นต้นด้วยตัวใหญ่
            if (!firstname_en && !lastname_en) {
                // หาคำที่ขึ้นต้นด้วยตัวพิมพ์ใหญ่ (ไม่รวม Name, Last, Miss, Mr, Mrs, Ms)
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

            // --- DOB Parsing ---
            const dobText = dobResult.data.text.replace(/\n/g, ' ').trim();
            // Regex: เลข 1-2 หลัก + เว้นวรรค + ตัวหนังสือ 3-4 ตัว + เว้นวรรค + เลข 4 หลัก
            const dobRegex = /(\d{1,2})\s+([A-Za-z]{3,4}\.?|[A-Za-z]{3,4})\s+(\d{4})/;
            const dobMatch = dobText.match(dobRegex);
            let finalDob = '';

            if (dobMatch) {
                const day = dobMatch[1];
                const month = normalizeMonth(dobMatch[2]);
                const year = dobMatch[3];
                finalDob = `${day} ${month} ${year}`;
            }

            // --- Final Check & Warning System ---
            const hasId = !!finalId && finalId.length === 13;
            const hasFirstName = !!firstname_en;
            const hasLastName = !!lastname_en;
            const hasDob = !!finalDob;

            // ตรวจสอบว่ามีข้อมูลอะไรบ้าง
            const missingFields = [];
            if (!hasId) missingFields.push('เลขบัตรประชาชน');
            if (!hasFirstName) missingFields.push('ชื่อ');
            if (!hasLastName) missingFields.push('นามสกุล');
            if (!hasDob) missingFields.push('วันเกิด');

            // ถ้าอ่านได้บางส่วน ให้แสดงผลพร้อม warning
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

                // แสดง warning ถ้าอ่านไม่ครบ หรือมีปัญหา
                if (missingFields.length > 0) {
                    setError(`⚠️ อ่านข้อมูลไม่ครบ: ${missingFields.join(', ')}\n\nการอ่านข้อมูลด้วย AI อาจมีความคลาดเคลื่อน กรุณาตรวจสอบความถูกต้องของข้อมูลทั้งหมดก่อนยืนยัน หรือถ่ายใหม่เพื่อความแม่นยำ`);
                } else if (!validateThaiID(finalId)) {
                    setError('⚠️ เลขบัตรประชาชนไม่ผ่านการตรวจสอบ\n\nการอ่านข้อมูลด้วย AI อาจมีความคลาดเคลื่อน กรุณาตรวจสอบความถูกต้องของเลขบัตรประชาชนก่อนใช้งาน');
                } else {
                    // อ่านได้ครบ แต่ยังต้องแจ้งเตือนให้ตรวจสอบ
                    setError('ℹ️ การอ่านข้อมูลด้วย AI อาจมีความคลาดเคลื่อน\n\nกรุณาตรวจสอบความถูกต้องของข้อมูลทั้งหมดก่อนยืนยันการใช้งาน');
                }
            } else {
                // ไม่มีข้อมูลเลย
                setError('❌ อ่านข้อมูลไม่สำเร็จ | กรุณาถ่ายใหม่ด้วยเงื่อนไขต่อไปนี้:\n• แสงสว่างเพียงพอ ไม่มีเงาบดบัง\n• บัตรวางบนพื้นเรียบ ไม่เอียง\n• หลีกเลี่ยงแสงสะท้อนจากพลาสติก\n• ถือกล้องนิ่งๆ ไม่เบลอ');
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
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden', bgcolor: isCameraOpen ? '#000' : '#fff' } }}>
            {!isCameraOpen && (
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 2.5, borderBottom: '1px solid #F1F5F9' }}>
                    <Box>
                        <Typography variant="h6" fontWeight="800" color="#1E293B">สแกนบัตรประชาชน</Typography>
                        <Typography variant="body2" color="#64748B">ระบบอ่านข้อมูลอัตโนมัติ (AI OCR)</Typography>
                        <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.5 }}>
                            ⚠️ กรุณาตรวจสอบความถูกต้องของข้อมูลก่อนยืนยัน
                        </Typography>
                    </Box>
                    <IconButton onClick={handleClose}><CloseIcon /></IconButton>
                </Stack>
            )}

            <DialogContent sx={{ p: 0, minHeight: 400, display: 'flex', flexDirection: 'column' }}>
                {isCameraOpen ? (
                    <Box sx={{ position: 'relative', flex: 1, bgcolor: '#000', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
                            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                            {/* --- Overlay Guides --- */}
                            <Box sx={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
                                {/* Card Frame - แนะนำให้วางบัตรทั้งใบให้เต็มกรอบ */}
                                <Box sx={{
                                    position: 'absolute',
                                    top: '8%',
                                    left: '5%',
                                    width: '90%',
                                    height: '60%',
                                    border: '3px dashed #4ade80',
                                    borderRadius: 3,
                                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Typography sx={{
                                        position: 'absolute',
                                        top: -32,
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        color: '#4ade80',
                                        fontSize: 13,
                                        fontWeight: 'bold',
                                        textShadow: '0 0 8px rgba(0,0,0,0.9)',
                                        bgcolor: 'rgba(0,0,0,0.5)',
                                        px: 2,
                                        py: 0.5,
                                        borderRadius: 2
                                    }}>
                                        🎯 วางบัตรประชาชนให้เต็มกรอบ
                                    </Typography>

                                    {/* Mini highlight zones */}
                                    <Box sx={{ position: 'absolute', top: '12%', left: '2%', width: '55%', height: '8%', border: '1px solid rgba(74, 222, 128, 0.4)', borderRadius: 1 }} />
                                    <Box sx={{ position: 'absolute', top: '32%', left: '15%', width: '60%', height: '12%', border: '1px solid rgba(250, 204, 21, 0.4)', borderRadius: 1 }} />
                                    <Box sx={{ position: 'absolute', top: '50%', left: '25%', width: '40%', height: '8%', border: '1px solid rgba(244, 114, 182, 0.4)', borderRadius: 1 }} />
                                </Box>

                                {/* Corner guides */}
                                <Box sx={{ position: 'absolute', top: '8%', left: '5%', width: 30, height: 30, borderTop: '4px solid #4ade80', borderLeft: '4px solid #4ade80', borderRadius: '8px 0 0 0' }} />
                                <Box sx={{ position: 'absolute', top: '8%', right: '5%', width: 30, height: 30, borderTop: '4px solid #4ade80', borderRight: '4px solid #4ade80', borderRadius: '0 8px 0 0' }} />
                                <Box sx={{ position: 'absolute', bottom: '32%', left: '5%', width: 30, height: 30, borderBottom: '4px solid #4ade80', borderLeft: '4px solid #4ade80', borderRadius: '0 0 0 8px' }} />
                                <Box sx={{ position: 'absolute', bottom: '32%', right: '5%', width: 30, height: 30, borderBottom: '4px solid #4ade80', borderRight: '4px solid #4ade80', borderRadius: '0 0 8px 0' }} />
                            </Box>

                            <Stack direction="row" justifyContent="center" sx={{ position: 'absolute', bottom: 140, left: 0, right: 0, zIndex: 20 }}>
                                <Typography variant="caption" sx={{ color: '#fff', bgcolor: 'rgba(0,0,0,0.7)', px: 2, py: 0.5, borderRadius: 20 }}>
                                    วางบัตรให้ตรงกรอบ แล้วกดถ่ายภาพ
                                </Typography>
                            </Stack>
                        </Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ height: 120, px: 4, bgcolor: '#000', zIndex: 20 }}>
                            <IconButton onClick={() => setIsCameraOpen(false)} sx={{ color: '#fff' }}><CloseIcon /></IconButton>
                            <IconButton onClick={capturePhoto} sx={{ p: 0 }}><Box sx={{ width: 72, height: 72, borderRadius: '50%', border: '4px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', '&:active': { transform: 'scale(0.95)' } }}><Box sx={{ width: 60, height: 60, bgcolor: '#fff', borderRadius: '50%' }} /></Box></IconButton>
                            <IconButton onClick={switchCamera} sx={{ color: '#fff' }}><FlipCameraIcon /></IconButton>
                        </Stack>
                    </Box>
                ) : imagePreview ? (
                    <Box sx={{ flex: 1, bgcolor: '#F8FAFC', display: 'flex', flexDirection: 'column', p: 3, overflowY: 'auto' }}>
                        <Box sx={{ width: '100%', borderRadius: 2, overflow: 'hidden', mb: 3, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', maxHeight: 200 }}>
                            <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </Box>

                        {processing ? (
                            <Stack alignItems="center" sx={{ py: 4 }}>
                                <CircularProgress size={30} />
                                <Typography sx={{ mt: 2, color: 'text.secondary', fontSize: '0.9rem' }}>{statusText}</Typography>
                            </Stack>
                        ) : scannedData ? (
                            <Fade in>
                                <Card elevation={0} sx={{ border: '1px solid #E2E8F0', p: 2, borderRadius: 3 }}>
                                    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                                        <VerifiedIcon color="success" />
                                        <Typography variant="subtitle1" fontWeight="bold">ตรวจสอบข้อมูล</Typography>
                                    </Stack>

                                    <Stack spacing={2}>
                                        <TextField
                                            label="เลขบัตรประชาชน"
                                            fullWidth value={scannedData.id || ''}
                                            color={scannedData.id && validateThaiID(scannedData.id) ? "success" : "warning"}
                                            focused size="small" inputProps={{ readOnly: true }}
                                        />
                                        <Stack direction="row" spacing={2}>
                                            <TextField label="First Name (Eng)" value={scannedData.firstname_en || ''} size="small" inputProps={{ readOnly: true }} sx={{ flex: 1 }} />
                                            <TextField label="Last Name (Eng)" value={scannedData.lastname_en || ''} size="small" inputProps={{ readOnly: true }} sx={{ flex: 1 }} />
                                        </Stack>
                                        {scannedData.middlename_en && (
                                            <TextField label="Middle Name (Eng)" value={scannedData.middlename_en || ''} size="small" inputProps={{ readOnly: true }} />
                                        )}
                                        <TextField label="Date of Birth" fullWidth value={scannedData.birthdate || ''} size="small" inputProps={{ readOnly: true }} />
                                    </Stack>

                                    {/* ข้อความแจ้งเตือนว่าสามารถแก้ไขได้ */}
                                    <Alert severity="info" sx={{ mt: 2, fontSize: '0.85rem' }} icon={false}>
                                        <Typography variant="caption" display="block" fontWeight="600" mb={0.5}>
                                            💡 คุณสามารถแก้ไขข้อมูลได้ในฟอร์มหลัง
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            หากพบข้อมูลไม่ถูกต้องหรือไม่ครบถ้วน สามารถแก้ไขเพิ่มเติมได้ในฟอร์มกรอกข้อมูลหลังจากกดยืนยัน
                                        </Typography>
                                    </Alert>

                                    <Stack direction="row" spacing={2} mt={3}>
                                        <Button fullWidth variant="outlined" color="inherit" onClick={() => { setScannedData(null); setError(null); }}>ถ่ายใหม่</Button>
                                        <Button fullWidth variant="contained" onClick={handleConfirm}>ยืนยันข้อมูล</Button>
                                    </Stack>
                                </Card>
                            </Fade>
                        ) : (
                            <Stack alignItems="center" spacing={2}>
                                {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}
                                <Button onClick={() => setImagePreview(null)} variant="outlined">ลองใหม่อีกครั้ง</Button>
                            </Stack>
                        )}
                    </Box>
                ) : (
                    <Box sx={{ flex: 1, p: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Typography variant="body1" textAlign="center" color="text.secondary" mb={4}>
                            ถ่ายรูปบัตรประชาชนเพื่ออ่านข้อมูลอัตโนมัติ <br />(เลขบัตร, ชื่ออังกฤษ, วันเกิด)
                        </Typography>
                        <Stack spacing={2}>
                            <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, cursor: 'pointer', transition: 'all 0.2s', '&:hover': { borderColor: '#3B82F6', transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(59,130,246,0.1)' } }} onClick={startCamera}>
                                <Stack direction="row" alignItems="center" p={2} spacing={2}>
                                    <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: '#EFF6FF', color: '#3B82F6' }}><CameraIcon fontSize="large" /></Box>
                                    <Box><Typography variant="subtitle1" fontWeight="bold">ถ่ายรูปบัตร</Typography><Typography variant="caption" color="text.secondary">วางบัตรบนพื้นเรียบ แสงสว่างพอดี</Typography></Box>
                                </Stack>
                            </Card>
                            <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}><Typography variant="caption" sx={{ bgcolor: '#fff', px: 1, color: '#94A3B8', zIndex: 1 }}>หรือ</Typography><Box sx={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px dashed #E2E8F0', zIndex: 0 }} /></Box>
                            <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, cursor: 'pointer', transition: 'all 0.2s', '&:hover': { borderColor: '#3B82F6', transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(59,130,246,0.1)' } }} onClick={() => uploadInputRef.current?.click()}>
                                <Stack direction="row" alignItems="center" p={2} spacing={2}>
                                    <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: '#F1F5F9', color: '#64748B' }}><GalleryIcon fontSize="large" /></Box>
                                    <Box><Typography variant="subtitle1" fontWeight="bold">เลือกจากอัลบั้ม</Typography><Typography variant="caption" color="text.secondary">รูปภาพชัดเจน ไม่เบลอ</Typography></Box>
                                </Stack>
                            </Card>
                        </Stack>
                        <input type="file" accept="image/*" hidden ref={uploadInputRef} onChange={handleFileChange} />
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}