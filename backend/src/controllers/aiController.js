const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../config/db');

// 1. Inicializamos Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const herramientasDeBaseDeDatos = {
  functionDeclarations: [
    {
      name: "obtenerProductosBajoStock",
      description: "Obtiene una lista de productos cuyo stock actual es menor o igual a su stock mínimo recomendado. Útil para saber qué comprar.",
    },
    {
      name: "obtenerResumenVentasHoy",
      description: "Obtiene el total de ingresos y la cantidad de ventas realizadas en el día actual.",
    },
    {
      name: "obtenerServiciosPendientes",
      description: "Obtiene la lista de equipos y servicios técnicos que actualmente están pendientes (en estado 'en_revision' o 'agendado'). Útil para saber qué falta reparar o instalar.",
    }

  ]
};

// 2. Funciones SQL Reales
const ejecutarObtenerProductosBajoStock = async () => {
    const [productos] = await db.query('SELECT codigo_interno, nombre, stock, stock_minimo FROM productos WHERE stock <= stock_minimo');
    return productos;
};

const ejecutarObtenerResumenVentasHoy = async () => {
    const [ventas] = await db.query('SELECT COUNT(id) as total_ventas, IFNULL(SUM(total), 0) as ingresos FROM ventas WHERE DATE(fecha_venta) = CURDATE() AND es_proforma = FALSE');
    return ventas[0];
};

const ejecutarObtenerServiciosPendientes = async () => {
    const [servicios] = await db.query(`
        SELECT id, cliente_nombre, equipo_dispositivo, servicio_realizado, estado 
        FROM servicios_tecnicos 
        WHERE estado IN ('en_revision', 'agendado')
    `);
    return servicios;
};

// 3. Controlador Principal
exports.procesarChat = async (req, res) => {
    const { mensaje } = req.body;

    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash", // o cualquier modelo
            tools: [herramientasDeBaseDeDatos],
            systemInstruction: "Eres COMPU-BOT, el asesor técnico y financiero del sistema ERP de COMPUDOCTOR. Tu trabajo es analizar los datos del inventario y servicios para dar recomendaciones proactivas. Tienes herramientas para consultar la base de datos. Sé conciso, profesional y amigable. Si el usuario pregunta algo fuera del contexto del negocio, niégate cortésmente."
        });

        const chat = model.startChat();
        let result = await chat.sendMessage(mensaje);
        let call = result.response.functionCalls();

        if (call && call.length > 0) {
            const functionName = call[0].name;
            let dbResult = null;

            if (functionName === "obtenerProductosBajoStock") {
                dbResult = await ejecutarObtenerProductosBajoStock();
            } else if (functionName === "obtenerResumenVentasHoy") {
                dbResult = await ejecutarObtenerResumenVentasHoy();
            } else if (functionName === "obtenerServiciosPendientes") {
                dbResult = await ejecutarObtenerServiciosPendientes();
            }

            result = await chat.sendMessage([{
                functionResponse: {
                    name: functionName,
                    response: { result: dbResult }
                }
            }]);
        }

        res.json({ respuesta: result.response.text() });

    } catch (error) {
        console.error("Error en la IA:", error);
        res.status(500).json({ respuesta: "Lo siento, tuve un problema interno al procesar tu solicitud." });
    }
};