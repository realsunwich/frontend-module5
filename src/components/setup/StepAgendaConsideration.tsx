'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Paper, Typography, Box, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Menu, MenuItem,
    Select, MenuItem as SelectMenuItem, FormControl,
    Stack, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
    Tooltip, Avatar, ListItemText, Divider
} from '@mui/material';
import {
    MoreVert as MoreVertIcon,
    VisibilityOutlined as VisibilityOutlinedIcon,
    FolderOpen as FolderOpenIcon,
    Close as CloseIcon,
    Save as SaveIcon,
    Assignment as AssignmentIcon,
    ListAlt as ListAltIcon,
    CheckCircle as CheckCircleIcon,
    Pending as PendingIcon,
    Cancel as CancelIcon,
    ArrowForwardIos as ArrowForwardIosIcon,
    DeleteOutline as DeleteOutlineIcon,
    AddCircleOutline as AddCircleOutlineIcon,
} from '@mui/icons-material';

const MOCK_ALL_CASES = [
    { id: 1, fileNo: 'ต.1/2568', name: 'นายสมชาย มั่งมี (คดียาเสพติดรายใหญ่)', region: 'ป.ป.ส. ภาค 1' },
    { id: 2, fileNo: 'ต.2/2568', name: 'นางสาววิไลวรรณ ณ เชียงใหม่ (คดีฟอกเงิน)', region: 'ป.ป.ส. ภาค 5' },
    { id: 3, fileNo: 'ต.3/2568', name: 'นายอำนาจ บารมี และพวก (คดีฉ้อโกงประชาชน)', region: 'ป.ป.ส. กทม.' },
    { id: 4, fileNo: 'ต.4/2568', name: 'บริษัท โกลบอล เทรด จำกัด (คดีลักลอบนำเข้าสินค้า)', region: 'กรมศุลกากร' },
    { id: 5, fileNo: 'ต.5/2568', name: 'นายเกรียงไกร ใจกล้า (คดีการพนันออนไลน์)', region: 'บช.สอท.' },
];

// เปิด/ปิด การใช้งาน API จริง
const USE_REAL_API = false; // เปลี่ยนเป็น true เมื่อ backend พร้อม

// --- Types ---
type Asset = {
    id: number;
    description: string;
    amount: string;
    status: string;
    note: string;
};

type AgendaItem = {
    id: number; // Case ID
    fileNo: string;
    name: string;
    region: string;
    order: string;
    assets: Asset[]; // รายการทรัพย์สินของคดีนี้
};

interface StepAgendaConsiderationProps {
    agendaNumber?: number;
    meetingId?: string | number;
    onDataChange?: (data: any) => void;
    initialData?: any;
}

export default function StepAgendaConsideration({
    agendaNumber = 4,
    meetingId,
    onDataChange,
    initialData
}: StepAgendaConsiderationProps) {
    // --- State ---
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const openMenu = Boolean(anchorEl);
    const [selectedItemForMenu, setSelectedItemForMenu] = useState<AgendaItem | null>(null);

    // รายการคดีที่ถูกเลือกเข้ามาในวาระ (Main State)
    const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false);
    const [currentEditingItem, setCurrentEditingItem] = useState<AgendaItem | null>(null);
    const [tempAssets, setTempAssets] = useState<Asset[]>([]); // State ชั่วคราวสำหรับแก้ไขใน Dialog

    // Track if we've already loaded initial data
    const hasLoadedInitialDataRef = useRef(false);
    const initialDataRef = useRef(initialData);

    // Load initial data once
    useEffect(() => {
        if (hasLoadedInitialDataRef.current) return;

        // Initialize from initialData or localStorage
        if (initialData && initialData.items && Array.isArray(initialData.items)) {
            console.log('Loading from initialData:', initialData.items);
            setAgendaItems(initialData.items);
            initialDataRef.current = initialData;
        } else {
            const storageKey = `agenda_${agendaNumber}_${meetingId || 'default'}`;
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
                try {
                    const parsed = JSON.parse(savedData);
                    if (parsed.items && Array.isArray(parsed.items)) {
                        console.log('Loading from localStorage:', parsed.items);
                        setAgendaItems(parsed.items);
                    }
                } catch (e) {
                    console.error('Error loading saved agenda data:', e);
                }
            } else {
                console.log('Starting with empty array');
            }
        }

        hasLoadedInitialDataRef.current = true;
    }, []); // Run only once on mount

    // --- Menu Handlers ---
    const handleClickMenu = (event: React.MouseEvent<HTMLElement>, item: AgendaItem) => {
        setAnchorEl(event.currentTarget);
        setSelectedItemForMenu(item);
    };
    const handleCloseMenu = () => {
        setAnchorEl(null);
        setSelectedItemForMenu(null);
    };

    // --- Actions ---

    // 1. เลือกคดีจากตารางซ้าย เข้าตารางขวา
    const handleSelectCase = (caseItem: any) => {
        const exists = agendaItems.find(item => item.id === caseItem.id);
        if (exists) {
            alert("แฟ้มนี้ถูกเลือกไปแล้ว");
            return;
        }

        const newItem: AgendaItem = {
            id: caseItem.id,
            fileNo: caseItem.fileNo,
            name: caseItem.name,
            region: caseItem.region,
            order: `${agendaNumber}.${agendaItems.length + 1}`,
            assets: [] // เริ่มต้นยังไม่มีทรัพย์สิน (ให้ไปเพิ่มใน Dialog)
        };

        setAgendaItems(prev => [...prev, newItem]);
    };

    // 2. ลบคดีออกจากวาระ
    const handleRemoveAgendaItem = (id: number) => {
        setAgendaItems(prev => {
            const newList = prev.filter(item => item.id !== id);
            // Re-order numbering
            return newList.map((item, index) => ({
                ...item,
                order: `${agendaNumber}.${index + 1}`
            }));
        });
        handleCloseMenu();
    };

    // 3. เปิด Dialog เพื่อจัดการทรัพย์สิน
    const handleOpenDialog = () => {
        if (!selectedItemForMenu) return;

        setCurrentEditingItem(selectedItemForMenu);

        // Clone assets มาใส่ temp state เพื่อแก้ไข ถ้าไม่มีให้ใส่ array ว่าง
        // ในระบบจริง อาจจะมีการ fetch assets จาก API ตรงนี้ถ้ายังไม่เคยโหลด
        if (selectedItemForMenu.assets.length === 0) {
            // Optional: Auto add empty row if empty
            setTempAssets([{ id: Date.now(), description: '', amount: '', status: 'pending', note: '' }]);
        } else {
            setTempAssets([...selectedItemForMenu.assets]);
        }

        setDialogOpen(true);
        handleCloseMenu();
    };

    // 4. บันทึกข้อมูลจาก Dialog ลง State หลัก
    const handleSaveDialog = () => {
        if (!currentEditingItem) return;

        setAgendaItems(prev => prev.map(item =>
            item.id === currentEditingItem.id
                ? { ...item, assets: tempAssets }
                : item
        ));

        setDialogOpen(false);
        setCurrentEditingItem(null);
    };

    // --- Asset Managment inside Dialog ---

    const handleAddAssetRow = () => {
        setTempAssets(prev => [
            ...prev,
            { id: Date.now(), description: '', amount: '', status: 'pending', note: '' }
        ]);
    };

    const handleDeleteAssetRow = (assetId: number) => {
        setTempAssets(prev => prev.filter(a => a.id !== assetId));
    };

    const handleAssetChange = (id: number, field: keyof Asset, value: string) => {
        setTempAssets(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
    };

    // 5. ล้างข้อมูลทั้งหมด
    const handleClearAll = () => {
        if (window.confirm('คุณต้องการล้างข้อมูลทั้งหมดในวาระนี้หรือไม่?')) {
            setAgendaItems([]);
            const storageKey = `agenda_${agendaNumber}_${meetingId || 'default'}`;
            localStorage.removeItem(storageKey);
        }
    };

    // Store last saved data to prevent unnecessary updates
    const lastSavedDataRef = useRef<string>('');
    const isFirstRenderRef = useRef(true);

    // --- Save to localStorage and notify parent whenever agendaItems changes ---
    useEffect(() => {
        // Skip on first render (initial load happens in the load effect above)
        if (isFirstRenderRef.current) {
            isFirstRenderRef.current = false;
            return;
        }

        const data = { agendaNo: agendaNumber, items: agendaItems };
        const dataString = JSON.stringify(data);

        // Only save if data actually changed
        if (dataString === lastSavedDataRef.current) {
            console.log('Data unchanged, skipping save');
            return;
        }

        // Check if this data is the same as what we received from initialData
        // This prevents calling onDataChange when we just loaded the data from parent
        if (initialDataRef.current) {
            const initialDataString = JSON.stringify(initialDataRef.current);
            if (dataString === initialDataString) {
                console.log('Data matches initialData, skipping save to prevent loop');
                lastSavedDataRef.current = dataString;
                initialDataRef.current = null; // Clear the ref so future changes will save
                return;
            }
        }

        console.log('Saving data:', data);
        lastSavedDataRef.current = dataString;

        // Save to localStorage
        const storageKey = `agenda_${agendaNumber}_${meetingId || 'default'}`;
        localStorage.setItem(storageKey, dataString);

        // Notify parent component
        if (onDataChange) {
            onDataChange(data);
        }
    }, [agendaItems, agendaNumber, meetingId]); // ลบ onDataChange ออกจาก dependencies

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'flex-start' }}>

                {/* --- Left Column: Source List --- */}
                <Box sx={{ flex: { xs: '1 1 100%', md: 5 }, width: '100%', minWidth: 0 }}>
                    <Paper elevation={0} sx={{ height: '100%', bgcolor: '#fff', borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0px 4px 20px rgba(0,0,0,0.02)' }}>
                        <Box sx={{ p: 2, px: 3, borderBottom: '1px solid #f1f5f9', bgcolor: '#f8fafc' }}>
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                                <FolderOpenIcon sx={{ color: '#3b82f6' }} />
                                <Typography variant="subtitle1" fontWeight="bold" color="#1e293b">เลือกแฟ้มสำนวนคดี</Typography>
                            </Stack>
                        </Box>
                        <TableContainer sx={{ maxHeight: 600 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#64748b', bgcolor: '#fff', borderBottom: '1px solid #e2e8f0', width: '25%' }}>เลขที่แฟ้ม</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#64748b', bgcolor: '#fff', borderBottom: '1px solid #e2e8f0' }}>ชื่อเรื่อง</TableCell>
                                        <TableCell sx={{ bgcolor: '#fff', borderBottom: '1px solid #e2e8f0', width: '50px' }}></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {MOCK_ALL_CASES.map((row) => {
                                        const isSelected = agendaItems.some(i => i.id === row.id);
                                        return (
                                            <TableRow
                                                key={row.id}
                                                hover
                                                onClick={() => !isSelected && handleSelectCase(row)}
                                                sx={{
                                                    cursor: isSelected ? 'default' : 'pointer',
                                                    opacity: isSelected ? 0.5 : 1,
                                                    bgcolor: isSelected ? '#f8fafc' : 'inherit',
                                                    '&:last-child td, &:last-child th': { border: 0 },
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <TableCell sx={{ color: '#334155', fontWeight: 500 }}>{row.fileNo}</TableCell>
                                                <TableCell sx={{ color: '#475569' }}>
                                                    <Typography variant="body2" sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {row.name}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    {!isSelected ? (
                                                        <Tooltip title="เพิ่มลงในวาระ">
                                                            <IconButton size="small" sx={{ color: '#3b82f6', bgcolor: '#eff6ff', '&:hover': { bgcolor: '#dbeafe' } }}>
                                                                <ArrowForwardIosIcon sx={{ fontSize: 14 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    ) : (
                                                        <Typography variant="caption" color="text.disabled">เลือกแล้ว</Typography>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Box>

                {/* --- Right Column: Target List --- */}
                <Box sx={{ flex: { xs: '1 1 100%', md: 7 }, width: '100%', minWidth: 0 }}>
                    <Paper elevation={0} sx={{ borderRadius: 3, bgcolor: '#fff', border: '1px solid #e2e8f0', boxShadow: '0px 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden', minHeight: 400 }}>
                        <Box sx={{ p: 2, px: 3, borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                                <ListAltIcon sx={{ color: '#f59e0b' }} />
                                <Typography variant="subtitle1" fontWeight="bold" color="#1e293b">รายการในวาระที่ {agendaNumber}</Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Chip label={`${agendaItems.length} รายการ`} size="small" color={agendaItems.length > 0 ? "warning" : "default"} sx={{ fontWeight: 'bold' }} />
                                {agendaItems.length > 0 && (
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color="error"
                                        onClick={handleClearAll}
                                        sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0.5, px: 1.5 }}
                                    >
                                        ล้างทั้งหมด
                                    </Button>
                                )}
                            </Stack>
                        </Box>

                        {agendaItems.length === 0 ? (
                            <Box sx={{ p: 5, textAlign: 'center', color: '#94a3b8' }}>
                                <Typography variant="body1">ยังไม่มีรายการในวาระนี้</Typography>
                                <Typography variant="caption">กรุณาเลือกแฟ้มจากตารางด้านซ้าย</Typography>
                            </Box>
                        ) : (
                            <TableContainer>
                                <Table>
                                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold', width: '10%', color: '#475569' }}>ลำดับ</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', width: '35%', color: '#475569' }}>เรื่อง / แฟ้มสำนวน</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', width: '25%', color: '#475569' }}>หน่วยงาน</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', width: '15%', color: '#475569', textAlign: 'center' }}>ทรัพย์สิน</TableCell>
                                            <TableCell align="center" sx={{ width: '15%', color: '#475569' }}>จัดการ</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {agendaItems.map((item) => (
                                            <TableRow key={item.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                                                <TableCell sx={{ color: '#334155', fontWeight: 600 }}>{item.order}</TableCell>
                                                <TableCell>
                                                    <Stack spacing={0.5}>
                                                        <Typography variant="body2" fontWeight={500} color="#1e293b">{item.fileNo}</Typography>
                                                        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 180 }}>{item.name}</Typography>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={item.region} size="small" sx={{ bgcolor: '#f1f5f9', color: '#475569', borderRadius: 1, fontSize: '0.75rem' }} />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        label={`${item.assets.length} รายการ`}
                                                        size="small"
                                                        color={item.assets.length > 0 ? "success" : "default"}
                                                        variant={item.assets.length > 0 ? "filled" : "outlined"}
                                                        sx={{ fontSize: '0.75rem', height: 20 }}
                                                    />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <IconButton size="small" onClick={(e) => handleClickMenu(e, item)} sx={{ color: '#94a3b8', '&:hover': { color: '#3b82f6', bgcolor: '#eff6ff' } }}>
                                                        <MoreVertIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Paper>
                </Box>
            </Box>

            {/* --- Menu Popup --- */}
            <Menu
                anchorEl={anchorEl}
                open={openMenu}
                onClose={handleCloseMenu}
                PaperProps={{ elevation: 3, sx: { borderRadius: 2, minWidth: 180, mt: 1, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9' } }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem onClick={handleOpenDialog} sx={{ py: 1.5, gap: 1.5 }}>
                    <VisibilityOutlinedIcon fontSize="small" sx={{ color: '#3b82f6' }} />
                    <ListItemText primary="จัดการทรัพย์สิน / ลงมติ" primaryTypographyProps={{ fontSize: 14, fontWeight: 500, color: '#334155' }} />
                </MenuItem>
                <Divider sx={{ my: 1 }} />
                <MenuItem onClick={() => selectedItemForMenu && handleRemoveAgendaItem(selectedItemForMenu.id)} sx={{ py: 1.5, gap: 1.5 }}>
                    <DeleteOutlineIcon fontSize="small" sx={{ color: '#ef4444' }} />
                    <ListItemText primary="นำออกจากวาระ" primaryTypographyProps={{ fontSize: 14, fontWeight: 500, color: '#ef4444' }} />
                </MenuItem>
            </Menu>

            {/* --- Dialog (Asset Management) --- */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="xl"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' } }}
            >
                <DialogTitle sx={{ m: 0, p: 3, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fff' }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ bgcolor: '#e0e7ff', color: '#3140BF' }}><AssignmentIcon /></Avatar>
                        <Box>
                            <Typography variant="h6" fontWeight={700} color="#1e293b">
                                {agendaNumber === 5 ? "พิจารณาทบทวนมติ" : "จัดการทรัพย์สิน / ลงมติ"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                คดี: {currentEditingItem?.name} ({currentEditingItem?.fileNo})
                            </Typography>
                        </Box>
                    </Stack>
                    <IconButton onClick={() => setDialogOpen(false)} sx={{ color: '#94a3b8' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 0, bgcolor: '#f8fafc' }}>
                    <Box sx={{ p: 3 }}>

                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="subtitle2" fontWeight="bold" color="#475569">รายการทรัพย์สินที่เกี่ยวข้อง</Typography>
                            <Button
                                startIcon={<AddCircleOutlineIcon />}
                                variant="outlined"
                                size="small"
                                onClick={handleAddAssetRow}
                                sx={{ textTransform: 'none', borderRadius: 2 }}
                            >
                                เพิ่มรายการทรัพย์สิน
                            </Button>
                        </Stack>

                        <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2, bgcolor: '#fff', overflow: 'hidden' }}>
                            <Table size="medium">
                                <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#475569', whiteSpace: 'nowrap', width: '5%' }}>#</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#475569', whiteSpace: 'nowrap', width: '30%' }}>รายการทรัพย์สิน <span style={{ color: 'red' }}>*</span></TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#475569', whiteSpace: 'nowrap', textAlign: 'right', width: '15%' }}>มูลค่า (บาท)</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#475569', whiteSpace: 'nowrap', width: '20%', textAlign: 'center' }}>สถานะ/มติ</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#475569', whiteSpace: 'nowrap', width: '25%' }}>หมายเหตุ</TableCell>
                                        <TableCell sx={{ width: '5%' }}></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {tempAssets.map((row, index) => (
                                        <TableRow key={row.id} sx={{ bgcolor: '#fff' }}>
                                            <TableCell sx={{ color: '#64748b' }}>{index + 1}</TableCell>
                                            <TableCell>
                                                <TextField
                                                    fullWidth size="small" placeholder="ระบุชื่อทรัพย์สิน..."
                                                    value={row.description}
                                                    onChange={(e) => handleAssetChange(row.id, 'description', e.target.value)}
                                                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fff' } }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <TextField
                                                    fullWidth size="small" placeholder="0.00"
                                                    value={row.amount}
                                                    onChange={(e) => handleAssetChange(row.id, 'amount', e.target.value)}
                                                    inputProps={{ style: { textAlign: 'right', fontFamily: 'monospace' } }}
                                                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fff' } }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <FormControl fullWidth size="small">
                                                    <Select
                                                        value={row.status}
                                                        onChange={(e) => handleAssetChange(row.id, 'status', e.target.value)}
                                                        displayEmpty
                                                        renderValue={(selected) => {
                                                            if (selected === 'seize') return <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CheckCircleIcon fontSize="small" color="success" /> ยึด/อายัด</Box>;
                                                            if (selected === 'pending') return <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><PendingIcon fontSize="small" color="warning" /> รอตรวจสอบ</Box>;
                                                            if (selected === 'reject') return <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CancelIcon fontSize="small" color="error" /> ไม่ยึด/คืน</Box>;
                                                            return selected;
                                                        }}
                                                        sx={{
                                                            bgcolor: '#fff', borderRadius: 1.5,
                                                            '& .MuiSelect-select': { py: 1, fontSize: '0.875rem' },
                                                            '& fieldset': { borderColor: '#e2e8f0' },
                                                            ...(row.status === 'seize' && { bgcolor: '#f0fdf4', '& fieldset': { borderColor: '#86efac' } }),
                                                            ...(row.status === 'pending' && { bgcolor: '#fffbeb', '& fieldset': { borderColor: '#fcd34d' } }),
                                                            ...(row.status === 'reject' && { bgcolor: '#fef2f2', '& fieldset': { borderColor: '#fecaca' } }),
                                                        }}
                                                    >
                                                        <SelectMenuItem value="seize"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#15803d' }}><CheckCircleIcon fontSize="small" /> ยึด/อายัด</Box></SelectMenuItem>
                                                        <SelectMenuItem value="pending"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#b45309' }}><PendingIcon fontSize="small" /> ยังไม่ยึด/อายัด (รอ)</Box></SelectMenuItem>
                                                        <SelectMenuItem value="reject"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#b91c1c' }}><CancelIcon fontSize="small" /> ไม่ยึด/อายัด (คืน)</Box></SelectMenuItem>
                                                    </Select>
                                                </FormControl>
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    fullWidth size="small" placeholder="ระบุหมายเหตุ..."
                                                    value={row.note}
                                                    onChange={(e) => handleAssetChange(row.id, 'note', e.target.value)}
                                                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fff' } }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <IconButton size="small" onClick={() => handleDeleteAssetRow(row.id)} sx={{ color: '#ef4444' }}>
                                                    <DeleteOutlineIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {tempAssets.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                                                <Typography>ยังไม่มีรายการทรัพย์สิน</Typography>
                                                <Button size="small" startIcon={<AddCircleOutlineIcon />} onClick={handleAddAssetRow} sx={{ mt: 1 }}>เพิ่มรายการ</Button>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 3, borderTop: '1px solid #e2e8f0', bgcolor: '#fff' }}>
                    <Button onClick={() => setDialogOpen(false)} variant="outlined" sx={{ borderRadius: 2, color: '#64748b', borderColor: '#cbd5e1', px: 3 }}>
                        ยกเลิก
                    </Button>
                    <Button onClick={handleSaveDialog} variant="contained" startIcon={<SaveIcon />} sx={{ borderRadius: 2, bgcolor: '#3140BF', px: 4, boxShadow: 'none', '&:hover': { bgcolor: '#1e1b4b', boxShadow: 'none' } }}>
                        บันทึกการเปลี่ยนแปลง
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}