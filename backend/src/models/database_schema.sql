-- 1. Tabla de Categorías (Para Computo, Impresoras, Audio, etc.)
CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    prefijo_codigo VARCHAR(5) NOT NULL 
);

-- 2. Tabla de Productos
CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_interno VARCHAR(20) UNIQUE, 
    nombre VARCHAR(255) NOT NULL, 
    precio_venta DECIMAL(10,2) NOT NULL, 
    stock INT NOT NULL, 
    stock_minimo INT NOT NULL, 
    categoria_id INT,
    fecha_abastecimiento DATE, 
    imagen_url VARCHAR(255), 
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

-- 3. Tabla de Servicios (Mantenimiento y Reparación)
CREATE TABLE servicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_interno VARCHAR(20) UNIQUE,
    cliente_nombre VARCHAR(255), 
    tipo_servicio VARCHAR(100), 
    problema_reportado TEXT, 
    precio DECIMAL(10,2), 
    estado_pago ENUM('cancelado', 'pendiente', 'adelanto') DEFAULT 'pendiente', 
    fecha_servicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    trabajador_id INT
);

-- 4. Tabla de Clientes
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    documento_identidad VARCHAR(20) UNIQUE, 
    nombre_completo VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    correo VARCHAR(100),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL, 
    cliente_id INT, 
    medio_pago VARCHAR(50) NOT NULL, 
    comprobante_url VARCHAR(255), 
    es_proforma BOOLEAN DEFAULT FALSE, 
    total DECIMAL(10,2) NOT NULL,
    fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);


CREATE TABLE detalle_ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venta_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL, 
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    celular VARCHAR(15) NOT NULL,
    dni VARCHAR(15) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('administrador', 'trabajador') DEFAULT 'trabajador',
    estado ENUM('pendiente', 'aprobado', 'rechazado') DEFAULT 'pendiente',
    codigo_recuperacion VARCHAR(6) NULL,
    expira_codigo DATETIME DEFAULT (NOW() + INTERVAL 15 MINUTE),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE servicios_tecnicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_nombre VARCHAR(150) NOT NULL,
    equipo_dispositivo VARCHAR(100) NOT NULL, -- Ej: Laptop HP Pavilion, Impresora Epson
    servicio_realizado TEXT NOT NULL,         -- Ej: Cambio de pantalla, limpieza
    precio DECIMAL(10,2) NOT NULL,
    estado ENUM('en_revision', 'reparado', 'entregado') DEFAULT 'en_revision',
    fecha_ingreso DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega DATETIME NULL,
    usuario_id INT NOT NULL,                  -- Para saber qué trabajador lo registró
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

ALTER TABLE servicios_tecnicos 
ADD COLUMN estado_pago ENUM('pendiente', 'a_cuenta', 'cancelado') DEFAULT 'pendiente' AFTER precio,
ADD COLUMN monto_adelanto DECIMAL(10,2) DEFAULT 0.00 AFTER estado_pago,
ADD COLUMN metodo_pago VARCHAR(50) DEFAULT 'Por definir' AFTER monto_adelanto;

CREATE TABLE movimientos_inventario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    tipo_movimiento ENUM('ingreso', 'salida', 'ajuste') NOT NULL,
    cantidad INT NOT NULL,
    fecha_movimiento DATETIME DEFAULT CURRENT_TIMESTAMP,
    usuario_id INT DEFAULT 1, -- Para saber qué trabajador registró el ingreso
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

ALTER TABLE usuarios 
ADD COLUMN nuevo_correo_temp VARCHAR(150) NULL AFTER correo;

-- 1. Asegurar que el estado del usuario tenga la opción 'inactivo'
ALTER TABLE usuarios 
MODIFY COLUMN estado ENUM('pendiente', 'aprobado', 'rechazado', 'inactivo') DEFAULT 'pendiente';

-- 2. Crear la tabla de Auditoría (Registro de Eventos)
CREATE TABLE auditoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    accion VARCHAR(255) NOT NULL,
    modulo VARCHAR(50) NOT NULL, -- Ej: 'Ventas', 'Inventario', 'Usuarios'
    detalles TEXT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);