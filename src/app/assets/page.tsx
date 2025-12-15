'use client';

import { useState, useEffect } from 'react';
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
        quantity: 1
    });
    const [hasLocation, setHasLocation] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);

    // Confirm Dialog State
    const [confirmDialog, setConfirmDialog] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [confirmNotes, setConfirmNotes] = useState('');
    const [photos, setPhotos] = useState<File[]>([]);
    const [photoPreview, setPhotoPreview] = useState<string[]>([]);

    // Fetch Data
    const fetchData = async () => {
        try {
            const res = await fetch('http://localhost:8080/api/assets');
            const data = await res.json();
            setAssets(data);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

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
            quantity: 1
        });
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
            quantity: asset.quantity || 1
        });
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
        const payload = {
            name: formData.name,
            description: formData.description,
            latitude: formData.lat,
            longitude: formData.lng,
            assetType: formData.assetType,
            quantity: formData.quantity,
            status: 'PENDING' as const
        };
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
            formDataToSend.append('notes', confirmNotes);
            photos.forEach((photo, index) => {
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

                        {/* 2. Stats Cards - Dashboard หลักฐาน */}
                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={3}
                            sx={{ mb: 4 }}
                        >
                            {/* ทรัพย์สินทั้งหมด */}
                            <Card sx={{
                                borderRadius: 4,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                                minWidth: 280,
                                flex: { xs: '1 1 auto', sm: '1 1 0' },
                                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                color: '#fff'
                            }}>
                                <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56, mr: 2 }}>
                                        <Inventory2OutlinedIcon fontSize="large" sx={{ color: '#fff' }} />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h4" fontWeight="bold">
                                            {assets.length}
                                        </Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                                            ทรัพย์สินทั้งหมด
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>

                            {/* รอตรวจสอบ */}
                            <Card sx={{
                                borderRadius: 4,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                                minWidth: 280,
                                flex: { xs: '1 1 auto', sm: '1 1 0' },
                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                color: '#fff'
                            }}>
                                <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56, mr: 2 }}>
                                        <PendingActionsIcon fontSize="large" sx={{ color: '#fff' }} />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h4" fontWeight="bold">
                                            {assets.filter(a => a.status === 'PENDING').length}
                                        </Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                                            รอตรวจสอบ
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>

                            {/* พบแล้ว */}
                            <Card sx={{
                                borderRadius: 4,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                                minWidth: 280,
                                flex: { xs: '1 1 auto', sm: '1 1 0' },
                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                color: '#fff'
                            }}>
                                <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56, mr: 2 }}>
                                        <VerifiedIcon fontSize="large" sx={{ color: '#fff' }} />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h4" fontWeight="bold">
                                            {assets.filter(a => a.status === 'CONFIRMED').length}
                                        </Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                                            พบแล้ว
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>

                            {/* ยึดแล้ว */}
                            <Card sx={{
                                borderRadius: 4,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                                minWidth: 280,
                                flex: { xs: '1 1 auto', sm: '1 1 0' },
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: '#fff'
                            }}>
                                <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56, mr: 2 }}>
                                        <GavelIcon fontSize="large" sx={{ color: '#fff' }} />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h4" fontWeight="bold">
                                            {assets.filter(a => a.status === 'CHECKED_IN').length}
                                        </Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                                            ยึดแล้ว
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Stack>

                        {/* 3. Main Content Card */}
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
                                            <TableCell sx={{ fontWeight: '600', color: '#64748b', py: 2 }}>ชื่อทรัพย์สิน</TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: '#64748b', py: 2 }} align="center">ประเภท</TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: '#64748b', py: 2 }} align="center">จำนวน</TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: '#64748b', py: 2 }} align="center">สถานะ</TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: '#64748b', py: 2 }}>รายละเอียด</TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: '#64748b', py: 2 }} align="center">ตำแหน่งพิกัด</TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: '#64748b', py: 2 }} align="center">จัดการ</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {assets.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                                    <Inventory2OutlinedIcon sx={{ fontSize: 48, opacity: 0.2, mb: 1 }} />
                                                    <Typography>ไม่พบข้อมูลทรัพย์สิน</Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            assets.map((asset) => (
                                                <TableRow key={asset.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
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
                                                        {getStatusChip(asset.status)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" color="#64748b" noWrap sx={{ maxWidth: 250 }}>
                                                            {asset.description || "-"}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            icon={<PlaceIcon style={{ fontSize: 16 }} />}
                                                            label={`${asset.latitude.toFixed(5)}, ${asset.longitude.toFixed(5)}`}
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
                                <Stack spacing={3}>
                                    {/* Input Fields Stack */}
                                    <Stack spacing={2}>
                                        <TextField
                                            label="ชื่อทรัพย์สิน"
                                            fullWidth
                                            required
                                            variant="outlined"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            InputProps={{ sx: { borderRadius: 2 } }}
                                        />
                                        <TextField
                                            label="รายละเอียด"
                                            fullWidth
                                            multiline
                                            rows={2}
                                            variant="outlined"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            InputProps={{ sx: { borderRadius: 2 } }}
                                        />

                                        {/* New Fields: Type and Quantity */}
                                        <Stack direction="row" spacing={2}>
                                            <FormControl fullWidth>
                                                <InputLabel>ประเภทหลักฐาน</InputLabel>
                                                <Select
                                                    value={formData.assetType}
                                                    label="ประเภทหลักฐาน"
                                                    onChange={(e) => setFormData({ ...formData, assetType: e.target.value })}
                                                    sx={{ borderRadius: 2 }}
                                                >
                                                    <MenuItem value="เอกสาร">เอกสาร</MenuItem>
                                                    <MenuItem value="อุปกรณ์">อุปกรณ์</MenuItem>
                                                    <MenuItem value="อาคาร">อาคาร</MenuItem>
                                                    <MenuItem value="ยานพาหนะ">ยานพาหนะ</MenuItem>
                                                    <MenuItem value="ที่ดิน">ที่ดิน</MenuItem>
                                                    <MenuItem value="อื่นๆ">อื่นๆ</MenuItem>
                                                </Select>
                                            </FormControl>

                                            <TextField
                                                label="จำนวน"
                                                type="number"
                                                fullWidth
                                                required
                                                variant="outlined"
                                                value={formData.quantity}
                                                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                                                InputProps={{
                                                    sx: { borderRadius: 2 },
                                                    inputProps: { min: 1 }
                                                }}
                                            />
                                        </Stack>
                                    </Stack>

                                    {/* Map Section */}
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" mb={1}>
                                            ค้นหาตำแหน่งจากชื่อสถานที่ (Optional)
                                        </Typography>
                                        <Stack direction="row" spacing={1}>
                                            <TextField
                                                label="พิมพ์ชื่อสถานที่ เช่น สนามหลวง, Siam Paragon"
                                                fullWidth
                                                size="small"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleSearchLocation()} // กด Enter เพื่อค้นหา
                                                InputProps={{
                                                    sx: { borderRadius: 2 },
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <IconButton onClick={handleSearchLocation} edge="end">
                                                                <SearchIcon />
                                                            </IconButton>
                                                        </InputAdornment>
                                                    )
                                                }}
                                            />
                                            <Button
                                                variant="outlined"
                                                onClick={handleSearchLocation}
                                                sx={{ borderRadius: 2, minWidth: '80px' }}
                                            >
                                                ค้นหา
                                            </Button>
                                        </Stack>
                                    </Box>
                                    <Box>
                                        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                            <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
                                                หรือ ปักหมุดเองบนแผนที่
                                            </Typography>
                                            {hasLocation ?
                                                <Chip label="เลือกแล้ว" color="success" size="small" variant="outlined" /> :
                                                <Chip label="กรุณาปักหมุด" color="error" size="small" variant="outlined" />
                                            }
                                        </Stack>

                                        <Box sx={{
                                            height: '400px',
                                            width: '100%',
                                            border: '2px solid #e2e8f0',
                                            borderRadius: 3,
                                            overflow: 'hidden',
                                            position: 'relative'
                                        }}>
                                            <AssetMap
                                                assets={hasLocation ? [{
                                                    id: 999,
                                                    name: formData.name || 'Current Selection',
                                                    description: 'ตำแหน่งที่เลือก',
                                                    latitude: formData.lat,
                                                    longitude: formData.lng
                                                }] : []}
                                                isEditable={true}
                                                onLocationSelect={(lat, lng) => {
                                                    handleLocationSelect(lat, lng);
                                                }}
                                                center={mapCenter}
                                            />
                                        </Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'right' }}>
                                            พิกัด: {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}
                                        </Typography>
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