import React, { useEffect, useState, useRef } from 'react';
import { Box, TextField, IconButton, Typography, Paper } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { ChatMessage } from '../../types/chat';
import { chatService } from '../../services/ChatService';
import { formatDistanceToNow } from 'date-fns';
import { sk } from 'date-fns/locale';

interface ChatViewProps {
    chatId: string;
}

export const ChatView: React.FC<ChatViewProps> = ({ chatId }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const currentUserId = chatService.getCurrentUserId();

    useEffect(() => {
        const unsubscribe = chatService.startListeningToMessages(chatId, (updatedMessages) => {
            setMessages(updatedMessages);
        });

        return () => unsubscribe();
    }, [chatId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim()) return;

        try {
            await chatService.sendMessage(chatId, newMessage.trim());
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                {messages.map((message) => (
                    <Box
                        key={message.id}
                        sx={{
                            display: 'flex',
                            justifyContent: message.senderId === currentUserId ? 'flex-end' : 'flex-start',
                            mb: 2
                        }}
                    >
                        <Paper
                            sx={{
                                p: 2,
                                backgroundColor: message.senderId === currentUserId ? 'primary.main' : 'grey.100',
                                color: message.senderId === currentUserId ? 'white' : 'text.primary',
                                maxWidth: '70%'
                            }}
                        >
                            <Typography variant="body1">{message.content}</Typography>
                            <Typography
                                variant="caption"
                                sx={{
                                    display: 'block',
                                    mt: 1,
                                    color: message.senderId === currentUserId ? 'white' : 'text.secondary'
                                }}
                            >
                                {formatDistanceToNow(message.timestamp.toDate(), {
                                    addSuffix: true,
                                    locale: sk
                                })}
                                {message.read && message.senderId === currentUserId && ' • Prečítané'}
                            </Typography>
                        </Paper>
                    </Box>
                ))}
                <div ref={messagesEndRef} />
            </Box>
            <Box sx={{ p: 2, backgroundColor: 'background.paper' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Napíšte správu..."
                        variant="outlined"
                        size="small"
                    />
                    <IconButton
                        color="primary"
                        onClick={handleSend}
                        disabled={!newMessage.trim()}
                    >
                        <SendIcon />
                    </IconButton>
                </Box>
            </Box>
        </Box>
    );
}; 