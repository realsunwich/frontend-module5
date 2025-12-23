'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Box, Paper, TextField, IconButton, Typography,
    Fab, CircularProgress, Stack, Avatar, Fade, Slide, Zoom, Chip, Tooltip
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import MinimizeIcon from '@mui/icons-material/Minimize';

interface Message {
    role: 'user' | 'bot';
    text: string;
}

type ChatSize = 'medium' | 'large';

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        { role: 'bot', text: 'สวัสดีครับ! ยินดีต้อนรับสู่ ASLES AI Assistant 👋\n\nผมพร้อมช่วยตอบคำถามเกี่ยวกับระบบ ASLES ของคุณ มีอะไรให้ช่วยไหมครับ?' }
    ]);
    const [loading, setLoading] = useState(false);
    const [showWelcome, setShowWelcome] = useState(true);
    const [chatSize, setChatSize] = useState<ChatSize>('medium');
    const [isMinimized, setIsMinimized] = useState(false);

    // ใช้สำหรับ Auto Scroll ลงล่างสุด
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    // กำหนดขนาดของ Chat Widget ตามแต่ละ Size
    const getSizeConfig = (size: ChatSize) => {
        switch (size) {
            case 'medium':
                return { width: 400, height: 550 };
            case 'large':
                return { width: 520, height: 680 };
        }
    };

    const sizeConfig = getSizeConfig(chatSize);

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

    const toggleSize = () => {
        setChatSize(chatSize === 'medium' ? 'large' : 'medium');
    };

    return (
        <>
            <Slide direction="up" in={isOpen && !isMinimized} mountOnEnter unmountOnExit>
                <Box sx={{
                    position: 'fixed',
                    bottom: 90,
                    right: 20,
                    zIndex: 1300,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                    <Paper
                        elevation={12}
                        sx={{
                            width: sizeConfig.width,
                            height: sizeConfig.height,
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: 3,
                            overflow: 'hidden',
                            border: '1px solid rgba(20, 19, 113, 0.1)',
                            boxShadow: '0 12px 40px rgba(20, 19, 113, 0.15)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
                                    ASLES AI Assistant
                                </Typography>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                    <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.7rem' }}>
                                        <Fade in={isOpen} timeout={1000}>
                                            <span>● ออนไลน์</span>
                                        </Fade>
                                    </Typography>
                                    <Chip
                                        label={chatSize === 'medium' ? 'M' : 'L'}
                                        size="small"
                                        sx={{
                                            height: 16,
                                            fontSize: '0.6rem',
                                            bgcolor: 'rgba(255,255,255,0.15)',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            '& .MuiChip-label': {
                                                px: 0.8,
                                                py: 0
                                            }
                                        }}
                                    />
                                </Stack>
                            </Box>
                        </Stack>
                        <Stack direction="row" spacing={0.5}>
                            <Tooltip title="ปรับขนาดหน้าต่าง" arrow>
                                <IconButton
                                    size="small"
                                    onClick={toggleSize}
                                    sx={{
                                        color: 'white',
                                        '&:hover': {
                                            bgcolor: 'rgba(255,255,255,0.15)',
                                            transform: 'scale(1.1)',
                                            transition: 'all 0.3s ease'
                                        }
                                    }}
                                >
                                    {chatSize === 'large' ? <CloseFullscreenIcon fontSize="small" /> : <OpenInFullIcon fontSize="small" />}
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="ย่อหน้าต่าง" arrow>
                                <IconButton
                                    size="small"
                                    onClick={() => setIsMinimized(true)}
                                    sx={{
                                        color: 'white',
                                        '&:hover': {
                                            bgcolor: 'rgba(255,255,255,0.15)',
                                            transform: 'scale(1.1)',
                                            transition: 'all 0.3s ease'
                                        }
                                    }}
                                >
                                    <MinimizeIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="ปิดหน้าต่าง" arrow>
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        setIsOpen(false);
                                        setIsMinimized(false);
                                    }}
                                    sx={{
                                        color: 'white',
                                        '&:hover': {
                                            bgcolor: 'rgba(255,255,255,0.15)',
                                            transform: 'rotate(90deg)',
                                            transition: 'all 0.3s ease'
                                        }
                                    }}
                                >
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    </Box>

                    {/* Chat Content */}
                    <Box sx={{
                        flexGrow: 1,
                        p: 2.5,
                        overflowY: 'auto',
                        background: 'linear-gradient(to bottom, #f8fafc 0%, #ffffff 100%)',
                        position: 'relative',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '100px',
                            background: 'radial-gradient(ellipse at top, rgba(20, 19, 113, 0.03) 0%, transparent 70%)',
                            pointerEvents: 'none'
                        },
                        '&::-webkit-scrollbar': {
                            width: '6px',
                        },
                        '&::-webkit-scrollbar-track': {
                            background: 'transparent',
                            borderRadius: '10px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: 'rgba(20, 19, 113, 0.3)',
                            borderRadius: '10px',
                            transition: 'background 0.3s ease',
                            '&:hover': {
                                background: '#141371',
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
                                            borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                            background: msg.role === 'user'
                                                ? 'linear-gradient(135deg, #141371 0%, #1e1b9e 100%)'
                                                : 'white',
                                            color: msg.role === 'user' ? 'white' : 'text.primary',
                                            boxShadow: msg.role === 'user'
                                                ? '0 4px 16px rgba(20, 19, 113, 0.2)'
                                                : '0 2px 12px rgba(0, 0, 0, 0.06)',
                                            border: msg.role === 'bot' ? '1px solid rgba(0, 0, 0, 0.05)' : 'none',
                                            position: 'relative',
                                            backdropFilter: msg.role === 'bot' ? 'blur(10px)' : 'none',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                            '&::before': msg.role === 'user' ? {
                                                content: '""',
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                borderRadius: 'inherit',
                                                padding: '1px',
                                                background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%)',
                                                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                                                WebkitMaskComposite: 'xor',
                                                maskComposite: 'exclude',
                                                pointerEvents: 'none'
                                            } : {},
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: msg.role === 'user'
                                                    ? '0 8px 24px rgba(20, 19, 113, 0.3)'
                                                    : '0 4px 16px rgba(0, 0, 0, 0.1)',
                                            }
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                lineHeight: 1.6,
                                                fontSize: '0.9rem',
                                                '& b': {
                                                    fontWeight: 'bold',
                                                    color: msg.role === 'user' ? 'inherit' : '#141371'
                                                },
                                                '& i': {
                                                    fontStyle: 'italic'
                                                },
                                                '& ul': {
                                                    marginTop: '8px',
                                                    marginBottom: '8px',
                                                },
                                                '& li': {
                                                    marginBottom: '4px'
                                                }
                                            }}
                                            dangerouslySetInnerHTML={{ __html: msg.text }}
                                        />
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
                        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.05)',
                        backdropFilter: 'blur(10px)',
                        position: 'relative',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '1px',
                            background: 'linear-gradient(90deg, transparent 0%, rgba(20, 19, 113, 0.1) 50%, transparent 100%)'
                        }
                    }}>
                        <TextField
                            fullWidth
                            size="small"
                            multiline
                            maxRows={3}
                            placeholder="พิมพ์ข้อความของคุณที่นี่..."
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
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    border: '2px solid transparent',
                                    '&:hover': {
                                        bgcolor: '#f1f5f9',
                                        borderColor: 'rgba(20, 19, 113, 0.08)',
                                    },
                                    '&.Mui-focused': {
                                        bgcolor: 'white',
                                        borderColor: 'rgba(20, 19, 113, 0.2)',
                                        boxShadow: '0 4px 20px rgba(20, 19, 113, 0.08)',
                                    }
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'transparent',
                                },
                                '& .MuiInputBase-input': {
                                    fontSize: '0.9rem',
                                    fontWeight: 400,
                                    '&::placeholder': {
                                        color: 'rgba(0, 0, 0, 0.35)',
                                        opacity: 1,
                                        fontStyle: 'italic'
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
                                    : 'rgba(0, 0, 0, 0.08)',
                                color: 'white',
                                width: 44,
                                height: 44,
                                boxShadow: input.trim() && !loading
                                    ? '0 4px 16px rgba(20, 19, 113, 0.3)'
                                    : 'none',
                                position: 'relative',
                                overflow: 'hidden',
                                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                '&::before': input.trim() && !loading ? {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 100%)',
                                    borderRadius: 'inherit',
                                    opacity: 0,
                                    transition: 'opacity 0.3s ease'
                                } : {},
                                '&:hover': {
                                    background: input.trim() && !loading
                                        ? 'linear-gradient(135deg, #1e1b9e 0%, #141371 100%)'
                                        : 'rgba(0, 0, 0, 0.08)',
                                    transform: input.trim() && !loading ? 'scale(1.08) rotate(-5deg)' : 'none',
                                    boxShadow: input.trim() && !loading
                                        ? '0 8px 24px rgba(20, 19, 113, 0.4)'
                                        : 'none',
                                    '&::before': {
                                        opacity: 1
                                    }
                                },
                                '&:active': {
                                    transform: input.trim() && !loading ? 'scale(0.95)' : 'none',
                                },
                                '&:disabled': {
                                    background: 'rgba(0, 0, 0, 0.08)',
                                    color: 'rgba(0, 0, 0, 0.26)',
                                }
                            }}
                        >
                            <SendIcon sx={{ fontSize: 20, position: 'relative', zIndex: 1 }} />
                        </IconButton>
                    </Box>
                </Paper>
                </Box>
            </Slide>

            {/* Minimized Bar */}
            <Slide direction="up" in={isOpen && isMinimized} mountOnEnter unmountOnExit>
                <Paper
                    elevation={6}
                    onClick={() => setIsMinimized(false)}
                    sx={{
                        position: 'fixed',
                        bottom: 20,
                        right: 20,
                        zIndex: 1300,
                        width: 280,
                        p: 1.5,
                        background: 'linear-gradient(135deg, #141371 0%, #1e1b9e 100%)',
                        color: 'white',
                        borderRadius: 2,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 12px 32px rgba(20, 19, 113, 0.4)',
                        }
                    }}
                >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{
                            bgcolor: 'rgba(255,255,255,0.2)',
                            width: 32,
                            height: 32
                        }}>
                            <SmartToyIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" fontWeight="bold">
                                ASLES AI Assistant
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.7rem' }}>
                                คลิกเพื่อเปิดหน้าต่างแชท
                            </Typography>
                        </Box>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                                setIsMinimized(false);
                            }}
                            sx={{
                                color: 'white',
                                '&:hover': {
                                    bgcolor: 'rgba(255,255,255,0.15)',
                                }
                            }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Stack>
                </Paper>
            </Slide>

            {/* 2. ปุ่มเปิด Chat (Fab) ขวาล่าง */}
            <Zoom in={!isOpen} timeout={300}>
            <Fab
                color="primary"
                aria-label="chat"
                onClick={() => {
                    setIsOpen(true);
                    setIsMinimized(false);
                }}
                sx={{
                    position: 'fixed',
                    bottom: 20,
                    right: 20,
                    zIndex: 1300,
                    background: 'linear-gradient(135deg, #141371 0%, #1e1b9e 100%)',
                    boxShadow: '0 8px 24px rgba(20, 19, 113, 0.3)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #1e1b9e 0%, #141371 100%)',
                        transform: 'scale(1.1) rotate(5deg)',
                        boxShadow: '0 12px 32px rgba(20, 19, 113, 0.4)',
                    },
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
            >
                <ChatIcon />
            </Fab>
            </Zoom>
        </>
    );
}