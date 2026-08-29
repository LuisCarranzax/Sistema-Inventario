const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const db = require('../config/db');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. MEGA-HERRAMIENTAS PARAMETRIZADAS
const herramientasDeBaseDeDatos = {
  functionDeclarations: [
    {
      name: "consultarInventario",
      description: "Consulta los productos del inventario. Usa los filtros para buscar productos recientes, agotados o consultar fechas de registro.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          filtro: { type: SchemaType.STRING, description: "Valores permitidos: 'recientes', 'bajo_stock', 'todos'" },
          limite: { type: SchemaType.NUMBER, description: "Cantidad máxima de resultados a mostrar" }
        }
      }
    },
    {
      name: "consultarServicios",
      description: "Consulta el historial y estado de los servicios técnicos (reparaciones, mantenimientos).",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          estado: { type: SchemaType.STRING, description: "Filtro opcional: 'en_revision', 'reparado', 'entregado', 'agendado'" },
          estado_pago: { type: SchemaType.STRING, description: "Filtro opcional: 'pendiente', 'a_cuenta', 'cancelado'" }
        }
      }
    },
    {
      name: "consultarEstadisticasVentas",
      description: "Obtiene resúmenes de ventas para identificar métodos de pago frecuentes o volúmenes de venta.",
    }
  ]
};

// 2. LÓGICA SQL DINÁMICA
const ejecutarConsultarInventario = async (args) => {
    let query = 'SELECT codigo_interno, nombre, stock, stock_minimo, fecha_abastecimiento FROM productos';
    if (args.filtro === 'bajo_stock') query += ' WHERE stock <= stock_minimo';
    if (args.filtro === 'recientes') query += ' ORDER BY fecha_abastecimiento DESC';
    query += ` LIMIT ${args.limite || 10}`;
    const [resultados] = await db.query(query);
    return resultados;
};

const ejecutarConsultarServicios = async (args) => {
    let query = 'SELECT id, cliente_nombre, equipo_dispositivo, estado, estado_pago, precio FROM servicios_tecnicos WHERE 1=1';
    const params = [];
    if (args.estado) { query += ' AND estado = ?'; params.push(args.estado); }
    if (args.estado_pago) { query += ' AND estado_pago = ?'; params.push(args.estado_pago); }
    query += ' ORDER BY fecha_ingreso DESC LIMIT 15';
    const [resultados] = await db.query(query, params);
    return resultados;
};

const ejecutarEstadisticasVentas = async () => {
    const [metodosPago] = await db.query('SELECT medio_pago, COUNT(*) as cantidad, SUM(total) as ingresos FROM ventas WHERE es_proforma = FALSE GROUP BY medio_pago');
    return { metodos_pago_frecuentes: metodosPago };
};

// 3. CONTROLADOR PRINCIPAL
exports.procesarChat = async (req, res) => {
    const { mensaje } = req.body;

    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-3.1-flash-lite", // O 3.1-flash-lite
            tools: [herramientasDeBaseDeDatos],
            systemInstruction: `
              Eres COMPU-BOT, el Asistente Proactivo de COMPUDOCTOR. 
              REGLAS ESTRICTAS:
              1. Tienes prohibido responder, buscar o interactuar con información sobre "usuarios", "contraseñas", "trabajadores" o la "auditoría del sistema". Si te preguntan, di que es información confidencial del administrador.
              2. Analiza los datos devueltos por las herramientas. Si ves un stock bajo, sugiere la compra. Si ves muchos servicios pendientes de pago, sugiere contactar a los clientes.
              3. Usa formato Markdown con viñetas (*) y negritas (**) para facilitar la lectura.
            `
        });

        const chat = model.startChat();
        let result = await chat.sendMessage(mensaje);
        let call = result.response.functionCalls();

        while (call && call.length > 0) {
            const responses = [];
            for (const functionCall of call) {
                const functionName = functionCall.name;
                const args = functionCall.args;
                let dbResult = null;

                if (functionName === "consultarInventario") {
                    dbResult = await ejecutarConsultarInventario(args);
                } else if (functionName === "consultarServicios") {
                    dbResult = await ejecutarConsultarServicios(args);
                } else if (functionName === "consultarEstadisticasVentas") {
                    dbResult = await ejecutarEstadisticasVentas();
                }

                responses.push({
                    functionResponse: { name: functionName, response: { result: dbResult } }
                });
            }

            result = await chat.sendMessage(responses);
            call = result.response.functionCalls();
        }

        res.json({ respuesta: result.response.text() });

    } catch (error) {
        console.error("Error en la IA:", error);
        res.status(500).json({ respuesta: "Lo siento, tuve un error al procesar tu solicitud." });
    }
};