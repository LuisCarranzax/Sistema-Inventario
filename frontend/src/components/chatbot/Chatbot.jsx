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
  const [tieneAlertas, setTieneAlertas] = useState(false);
  
  // Referencia para hacer scroll automático al último mensaje
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Chequeo inicial de alertas al iniciar sesión / montar
  useEffect(() => {
    const verificarAlertas = async () => {
      try {
        const response = await api.get('/dashboard');
        const countStock = response.data.alertas_stock ? response.data.alertas_stock.length : 0;
        const countEntrega = response.data.servicios_pendientes_entrega || 0;
        const countPago = response.data.servicios_pendientes_pago || 0;

        if (countStock > 0 || countEntrega > 0 || countPago > 0) {
          setTieneAlertas(true);
          setMessages([
            { 
              sender: 'bot', 
              text: `👋 ¡Hola! Soy COMPU-BOT. He detectado algunas alertas en el negocio que requieren atención:\n\n` +
                    `⚠️ **${countStock}** productos con bajo stock.\n` +
                    `🔧 **${countEntrega}** servicios pendientes de entrega.\n` +
                    `💵 **${countPago}** servicios con pagos pendientes.\n\n` +
                    `¿Quieres que te muestre un resumen detallado de estas alertas? Escribe la palabra *"mostrar resumen"* aquí mismo o presiona el botón que verás al final del chat.`
            }
          ]);
        }
      } catch (error) {
        console.error("Error al comprobar alertas iniciales:", error);
      }
    };
    verificarAlertas();
  }, []);

  const handleRequestResumen = async () => {
    setTieneAlertas(false);
    
    const userPrompt = "Mostrar resumen de alertas del negocio";
    const systemPrompt = "Hola COMPU-BOT, por favor dame un reporte resumido del estado actual del negocio, detallando:\n" +
      "1. Los productos que están con stock bajo o agotados (puedes usar consultarInventario con filtro 'bajo_stock').\n" +
      "2. Los servicios técnicos que están pendientes de entrega (estado 'en_revision' o 'reparado') y los que tienen pagos pendientes (estado_pago 'pendiente' o 'a_cuenta'). Usa consultarServicios para encontrarlos.\n" +
      "Presenta la información de forma clara y amigable en formato de lista con viñetas y negrita.";

    setMessages(prev => [...prev, { sender: 'user', text: userPrompt }]);
    setMessages(prev => [...prev, { sender: 'bot', text: 'Analizando el estado del inventario y del taller...', isTyping: true }]);
    
    try {
      const response = await api.post('/ia/chat', { mensaje: systemPrompt });
      setMessages(prev => {
        const newMessages = prev.filter(msg => !msg.isTyping);
        return [...newMessages, { sender: 'bot', text: response.data.respuesta }];
      });
    } catch (error) {
      setMessages(prev => {
        const newMessages = prev.filter(msg => !msg.isTyping);
        return [...newMessages, { sender: 'bot', text: 'Error al obtener el reporte de alertas.' }];
      });
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage.trim();
    const userMsg = { sender: 'user', text: userText };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setTieneAlertas(false);

    setMessages(prev => [...prev, { sender: 'bot', text: 'Pensando...', isTyping: true }]);

    // Si el usuario escribe mostrar resumen, reemplazamos por el prompt completo
    let mensajeEnviar = userText;
    if (userText.toLowerCase() === 'mostrar resumen') {
      mensajeEnviar = "Hola COMPU-BOT, por favor dame un reporte resumido del estado actual del negocio, detallando:\n" +
        "1. Los productos que están con stock bajo o agotados (puedes usar consultarInventario con filtro 'bajo_stock').\n" +
        "2. Los servicios técnicos que están pendientes de entrega (estado 'en_revision' o 'reparado') y los que tienen pagos pendientes (estado_pago 'pendiente' o 'a_cuenta'). Usa consultarServicios para encontrarlos.\n" +
        "Presenta la información de forma clara y amigable en formato de lista con viñetas y negrita.";
    }

    try {
      const response = await api.post('/ia/chat', { mensaje: mensajeEnviar });
      
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
    <>
      {/* Burbuja Flotante para ABRIR el chat */}
      {!isOpen && (
        <button 
          className={`chatbot-bubble ${tieneAlertas ? 'tiene-alertas' : ''}`} 
          onClick={() => {
            setIsOpen(true);
            setTieneAlertas(false);
          }}
          title="COMPU-BOT Asesor"
        >
          <FiMessageSquare size={28} />
          {tieneAlertas && (
            <span className="chatbot-badge">!</span>
          )}
        </button>
      )}

      {/* Estructura del SIDEBAR y el OVERLAY oscuro */}
      {isOpen && (
        <>
          {/* Al hacer clic en lo oscuro, se cierra el menú */}
          <div className="chatbot-overlay" onClick={() => setIsOpen(false)}></div>
          
          <div className="chatbot-sidebar">
            <div className="chatbot-header">
              <div className="chatbot-header-title">
                <FiCpu size={22} />
                <span>COMPU-BOT Asesor</span>
              </div>
              <button className="chatbot-close-btn" onClick={() => setIsOpen(false)}>
                <FiX size={26} />
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
              
              {/* Chip de sugerencia de reporte de alertas */}
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '10px' }}>
                <button 
                  type="button"
                  onClick={handleRequestResumen}
                  className="chatbot-chip-btn"
                >
                  📋 Mostrar Resumen de Alertas
                </button>
              </div>

              <div ref={messagesEndRef} />
            </div>

            <form className="chatbot-input-area" onSubmit={handleSendMessage}>
              <input 
                type="text" 
                placeholder="Pregunta sobre ventas, stock o servicios..." 
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
              />
              <button type="submit" className="chatbot-send-btn">
                <FiSend size={20} />
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
};

export default Chatbot;