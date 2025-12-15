'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
    Container, Paper, TextField, Button, Typography, Box,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    Chip, Stack, Tooltip, Card, CardContent, Avatar
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
}

export default function AssetPage() {
    const [assets, setAssets] = useState<Asset[]>([]);

    // Dialog & Form State
    const [open, setOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '', lat: 0, lng: 0 });
    const [hasLocation, setHasLocation] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);

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
        setFormData({ name: '', description: '', lat: 13.7563, lng: 100.5018 });
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
            lng: asset.longitude
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
            longitude: formData.lng
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

                        {/* 2. Stats Cards (ใช้ Stack แทน Grid) */}
                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={3}
                            sx={{ mb: 4 }}
                        >
                            <Card sx={{
                                borderRadius: 4,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                                minWidth: 280,
                                flex: { xs: '1 1 auto', sm: '0 1 300px' } // Responsive Flex
                            }}>
                                <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                                    <Avatar sx={{ bgcolor: '#eff6ff', color: '#3b82f6', width: 56, height: 56, mr: 2 }}>
                                        <Inventory2OutlinedIcon fontSize="large" />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h4" fontWeight="bold" color="#1e293b">
                                            {assets.length}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" fontWeight="medium">
                                            ทรัพย์สินทั้งหมด
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                            {/* สามารถเพิ่ม Card อื่นๆ ต่อท้ายใน Stack ได้เลย */}
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
                                            <TableCell sx={{ fontWeight: '600', color: '#64748b', py: 2 }}>รายละเอียด</TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: '#64748b', py: 2 }} align="center">ตำแหน่งพิกัด</TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: '#64748b', py: 2 }} align="center">จัดการ</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {assets.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                                    <Inventory2OutlinedIcon sx={{ fontSize: 48, opacity: 0.2, mb: 1 }} />
                                                    <Typography>ไม่พบข้อมูลทรัพย์สิน</Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            assets.map((asset) => (
                                                <TableRow key={asset.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                    <TableCell width="25%">
                                                        <Typography fontWeight="600" color="#334155">{asset.name}</Typography>
                                                    </TableCell>
                                                    <TableCell width="40%">
                                                        <Typography variant="body2" color="#64748b" noWrap sx={{ maxWidth: 350 }}>
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

                    </Container>
                </Box>
            </Stack>
        </Box>
    );
}