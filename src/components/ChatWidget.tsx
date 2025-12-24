'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Box, Paper, TextField, IconButton, Typography,
    Fab, CircularProgress, Stack, Avatar, Fade, Slide, Zoom, Chip, Tooltip,
    Dialog, DialogTitle, DialogContent, DialogActions, Button
} from '@mui/material';

// Icons
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import MinimizeIcon from '@mui/icons-material/Minimize';

// Feedback Icons
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined';
import ThumbDownAltIcon from '@mui/icons-material/ThumbDownAlt';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

interface Message {
    id: string;
    role: 'user' | 'bot';
    text: string;
    rating?: 'LIKE' | 'DISLIKE';
    disableFeedback?: boolean; // เพิ่มตัวแปรนี้เพื่อปิดการแสดง feedback
}

type ChatSize = 'medium' | 'large';

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome-msg',
            role: 'bot',
            text: 'สวัสดีครับ! ยินดีต้อนรับสู่ ASLES AI Assistant 👋\n\nผมพร้อมช่วยตอบคำถามเกี่ยวกับระบบ ASLES ของคุณ มีอะไรให้ช่วยไหมครับ?',
            disableFeedback: true // กำหนดให้ข้อความแรกไม่ต้องมีปุ่มประเมิน
        }
    ]);
    const [loading, setLoading] = useState(false);
    const [showWelcome, setShowWelcome] = useState(true);
    const [chatSize, setChatSize] = useState<ChatSize>('medium');
    const [isMinimized, setIsMinimized] = useState(false);

    // State สำหรับ Feedback
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [currentFeedbackId, setCurrentFeedbackId] = useState<string | null>(null);
    const [currentRatingType, setCurrentRatingType] = useState<'LIKE' | 'DISLIKE' | null>(null);
    const [feedbackComment, setFeedbackComment] = useState("");
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const getSizeConfig = (size: ChatSize) => {
        switch (size) {
            case 'medium': return { width: 400, height: 550 };
            case 'large': return { width: 520, height: 680 };
        }
    };
    const sizeConfig = getSizeConfig(chatSize);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // --- Logic การส่งข้อความ ---
    const handleSend = async () => {
        if (!input.trim()) return;
        setShowWelcome(false);

        const tempId = Date.now().toString();

        const userMsg: Message = { id: `user-${tempId}`, role: 'user', text: input };
        setMessages((prev) => [...prev, userMsg]);

        const userInput = input;
        setInput("");
        setLoading(true);

        try {
            // จำลอง API Call (เปลี่ยน URL เป็นของจริงเมื่อพร้อม)
            const response = await fetch("http://localhost:8080/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userInput }),
            });

            let botText = "ขออภัย ระบบขัดข้อง";
            let logId = `bot-${Date.now()}`;

            if (response.ok) {
                const data = await response.json();
                botText = data.candidates?.[0]?.content?.parts?.[0]?.text || botText;
            }

            // ข้อความตอบกลับปกติ จะไม่มี disableFeedback (default false/undefined)
            const botMsg: Message = { id: logId, role: 'bot', text: botText };
            setMessages((prev) => [...prev, botMsg]);

        } catch (error: any) {
            console.error("Chat Error:", error);
            setMessages((prev) => [...prev, {
                id: `err-${Date.now()}`,
                role: 'bot',
                text: `⚠️ เกิดข้อผิดพลาด: ${error.message}`,
                disableFeedback: true // Error message ไม่ต้องให้คะแนนก็ได้
            }]);
        } finally {
            setLoading(false);
        }
    };

    // --- Logic การให้ Feedback ---
    const handleRate = (msgId: string, type: 'LIKE' | 'DISLIKE') => {
        setCurrentFeedbackId(msgId);
        setCurrentRatingType(type);
        setFeedbackComment("");
        setFeedbackOpen(true);
    };

    const submitFeedback = async () => {
        if (!currentFeedbackId || !currentRatingType) return;

        // อัพเดท UI ก่อนเพื่อให้ผู้ใช้เห็นการเปลี่ยนแปลงทันที
        setMessages(prev => prev.map(msg =>
            msg.id === currentFeedbackId ? { ...msg, rating: currentRatingType } : msg
        ));

        try {
            // หาข้อความที่เกี่ยวข้องเพื่อส่ง context ไปด้วย
            const currentMessage = messages.find(msg => msg.id === currentFeedbackId);
            const messageIndex = messages.findIndex(msg => msg.id === currentFeedbackId);
            const userMessage = messageIndex > 0 ? messages[messageIndex - 1]?.text : '';

            const feedbackData = {
                logId: currentFeedbackId,
                rating: currentRatingType,
                comment: feedbackComment || '',
                userName: 'ผู้ใช้งาน', // สามารถแก้ไขให้รับจาก props หรือ context ได้
                userMessage: userMessage,
                botResponse: currentMessage?.text || ''
            };

            console.log("Submitting Feedback:", feedbackData);

            const response = await fetch("http://localhost:8080/api/chat/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(feedbackData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Feedback submission failed:", errorData);
                // แสดง error message ให้ผู้ใช้ทราบ (optional)
                alert("ไม่สามารถบันทึกการประเมินได้: " + (errorData.message || "เกิดข้อผิดพลาด"));
            } else {
                const result = await response.json();
                console.log("Feedback submitted successfully:", result);
            }
        } catch (error) {
            console.error("Feedback Error:", error);
            // แสดง error message ให้ผู้ใช้ทราบ (optional)
            alert("เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง");
        } finally {
            setFeedbackOpen(false);
        }
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const toggleSize = () => {
        setChatSize(chatSize === 'medium' ? 'large' : 'medium');
    };

    return (
        <>
            <Slide direction="up" in={isOpen && !isMinimized} mountOnEnter unmountOnExit>
                <Box sx={{ position: 'fixed', bottom: 90, right: 20, zIndex: 1300 }}>
                    <Paper
                        elevation={12}
                        sx={{
                            width: sizeConfig.width,
                            height: sizeConfig.height,
                            display: 'flex', flexDirection: 'column',
                            borderRadius: 3, overflow: 'hidden',
                            border: '1px solid rgba(20, 19, 113, 0.1)',
                            boxShadow: '0 12px 40px rgba(20, 19, 113, 0.15)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                    >
                        {/* Header */}
                        <Box sx={{
                            p: 2.5,
                            background: 'linear-gradient(135deg, #141371 0%, #1e1b9e 100%)',
                            color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 36, height: 36 }}>
                                    <SmartToyIcon sx={{ fontSize: 20 }} />
                                </Avatar>
                                <Box>
                                    <Typography variant="subtitle1" fontWeight="bold">ASLES AI</Typography>
                                    <Chip
                                        label="ออนไลน์"
                                        size="small"
                                        sx={{
                                            height: 20,
                                            bgcolor: '#10b981',
                                            color: 'white',
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                            '& .MuiChip-label': { px: 1 }
                                        }}
                                    />
                                </Box>
                            </Stack>
                            <Stack direction="row" spacing={0.5}>
                                <Tooltip title="ปรับขนาด"><IconButton size="small" onClick={toggleSize} sx={{ color: 'white' }}>{chatSize === 'large' ? <CloseFullscreenIcon fontSize="small" /> : <OpenInFullIcon fontSize="small" />}</IconButton></Tooltip>
                                <Tooltip title="ย่อ"><IconButton size="small" onClick={() => setIsMinimized(true)} sx={{ color: 'white' }}><MinimizeIcon fontSize="small" /></IconButton></Tooltip>
                                <Tooltip title="ปิด"><IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'white' }}><CloseIcon fontSize="small" /></IconButton></Tooltip>
                            </Stack>
                        </Box>

                        {/* Chat Content */}
                        <Box sx={{
                            flexGrow: 1, p: 1.5, overflowY: 'auto',
                            background: 'linear-gradient(to bottom, #f8fafc 0%, #ffffff 100%)',
                        }}>
                            {showWelcome && messages.length === 1 && (
                                <Box sx={{ textAlign: 'center', mb: 2 }}>
                                    <Chip
                                        icon={<AutoAwesomeIcon />}
                                        label="ระบบ AI พร้อมช่วยเหลือคุณ"
                                        size="small"
                                        sx={{
                                            bgcolor: 'rgba(20, 19, 113, 0.08)',
                                            color: '#141371',
                                            fontWeight: 500,
                                            fontSize: '0.75rem'
                                        }}
                                    />
                                </Box>
                            )}

                            {messages.map((msg, index) => (
                                <Fade in key={index}>
                                    <Box sx={{
                                        display: 'flex', flexDirection: 'column',
                                        alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                        mb: 2
                                    }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'row', maxWidth: '85%' }}>
                                            {msg.role === 'bot' && (
                                                <Avatar sx={{ width: 32, height: 32, bgcolor: '#141371', mr: 1.5, mt: 0.5 }}>
                                                    <SmartToyIcon sx={{ fontSize: 18 }} />
                                                </Avatar>
                                            )}

                                            <Box>
                                                <Paper
                                                    elevation={0}
                                                    sx={{
                                                        p: 1.5,
                                                        borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                                        background: msg.role === 'user' ? 'linear-gradient(135deg, #141371 0%, #1e1b9e 100%)' : 'white',
                                                        color: msg.role === 'user' ? 'white' : 'text.primary',
                                                        boxShadow: msg.role === 'user' ? '0 4px 16px rgba(20, 19, 113, 0.2)' : '0 2px 12px rgba(0, 0, 0, 0.06)',
                                                        border: msg.role === 'bot' ? '1px solid rgba(0, 0, 0, 0.05)' : 'none',
                                                    }}
                                                >
                                                    <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }} />
                                                </Paper>

                                                {/* --- Feedback Action Bar --- */}
                                                {/* เพิ่มเงื่อนไข !msg.disableFeedback เพื่อซ่อนถ้าเป็น Welcome message */}
                                                {msg.role === 'bot' && !msg.disableFeedback && (
                                                    <Stack direction="row" spacing={1} sx={{ mt: 0.5, ml: 1 }}>
                                                        <Tooltip title="คำตอบมีประโยชน์">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleRate(msg.id, 'LIKE')}
                                                                sx={{
                                                                    color: msg.rating === 'LIKE' ? '#10b981' : 'text.disabled',
                                                                    padding: '4px'
                                                                }}
                                                            >
                                                                {msg.rating === 'LIKE' ? <ThumbUpAltIcon fontSize="small" /> : <ThumbUpAltOutlinedIcon fontSize="small" />}
                                                            </IconButton>
                                                        </Tooltip>

                                                        <Tooltip title="คำตอบไม่ถูกต้อง">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleRate(msg.id, 'DISLIKE')}
                                                                sx={{
                                                                    color: msg.rating === 'DISLIKE' ? '#ef4444' : 'text.disabled',
                                                                    padding: '4px'
                                                                }}
                                                            >
                                                                {msg.rating === 'DISLIKE' ? <ThumbDownAltIcon fontSize="small" /> : <ThumbDownAltOutlinedIcon fontSize="small" />}
                                                            </IconButton>
                                                        </Tooltip>

                                                        <Tooltip title={copiedId === msg.id ? "คัดลอกแล้ว" : "คัดลอกข้อความ"}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleCopy(msg.text, msg.id)}
                                                                sx={{ color: 'text.disabled', padding: '4px' }}
                                                            >
                                                                {copiedId === msg.id ? <CheckIcon fontSize="small" color="success" /> : <ContentCopyIcon fontSize="small" />}
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Stack>
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>
                                </Fade>
                            ))}

                            {loading && (
                                <Box sx={{ display: 'flex', ml: 5, mb: 2 }}>
                                    <Paper elevation={0} sx={{ p: 1.5, borderRadius: '16px', bgcolor: 'white', border: '1px solid rgba(0,0,0,0.06)' }}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <CircularProgress size={14} sx={{ color: '#141371' }} />
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>AI กำลังพิมพ์...</Typography>
                                        </Stack>
                                    </Paper>
                                </Box>
                            )}
                            <div ref={messagesEndRef} />
                        </Box>

                        {/* Input Area */}
                        <Box sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.06)', bgcolor: 'white', display: 'flex', gap: 1.5 }}>
                            <TextField
                                fullWidth size="small" multiline maxRows={3}
                                placeholder="พิมพ์ข้อความ..."
                                value={input} onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                disabled={loading}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } }}
                            />
                            <IconButton onClick={handleSend} disabled={loading || !input.trim()} sx={{ bgcolor: input.trim() ? '#141371' : 'rgba(0,0,0,0.08)', color: 'white', '&:hover': { bgcolor: '#1e1b9e' } }}>
                                <SendIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    </Paper>
                </Box>
            </Slide>

            <Slide direction="up" in={isOpen && isMinimized} mountOnEnter unmountOnExit>
                <Fab variant="extended" size="medium" color="primary" onClick={() => setIsMinimized(false)} sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1300, bgcolor: '#141371' }}>
                    <SmartToyIcon sx={{ mr: 1 }} /> เปิดแชท
                </Fab>
            </Slide>

            <Zoom in={!isOpen}>
                <Fab color="primary" onClick={() => { setIsOpen(true); setIsMinimized(false); }} sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1300, bgcolor: '#141371' }}>
                    <ChatIcon />
                </Fab>
            </Zoom>

            {/* --- Feedback Dialog --- */}
            <Dialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
                    {currentRatingType === 'LIKE' ? 'สิ่งที่ชอบเกี่ยวกับคำตอบนี้?' : 'ทำไมคำตอบนี้ถึงไม่เป็นประโยชน์?'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus margin="dense" id="comment"
                        label="ความคิดเห็นเพิ่มเติม (ไม่บังคับ)"
                        type="text" fullWidth multiline rows={3} variant="outlined"
                        value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)}
                        placeholder={currentRatingType === 'LIKE' ? "เช่น ตอบตรงประเด็น, ข้อมูลครบถ้วน" : "เช่น ข้อมูลผิด, ไม่ตรงคำถาม"}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setFeedbackOpen(false)} color="inherit" size="small">ยกเลิก</Button>
                    <Button onClick={submitFeedback} variant="contained" size="small" sx={{ bgcolor: '#141371' }}>ส่งข้อมูล</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}