import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, ChevronDown, CheckCheck, Smile } from 'lucide-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import './AutoChat.css';

const AutoChat = () => {
    const { i18n } = useTranslation();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    // Initialize language based on global i18n setting
    const [language, setLanguage] = useState(i18n.language?.startsWith('hi') ? 'hi' : 'en');

    // Sync with global language changes if the chat is not open/active interaction
    useEffect(() => {
        setLanguage(i18n.language?.startsWith('hi') ? 'hi' : 'en');
    }, [i18n.language]);

    const [messages, setMessages] = useState(() => {
        const savedMessages = localStorage.getItem('auto_chat_messages');
        return savedMessages ? JSON.parse(savedMessages) : [];
    });
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [step, setStep] = useState(0); // 0: init, 1: asking, 2: completed
    const [leadId, setLeadId] = useState(() => localStorage.getItem('auto_chat_lead_id'));
    const [saved, setSaved] = useState(false);
    const messagesEndRef = useRef(null);

    const isAdminPage = location.pathname.startsWith('/admin') || location.pathname.startsWith('/admin-user-explorer');

    // Close chat automatically on admin pages
    useEffect(() => {
        if (isAdminPage) setIsOpen(false);
    }, [isAdminPage]);

    // Fetch chat history logic
    useEffect(() => {
        const fetchChat = async () => {
            const user = JSON.parse(localStorage.getItem('user'));

            // If logged in, fetch from backend via userId
            if (user && user._id) {
                try {
                    const res = await axios.get(`http://localhost:5000/api/leads/user/${user._id}`);
                    if (res.data) {
                        setLeadId(res.data._id); // Sync lead ID
                        if (res.data.chatHistory) {
                            setMessages(res.data.chatHistory);
                            // Check saved state
                            const hasAssurance = res.data.chatHistory.some(m => m.translationKey === 'assurance');
                            if (hasAssurance) {
                                setSaved(true);
                                setStep(2); // Assume conversation established
                            }
                        }
                    }
                } catch (err) {
                    // If 404, valid case: user has no chat yet.
                    // We start fresh.
                    if (err.response && err.response.status === 404) {
                        // No existing chat. 
                    } else {
                        console.error("Failed to fetch user chat", err);
                    }
                }
            } else {
                // Guest: use localStorage logic (already initialized via useState, but maybe sync?)
                // If we had a leadId in localStorage, try to fetch updates (polling logic below covers this)
            }
        };

        fetchChat();
    }, []);

    // Check if we need to restore step on mount/update
    useEffect(() => {
        if (messages.length > 0 && step === 0) {
            const hasAskParam = messages.some(m => m.translationKey === 'askNumber');
            const hasAssurance = messages.some(m => m.translationKey === 'assurance');
            if (hasAssurance) {
                setSaved(true);
                setStep(2);
            } else if (hasAskParam) {
                setStep(1);
            }
        }
    }, [messages, step]);

    // Fetch latest messages from server if connected (Polling)
    useEffect(() => {
        let interval;
        const user = JSON.parse(localStorage.getItem('user'));

        // Polling condition: leadId exists AND (chat is open OR user is logged in)
        // If logged in, we want to know if admin replied even if closed? Maybe not essential for "AutoChat" widget unless we show notifications.
        // For now, poll if leadId is there.
        if (leadId && isOpen) {
            const fetchMessages = async () => {
                try {
                    const res = await axios.get(`http://localhost:5000/api/leads/${leadId}`);
                    if (res.data && res.data.chatHistory) {
                        setMessages(prev => {
                            // Prevent overwriting if local state is ahead (pending saves)
                            if (res.data.chatHistory.length < prev.length) {
                                return prev;
                            }
                            // Deep check could be better, but length check prevents the main "disappearing" issue
                            return res.data.chatHistory;
                        });

                        const hasAssurance = res.data.chatHistory.some(m => m.translationKey === 'assurance');
                        if (hasAssurance) {
                            setSaved(true);
                            setStep(2);
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch chat history", error);
                }
            };

            // Poll every 5 seconds
            interval = setInterval(fetchMessages, 5000);
        }
        return () => clearInterval(interval);
    }, [leadId, isOpen]);

    // Persist messages to localStorage ONLY if guest
    useEffect(() => {
        const user = localStorage.getItem('user');
        if (!user) {
            localStorage.setItem('auto_chat_messages', JSON.stringify(messages));
        }
    }, [messages]);

    const translations = {
        en: {
            greeting: "Hello! Welcome to Dharmarth Foundation. How can I help you today?",
            askNumber: "Please share your mobile number so our support team can assist you better.",
            invalidNumber: "That doesn't look like a valid Indian mobile number. Please try again (10 digits).",
            thankYou: "Thank you! Your number has been saved successfully.",
            assurance: "Our support team will contact you within 24 hours.",
            placeholder: "Type your number...",
            send: "Send",
            greetingResponse: "Hello! To connect you with our team, please share your mobile number.",
            smallTalkResponse: "To assist you better, please share your mobile number. Our team will contact you within 24 hours.",
            messageReceived: "Thank you for the details. Our team will review this and contact you within 24 hours.",
            responseGreeting: "Hello! We've received your message. Our team will be in touch within 24 hours.",
            responseQuestion: "We've received your query. Our support team will analyze it and contact you within 24 hours."
        },
        hi: {
            greeting: "नमस्ते! धर्मार्थ फाउंडेशन में आपका स्वागत है। आज मैं आपकी किस प्रकार सहायता कर सकता हूँ?",
            askNumber: "कृपया अपना मोबाइल नंबर साझा करें ताकि हमारी सहायता टीम आपकी बेहतर मदद कर सके।",
            invalidNumber: "यह एक मान्य भारतीय मोबाइल नंबर नहीं लग रहा है। कृपया पुनः प्रयास करें (10 अंक)।",
            thankYou: "धन्यवाद! आपका नंबर सफलतापूर्वक सेव कर लिया गया है।",
            assurance: "हमारी सहायता टीम 24 घंटे के भीतर आपसे संपर्क करेगी।",
            placeholder: "अपना नंबर टाइप करें...",
            send: "भेजें",
            greetingResponse: "नमस्ते! हमारी टीम से जुड़ने के लिए, कृपया अपना मोबाइल नंबर साझा करें।",
            smallTalkResponse: "आपकी बेहतर सहायता के लिए, कृपया अपना मोबाइल नंबर साझा करें। हमारी टीम 24 घंटे के भीतर आपसे संपर्क करेगी।",
            messageReceived: "जानकारी के लिए धन्यवाद। हमारी टीम इसकी समीक्षा करेगी और 24 घंटे के भीतर आपसे संपर्क करेगी।",
            responseGreeting: "नमस्ते! हमें आपका संदेश प्राप्त हुआ। हमारी टीम 24 घंटे के भीतर आपसे संपर्क करेगी।",
            responseQuestion: "हमें आपका प्रश्न प्राप्त हुआ है। हमारी सहायता टीम इसका विश्लेषण करेगी और 24 घंटे के भीतर आपसे संपर्क करेगी।"
        }
    };

    const t = translations[language];

    const toggleOpen = () => {
        if (!isOpen && messages.length === 0) {
            // Initial greeting
            setIsTyping(true);
            setTimeout(() => {
                addMessage({ translationKey: 'greeting', sender: 'bot' });
                setIsTyping(false);
                setTimeout(() => {
                    setIsTyping(true);
                    setTimeout(() => {
                        addMessage({ translationKey: 'askNumber', sender: 'bot' });
                        setIsTyping(false);
                        setStep(1);
                    }, 1000);
                }, 500);
            }, 800);
        }
        setIsOpen(!isOpen);
    };

    const addMessage = (msg) => {
        setMessages(prev => [...prev, msg]);
    };

    const validateNumber = (num) => {
        const regex = /^[6-9]\d{9}$/; // Indian mobile number validation
        // Remove spaces and dashes for validation
        const cleanNum = num.replace(/[\s-]/g, '');
        return regex.test(cleanNum);
    };

    const isGreeting = (text) => {
        const greetings = ['hi', 'hello', 'hey', 'namaste', 'greetings', 'good morning', 'good afternoon', 'good evening', 'ssup', 'wassup', 'hii', 'helloo'];
        const lowerText = text.toLowerCase();
        return greetings.some(g => lowerText.includes(g));
    };

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        try {
            console.log("handleSend detailed log:", { step, saved, leadId, input: inputValue });
            const userMsg = { text: inputValue, sender: 'user' };
            addMessage(userMsg);
            setInputValue('');

            if (step === 2 || (step === 2 && saved) || (leadId && step !== 0 && step !== 1)) {
                console.log("Entering Step 2 flow");
                // Already saved, append new message to backend
                const finalMessages = [...messages, userMsg];

                // Only update backend if we have a leadId
                if (leadId) {
                    try {
                        // Use atomic POST /messages to prevent overwriting history
                        await axios.post(`http://localhost:5000/api/leads/${leadId}/messages`, {
                            message: {
                                sender: userMsg.sender,
                                text: userMsg.text,
                                timestamp: new Date()
                            }
                        });

                        // Bot acknowledgment for follow-up
                        setIsTyping(true);
                        let responseKey = 'messageReceived';

                        if (isGreeting(userMsg.text)) {
                            responseKey = 'responseGreeting';
                        } else if (userMsg.text.includes('?') || userMsg.text.includes('ky') || userMsg.text.includes('kaise') || userMsg.text.includes('kab') || userMsg.text.includes('what') || userMsg.text.includes('how') || userMsg.text.includes('when')) {
                            responseKey = 'responseQuestion';
                        }

                        setTimeout(async () => {
                            const botMsg = { translationKey: responseKey, sender: 'bot', timestamp: new Date() };
                            addMessage(botMsg);
                            setIsTyping(false);

                            // Save bot reply to backend
                            try {
                                await axios.post(`http://localhost:5000/api/leads/${leadId}/messages`, {
                                    message: botMsg
                                });
                            } catch (e) { console.error("Failed to save bot reply", e); }
                        }, 1000);

                    } catch (error) {
                        console.error("Failed to update chat history", error);
                    }
                }
                return;
            }

            if (step === 1 || (step === 0 && messages.length > 0)) {
                console.log("Processing input in step 1 logic (or recovered step 0)");

                // Fallback for step 0 if messages exist but step wasn't updated yet?
                let currentStep = step;
                if (currentStep === 0) currentStep = 1;

                // Check if it's a number first (removing common format chars)
                const cleanText = userMsg.text.replace(/[\s-]/g, '');

                if (validateNumber(cleanText)) {
                    setIsTyping(true);
                    setStep(2);

                    const finalMessages = [...messages, userMsg];

                    // Save to backend
                    try {
                        const user = JSON.parse(localStorage.getItem('user'));
                        const res = await axios.post('http://localhost:5000/api/leads', {
                            mobile: cleanText,
                            language: language,
                            userId: user ? user._id || user.id : null,
                            name: user ? user.name : null,
                            email: user ? user.email : null,
                            chatHistory: finalMessages.map(m => ({
                                sender: m.sender,
                                text: m.text,
                                translationKey: m.translationKey,
                                timestamp: new Date()
                            }))
                        });

                        if (res.data && res.data.lead && res.data.lead._id) {
                            const newLeadId = res.data.lead._id;
                            setLeadId(newLeadId);
                            localStorage.setItem('auto_chat_lead_id', newLeadId);

                            setTimeout(async () => {
                                const thankMsg = { translationKey: 'thankYou', sender: 'bot', success: true, timestamp: new Date() };
                                addMessage(thankMsg);
                                setIsTyping(false);

                                // Persist thankYou message
                                try {
                                    await axios.post(`http://localhost:5000/api/leads/${newLeadId}/messages`, { message: thankMsg });
                                } catch (e) { console.error("Failed to save thankYou", e); }

                                setTimeout(() => {
                                    setIsTyping(true);
                                    setTimeout(async () => {
                                        const assuranceMsg = { translationKey: 'assurance', sender: 'bot', timestamp: new Date() };
                                        addMessage(assuranceMsg);
                                        setIsTyping(false);
                                        setSaved(true);

                                        // Persist assurance message
                                        try {
                                            await axios.post(`http://localhost:5000/api/leads/${newLeadId}/messages`, { message: assuranceMsg });
                                        } catch (e) { console.error("Failed to save assurance", e); }
                                    }, 1000);
                                }, 500);
                            }, 1000);
                        }
                    } catch (error) {
                        console.error("Failed to save lead", error);
                        addMessage({ text: "Failed to save details. Please try again.", sender: 'bot', error: true });
                    }
                } else if (isGreeting(userMsg.text)) {
                    // If it's a greeting, respond politely but ask for number again
                    setIsTyping(true);
                    setTimeout(() => {
                        addMessage({ translationKey: 'greetingResponse', sender: 'bot' });
                        setIsTyping(false);
                    }, 800);
                } else if (/[0-9]/.test(userMsg.text)) {
                    // Contains numbers but invalid -> Show invalid number error
                    setIsTyping(true);
                    setTimeout(() => {
                        addMessage({ translationKey: 'invalidNumber', sender: 'bot', error: true });
                        setIsTyping(false);
                    }, 800);
                } else {
                    // General text / small talk -> General deflection
                    setIsTyping(true);
                    setTimeout(() => {
                        addMessage({ translationKey: 'smallTalkResponse', sender: 'bot' });
                        setIsTyping(false);
                    }, 800);
                }
            }
        } catch (e) {
            console.error("CRITICAL handleSend Error:", e);
            // Optional: add a visible error message to chat
            addMessage({ text: "Something went wrong. Please try again.", sender: 'bot', error: true });
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, isOpen]);

    const switchLanguage = () => {
        const newLang = language === 'en' ? 'hi' : 'en';
        setLanguage(newLang);
    };

    if (isAdminPage) return null;

    if (!isOpen && messages.length === 0) {
        return (
            <div className="chat-widget-container">
                <button className="chat-toggle-btn" onClick={toggleOpen}>
                    <MessageCircle size={28} />
                </button>
            </div>
        );
    }

    if (!isOpen && messages.length > 0) {
        return (
            <div className="chat-widget-container">
                <button className="chat-toggle-btn" onClick={() => setIsOpen(true)}>
                    <MessageCircle size={28} />
                    <span className="badge-dot-chat"></span>
                </button>
            </div>
        );
    }

    return (
        <div className="chat-widget-container">
            <div className={`chat-window ${isOpen ? 'open' : ''}`}>
                {/* Header ... */}
                <div className="chat-header">
                    <div className="chat-identity">
                        <div className="chat-avatar-large">
                            <Smile size={24} color="white" />
                        </div>
                        <div className="chat-info">
                            <h3>Support Assistant</h3>
                            <p>{language === 'en' ? 'Online' : 'ऑनलाइन'} • {language === 'en' ? 'Replies instantly' : 'तुरंत जवाब'}</p>
                        </div>
                    </div>
                    <div className="chat-controls">
                        <button className="lang-switch" onClick={switchLanguage}>
                            {language === 'en' ? 'HI' : 'EN'}
                        </button>
                        <button className="close-chat" onClick={() => setIsOpen(false)}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="chat-body">
                    {messages.map((msg, index) => (
                        <div key={index} className={`chat-message message-${msg.sender}`}>
                            <div className="message-content">
                                {msg.translationKey ? translations[language][msg.translationKey] : msg.text}
                                {msg.success && <span className="success-tick"><CheckCheck size={10} /></span>}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="message-bot">
                            <div className="typing-indicator">
                                <div className="dot"></div>
                                <div className="dot"></div>
                                <div className="dot"></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chat-footer">
                    {/* Always show input, even if saved, but maybe show different placeholder? */}
                    <div className="input-group">
                        <input
                            type="text"
                            className="chat-input"
                            placeholder={saved ? (language === 'en' ? "Type a message..." : "संदेश टाइप करें...") : t.placeholder}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={step === 0 && messages.length === 0}
                        />
                        <button className="send-btn" onClick={handleSend} disabled={!inputValue.trim()}>
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AutoChat;
