'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
    Container, Paper, TextField, Button, Typography, Box,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    Chip, Stack, Tooltip, Card, CardContent, Avatar, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import { InputAdornment } from '@mui/material';

// Icons
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditRounded';
import MapIcon from '@mui/icons-material/MapRounded';
import PlaceIcon from '@mui/icons-material/PlaceRounded';
import NavigationIcon from '@mui/icons-material/NearMeRounded';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LoginIcon from '@mui/icons-material/Login';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import VerifiedIcon from '@mui/icons-material/Verified';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import DescriptionIcon from '@mui/icons-material/Description';
import BuildIcon from '@mui/icons-material/Build';
import ApartmentIcon from '@mui/icons-material/Apartment';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LandscapeIcon from '@mui/icons-material/Landscape';
import CategoryIcon from '@mui/icons-material/Category';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import GavelIcon from '@mui/icons-material/Gavel';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import InfoIcon from '@mui/icons-material/Info';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

import Header from '@/components/header';
import Sidebar from '@/components/sidebar';

// Import Map (Dynamic)
const AssetMap = dynamic(() => import('../../components/Map/AssetMap'), {
    ssr: false,
    loading: () => <Box sx={{ height: 400, bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2 }}>Loading Map...</Box>
});

// Type Definition
interface Asset {
    id?: number;
    name: string;
    description: string;
    latitude: number;
    longitude: number;
    assetType?: string;           // ประเภทหลักฐาน เช่น เอกสาร, อุปกรณ์, อาคาร
    quantity?: number;             // จำนวน
    status?: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN';  // สถานะ
    checkedInAt?: string;          // วันที่เช็คอิน
    confirmNotes?: string;         // บันทึกเพิ่มเติมเมื่อยืนยันการพบหลักฐาน
    photoUrls?: string;            // JSON string ของ URL รูปภาพ
    confirmedAt?: string;          // วันที่ยืนยันการพบหลักฐาน
    totalValue?: number;           // มูลค่ารวมทั้งหมด
    individualValues?: string;     // มูลค่าแต่ละชิ้น (JSON array string)
    valueUnit?: string;            // หน่วยเงิน เช่น "บาท"
    bankDetails?: string;          // รายละเอียดบัญชีธนาคาร (JSON string)
    createdAt?: string;            // วันที่สร้าง
    updatedAt?: string;            // วันที่อัพเดทล่าสุด
}

export default function AssetPage() {
    const [assets, setAssets] = useState<Asset[]>([]);

    // Dialog & Form State
    const [open, setOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        lat: 0,
        lng: 0,
        assetType: 'เอกสาร',
        quantity: 1,
        totalValue: 0,
        valueUnit: 'บาท'
    });
    const [individualValueList, setIndividualValueList] = useState<number[]>([]);
    const [bankDetailsList, setBankDetailsList] = useState<Array<{
        bankName: string;
        accountNumber: string;
        accountName: string;
        amount: number;
    }>>([]);
    const [hasLocation, setHasLocation] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);

    // Filter & Search State
    const [searchText, setSearchText] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [filterType, setFilterType] = useState<string>('ALL');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Confirm Dialog State
    const [confirmDialog, setConfirmDialog] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [confirmNotes, setConfirmNotes] = useState('');
    const [photos, setPhotos] = useState<File[]>([]);
    const [photoPreview, setPhotoPreview] = useState<string[]>([]);

    // Detail Dialog State
    const [detailDialog, setDetailDialog] = useState(false);
    const [detailAsset, setDetailAsset] = useState<Asset | null>(null);
    const [newStatus, setNewStatus] = useState<'PENDING' | 'CONFIRMED' | 'CHECKED_IN'>('PENDING');
    const [additionalPhotos, setAdditionalPhotos] = useState<File[]>([]);
    const [additionalPhotoPreview, setAdditionalPhotoPreview] = useState<string[]>([]);

    // Fetch Data
    const fetchData = async () => {
        try {
            const res = await fetch('http://localhost:8080/api/assets');
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const data = await res.json();
            // Validate that data is an array
            if (Array.isArray(data)) {
                setAssets(data);
            } else {
                console.error("API returned non-array data:", data);
                setAssets([]);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            setAssets([]); // Reset to empty array on error
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchText);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchText]);

    // Filter และ Search assets
    const filteredAssets = useMemo(() => {
        let result = [...assets];

        // Filter by status
        if (filterStatus !== 'ALL') {
            result = result.filter(asset => asset.status === filterStatus);
        }

        // Filter by type
        if (filterType !== 'ALL') {
            result = result.filter(asset => asset.assetType === filterType);
        }

        // Search by text
        if (debouncedSearch.trim()) {
            const query = debouncedSearch.toLowerCase();
            result = result.filter(asset =>
                (asset.name || '').toLowerCase().includes(query) ||
                (asset.description || '').toLowerCase().includes(query) ||
                (asset.assetType || '').toLowerCase().includes(query) ||
                `${asset.latitude},${asset.longitude}`.includes(query)
            );
        }

        return result;
    }, [assets, filterStatus, filterType, debouncedSearch]);

    const handleSearchLocation = async () => {
        if (!searchQuery) return;

        try {
            // เรียกใช้ Nominatim API (Free)
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
            const data = await response.json();

            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);

                // 1. อัปเดตพิกัดในฟอร์ม (เพื่อให้ Save ได้เลย)
                setFormData(prev => ({ ...prev, lat: lat, lng: lon }));
                setHasLocation(true);

                // 2. สั่ง Map ให้ขยับไปจุดนั้น
                setMapCenter([lat, lon]);
            } else {
                alert("ไม่พบสถานที่ที่ค้นหา");
            }
        } catch (error) {
            console.error("Search error:", error);
            alert("เกิดข้อผิดพลาดในการค้นหา");
        }
    };

    // --- Handlers ---
    const handleOpenAdd = () => {
        setIsEditMode(false);
        setFormData({
            name: '',
            description: '',
            lat: 13.7563,
            lng: 100.5018,
            assetType: 'เอกสาร',
            quantity: 1,
            totalValue: 0,
            valueUnit: 'บาท'
        });
        setIndividualValueList([]);
        setBankDetailsList([]);
        setHasLocation(false);
        setOpen(true);
        setSearchQuery('');
        setMapCenter([13.7563, 100.5018]);
    };

    const handleOpenEdit = (asset: Asset) => {
        setIsEditMode(true);
        setCurrentId(asset.id || null);
        setFormData({
            name: asset.name,
            description: asset.description,
            lat: asset.latitude,
            lng: asset.longitude,
            assetType: asset.assetType || 'เอกสาร',
            quantity: asset.quantity || 1,
            totalValue: asset.totalValue || 0,
            valueUnit: asset.valueUnit || 'บาท'
        });

        // Parse individual values
        if (asset.individualValues) {
            try {
                const values = JSON.parse(asset.individualValues);
                setIndividualValueList(values);
            } catch {
                setIndividualValueList([]);
            }
        } else {
            setIndividualValueList([]);
        }

        // Parse bank details
        if (asset.bankDetails) {
            try {
                const details = JSON.parse(asset.bankDetails);
                setBankDetailsList(details);
            } catch {
                setBankDetailsList([]);
            }
        } else {
            setBankDetailsList([]);
        }

        setHasLocation(true);
        setOpen(true);
        setSearchQuery('');
        setMapCenter([asset.latitude, asset.longitude]);
    };

    const handleClose = () => setOpen(false);

    const handleLocationSelect = (lat: number, lng: number) => {
        setFormData(prev => ({ ...prev, lat, lng }));
        setHasLocation(true);
    };

    const handleSave = async () => {
        if (!formData.name || !hasLocation) {
            alert("กรุณากรอกชื่อและปักหมุดบนแผนที่");
            return;
        }

        // สำหรับเงินสดและเงินในธนาคาร ไม่ต้องมี totalValue และ individualValues
        const isMoneyType = formData.assetType === 'เงินสด' || formData.assetType === 'เงินในธนาคาร';

        const payload: any = {
            name: formData.name,
            description: formData.description,
            latitude: formData.lat,
            longitude: formData.lng,
            assetType: formData.assetType,
            quantity: formData.quantity,
            status: 'PENDING' as const
        };

        // เพิ่ม totalValue และ individualValues เฉพาะเมื่อไม่ใช่เงินสดหรือเงินในธนาคาร
        if (!isMoneyType) {
            payload.totalValue = formData.totalValue;
            payload.individualValues = individualValueList.length > 0 ? JSON.stringify(individualValueList) : null;
            payload.valueUnit = formData.valueUnit;
        }

        // เพิ่ม bankDetails สำหรับเงินในธนาคาร
        if (formData.assetType === 'เงินในธนาคาร') {
            payload.bankDetails = bankDetailsList.length > 0 ? JSON.stringify(bankDetailsList) : null;
            // คำนวณ totalValue จาก bank accounts
            const totalFromBanks = bankDetailsList.reduce((sum, bank) => sum + (bank.amount || 0), 0);
            payload.totalValue = totalFromBanks;
            payload.valueUnit = 'บาท';
        }

        // เพิ่ม totalValue สำหรับเงินสด
        if (formData.assetType === 'เงินสด') {
            payload.totalValue = formData.totalValue || 0;
            payload.valueUnit = formData.valueUnit;
        }
        const url = isEditMode && currentId
            ? `http://localhost:8080/api/assets/${currentId}`
            : 'http://localhost:8080/api/assets';

        try {
            const res = await fetch(url, {
                method: isEditMode ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                handleClose();
                fetchData();
                alert(isEditMode ? "แก้ไขข้อมูลสำเร็จ" : "บันทึกข้อมูลสำเร็จ");
            }
        } catch (error) {
            console.error("Error saving:", error);
            alert("เกิดข้อผิดพลาดในการบันทึก");
        }
    };

    const handleNavigate = (lat: number, lng: number) => {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    };

    // เปิด Dialog สำหรับยืนยันการพบหลักฐาน
    const handleOpenConfirmDialog = (asset: Asset) => {
        setSelectedAsset(asset);
        setConfirmDialog(true);
        setConfirmNotes('');
        setPhotos([]);
        setPhotoPreview([]);
    };

    const handleCloseConfirmDialog = () => {
        setConfirmDialog(false);
        setSelectedAsset(null);
        setConfirmNotes('');
        setPhotos([]);
        setPhotoPreview([]);
    };

    // จัดการการเลือกรูปภาพ
    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setPhotos(prev => [...prev, ...filesArray]);

            // สร้าง preview
            filesArray.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPhotoPreview(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    // ลบรูปภาพ
    const handleRemovePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
        setPhotoPreview(prev => prev.filter((_, i) => i !== index));
    };

    // ถ่ายรูปด้วยกล้อง
    const handleCameraCapture = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            // สามารถขยายเพิ่มให้เปิดกล้องถ่ายรูปได้
            stream.getTracks().forEach(track => track.stop());
            alert("ฟีเจอร์กล้องกำลังพัฒนา กรุณาใช้การอัพโหลดรูปภาพแทน");
        } catch (error) {
            alert("ไม่สามารถเข้าถึงกล้องได้");
        }
    };

    // ยืนยันการพบหลักฐาน
    const handleConfirmAsset = async () => {
        if (!selectedAsset?.id) return;

        try {
            const formDataToSend = new FormData();

            // เพิ่ม notes (ถ้ามี)
            if (confirmNotes) {
                formDataToSend.append('notes', confirmNotes);
            }

            // เพิ่มรูปภาพทั้งหมด
            photos.forEach((photo) => {
                formDataToSend.append('photos', photo);
            });

            const res = await fetch(`http://localhost:8080/api/assets/${selectedAsset.id}/confirm`, {
                method: 'PATCH',
                body: formDataToSend
            });

            if (res.ok) {
                handleCloseConfirmDialog();
                fetchData();
                alert("ยืนยันการพบหลักฐานสำเร็จ");
            } else {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
        } catch (error) {
            console.error("Error confirming asset:", error);
            alert("เกิดข้อผิดพลาดในการยืนยัน");
        }
    };

    // ยึดหลักฐาน (เปลี่ยนจาก Check-in)
    const handleSeizeAsset = async (id: number) => {
        if (!confirm("ยืนยันการยึดหลักฐาน?")) return;

        try {
            const res = await fetch(`http://localhost:8080/api/assets/${id}/seize`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                fetchData();
                alert("ยึดหลักฐานสำเร็จ");
            }
        } catch (error) {
            console.error("Error seizing asset:", error);
            alert("เกิดข้อผิดพลาดในการยึดหลักฐาน");
        }
    };

    // เปิด Dialog รายละเอียดหลักฐาน
    const handleOpenDetailDialog = (asset: Asset) => {
        setDetailAsset(asset);
        setNewStatus(asset.status || 'PENDING');
        setAdditionalPhotos([]);
        setAdditionalPhotoPreview([]);
        setDetailDialog(true);
    };

    const handleCloseDetailDialog = () => {
        setDetailDialog(false);
        setDetailAsset(null);
        setAdditionalPhotos([]);
        setAdditionalPhotoPreview([]);
    };

    // จัดการการเพิ่มรูปภาพเพิ่มเติมใน Detail Dialog
    const handleAdditionalPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setAdditionalPhotos(prev => [...prev, ...filesArray]);

            // สร้าง preview
            filesArray.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setAdditionalPhotoPreview(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    // ลบรูปภาพเพิ่มเติม
    const handleRemoveAdditionalPhoto = (index: number) => {
        setAdditionalPhotos(prev => prev.filter((_, i) => i !== index));
        setAdditionalPhotoPreview(prev => prev.filter((_, i) => i !== index));
    };

    // อัพเดทสถานะหลักฐานและอัพโหลดรูปภาพเพิ่มเติม
    const handleUpdateStatus = async () => {
        if (!detailAsset?.id) return;

        try {
            const statusChanged = newStatus !== detailAsset.status;
            const hasPhotos = additionalPhotos.length > 0;

            // 1. อัพเดทสถานะ (เฉพาะเมื่อมีการเปลี่ยนแปลง)
            if (statusChanged) {
                console.log('Updating status to:', newStatus);
                const statusRes = await fetch(`http://localhost:8080/api/assets/${detailAsset.id}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                });

                if (!statusRes.ok) {
                    const errorText = await statusRes.text();
                    console.error('Status update failed:', errorText);
                    throw new Error(`Failed to update status: ${statusRes.status}`);
                }
                console.log('Status updated successfully');
            }

            // 2. อัพโหลดรูปภาพ (ถ้ามี)
            if (hasPhotos) {
                console.log('Uploading photos:', additionalPhotos.length);
                const formData = new FormData();
                additionalPhotos.forEach((photo, index) => {
                    console.log(`Adding photo ${index}:`, photo.name, photo.type);
                    formData.append('photos', photo);
                });

                const photoRes = await fetch(`http://localhost:8080/api/assets/${detailAsset.id}/photos`, {
                    method: 'POST',
                    body: formData
                });

                if (!photoRes.ok) {
                    const errorText = await photoRes.text();
                    console.error('Photo upload failed:', errorText);
                    throw new Error(`Failed to upload photos: ${photoRes.status}`);
                }
                console.log('Photos uploaded successfully');
            }

            handleCloseDetailDialog();
            fetchData();

            // แสดงข้อความตามสถานการณ์
            if (statusChanged && hasPhotos) {
                alert("อัพเดทสถานะและเพิ่มรูปภาพสำเร็จ");
            } else if (statusChanged) {
                alert("อัพเดทสถานะสำเร็จ");
            } else if (hasPhotos) {
                alert("บันทึกรูปภาพสำเร็จ");
            }
        } catch (error) {
            console.error("Error updating:", error);
            alert(`เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const getStatusChip = (status?: string) => {
        switch (status) {
            case 'PENDING':
                return <Chip label="รอตรวจสอบ" size="small" sx={{ bgcolor: '#fef3c7', color: '#d97706', fontWeight: 'bold' }} />;
            case 'CONFIRMED':
                return <Chip label="พบแล้ว" size="small" sx={{ bgcolor: '#dbeafe', color: '#2563eb', fontWeight: 'bold' }} />;
            case 'CHECKED_IN':
                return <Chip label="ยึดแล้ว" size="small" sx={{ bgcolor: '#d1fae5', color: '#059669', fontWeight: 'bold' }} />;
            default:
                return <Chip label="ไม่ระบุ" size="small" sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 'bold' }} />;
        }
    };

    const getAssetTypeIcon = (assetType?: string) => {
        const iconStyle = { fontSize: 18 };
        switch (assetType) {
            case 'เอกสาร':
                return <DescriptionIcon sx={{ ...iconStyle, color: '#3b82f6' }} />;
            case 'อุปกรณ์':
                return <BuildIcon sx={{ ...iconStyle, color: '#f59e0b' }} />;
            case 'อาคาร':
                return <ApartmentIcon sx={{ ...iconStyle, color: '#8b5cf6' }} />;
            case 'ยานพาหนะ':
                return <DirectionsCarIcon sx={{ ...iconStyle, color: '#06b6d4' }} />;
            case 'ที่ดิน':
                return <LandscapeIcon sx={{ ...iconStyle, color: '#10b981' }} />;
            case 'เงินสด':
                return <AttachMoneyIcon sx={{ ...iconStyle, color: '#ef4444' }} />;
            case 'เงินในธนาคาร':
                return <AccountBalanceIcon sx={{ ...iconStyle, color: '#14b8a6' }} />;
            case 'อื่นๆ':
                return <CategoryIcon sx={{ ...iconStyle, color: '#64748b' }} />;
            default:
                return <CategoryIcon sx={{ ...iconStyle, color: '#94a3b8' }} />;
        }
    };

    const getAssetTypeColor = (assetType?: string) => {
        switch (assetType) {
            case 'เอกสาร':
                return { bg: '#eff6ff', color: '#3b82f6', border: '#bfdbfe' };
            case 'อุปกรณ์':
                return { bg: '#fef3c7', color: '#f59e0b', border: '#fcd34d' };
            case 'อาคาร':
                return { bg: '#f3e8ff', color: '#8b5cf6', border: '#d8b4fe' };
            case 'ยานพาหนะ':
                return { bg: '#ecfeff', color: '#06b6d4', border: '#a5f3fc' };
            case 'ที่ดิน':
                return { bg: '#d1fae5', color: '#10b981', border: '#6ee7b7' };
            case 'เงินสด':
                return { bg: '#fee2e2', color: '#ef4444', border: '#fca5a5' };
            case 'เงินในธนาคาร':
                return { bg: '#ccfbf1', color: '#14b8a6', border: '#5eead4' };
            case 'อื่นๆ':
                return { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' };
            default:
                return { bg: '#f8fafc', color: '#94a3b8', border: '#e2e8f0' };
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#f8fafc' }}>
            <Header />
            <Stack direction="row" sx={{ flex: 1, overflow: 'hidden' }}>
                <Sidebar />

                <Box component="main" sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
                    <Container maxWidth="xl">

                        {/* 1. Header Section */}
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="h4" fontWeight="800" color="#1e293b" gutterBottom>
                                ตรวจสอบทรัพย์สิน
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                จัดการตำแหน่งและข้อมูลทรัพย์สินทั้งหมดในระบบ
                            </Typography>
                        </Box>

                        {/* 3. Filter & Search Section */}
                        <Paper sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden', mb: 3, p: 3 }}>
                            <Stack spacing={2.5}>
                                {/* Search Bar */}
                                <TextField
                                    placeholder="ค้นหาชื่อทรัพย์สิน, รายละเอียด, ประเภท, พิกัด..."
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    size="small"
                                    fullWidth
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon sx={{ color: '#94A3B8' }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: searchText && (
                                            <InputAdornment position="end">
                                                <IconButton size="small" onClick={() => setSearchText('')}>
                                                    <CloseIcon fontSize="small" />
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            borderRadius: 3,
                                            bgcolor: '#fff',
                                            '& fieldset': { borderColor: '#E2E8F0' },
                                            '&:hover fieldset': { borderColor: '#CBD5E1' },
                                            '&.Mui-focused fieldset': { borderColor: '#3B82F6', borderWidth: 2 }
                                        }
                                    }}
                                />

                                {/* Filters */}
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    {/* Filter by Status */}
                                    <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
                                        <InputLabel>กรองตามสถานะ</InputLabel>
                                        <Select
                                            value={filterStatus}
                                            label="กรองตามสถานะ"
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            sx={{ borderRadius: 2 }}
                                        >
                                            <MenuItem value="ALL">
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <CategoryIcon sx={{ fontSize: 18, color: '#64748b' }} />
                                                    <Typography>ทั้งหมด ({assets.length})</Typography>
                                                </Stack>
                                            </MenuItem>
                                            <MenuItem value="PENDING">
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <PendingActionsIcon sx={{ fontSize: 18, color: '#d97706' }} />
                                                    <Typography>รอตรวจสอบ ({assets.filter(a => a.status === 'PENDING').length})</Typography>
                                                </Stack>
                                            </MenuItem>
                                            <MenuItem value="CONFIRMED">
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <VerifiedIcon sx={{ fontSize: 18, color: '#2563eb' }} />
                                                    <Typography>พบแล้ว ({assets.filter(a => a.status === 'CONFIRMED').length})</Typography>
                                                </Stack>
                                            </MenuItem>
                                            <MenuItem value="CHECKED_IN">
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <GavelIcon sx={{ fontSize: 18, color: '#059669' }} />
                                                    <Typography>ยึดแล้ว ({assets.filter(a => a.status === 'CHECKED_IN').length})</Typography>
                                                </Stack>
                                            </MenuItem>
                                        </Select>
                                    </FormControl>

                                    {/* Filter by Type */}
                                    <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 220 } }}>
                                        <InputLabel>กรองตามประเภท</InputLabel>
                                        <Select
                                            value={filterType}
                                            label="กรองตามประเภท"
                                            onChange={(e) => setFilterType(e.target.value)}
                                            sx={{ borderRadius: 2 }}
                                        >
                                            <MenuItem value="ALL">ทั้งหมด ({assets.length})</MenuItem>
                                            <MenuItem value="เอกสาร">📄 เอกสาร ({assets.filter(a => a.assetType === 'เอกสาร').length})</MenuItem>
                                            <MenuItem value="อุปกรณ์">🔧 อุปกรณ์ ({assets.filter(a => a.assetType === 'อุปกรณ์').length})</MenuItem>
                                            <MenuItem value="อาคาร">🏢 อาคาร ({assets.filter(a => a.assetType === 'อาคาร').length})</MenuItem>
                                            <MenuItem value="ยานพาหนะ">🚗 ยานพาหนะ ({assets.filter(a => a.assetType === 'ยานพาหนะ').length})</MenuItem>
                                            <MenuItem value="ที่ดิน">🏞️ ที่ดิน ({assets.filter(a => a.assetType === 'ที่ดิน').length})</MenuItem>
                                            <MenuItem value="เงินสด">💵 เงินสด ({assets.filter(a => a.assetType === 'เงินสด').length})</MenuItem>
                                            <MenuItem value="เงินในธนาคาร">🏦 เงินในธนาคาร ({assets.filter(a => a.assetType === 'เงินในธนาคาร').length})</MenuItem>
                                            <MenuItem value="อื่นๆ">📦 อื่นๆ ({assets.filter(a => a.assetType === 'อื่นๆ').length})</MenuItem>
                                        </Select>
                                    </FormControl>

                                    {/* Reset Filters Button */}
                                    {(filterStatus !== 'ALL' || filterType !== 'ALL' || searchText) && (
                                        <Button
                                            variant="outlined"
                                            startIcon={<CloseIcon />}
                                            onClick={() => {
                                                setFilterStatus('ALL');
                                                setFilterType('ALL');
                                                setSearchText('');
                                            }}
                                            sx={{
                                                borderRadius: 2,
                                                textTransform: 'none',
                                                borderColor: '#E2E8F0',
                                                color: '#64748b',
                                                '&:hover': { borderColor: '#CBD5E1', bgcolor: '#F8FAFC' }
                                            }}
                                        >
                                            ล้างตัวกรอง
                                        </Button>
                                    )}

                                    {/* Results Count */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
                                        <Chip
                                            label={`แสดง ${filteredAssets.length} จาก ${assets.length} รายการ`}
                                            sx={{
                                                bgcolor: '#EFF6FF',
                                                color: '#3B82F6',
                                                fontWeight: 'bold',
                                                borderRadius: 2
                                            }}
                                        />
                                    </Box>
                                </Stack>
                            </Stack>
                        </Paper>

                        {/* 4. Main Content Card */}
                        <Paper sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }}>

                            {/* Toolbar */}
                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                sx={{ p: 3, borderBottom: '1px solid #f1f5f9', bgcolor: '#fff' }}
                            >
                                <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <MapIcon color="primary" /> รายการทรัพย์สิน
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={handleOpenAdd}
                                    sx={{
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        fontWeight: 'bold',
                                        bgcolor: '#3b82f6',
                                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                                        '&:hover': { bgcolor: '#2563eb' }
                                    }}
                                >
                                    เพิ่มทรัพย์สินใหม่
                                </Button>
                            </Stack>

                            {/* Modern Table */}
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                            <TableCell sx={{ fontWeight: '600', color: '#64748b', py: 2 }} align="center">#</TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: '#64748b', py: 2 }}>ชื่อทรัพย์สิน</TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: '#64748b', py: 2 }} align="center">ประเภท</TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: '#64748b', py: 2 }} align="center">จำนวน</TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: '#64748b', py: 2 }} align="center">มูลค่า</TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: '#64748b', py: 2 }} align="center">สถานะ</TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: '#64748b', py: 2 }}>รายละเอียด</TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: '#64748b', py: 2 }} align="center">พิกัด</TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: '#64748b', py: 2 }} align="center">จัดการ</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredAssets.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                                    <Inventory2OutlinedIcon sx={{ fontSize: 48, opacity: 0.2, mb: 1 }} />
                                                    <Typography variant="h6" color="#64748B" fontWeight="500" gutterBottom>
                                                        {searchText || filterStatus !== 'ALL' || filterType !== 'ALL'
                                                            ? 'ไม่พบทรัพย์สินที่ตรงกับการค้นหา'
                                                            : 'ไม่พบข้อมูลทรัพย์สิน'}
                                                    </Typography>
                                                    {(searchText || filterStatus !== 'ALL' || filterType !== 'ALL') && (
                                                        <Typography variant="body2" color="#94A3B8">
                                                            ลองเปลี่ยนเงื่อนไขการค้นหาหรือล้างตัวกรอง
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredAssets.map((asset, index) => (
                                                <TableRow key={asset.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                    <TableCell align="center">
                                                        <Stack direction="column" spacing={0.5} alignItems="center">
                                                            <Typography fontWeight="600" color="#64748b">
                                                                {index + 1}
                                                            </Typography>
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography fontWeight="600" color="#334155">{asset.name}</Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            icon={getAssetTypeIcon(asset.assetType)}
                                                            label={asset.assetType || '-'}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: getAssetTypeColor(asset.assetType).bg,
                                                                color: getAssetTypeColor(asset.assetType).color,
                                                                fontWeight: '600',
                                                                border: `1px solid ${getAssetTypeColor(asset.assetType).border}`
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Typography fontWeight="600" color="#334155">{asset.quantity || 1}</Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        {asset.totalValue != null && (asset.totalValue > 0 || asset.assetType === 'เงินสด' || asset.assetType === 'เงินในธนาคาร') ? (
                                                            <Typography variant="body2" fontWeight="600" color="#10b981" noWrap>
                                                                {asset.totalValue.toLocaleString()}
                                                                <Typography component="span" variant="caption" color="text.secondary" ml={0.5}>
                                                                    {asset.valueUnit || 'บาท'}
                                                                </Typography>
                                                            </Typography>
                                                        ) : (
                                                            <Typography variant="body2" color="#94a3b8">-</Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        {getStatusChip(asset.status)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" color="#64748b" noWrap sx={{ maxWidth: 200 }}>
                                                            {asset.description || "-"}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            icon={<PlaceIcon style={{ fontSize: 16 }} />}
                                                            label={`${asset.latitude.toFixed(4)}, ${asset.longitude.toFixed(4)}`}
                                                            size="small"
                                                            onClick={() => handleNavigate(asset.latitude, asset.longitude)}
                                                            sx={{
                                                                bgcolor: '#eff6ff',
                                                                color: '#3b82f6',
                                                                fontWeight: '600',
                                                                cursor: 'pointer',
                                                                '&:hover': { bgcolor: '#dbeafe' },
                                                                border: '1px solid #bfdbfe'
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Stack direction="row" spacing={1} justifyContent="center">
                                                            <Tooltip title="ดูรายละเอียด">
                                                                <IconButton
                                                                    onClick={() => handleOpenDetailDialog(asset)}
                                                                    sx={{
                                                                        color: '#8b5cf6',
                                                                        bgcolor: '#f3e8ff',
                                                                        '&:hover': { bgcolor: '#e9d5ff' }
                                                                    }}
                                                                >
                                                                    <VisibilityIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            {asset.status === 'PENDING' && (
                                                                <Tooltip title="ยืนยันการพบหลักฐาน">
                                                                    <IconButton
                                                                        onClick={() => handleOpenConfirmDialog(asset)}
                                                                        sx={{
                                                                            color: '#2563eb',
                                                                            bgcolor: '#dbeafe',
                                                                            '&:hover': { bgcolor: '#bfdbfe' }
                                                                        }}
                                                                    >
                                                                        <CheckCircleIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                            {asset.status === 'CONFIRMED' && (
                                                                <Tooltip title="ยึดหลักฐาน">
                                                                    <IconButton
                                                                        onClick={() => handleSeizeAsset(asset.id!)}
                                                                        sx={{
                                                                            color: '#059669',
                                                                            bgcolor: '#d1fae5',
                                                                            '&:hover': { bgcolor: '#a7f3d0' }
                                                                        }}
                                                                    >
                                                                        <GavelIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                            <Tooltip title="นำทาง">
                                                                <IconButton
                                                                    onClick={() => handleNavigate(asset.latitude, asset.longitude)}
                                                                    sx={{
                                                                        color: '#06b6d4',
                                                                        bgcolor: '#ecfeff',
                                                                        '&:hover': { bgcolor: '#cffafe' }
                                                                    }}
                                                                >
                                                                    <NavigationIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="แก้ไข">
                                                                <IconButton
                                                                    onClick={() => handleOpenEdit(asset)}
                                                                    sx={{
                                                                        color: '#64748b',
                                                                        bgcolor: '#f1f5f9',
                                                                        '&:hover': { bgcolor: '#e2e8f0', color: '#334155' }
                                                                    }}
                                                                >
                                                                    <EditIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>

                        {/* --- Modern Dialog (ใช้ Stack จัด Layout) --- */}
                        <Dialog
                            open={open}
                            onClose={handleClose}
                            maxWidth="md"
                            fullWidth
                            scroll="paper"
                            PaperProps={{ sx: { borderRadius: 3 } }}
                        >
                            <DialogTitle sx={{ borderBottom: '1px solid #f1f5f9', py: 2, px: 3, fontWeight: 'bold' }}>
                                {isEditMode ? 'แก้ไขข้อมูลทรัพย์สิน' : 'เพิ่มทรัพย์สินใหม่'}
                            </DialogTitle>

                            <DialogContent dividers sx={{ p: 3 }}>
                                <Stack spacing={2.5}>
                                    {/* ข้อมูลพื้นฐาน */}
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight="bold" color="primary" mb={1.5} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <DescriptionIcon fontSize="small" />
                                            ข้อมูลพื้นฐาน
                                        </Typography>
                                        <Stack spacing={2}>
                                            <TextField
                                                label="ชื่อทรัพย์สิน"
                                                fullWidth
                                                required
                                                size="small"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                InputProps={{ sx: { borderRadius: 2 } }}
                                            />
                                            <TextField
                                                label="รายละเอียด"
                                                fullWidth
                                                multiline
                                                rows={2}
                                                size="small"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                InputProps={{ sx: { borderRadius: 2 } }}
                                            />
                                            <Stack direction="row" spacing={2}>
                                                <FormControl fullWidth size="small">
                                                    <InputLabel>ประเภท</InputLabel>
                                                    <Select
                                                        value={formData.assetType}
                                                        label="ประเภท"
                                                        onChange={(e) => setFormData({ ...formData, assetType: e.target.value })}
                                                        sx={{ borderRadius: 2 }}
                                                    >
                                                        <MenuItem value="เอกสาร">📄 เอกสาร</MenuItem>
                                                        <MenuItem value="อุปกรณ์">🔧 อุปกรณ์</MenuItem>
                                                        <MenuItem value="อาคาร">🏢 อาคาร</MenuItem>
                                                        <MenuItem value="ยานพาหนะ">🚗 ยานพาหนะ</MenuItem>
                                                        <MenuItem value="ที่ดิน">🏞️ ที่ดิน</MenuItem>
                                                        <MenuItem value="เงินสด">💵 เงินสด</MenuItem>
                                                        <MenuItem value="เงินในธนาคาร">🏦 เงินในธนาคาร</MenuItem>
                                                        <MenuItem value="อื่นๆ">📦 อื่นๆ</MenuItem>
                                                    </Select>
                                                </FormControl>
                                                {formData.assetType !== 'เงินสด' && formData.assetType !== 'เงินในธนาคาร' && (
                                                    <TextField
                                                        label="จำนวน"
                                                        type="number"
                                                        size="small"
                                                        sx={{ width: 120 }}
                                                        value={formData.quantity}
                                                        onChange={(e) => {
                                                            const qty = parseInt(e.target.value) || 1;
                                                            setFormData({ ...formData, quantity: qty });
                                                            setIndividualValueList(prev => {
                                                                const newList = [...prev];
                                                                while (newList.length < qty) newList.push(0);
                                                                return newList.slice(0, qty);
                                                            });
                                                        }}
                                                        InputProps={{
                                                            sx: { borderRadius: 2 },
                                                            inputProps: { min: 1 }
                                                        }}
                                                    />
                                                )}
                                            </Stack>
                                        </Stack>
                                    </Box>

                                    {formData.assetType === 'เงินสด' && (
                                        <Box sx={{ bgcolor: '#fef9e7', p: 2, borderRadius: 2, border: '1px solid #fde68a' }}>
                                            <Typography variant="subtitle2" fontWeight="bold" color="#92400e" mb={1.5} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                💵 จำนวนเงินสด
                                            </Typography>
                                            <Stack spacing={2}>
                                                <Stack direction="row" spacing={2}>
                                                    <TextField
                                                        label="จำนวนเงินสด"
                                                        type="number"
                                                        fullWidth
                                                        size="small"
                                                        value={formData.totalValue}
                                                        onChange={(e) => setFormData({ ...formData, totalValue: parseFloat(e.target.value) || 0 })}
                                                        InputProps={{
                                                            sx: { borderRadius: 2 },
                                                            inputProps: { min: 0, step: 0.01 }
                                                        }}
                                                    />
                                                    <FormControl size="small" sx={{ minWidth: 120 }}>
                                                        <InputLabel>หน่วย</InputLabel>
                                                        <Select
                                                            value={formData.valueUnit}
                                                            label="หน่วย"
                                                            onChange={(e) => setFormData({ ...formData, valueUnit: e.target.value })}
                                                            sx={{ borderRadius: 2 }}
                                                        >
                                                            <MenuItem value="บาท">บาท</MenuItem>
                                                            <MenuItem value="ล้านบาท">ล้านบาท</MenuItem>
                                                            <MenuItem value="USD">USD</MenuItem>
                                                            <MenuItem value="EUR">EUR</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                </Stack>
                                                {formData.totalValue > 0 && (
                                                    <Box sx={{ bgcolor: '#fef3c7', p: 1.5, borderRadius: 2 }}>
                                                        <Typography variant="body2" fontWeight="bold" color="#92400e">
                                                            จำนวนเงินสด: {formData.totalValue.toLocaleString()} {formData.valueUnit}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Stack>
                                        </Box>
                                    )}

                                    {formData.assetType === 'เงินในธนาคาร' && (
                                        <Box sx={{ bgcolor: '#f0fdfa', p: 2, borderRadius: 2, border: '1px solid #5eead4' }}>
                                            <Typography variant="subtitle2" fontWeight="bold" color="#0f766e" mb={1.5} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <AccountBalanceIcon fontSize="small" />
                                                ข้อมูลบัญชีธนาคาร
                                            </Typography>
                                            <Stack spacing={2}>
                                                {bankDetailsList.map((bank, index) => (
                                                    <Paper key={index} sx={{ p: 2, bgcolor: '#fff', borderRadius: 2, border: '1px solid #99f6e4' }}>
                                                        <Stack spacing={1.5}>
                                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                                <Typography variant="caption" fontWeight="bold" color="#0f766e">
                                                                    บัญชีที่ {index + 1}
                                                                </Typography>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => {
                                                                        const newList = bankDetailsList.filter((_, i) => i !== index);
                                                                        setBankDetailsList(newList);
                                                                    }}
                                                                    sx={{ color: '#dc2626' }}
                                                                >
                                                                    <CloseIcon fontSize="small" />
                                                                </IconButton>
                                                            </Stack>
                                                            <TextField
                                                                label="ชื่อธนาคาร"
                                                                size="small"
                                                                fullWidth
                                                                value={bank.bankName}
                                                                onChange={(e) => {
                                                                    const newList = [...bankDetailsList];
                                                                    newList[index].bankName = e.target.value;
                                                                    setBankDetailsList(newList);
                                                                }}
                                                                InputProps={{ sx: { borderRadius: 2 } }}
                                                            />
                                                            <TextField
                                                                label="เลขที่บัญชี"
                                                                size="small"
                                                                fullWidth
                                                                value={bank.accountNumber}
                                                                onChange={(e) => {
                                                                    const newList = [...bankDetailsList];
                                                                    newList[index].accountNumber = e.target.value;
                                                                    setBankDetailsList(newList);
                                                                }}
                                                                InputProps={{ sx: { borderRadius: 2 } }}
                                                            />
                                                            <TextField
                                                                label="ชื่อบัญชี"
                                                                size="small"
                                                                fullWidth
                                                                value={bank.accountName}
                                                                onChange={(e) => {
                                                                    const newList = [...bankDetailsList];
                                                                    newList[index].accountName = e.target.value;
                                                                    setBankDetailsList(newList);
                                                                }}
                                                                InputProps={{ sx: { borderRadius: 2 } }}
                                                            />
                                                            <TextField
                                                                label="ยอดเงิน (บาท)"
                                                                type="number"
                                                                size="small"
                                                                fullWidth
                                                                value={bank.amount}
                                                                onChange={(e) => {
                                                                    const newList = [...bankDetailsList];
                                                                    newList[index].amount = parseFloat(e.target.value) || 0;
                                                                    setBankDetailsList(newList);
                                                                }}
                                                                InputProps={{
                                                                    sx: { borderRadius: 2 },
                                                                    inputProps: { min: 0, step: 0.01 }
                                                                }}
                                                            />
                                                        </Stack>
                                                    </Paper>
                                                ))}
                                                <Button
                                                    variant="outlined"
                                                    startIcon={<AddIcon />}
                                                    onClick={() => {
                                                        setBankDetailsList([...bankDetailsList, {
                                                            bankName: '',
                                                            accountNumber: '',
                                                            accountName: '',
                                                            amount: 0
                                                        }]);
                                                    }}
                                                    sx={{ borderRadius: 2, textTransform: 'none' }}
                                                >
                                                    เพิ่มบัญชีธนาคาร
                                                </Button>
                                                {bankDetailsList.length > 0 && (
                                                    <Box sx={{ bgcolor: '#ccfbf1', p: 1.5, borderRadius: 2 }}>
                                                        <Typography variant="body2" fontWeight="bold" color="#0f766e">
                                                            ยอดรวมทั้งหมด: {bankDetailsList.reduce((sum, bank) => sum + (bank.amount || 0), 0).toLocaleString()} บาท
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Stack>
                                        </Box>
                                    )}

                                    {/* มูลค่าสำหรับประเภทอื่นๆ */}
                                    {formData.assetType !== 'เงินสด' && formData.assetType !== 'เงินในธนาคาร' && (
                                        <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                            <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" mb={1.5} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CategoryIcon fontSize="small" />
                                                มูลค่าหลักฐาน (ไม่บังคับ)
                                            </Typography>
                                            <Stack spacing={2}>
                                                <Stack direction="row" spacing={2}>
                                                    <TextField
                                                        label="มูลค่ารวม"
                                                        type="number"
                                                        fullWidth
                                                        size="small"
                                                        value={formData.totalValue}
                                                        onChange={(e) => setFormData({ ...formData, totalValue: parseFloat(e.target.value) || 0 })}
                                                        InputProps={{
                                                            sx: { borderRadius: 2 },
                                                            inputProps: { min: 0, step: 0.01 }
                                                        }}
                                                    />
                                                    <FormControl size="small" sx={{ minWidth: 120 }}>
                                                        <InputLabel>หน่วย</InputLabel>
                                                        <Select
                                                            value={formData.valueUnit}
                                                            label="หน่วย"
                                                            onChange={(e) => setFormData({ ...formData, valueUnit: e.target.value })}
                                                            sx={{ borderRadius: 2 }}
                                                        >
                                                            <MenuItem value="บาท">บาท</MenuItem>
                                                            <MenuItem value="ล้านบาท">ล้านบาท</MenuItem>
                                                            <MenuItem value="USD">USD</MenuItem>
                                                            <MenuItem value="EUR">EUR</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                </Stack>

                                                {/* Individual Values - แสดงแบบกริด 2 คอลัมน์ */}
                                                {formData.quantity > 1 && (
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary" fontWeight="600" display="block" mb={1}>
                                                            มูลค่าแต่ละชิ้น:
                                                        </Typography>
                                                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
                                                            {Array.from({ length: formData.quantity }).map((_, index) => (
                                                                <TextField
                                                                    key={index}
                                                                    label={`#${index + 1}`}
                                                                    type="number"
                                                                    size="small"
                                                                    value={individualValueList[index] || 0}
                                                                    onChange={(e) => {
                                                                        const newList = [...individualValueList];
                                                                        newList[index] = parseFloat(e.target.value) || 0;
                                                                        setIndividualValueList(newList);
                                                                        const total = newList.reduce((sum, val) => sum + val, 0);
                                                                        setFormData(prev => ({ ...prev, totalValue: total }));
                                                                    }}
                                                                    InputProps={{
                                                                        sx: { borderRadius: 2 },
                                                                        inputProps: { min: 0, step: 0.01 }
                                                                    }}
                                                                />
                                                            ))}
                                                        </Box>
                                                    </Box>
                                                )}
                                            </Stack>
                                        </Box>
                                    )}

                                    {/* ตำแหน่งบนแผนที่ */}
                                    <Box>
                                        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                                            <Typography variant="subtitle2" fontWeight="bold" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <PlaceIcon fontSize="small" />
                                                ตำแหน่งบนแผนที่
                                            </Typography>
                                            {hasLocation ?
                                                <Chip label="✓ เลือกแล้ว" color="success" size="small" /> :
                                                <Chip label="⚠ กรุณาปักหมุด" color="error" size="small" />
                                            }
                                        </Stack>

                                        {/* ค้นหาสถานที่ */}
                                        <TextField
                                            placeholder="ค้นหาสถานที่ เช่น สนามหลวง, Siam Paragon"
                                            fullWidth
                                            size="small"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSearchLocation()}
                                            sx={{ mb: 1.5 }}
                                            InputProps={{
                                                sx: { borderRadius: 2 },
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton onClick={handleSearchLocation} edge="end" size="small">
                                                            <SearchIcon />
                                                        </IconButton>
                                                    </InputAdornment>
                                                )
                                            }}
                                        />

                                        {/* แผนที่ */}
                                        <Box sx={{
                                            height: '350px',
                                            width: '100%',
                                            border: '2px solid #e2e8f0',
                                            borderRadius: 2,
                                            overflow: 'hidden'
                                        }}>
                                            <AssetMap
                                                assets={hasLocation ? [{
                                                    id: 999,
                                                    name: formData.name || 'ตำแหน่งที่เลือก',
                                                    description: formData.description,
                                                    latitude: formData.lat,
                                                    longitude: formData.lng
                                                }] : []}
                                                isEditable={true}
                                                onLocationSelect={handleLocationSelect}
                                                center={mapCenter}
                                            />
                                        </Box>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1}>
                                            <Typography variant="caption" color="text.secondary">
                                                💡 คลิกบนแผนที่เพื่อปักหมุด
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" fontWeight="600">
                                                {formData.lat.toFixed(5)}, {formData.lng.toFixed(5)}
                                            </Typography>
                                        </Stack>
                                    </Box>
                                </Stack>
                            </DialogContent>

                            <DialogActions sx={{ p: 3, borderTop: '1px solid #f1f5f9', bgcolor: '#f8fafc' }}>
                                <Button onClick={handleClose} sx={{ color: '#64748b', fontWeight: '600' }}>
                                    ยกเลิก
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    variant="contained"
                                    disabled={!formData.name || !hasLocation}
                                    sx={{
                                        borderRadius: 2,
                                        boxShadow: 'none',
                                        fontWeight: 'bold',
                                        px: 3,
                                        bgcolor: '#3b82f6',
                                        '&:hover': { bgcolor: '#2563eb', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }
                                    }}
                                >
                                    {isEditMode ? 'บันทึกการแก้ไข' : 'ยืนยันการเพิ่ม'}
                                </Button>
                            </DialogActions>
                        </Dialog>

                        {/* Detail Dialog - แสดงรายละเอียดหลักฐาน */}
                        <Dialog
                            open={detailDialog}
                            onClose={handleCloseDetailDialog}
                            maxWidth="sm"
                            fullWidth
                            PaperProps={{
                                sx: {
                                    borderRadius: 3,
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                }
                            }}
                        >
                            <DialogTitle sx={{ py: 2.5, px: 3, color: '#fff' }}>
                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                    <Stack direction="row" alignItems="center" spacing={1.5}>
                                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 40, height: 40 }}>
                                            <InfoIcon sx={{ color: '#fff' }} />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="h6" fontWeight="bold">
                                                รายละเอียดหลักฐาน
                                            </Typography>
                                            <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                                ข้อมูลและการจัดการสถานะ
                                            </Typography>
                                        </Box>
                                    </Stack>
                                    <IconButton
                                        size="small"
                                        onClick={handleCloseDetailDialog}
                                        sx={{
                                            color: '#fff',
                                            bgcolor: 'rgba(255,255,255,0.1)',
                                            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                                        }}
                                    >
                                        <CloseIcon />
                                    </IconButton>
                                </Stack>
                            </DialogTitle>

                            <DialogContent sx={{ p: 0, bgcolor: '#fff' }}>
                                {/* ชื่อหลักฐาน - Header */}
                                <Box sx={{ px: 3, pt: 3, pb: 2, bgcolor: '#f8fafc' }}>
                                    <Typography variant="h5" fontWeight="bold" color="#1e293b">
                                        {detailAsset?.name}
                                    </Typography>
                                    <Stack direction="row" spacing={1} mt={1.5} flexWrap="wrap">
                                        <Chip
                                            icon={getAssetTypeIcon(detailAsset?.assetType)}
                                            label={detailAsset?.assetType}
                                            size="small"
                                            sx={{
                                                bgcolor: getAssetTypeColor(detailAsset?.assetType).bg,
                                                color: getAssetTypeColor(detailAsset?.assetType).color,
                                                fontWeight: '600',
                                                border: `1px solid ${getAssetTypeColor(detailAsset?.assetType).border}`
                                            }}
                                        />
                                        {detailAsset?.assetType !== 'เงินสด' && detailAsset?.assetType !== 'เงินในธนาคาร' && (
                                            <Chip
                                                label={`จำนวน: ${detailAsset?.quantity || 1}`}
                                                size="small"
                                                sx={{ bgcolor: '#e0e7ff', color: '#4f46e5', fontWeight: '600' }}
                                            />
                                        )}
                                    </Stack>
                                </Box>

                                {/* รายละเอียดหลักฐาน */}
                                <Box sx={{ px: 3, py: 2.5 }}>
                                    <Stack spacing={2.5}>
                                        {/* รายละเอียด */}
                                        {detailAsset?.description && (
                                            <Box>
                                                <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                                                    <DescriptionIcon sx={{ fontSize: 18, color: '#64748b' }} />
                                                    <Typography variant="caption" color="text.secondary" fontWeight="700" textTransform="uppercase" letterSpacing={0.5}>
                                                        รายละเอียด
                                                    </Typography>
                                                </Stack>
                                                <Typography variant="body2" color="#334155" sx={{ pl: 3.5 }}>
                                                    {detailAsset.description}
                                                </Typography>
                                            </Box>
                                        )}

                                        {/* ตำแหน่งพิกัด */}
                                        <Box>
                                            <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                                                <PlaceIcon sx={{ fontSize: 18, color: '#64748b' }} />
                                                <Typography variant="caption" color="text.secondary" fontWeight="700" textTransform="uppercase" letterSpacing={0.5}>
                                                    ตำแหน่งพิกัด
                                                </Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ pl: 3.5 }}>
                                                <Typography variant="body2" fontWeight="600" color="#3b82f6">
                                                    {detailAsset?.latitude.toFixed(5)}, {detailAsset?.longitude.toFixed(5)}
                                                </Typography>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => detailAsset && handleNavigate(detailAsset.latitude, detailAsset.longitude)}
                                                    sx={{
                                                        color: '#06b6d4',
                                                        bgcolor: '#ecfeff',
                                                        width: 28,
                                                        height: 28,
                                                        '&:hover': { bgcolor: '#cffafe' }
                                                    }}
                                                >
                                                    <NavigationIcon sx={{ fontSize: 16 }} />
                                                </IconButton>
                                            </Stack>
                                        </Box>

                                        {/* Timeline - ข้อมูลวันเวลา */}
                                        {(detailAsset?.confirmedAt || detailAsset?.checkedInAt) && (
                                            <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2 }}>
                                                <Typography variant="caption" color="text.secondary" fontWeight="700" textTransform="uppercase" letterSpacing={0.5} mb={1} display="block">
                                                    Timeline
                                                </Typography>
                                                <Stack spacing={1}>
                                                    {detailAsset?.confirmedAt && (
                                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                                            <VerifiedIcon sx={{ fontSize: 16, color: '#2563eb' }} />
                                                            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60 }}>พบ</Typography>
                                                            <Typography variant="body2" color="#334155" fontWeight="600">
                                                                {new Date(detailAsset.confirmedAt).toLocaleString('th-TH', {
                                                                    month: 'short', day: 'numeric', year: '2-digit', hour: '2-digit', minute: '2-digit'
                                                                })}
                                                            </Typography>
                                                        </Stack>
                                                    )}
                                                    {detailAsset?.checkedInAt && (
                                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                                            <GavelIcon sx={{ fontSize: 16, color: '#059669' }} />
                                                            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60 }}>ยึด</Typography>
                                                            <Typography variant="body2" color="#334155" fontWeight="600">
                                                                {new Date(detailAsset.checkedInAt).toLocaleString('th-TH', {
                                                                    month: 'short', day: 'numeric', year: '2-digit', hour: '2-digit', minute: '2-digit'
                                                                })}
                                                            </Typography>
                                                        </Stack>
                                                    )}
                                                </Stack>
                                            </Box>
                                        )}

                                        {/* บันทึกเพิ่มเติม */}
                                        {detailAsset?.confirmNotes && (
                                            <Box>
                                                <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                                                    <DescriptionIcon sx={{ fontSize: 18, color: '#64748b' }} />
                                                    <Typography variant="caption" color="text.secondary" fontWeight="700" textTransform="uppercase" letterSpacing={0.5}>
                                                        บันทึกเพิ่มเติม
                                                    </Typography>
                                                </Stack>
                                                <Typography variant="body2" color="#334155" sx={{ pl: 3.5 }}>
                                                    {detailAsset.confirmNotes}
                                                </Typography>
                                            </Box>
                                        )}

                                        {/* มูลค่าหลักฐาน - เงินสด */}
                                        {detailAsset?.assetType === 'เงินสด' && detailAsset?.totalValue != null && (
                                            <Box sx={{ bgcolor: '#fef9e7', p: 2, borderRadius: 2, border: '1px solid #fde68a' }}>
                                                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                                                    <Typography variant="caption" color="#92400e" fontWeight="700" textTransform="uppercase" letterSpacing={0.5}>
                                                        💵 จำนวนเงินสด
                                                    </Typography>
                                                </Stack>
                                                <Typography variant="h6" color="#92400e" fontWeight="bold">
                                                    {detailAsset.totalValue.toLocaleString()} {detailAsset.valueUnit || 'บาท'}
                                                </Typography>
                                            </Box>
                                        )}

                                        {/* มูลค่าหลักฐาน - เงินในธนาคาร */}
                                        {detailAsset?.assetType === 'เงินในธนาคาร' && detailAsset?.bankDetails && (() => {
                                            try {
                                                const banks = JSON.parse(detailAsset.bankDetails);
                                                if (banks.length > 0) {
                                                    return (
                                                        <Box sx={{ bgcolor: '#f0fdfa', p: 2, borderRadius: 2, border: '1px solid #5eead4' }}>
                                                            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                                                                <Typography variant="caption" color="#0f766e" fontWeight="700" textTransform="uppercase" letterSpacing={0.5}>
                                                                    🏦 ข้อมูลบัญชีธนาคาร
                                                                </Typography>
                                                            </Stack>
                                                            <Stack spacing={1.5}>
                                                                {banks.map((bank: { bankName: string; accountNumber: string; accountName: string; amount: number }, idx: number) => (
                                                                    <Box key={idx} sx={{ bgcolor: '#fff', p: 1.5, borderRadius: 1.5, border: '1px solid #99f6e4' }}>
                                                                        <Stack spacing={0.5}>
                                                                            <Typography variant="caption" color="#0f766e" fontWeight="bold">
                                                                                บัญชีที่ {idx + 1}
                                                                            </Typography>
                                                                            <Typography variant="body2" color="#334155">
                                                                                <strong>ธนาคาร:</strong> {bank.bankName}
                                                                            </Typography>
                                                                            <Typography variant="body2" color="#334155">
                                                                                <strong>เลขที่บัญชี:</strong> {bank.accountNumber}
                                                                            </Typography>
                                                                            <Typography variant="body2" color="#334155">
                                                                                <strong>ชื่อบัญชี:</strong> {bank.accountName}
                                                                            </Typography>
                                                                            <Typography variant="body2" color="#0f766e" fontWeight="bold">
                                                                                <strong>ยอดเงิน:</strong> {bank.amount.toLocaleString()} บาท
                                                                            </Typography>
                                                                        </Stack>
                                                                    </Box>
                                                                ))}
                                                            </Stack>
                                                            {detailAsset.totalValue != null && (
                                                                <Box sx={{ bgcolor: '#ccfbf1', p: 1.5, borderRadius: 1.5, mt: 1.5 }}>
                                                                    <Typography variant="body2" fontWeight="bold" color="#0f766e">
                                                                        ยอดรวมทั้งหมด: {detailAsset.totalValue.toLocaleString()} {detailAsset.valueUnit || 'บาท'}
                                                                    </Typography>
                                                                </Box>
                                                            )}
                                                        </Box>
                                                    );
                                                }
                                            } catch {
                                                return null;
                                            }
                                            return null;
                                        })()}

                                        {/* มูลค่าหลักฐาน - ประเภทอื่นๆ */}
                                        {detailAsset?.assetType !== 'เงินสด' && detailAsset?.assetType !== 'เงินในธนาคาร' && detailAsset?.totalValue != null && detailAsset.totalValue > 0 && (
                                            <Box sx={{ bgcolor: '#f0fdf4', p: 2, borderRadius: 2, border: '1px solid #86efac' }}>
                                                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                                                    <CategoryIcon sx={{ fontSize: 18, color: '#10b981' }} />
                                                    <Typography variant="caption" color="#059669" fontWeight="700" textTransform="uppercase" letterSpacing={0.5}>
                                                        มูลค่าหลักฐาน
                                                    </Typography>
                                                </Stack>
                                                <Typography variant="h6" color="#10b981" fontWeight="bold">
                                                    {detailAsset.totalValue.toLocaleString()} {detailAsset.valueUnit || 'บาท'}
                                                </Typography>

                                                {/* มูลค่าแต่ละชิ้น */}
                                                {detailAsset.individualValues && (() => {
                                                    try {
                                                        const values = JSON.parse(detailAsset.individualValues);
                                                        if (values.length > 1) {
                                                            return (
                                                                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid #bbf7d0' }}>
                                                                    <Typography variant="caption" color="#059669" fontWeight="600" display="block" mb={0.5}>
                                                                        รายละเอียดแต่ละชิ้น:
                                                                    </Typography>
                                                                    <Stack direction="row" spacing={1} flexWrap="wrap">
                                                                        {values.map((val: number, idx: number) => (
                                                                            <Chip
                                                                                key={idx}
                                                                                label={`#${idx + 1}: ${val.toLocaleString()} ${detailAsset.valueUnit || 'บาท'}`}
                                                                                size="small"
                                                                                sx={{
                                                                                    bgcolor: '#fff',
                                                                                    color: '#059669',
                                                                                    fontWeight: '600',
                                                                                    border: '1px solid #86efac'
                                                                                }}
                                                                            />
                                                                        ))}
                                                                    </Stack>
                                                                </Box>
                                                            );
                                                        }
                                                    } catch {
                                                        return null;
                                                    }
                                                    return null;
                                                })()}
                                            </Box>
                                        )}

                                        {/* รูปภาพหลักฐาน */}
                                        {detailAsset?.photoUrls && (() => {
                                            try {
                                                const urls = JSON.parse(detailAsset.photoUrls);
                                                if (urls.length > 0) {
                                                    return (
                                                        <Box>
                                                            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                                                                <PhotoLibraryIcon sx={{ fontSize: 18, color: '#64748b' }} />
                                                                <Typography variant="caption" color="text.secondary" fontWeight="700" textTransform="uppercase" letterSpacing={0.5}>
                                                                    รูปภาพหลักฐาน ({urls.length})
                                                                </Typography>
                                                            </Stack>
                                                            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ pl: 3.5 }}>
                                                                {urls.map((url: string, index: number) => (
                                                                    <Box
                                                                        key={index}
                                                                        sx={{
                                                                            width: 100,
                                                                            height: 100,
                                                                            borderRadius: 2,
                                                                            overflow: 'hidden',
                                                                            border: '2px solid #e2e8f0',
                                                                            cursor: 'pointer',
                                                                            transition: 'all 0.2s',
                                                                            '&:hover': {
                                                                                border: '2px solid #3b82f6',
                                                                                transform: 'scale(1.05)',
                                                                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                                                                            }
                                                                        }}
                                                                        onClick={() => window.open(`http://localhost:8080${url}`, '_blank')}
                                                                    >
                                                                        <img
                                                                            src={`http://localhost:8080${url}`}
                                                                            alt={`Evidence ${index + 1}`}
                                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                        />
                                                                    </Box>
                                                                ))}
                                                            </Stack>
                                                        </Box>
                                                    );
                                                }
                                            } catch {
                                                return null;
                                            }
                                            return null;
                                        })()}
                                    </Stack>
                                </Box>

                                {/* เพิ่มรูปภาพหลักฐาน */}
                                <Box sx={{ px: 3, py: 2.5, borderTop: '1px solid #e2e8f0' }}>
                                    <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                                        <PhotoLibraryIcon sx={{ fontSize: 18, color: '#3b82f6' }} />
                                        <Typography variant="subtitle2" fontWeight="bold" color="#3b82f6">
                                            เพิ่มรูปภาพหลักฐาน
                                        </Typography>
                                    </Stack>

                                    <Button
                                        variant="outlined"
                                        startIcon={<PhotoLibraryIcon />}
                                        component="label"
                                        fullWidth
                                        sx={{ borderRadius: 2, textTransform: 'none', mb: 2 }}
                                    >
                                        เลือกรูปภาพเพิ่มเติม
                                        <input
                                            type="file"
                                            hidden
                                            accept="image/*"
                                            multiple
                                            onChange={handleAdditionalPhotoChange}
                                        />
                                    </Button>

                                    {/* แสดง Preview รูปภาพใหม่ */}
                                    {additionalPhotoPreview.length > 0 && (
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" gutterBottom>
                                                รูปภาพที่เลือก ({additionalPhotoPreview.length} รูป)
                                            </Typography>
                                            <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
                                                {additionalPhotoPreview.map((preview, index) => (
                                                    <Box
                                                        key={index}
                                                        sx={{
                                                            position: 'relative',
                                                            width: 100,
                                                            height: 100,
                                                            borderRadius: 2,
                                                            overflow: 'hidden',
                                                            border: '2px solid #3b82f6'
                                                        }}
                                                    >
                                                        <img
                                                            src={preview}
                                                            alt={`New ${index + 1}`}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleRemoveAdditionalPhoto(index)}
                                                            sx={{
                                                                position: 'absolute',
                                                                top: 2,
                                                                right: 2,
                                                                bgcolor: 'rgba(0,0,0,0.6)',
                                                                color: 'white',
                                                                '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
                                                            }}
                                                        >
                                                            <CloseIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </Box>
                                    )}
                                </Box>

                                {/* จัดการสถานะ */}
                                <Box sx={{ px: 3, py: 2.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                                    <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                                        <BuildIcon sx={{ fontSize: 18, color: '#8b5cf6' }} />
                                        <Typography variant="subtitle2" fontWeight="bold" color="#8b5cf6">
                                            จัดการสถานะ
                                        </Typography>
                                    </Stack>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>เปลี่ยนสถานะ</InputLabel>
                                        <Select
                                            value={newStatus}
                                            label="เปลี่ยนสถานะ"
                                            onChange={(e) => setNewStatus(e.target.value as 'PENDING' | 'CONFIRMED' | 'CHECKED_IN')}
                                            sx={{
                                                borderRadius: 2,
                                                bgcolor: '#fff',
                                                '& .MuiSelect-select': { py: 1.5 }
                                            }}
                                        >
                                            <MenuItem value="PENDING">
                                                <Stack direction="row" spacing={1.5} alignItems="center">
                                                    <PendingActionsIcon sx={{ color: '#d97706', fontSize: 20 }} />
                                                    <Typography>รอตรวจสอบ</Typography>
                                                </Stack>
                                            </MenuItem>
                                            <MenuItem value="CONFIRMED">
                                                <Stack direction="row" spacing={1.5} alignItems="center">
                                                    <VerifiedIcon sx={{ color: '#2563eb', fontSize: 20 }} />
                                                    <Typography>พบแล้ว</Typography>
                                                </Stack>
                                            </MenuItem>
                                            <MenuItem value="CHECKED_IN">
                                                <Stack direction="row" spacing={1.5} alignItems="center">
                                                    <GavelIcon sx={{ color: '#059669', fontSize: 20 }} />
                                                    <Typography>ยึดแล้ว</Typography>
                                                </Stack>
                                            </MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                            </DialogContent>

                            <DialogActions sx={{ px: 3, py: 2, bgcolor: '#fff', borderTop: '1px solid #e2e8f0' }}>
                                <Button
                                    onClick={handleCloseDetailDialog}
                                    sx={{
                                        color: '#64748b',
                                        fontWeight: '600',
                                        textTransform: 'none',
                                        px: 2
                                    }}
                                >
                                    ปิด
                                </Button>
                                <Button
                                    onClick={handleUpdateStatus}
                                    variant="contained"
                                    disabled={newStatus === detailAsset?.status && additionalPhotos.length === 0}
                                    startIcon={<CheckCircleIcon />}
                                    sx={{
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        fontWeight: 'bold',
                                        px: 3,
                                        background: (newStatus === detailAsset?.status && additionalPhotos.length === 0)
                                            ? undefined
                                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        boxShadow: (newStatus === detailAsset?.status && additionalPhotos.length === 0)
                                            ? 'none'
                                            : '0 4px 15px rgba(102, 126, 234, 0.4)',
                                        '&:hover': {
                                            background: (newStatus === detailAsset?.status && additionalPhotos.length === 0)
                                                ? undefined
                                                : 'linear-gradient(135deg, #5a67d8 0%, #6b3fa0 100%)',
                                            boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)'
                                        }
                                    }}
                                >
                                    {additionalPhotos.length > 0 && newStatus === detailAsset?.status
                                        ? 'บันทึกรูปภาพ'
                                        : newStatus !== detailAsset?.status && additionalPhotos.length > 0
                                            ? 'อัพเดทสถานะและรูปภาพ'
                                            : 'อัพเดทสถานะ'}
                                </Button>
                            </DialogActions>
                        </Dialog>

                        {/* Confirm Asset Dialog - พบหลักฐาน */}
                        <Dialog
                            open={confirmDialog}
                            onClose={handleCloseConfirmDialog}
                            maxWidth="md"
                            fullWidth
                            PaperProps={{ sx: { borderRadius: 3 } }}
                        >
                            <DialogTitle sx={{ borderBottom: '1px solid #f1f5f9', py: 2, px: 3, fontWeight: 'bold' }}>
                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CheckCircleIcon color="primary" />
                                        <Typography variant="h6" fontWeight="bold">
                                            ยืนยันการพบหลักฐาน
                                        </Typography>
                                    </Box>
                                    <IconButton size="small" onClick={handleCloseConfirmDialog}>
                                        <CloseIcon />
                                    </IconButton>
                                </Stack>
                            </DialogTitle>

                            <DialogContent dividers sx={{ p: 3 }}>
                                <Stack spacing={3}>
                                    {/* ข้อมูลหลักฐาน */}
                                    <Paper sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            ข้อมูลหลักฐาน
                                        </Typography>
                                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                                            {selectedAsset?.name}
                                        </Typography>
                                        <Stack direction="row" spacing={2} mt={1}>
                                            <Chip
                                                icon={getAssetTypeIcon(selectedAsset?.assetType)}
                                                label={selectedAsset?.assetType || '-'}
                                                size="small"
                                                sx={{
                                                    bgcolor: getAssetTypeColor(selectedAsset?.assetType).bg,
                                                    color: getAssetTypeColor(selectedAsset?.assetType).color,
                                                    fontWeight: '600'
                                                }}
                                            />
                                            <Chip
                                                label={`จำนวน: ${selectedAsset?.quantity || 1}`}
                                                size="small"
                                                sx={{ bgcolor: '#f1f5f9', fontWeight: '600' }}
                                            />
                                        </Stack>
                                    </Paper>

                                    {/* บันทึกข้อความ */}
                                    <TextField
                                        label="บันทึกเพิ่มเติม (Optional)"
                                        fullWidth
                                        multiline
                                        rows={3}
                                        value={confirmNotes}
                                        onChange={(e) => setConfirmNotes(e.target.value)}
                                        placeholder="บันทึกรายละเอียดเพิ่มเติมเกี่ยวกับการพบหลักฐาน..."
                                        InputProps={{ sx: { borderRadius: 2 } }}
                                    />

                                    {/* อัพโหลดรูปภาพ */}
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" mb={1}>
                                            รูปภาพหลักฐาน (Optional)
                                        </Typography>
                                        <Stack direction="row" spacing={2}>
                                            <Button
                                                variant="outlined"
                                                startIcon={<PhotoLibraryIcon />}
                                                component="label"
                                                sx={{ borderRadius: 2, textTransform: 'none' }}
                                            >
                                                เลือกรูปภาพ
                                                <input
                                                    type="file"
                                                    hidden
                                                    accept="image/*"
                                                    multiple
                                                    onChange={handlePhotoChange}
                                                />
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                startIcon={<CameraAltIcon />}
                                                onClick={handleCameraCapture}
                                                sx={{ borderRadius: 2, textTransform: 'none' }}
                                            >
                                                ถ่ายรูป
                                            </Button>
                                        </Stack>

                                        {/* แสดง Preview รูปภาพ */}
                                        {photoPreview.length > 0 && (
                                            <Box mt={2}>
                                                <Typography variant="caption" color="text.secondary" gutterBottom>
                                                    รูปภาพที่เลือก ({photoPreview.length} รูป)
                                                </Typography>
                                                <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
                                                    {photoPreview.map((preview, index) => (
                                                        <Box
                                                            key={index}
                                                            sx={{
                                                                position: 'relative',
                                                                width: 100,
                                                                height: 100,
                                                                borderRadius: 2,
                                                                overflow: 'hidden',
                                                                border: '2px solid #e2e8f0'
                                                            }}
                                                        >
                                                            <img
                                                                src={preview}
                                                                alt={`Preview ${index + 1}`}
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            />
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleRemovePhoto(index)}
                                                                sx={{
                                                                    position: 'absolute',
                                                                    top: 2,
                                                                    right: 2,
                                                                    bgcolor: 'rgba(0,0,0,0.6)',
                                                                    color: 'white',
                                                                    '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
                                                                }}
                                                            >
                                                                <CloseIcon fontSize="small" />
                                                            </IconButton>
                                                        </Box>
                                                    ))}
                                                </Stack>
                                            </Box>
                                        )}
                                    </Box>
                                </Stack>
                            </DialogContent>

                            <DialogActions sx={{ p: 3, borderTop: '1px solid #f1f5f9', bgcolor: '#f8fafc' }}>
                                <Button onClick={handleCloseConfirmDialog} sx={{ color: '#64748b', fontWeight: '600' }}>
                                    ยกเลิก
                                </Button>
                                <Button
                                    onClick={handleConfirmAsset}
                                    variant="contained"
                                    startIcon={<CheckCircleIcon />}
                                    sx={{
                                        borderRadius: 2,
                                        boxShadow: 'none',
                                        fontWeight: 'bold',
                                        px: 3,
                                        bgcolor: '#2563eb',
                                        '&:hover': { bgcolor: '#1d4ed8', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }
                                    }}
                                >
                                    ยืนยันการพบหลักฐาน
                                </Button>
                            </DialogActions>
                        </Dialog>

                    </Container>
                </Box>
            </Stack>
        </Box>
    );
}