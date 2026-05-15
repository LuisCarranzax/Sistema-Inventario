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

-- Para el control de acceso:
ALTER TABLE usuarios ADD COLUMN estado ENUM('pendiente', 'aprobado', 'rechazado') DEFAULT 'pendiente';

-- Para la recuperación de contraseña:
ALTER TABLE usuarios ADD COLUMN codigo_recuperacion VARCHAR(6);
ALTER TABLE usuarios 
ADD COLUMN expira_codigo DATETIME DEFAULT (NOW() + INTERVAL 15 MINUTE);

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