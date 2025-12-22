'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Box, Paper, TextField, IconButton, Typography,
    Fab, CircularProgress, Stack, Avatar, Fade, Slide, Zoom, Chip
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

interface Message {
    role: 'user' | 'bot';
    text: string;
}

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        { role: 'bot', text: 'สวัสดีครับ! ยินดีต้อนรับสู่ AI Assistant 👋\n\nผมพร้อมช่วยตอบคำถามเกี่ยวกับระบบ ASLES ของคุณ มีอะไรให้ช่วยไหมครับ?' }
    ]);
    const [loading, setLoading] = useState(false);
    const [showWelcome, setShowWelcome] = useState(true);

    // ใช้สำหรับ Auto Scroll ลงล่างสุด
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        setShowWelcome(false); // ซ่อน Welcome message เมื่อเริ่มแชท

        // 1. ใส่ข้อความ User
        const userMsg: Message = { role: 'user', text: input };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            // 2. ยิง API ไปหา Backend (Spring Boot)
            const response = await fetch("http://localhost:8080/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: input }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();

            const botText = data.candidates?.[0]?.content?.parts?.[0]?.text || "ขออภัย ระบบขัดข้อง";

            const botMsg: Message = { role: 'bot', text: botText };
            setMessages((prev) => [...prev, botMsg]);

        } catch (error: any) {
            console.error("Chat Error:", error);
            setMessages((prev) => [...prev, { role: 'bot', text: `⚠️ เกิดข้อผิดพลาด: ${error.message}` }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Slide direction="up" in={isOpen} mountOnEnter unmountOnExit>
                <Box sx={{ position: 'fixed', bottom: 90, right: 20, zIndex: 1300 }}>
                    <Paper
                        elevation={12}
                        sx={{
                            width: 380,
                            height: 500,
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: 3,
                            overflow: 'hidden',
                            border: '1px solid rgba(20, 19, 113, 0.1)',
                            boxShadow: '0 12px 40px rgba(20, 19, 113, 0.15)',
                        }}
                    >
                    {/* Header แบบ Gradient ที่สวยงาม */}
                    <Box sx={{
                        p: 2.5,
                        background: 'linear-gradient(135deg, #141371 0%, #1e1b9e 100%)',
                        color: 'white',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Zoom in={isOpen}>
                                <Avatar sx={{
                                    bgcolor: 'rgba(255,255,255,0.2)',
                                    backdropFilter: 'blur(10px)',
                                    width: 36,
                                    height: 36
                                }}>
                                    <SmartToyIcon sx={{ fontSize: 20 }} />
                                </Avatar>
                            </Zoom>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                                    AI Assistant
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.7rem' }}>
                                    <Fade in={isOpen} timeout={1000}>
                                        <span>● ออนไลน์</span>
                                    </Fade>
                                </Typography>
                            </Box>
                        </Stack>
                        <IconButton
                            size="small"
                            onClick={() => setIsOpen(false)}
                            sx={{
                                color: 'white',
                                '&:hover': {
                                    bgcolor: 'rgba(255,255,255,0.15)',
                                    transform: 'rotate(90deg)',
                                    transition: 'all 0.3s ease'
                                }
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    {/* Chat Content */}
                    <Box sx={{
                        flexGrow: 1,
                        p: 2.5,
                        overflowY: 'auto',
                        background: 'linear-gradient(to bottom, #f8fafc 0%, #ffffff 100%)',
                        '&::-webkit-scrollbar': {
                            width: '6px',
                        },
                        '&::-webkit-scrollbar-track': {
                            background: '#f1f1f1',
                            borderRadius: '10px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: '#141371',
                            borderRadius: '10px',
                            '&:hover': {
                                background: '#1e1b9e',
                            }
                        }
                    }}>
                        {/* Welcome Badge */}
                        {showWelcome && messages.length === 1 && (
                            <Fade in timeout={800}>
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
                            </Fade>
                        )}

                        {messages.map((msg, index) => (
                            <Fade in timeout={500} key={index}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                        mb: 2,
                                        animation: 'slideIn 0.3s ease-out',
                                        '@keyframes slideIn': {
                                            from: {
                                                opacity: 0,
                                                transform: msg.role === 'user' ? 'translateX(20px)' : 'translateX(-20px)'
                                            },
                                            to: {
                                                opacity: 1,
                                                transform: 'translateX(0)'
                                            }
                                        }
                                    }}
                                >
                                    {/* ถ้าเป็น Bot ให้โชว์ Avatar */}
                                    {msg.role === 'bot' && (
                                        <Avatar sx={{
                                            width: 32,
                                            height: 32,
                                            background: 'linear-gradient(135deg, #141371 0%, #1e1b9e 100%)',
                                            mr: 1.5,
                                            mt: 0.5,
                                            boxShadow: '0 2px 8px rgba(20, 19, 113, 0.2)'
                                        }}>
                                            <SmartToyIcon sx={{ fontSize: 18 }} />
                                        </Avatar>
                                    )}

                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            maxWidth: '75%',
                                            borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                            background: msg.role === 'user'
                                                ? 'linear-gradient(135deg, #141371 0%, #1e1b9e 100%)'
                                                : 'white',
                                            color: msg.role === 'user' ? 'white' : 'text.primary',
                                            boxShadow: msg.role === 'user'
                                                ? '0 4px 12px rgba(20, 19, 113, 0.25)'
                                                : '0 2px 8px rgba(0, 0, 0, 0.08)',
                                            border: msg.role === 'bot' ? '1px solid rgba(0, 0, 0, 0.06)' : 'none',
                                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                            '&:hover': {
                                                transform: 'translateY(-1px)',
                                                boxShadow: msg.role === 'user'
                                                    ? '0 6px 16px rgba(20, 19, 113, 0.3)'
                                                    : '0 4px 12px rgba(0, 0, 0, 0.12)',
                                            }
                                        }}
                                    >
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                whiteSpace: 'pre-wrap',
                                                lineHeight: 1.6,
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            {msg.text}
                                        </Typography>
                                    </Paper>
                                </Box>
                            </Fade>
                        ))}

                        {/* Typing Indicator */}
                        {loading && (
                            <Fade in timeout={300}>
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    ml: 5,
                                    mb: 2
                                }}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 1.5,
                                            borderRadius: '16px 16px 16px 4px',
                                            bgcolor: 'white',
                                            border: '1px solid rgba(0, 0, 0, 0.06)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1
                                        }}
                                    >
                                        <CircularProgress size={16} thickness={5} sx={{ color: '#141371' }} />
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                            AI กำลังพิมพ์...
                                        </Typography>
                                    </Paper>
                                </Box>
                            </Fade>
                        )}
                        <div ref={messagesEndRef} />
                    </Box>

                    {/* Input Area */}
                    <Box sx={{
                        p: 2,
                        borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                        bgcolor: 'white',
                        display: 'flex',
                        gap: 1.5,
                        alignItems: 'flex-end',
                        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.03)'
                    }}>
                        <TextField
                            fullWidth
                            size="small"
                            multiline
                            maxRows={3}
                            placeholder="พิมพ์ข้อความที่นี่..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            disabled={loading}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3,
                                    bgcolor: '#f8fafc',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        bgcolor: '#f1f5f9',
                                    },
                                    '&.Mui-focused': {
                                        bgcolor: 'white',
                                        boxShadow: '0 0 0 2px rgba(20, 19, 113, 0.1)',
                                    }
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(0, 0, 0, 0.08)',
                                },
                                '& .MuiInputBase-input': {
                                    fontSize: '0.9rem',
                                    '&::placeholder': {
                                        color: 'rgba(0, 0, 0, 0.4)',
                                        opacity: 1
                                    }
                                }
                            }}
                        />
                        <IconButton
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            sx={{
                                background: input.trim() && !loading
                                    ? 'linear-gradient(135deg, #141371 0%, #1e1b9e 100%)'
                                    : 'rgba(0, 0, 0, 0.12)',
                                color: 'white',
                                width: 42,
                                height: 42,
                                boxShadow: input.trim() && !loading
                                    ? '0 4px 12px rgba(20, 19, 113, 0.25)'
                                    : 'none',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    background: input.trim() && !loading
                                        ? 'linear-gradient(135deg, #1e1b9e 0%, #141371 100%)'
                                        : 'rgba(0, 0, 0, 0.12)',
                                    transform: input.trim() && !loading ? 'scale(1.05) rotate(5deg)' : 'none',
                                    boxShadow: input.trim() && !loading
                                        ? '0 6px 16px rgba(20, 19, 113, 0.3)'
                                        : 'none',
                                },
                                '&:disabled': {
                                    background: 'rgba(0, 0, 0, 0.12)',
                                    color: 'rgba(0, 0, 0, 0.26)',
                                }
                            }}
                        >
                            <SendIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                    </Box>
                </Paper>
                </Box>
            </Slide>

            {/* 2. ปุ่มเปิด Chat (Fab) ขวาล่าง */}
            <Zoom in={!isOpen} timeout={300}>
            <Fab
                color="primary"
                aria-label="chat"
                onClick={() => setIsOpen(!isOpen)}
                sx={{
                    position: 'fixed',
                    bottom: 20,
                    right: 20,
                    zIndex: 1300,
                    background: 'linear-gradient(135deg, #141371 0%, #1e1b9e 100%)',
                    boxShadow: '0 8px 24px rgba(20, 19, 113, 0.3)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #1e1b9e 0%, #141371 100%)',
                        transform: 'scale(1.05)',
                        boxShadow: '0 12px 32px rgba(20, 19, 113, 0.4)',
                    },
                    transition: 'all 0.3s ease'
                }}
            >
                {isOpen ? <CloseIcon /> : <ChatIcon />}
            </Fab>
            </Zoom>
        </>
    );
}