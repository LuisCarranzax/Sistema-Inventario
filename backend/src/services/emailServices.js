const nodemailer = require('nodemailer');
require('dotenv').config({ path: '../../.env' });

// 1. Configurar el Transporter (El motor de envío)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_MESSENGER,
        pass: process.env.EMAIL_PASS
    }
});

// 2. Función para notificar al Administrador sobre un nuevo registro
const notificarAdminNuevoRegistro = async (usuarioData) => {
    const { id, nombre, apellidos, correo, dni, celular } = usuarioData;

    // Enlaces de acción que apuntarán a nuevas rutas que crearemos en el backend
    const urlAprobar = `http://localhost:4000/api/auth/aprobar/${id}`;
    const urlRechazar = `http://localhost:4000/api/auth/rechazar/${id}`;

    // Plantilla HTML estilizada
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #0f172a; padding: 20px; text-align: center; color: white;">
                <h2>Nueva Solicitud de Acceso</h2>
            </div>
            <div style="padding: 20px; background-color: #f8fafc; color: #333;">
                <p>Hola, tienes una nueva solicitud de registro para el Sistema de Inventario.</p>
                <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">Datos del Solicitante:</h3>
                <ul style="list-style: none; padding: 0;">
                    <li><strong>Nombre:</strong> ${nombre} ${apellidos}</li>
                    <li><strong>DNI:</strong> ${dni}</li>
                    <li><strong>Correo:</strong> ${correo}</li>
                    <li><strong>Celular:</strong> ${celular}</li>
                </ul>
                <p style="margin-top: 30px; text-align: center;">¿Deseas conceder acceso a este usuario?</p>
                
                <div style="text-align: center; margin-top: 20px;">
                    <a href="${urlAprobar}" style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-right: 10px;">Aprobar</a>
                    <a href="${urlRechazar}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Rechazar</a>
                </div>
            </div>
            <div style="background-color: #e2e8f0; padding: 10px; text-align: center; font-size: 12px; color: #64748b;">
                Sistema de Gestión IT &copy; ${new Date().getFullYear()}
            </div>
        </div>
    `;

    const mailOptions = {
        from: `"Sistema Inventario" <${process.env.EMAIL_MESSENGER}>`,
        to: process.env.EMAIL_ADMIN,
        subject: `🔒 Nueva Solicitud de Registro: ${nombre} ${apellidos}`,
        html: htmlContent
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Correo de notificación enviado al administrador.');
    } catch (error) {
        console.error('Error al enviar correo al administrador:', error);
    }
};
// Función para notificar al trabajador su resultado 
const notificarUsuarioResultado = async (correo, nombre, estado) => {
    let subject = '';
    let mensaje = '';

    if (estado === 'aprobado') {
        subject = '🎉 ¡Bienvenido al Sistema de Inventario!';
        mensaje = `<p>Hola ${nombre},</p>
                   <p>Tu solicitud ha sido <strong>aprobada</strong> por el administrador.</p>
                   <p>Ya puedes ingresar al sistema con tus credenciales.</p>
                   <a href="http://localhost:5173/login" style="background-color: #22c55e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Iniciar Sesión</a>`;
    } else {
        subject = 'ℹ️ Actualización de tu solicitud de acceso';
        mensaje = `<p>Hola ${nombre},</p>
                   <p>Agradecemos tu interés, pero tu solicitud de acceso al sistema ha sido <strong>rechazada</strong> en esta ocasión.</p>
                   <p>Si consideras que es un error, por favor contacta al administrador del local.</p>`;
    }

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #0f172a; text-align: center;">Sistema de Gestión IT</h2>
            <div style="background-color: #f8fafc; padding: 20px; color: #333;">
                ${mensaje}
            </div>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: `"Sistema Inventario" <${process.env.EMAIL_USER}>`,
            to: correo,
            subject: subject,
            html: htmlContent
        });
        console.log(`Correo de ${estado} enviado a ${correo}`);
    } catch (error) {
        console.error('Error al enviar correo al usuario:', error);
    }
};

// No olvides exportar la nueva función
module.exports = {
    notificarAdminNuevoRegistro,
    notificarUsuarioResultado
};