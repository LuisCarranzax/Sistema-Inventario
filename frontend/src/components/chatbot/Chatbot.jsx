import React, { useState, useRef, useEffect } from 'react';
import { FiMessageSquare, FiX, FiSend, FiCpu } from 'react-icons/fi';
import api from '../../services/api';
import ReactMarkdown from 'react-markdown';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'bot', text: '¡Hola! Soy COMPU-BOT, tu asistente inteligente. ¿En qué puedo ayudarte hoy con el inventario o los servicios?' }
  ]);
  
  // Referencia para hacer scroll automático al último mensaje
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // 1. Agregamos el mensaje del usuario a la pantalla
    const userMsg = { sender: 'user', text: inputMessage };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');

    // 2. Simulamos un estado de "Escribiendo..."
    setMessages(prev => [...prev, { sender: 'bot', text: 'Pensando...', isTyping: true }]);

    try {
      // Llamada real al backend
      const response = await api.post('/ia/chat', { mensaje: inputMessage });
      
      // Eliminamos el mensaje de "Pensando..." y agregamos la respuesta de la IA
      setMessages(prev => {
        const newMessages = prev.filter(msg => !msg.isTyping);
        return [...newMessages, { sender: 'bot', text: response.data.respuesta }];
      });

    } catch (error) {
      setMessages(prev => {
        const newMessages = prev.filter(msg => !msg.isTyping);
        return [...newMessages, { sender: 'bot', text: 'Lo siento, tuve un error al conectar con el cerebro de IA.' }];
      });
    }
  };

  return (
    <div className="chatbot-wrapper">
      
      {isOpen && (
        <div className="chatbot-window">
          
          <div className="chatbot-header">
            <div className="chatbot-header-title">
              <FiCpu size={20} />
              <span>COMPU-BOT Asesor</span>
            </div>
            <button className="chatbot-close-btn" onClick={() => setIsOpen(false)}>
              <FiX size={24} />
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                {msg.sender === 'bot' ? (
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                ) : (
                  msg.text
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form className="chatbot-input-area" onSubmit={handleSendMessage}>
            <input 
              type="text" 
              placeholder="Escribe tu consulta aquí..." 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
            />
            <button type="submit" className="chatbot-send-btn">
              <FiSend size={18} />
            </button>
          </form>

        </div>
      )}

      {/* Burbuja Flotante para abrir/cerrar */}
      {!isOpen && (
        <button className="chatbot-bubble" onClick={() => setIsOpen(true)}>
          <FiMessageSquare size={28} />
        </button>
      )}
      
    </div>
  );
};

export default Chatbot;