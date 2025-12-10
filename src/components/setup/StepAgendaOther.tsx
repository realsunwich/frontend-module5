'use client';

import React, { useState, useEffect } from 'react';
import {
    Paper, Typography, Box, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Menu, MenuItem,
    Select, MenuItem as SelectMenuItem, FormControl,
    Stack, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
    Tooltip, Avatar, CircularProgress, Alert
} from '@mui/material';
import {
    MoreVert as MoreVertIcon,
    VisibilityOutlined as VisibilityOutlinedIcon,
    EditOutlined as EditOutlinedIcon,
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
    History as HistoryIcon
} from '@mui/icons-material';

// --- Types ---
type Asset = {
    id: number;
    description: string;
    amount: number | string;
    status: string;
    note: string;
};

type CaseItem = {
    id: number;
    fileNo: string;
    name: string;
    region: string;
    status?: string;
    prevStatus?: string; // สำหรับวาระ 5 (ถ้ามี)
};

type AgendaItem = CaseItem & {
    order: string;
    assets: Asset[];
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
    const [loadingSource, setLoadingSource] = useState(false);
    const [loadingAssets, setLoadingAssets] = useState(false);
    const [sourceList, setSourceList] = useState<CaseItem[]>([]);
    const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const openMenu = Boolean(anchorEl);
    const [selectedItemForMenu, setSelectedItemForMenu] = useState<AgendaItem | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [currentEditingItem, setCurrentEditingItem] = useState<AgendaItem | null>(null);
    const [tempAssets, setTempAssets] = useState<Asset[]>([]);

    // --- Helper: Parse JSON string from agendaFourData ---
    const parseAgendaItems = (jsonString: string): CaseItem[] => {
        try {
            if (!jsonString) return [];

            // 1. Parse JSON String ชั้นแรก (ถ้ามันถูก stringify มา)
            // บางครั้งอาจจะเป็น object อยู่แล้วถ้า fetch มาผ่าน library บางตัว
            let parsed = jsonString;
            if (typeof jsonString === 'string') {
                parsed = JSON.parse(jsonString);
            }

            // 2. เข้าถึง items array
            // โครงสร้างที่ส่งมา: { agendaNo: 4, items: [...] }
            const items = (parsed as any).items || [];

            if (Array.isArray(items)) {
                return items.map((item: any) => ({
                    id: item.id || Date.now(), // Fallback ID
                    fileNo: item.fileNo || '-',
                    name: item.name || '-',
                    region: item.region || '-',
                    // ถ้าใน agendaFourData มี assets หรือ status ติดมาด้วย สามารถดึงมาโชว์เป็น prevStatus ได้
                    prevStatus: item.assets ? `${item.assets.length} ทรัพย์สิน` : 'พิจารณาแล้ว'
                }));
            }
            return [];
        } catch (e) {
            console.error("Error parsing agenda data:", e);
            return [];
        }
    };

    // --- 1. Fetch Source Data (Left Table) ---
    useEffect(() => {
        const fetchSourceData = async () => {
            setLoadingSource(true);
            try {
                if (agendaNumber === 5) {
                    // ✅ วาระ 5: ดึงข้อมูลการประชุมปัจจุบัน -> แกะ agendaFourData
                    if (!meetingId) {
                        console.warn("Meeting ID is missing for Agenda 5");
                        setLoadingSource(false);
                        return;
                    }

                    const res = await fetch(`http://localhost:8080/api/meetings/${meetingId}`);
                    if (res.ok) {
                        const meetingData = await res.json();
                        // ถ้ามีข้อมูล agendaFourData ให้ parse มาใส่ตารางซ้าย
                        if (meetingData.agendaFourData) {
                            const casesFromAgenda4 = parseAgendaItems(meetingData.agendaFourData);
                            setSourceList(casesFromAgenda4);
                        } else {
                            setSourceList([]); // ยังไม่มีข้อมูลวาระ 4
                        }
                    }
                } else {
                    // ✅ วาระ 4: ดึงคดีทั้งหมดที่สถานะพร้อม (API ปกติ)
                    const res = await fetch(`http://localhost:8080/api/cases?status=READY`);
                    if (res.ok) {
                        const data = await res.json();
                        setSourceList(data);
                    }
                }
            } catch (error) {
                console.error("Error fetching source cases:", error);
            } finally {
                setLoadingSource(false);
            }
        };

        fetchSourceData();
    }, [agendaNumber, meetingId]);

    // --- 2. Load Initial Data (Right Table) ---
    useEffect(() => {
        if (initialData && initialData.items) {
            setAgendaItems(initialData.items);
        }
    }, [initialData]);

    // --- Handlers ---
    const handleClickMenu = (event: React.MouseEvent<HTMLElement>, item: AgendaItem) => {
        setAnchorEl(event.currentTarget);
        setSelectedItemForMenu(item);
    };
    const handleCloseMenu = () => {
        setAnchorEl(null);
        setSelectedItemForMenu(null);
    };

    const handleSelectCase = (caseItem: CaseItem) => {
        const exists = agendaItems.find(item => item.id === caseItem.id);
        if (exists) {
            alert("รายการนี้ถูกเลือกไปแล้ว");
            return;
        }

        const newItem: AgendaItem = {
            ...caseItem,
            order: `${agendaNumber}.${agendaItems.length + 1}`,
            assets: []
        };

        setAgendaItems(prev => [...prev, newItem]);
    };

    const handleRemoveAgendaItem = (id: number) => {
        setAgendaItems(prev => {
            const newList = prev.filter(item => item.id !== id);
            return newList.map((item, index) => ({
                ...item,
                order: `${agendaNumber}.${index + 1}`
            }));
        });
        handleCloseMenu();
    };

    const handleOpenDialog = async () => {
        if (!selectedItemForMenu) return;

        setCurrentEditingItem(selectedItemForMenu);
        setDialogOpen(true);
        handleCloseMenu();

        if (selectedItemForMenu.assets && selectedItemForMenu.assets.length > 0) {
            setTempAssets([...selectedItemForMenu.assets]);
        } else {
            setLoadingAssets(true);
            try {
                // ถ้าเป็นวาระ 5 อาจจะต้องดึง Assets จากวาระ 4 มาแสดง (ถ้ามี Logic นี้)
                // หรือดึงสดจาก DB เหมือนเดิม
                const res = await fetch(`http://localhost:8080/api/cases/${selectedItemForMenu.id}/assets`);
                if (res.ok) {
                    const data = await res.json();
                    setTempAssets(data);
                } else {
                    setTempAssets([]);
                }
            } catch (error) {
                console.error("Error fetching assets:", error);
                setTempAssets([]);
            } finally {
                setLoadingAssets(false);
            }
        }
    };

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

    const handleAddAssetRow = () => {
        setTempAssets(prev => [
            ...prev,
            { id: Date.now() * -1, description: '', amount: '', status: 'pending', note: '' }
        ]);
    };

    const handleDeleteAssetRow = (assetId: number) => {
        setTempAssets(prev => prev.filter(a => a.id !== assetId));
    };

    const handleAssetChange = (id: number, field: keyof Asset, value: string) => {
        setTempAssets(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
    };

    useEffect(() => {
        onDataChange?.({ agendaNo: agendaNumber, items: agendaItems });
    }, [agendaItems]);

    // UI Variables
    const sourceTitle = agendaNumber === 5 ? "รายการจากวาระที่ 4 (ทบทวน)" : "เลือกแฟ้มสำนวนคดี";
    const SourceIcon = agendaNumber === 5 ? HistoryIcon : FolderOpenIcon;

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'flex-start' }}>

                {/* --- Left Column: Source List --- */}
                <Box sx={{ flex: { xs: '1 1 100%', md: 5 }, width: '100%', minWidth: 0 }}>
                    <Paper elevation={0} sx={{ height: '100%', bgcolor: '#fff', borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0px 4px 20px rgba(0,0,0,0.02)' }}>
                        <Box sx={{ p: 2, px: 3, borderBottom: '1px solid #f1f5f9', bgcolor: '#f8fafc' }}>
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                                <SourceIcon sx={{ color: agendaNumber === 5 ? '#9333ea' : '#3b82f6' }} />
                                <Typography variant="subtitle1" fontWeight="bold" color="#1e293b">
                                    {sourceTitle}
                                </Typography>
                            </Stack>
                        </Box>
                        <TableContainer sx={{ maxHeight: 600 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#64748b', bgcolor: '#fff', borderBottom: '1px solid #e2e8f0', width: '25%' }}>เลขที่แฟ้ม</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#64748b', bgcolor: '#fff', borderBottom: '1px solid #e2e8f0' }}>ชื่อเรื่อง</TableCell>
                                        {agendaNumber === 5 && (
                                            <TableCell sx={{ fontWeight: 'bold', color: '#64748b', bgcolor: '#fff', borderBottom: '1px solid #e2e8f0', display: { xs: 'none', lg: 'table-cell' } }}>สถานะเดิม</TableCell>
                                        )}
                                        <TableCell sx={{ bgcolor: '#fff', borderBottom: '1px solid #e2e8f0', width: '50px' }}></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loadingSource ? (
                                        <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>
                                    ) : sourceList.length === 0 ? (
                                        <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: '#9ca3af' }}>ไม่พบรายการ</TableCell></TableRow>
                                    ) : (
                                        sourceList.map((row) => {
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
                                                        <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {row.name}
                                                        </Typography>
                                                    </TableCell>
                                                    {agendaNumber === 5 && (
                                                        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                                                            <Chip label={row.prevStatus || '-'} size="small" variant="outlined" sx={{ borderColor: '#e5e7eb', color: '#6b7280', fontSize: '0.75rem' }} />
                                                        </TableCell>
                                                    )}
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
                                        })
                                    )}
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
                            <Chip label={`${agendaItems.length} รายการ`} size="small" color={agendaItems.length > 0 ? "warning" : "default"} sx={{ fontWeight: 'bold' }} />
                        </Box>

                        {agendaItems.length === 0 ? (
                            <Box sx={{ p: 5, textAlign: 'center', color: '#94a3b8' }}>
                                <Typography variant="body1">ยังไม่มีรายการในวาระนี้</Typography>
                                <Typography variant="caption">กรุณาเลือกรายการจากตารางด้านซ้าย</Typography>
                            </Box>
                        ) : (
                            <TableContainer>
                                <Table>
                                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold', width: '10%', color: '#475569' }}>ลำดับ</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', width: '45%', color: '#475569' }}>เรื่อง / แฟ้มสำนวน</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', width: '30%', color: '#475569' }}>หน่วยงาน</TableCell>
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
                                                        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>{item.name}</Typography>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={item.region} size="small" sx={{ bgcolor: '#f1f5f9', color: '#475569', borderRadius: 1, fontSize: '0.75rem' }} />
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
            >
                <MenuItem onClick={handleOpenDialog} sx={{ py: 1.5, gap: 1.5 }}>
                    <VisibilityOutlinedIcon fontSize="small" sx={{ color: '#3b82f6' }} />
                    <Typography variant="body2" fontWeight={500}>{agendaNumber === 5 ? "ทบทวนมติ" : "จัดการทรัพย์สิน"}</Typography>
                </MenuItem>
                <MenuItem onClick={() => selectedItemForMenu && handleRemoveAgendaItem(selectedItemForMenu.id)} sx={{ py: 1.5, gap: 1.5 }}>
                    <DeleteOutlineIcon fontSize="small" sx={{ color: '#ef4444' }} />
                    <Typography variant="body2" fontWeight={500} color="#ef4444">นำออกจากวาระ</Typography>
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

                        {loadingAssets ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
                        ) : (
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
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
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