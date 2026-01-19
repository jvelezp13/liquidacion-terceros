-- ============================================================================
-- CARGA MASIVA DE DATOS - LIQUIDACIÓN TERCEROS
-- Fecha: 2026-01-19
-- ============================================================================

-- Escenario activo: Nutresa 2026
-- ID: d3751614-222a-4a48-a418-8de596027ee4

-- ============================================================================
-- 1. CONTRATISTAS (7 registros)
-- ============================================================================

INSERT INTO liq_contratistas (
    escenario_id, nombre, tipo_documento, numero_documento,
    banco, tipo_cuenta, numero_cuenta, email, activo
) VALUES
-- Paola Andrea Martinez
('d3751614-222a-4a48-a418-8de596027ee4', 'PAOLA ANDREA MARTINEZ LOAIZA', 'CC', '21556431',
 'BANCOLOMBIA', 'ahorros', '43800003596', 'andreahispania@hotmail.com', true),

-- Guillermo Leon Rios Franco
('d3751614-222a-4a48-a418-8de596027ee4', 'GUILLERMO LEON RIOS FRANCO', 'CC', '71397505',
 'BANCOLOMBIA', 'ahorros', '54100002680', 'leonrios78@gmail.com', true),

-- Leidy Janet Agudelo Taborda (contratista de 3 vehículos)
('d3751614-222a-4a48-a418-8de596027ee4', 'LEIDY JANET AGUDELO TABORDA', 'CC', '43711036',
 'BANCOLOMBIA', 'ahorros', '52097978247', 'agudeloocampomaria@gmail.com', true),

-- Edwin Arley Castrillon Molina
('d3751614-222a-4a48-a418-8de596027ee4', 'EDWIN ARLEY CASTRILLON MOLINA', 'CC', '8071399',
 'BANCOLOMBIA', 'ahorros', '54166189139', 'edwincastr2017@gmail.com', true),

-- Yeison Alexander Morales Arredondo
('d3751614-222a-4a48-a418-8de596027ee4', 'YEISON ALEXANDER MORALES ARREDONDO', 'CC', '1033653209',
 'BANCOLOMBIA', 'ahorros', '64171976900', 'yeisonmorales3209@gmail.com', true),

-- Jose Manuel Guzman Sierra
('d3751614-222a-4a48-a418-8de596027ee4', 'JOSE MANUEL GUZMAN SIERRA', 'CC', '98601568',
 'BANCO DAVIVIENDA SA', 'ahorros', '550397400009817', 'Josemanuelguzmansierra1@gmail.com', true),

-- Gustavo Alonso Espinosa
('d3751614-222a-4a48-a418-8de596027ee4', 'GUSTAVO ALONSO ESPINOSA', 'CC', '71395454',
 'BANCOLOMBIA', 'ahorros', '54195764991', 'gustavoespinosa.14@outlook.es', true);


-- ============================================================================
-- 2. VEHICULOS TERCEROS (9 registros)
-- Vincula vehículos de Planeación con contratistas
-- ============================================================================

-- Primero obtenemos los IDs de los contratistas recién creados
-- y los vehículos del escenario Nutresa 2026

INSERT INTO liq_vehiculos_terceros (
    vehiculo_id, contratista_id, placa, conductor_nombre, activo
)
SELECT
    v.id as vehiculo_id,
    c.id as contratista_id,
    datos.placa,
    datos.conductor,
    true as activo
FROM (VALUES
    -- (nombre_vehiculo, placa, conductor, documento_contratista)
    ('Paola', 'WPS827', 'Juan Camilo Rodriguez', '21556431'),
    ('Guillermo', 'GDX689', 'Ivan Cardona', '71397505'),
    ('Leydi 1', 'ZDA203', 'Esteban David Serna Villa', '43711036'),
    ('Leydi 2', 'SNP135', 'Adrian Zapata Parra', '43711036'),
    ('Leydi 3', 'WLW989', 'Oscar Albeiro Villa Cañas', '43711036'),
    ('Edwin', 'ESP210', 'Daniel Rios', '8071399'),
    ('Yeison', 'WLC041', 'Carlos Andres Meza', '1033653209'),
    ('Jose Manuel', 'LKM383', 'Jose Manuel Guzman Sierra', '98601568'),
    ('Gustavo', 'GUQ830', 'Gustavo Alonso Espinosa', '71395454')
) AS datos(nombre_vehiculo, placa, conductor, documento_contratista)
JOIN vehiculos v ON v.nombre = datos.nombre_vehiculo
    AND v.escenario_id = 'd3751614-222a-4a48-a418-8de596027ee4'
    AND v.esquema = 'tercero'
JOIN liq_contratistas c ON c.numero_documento = datos.documento_contratista
    AND c.escenario_id = 'd3751614-222a-4a48-a418-8de596027ee4';


-- ============================================================================
-- 3. RUTAS PROGRAMADAS POR DÍA DE SEMANA
-- Día: 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado
-- ============================================================================

INSERT INTO liq_vehiculo_rutas_programadas (
    vehiculo_tercero_id, ruta_id, dia_semana, activo
)
SELECT
    vt.id as vehiculo_tercero_id,
    r.id as ruta_id,
    datos.dia_semana,
    true as activo
FROM (VALUES
    -- WPS827 (Paola) - Andes y Hispania-Betania
    ('WPS827', 'Andes Lunes Martes', 1),
    ('WPS827', 'Andes Lunes Martes', 2),
    ('WPS827', 'Hispania-Betania', 4),
    ('WPS827', 'Andes Viernes Sabado', 5),
    ('WPS827', 'Andes Viernes Sabado', 6),

    -- WLC041 (Yeison) - Ciudad Bolivar
    ('WLC041', 'Ciudad Bolivar Lunes Martes', 1),
    ('WLC041', 'Ciudad Bolivar Lunes Martes', 2),
    ('WLC041', 'Ciudad Bolivar-Carmen Jueves Sabado', 4),
    ('WLC041', 'Ciudad Bolivar-Carmen Jueves Sabado', 5),
    ('WLC041', 'Ciudad Bolivar-Carmen Jueves Sabado', 6),

    -- GUQ830 (Gustavo) - Angelopolis, Jardin, Jerico
    ('GUQ830', 'Angelopolis', 1),
    ('GUQ830', 'Jardin Martes Miercoles', 2),
    ('GUQ830', 'Jardin Martes Miercoles', 3),
    ('GUQ830', 'Jardin Jueves', 4),
    ('GUQ830', 'Jerico Viernes', 5),

    -- WLW989 (Leydi 3) - Bolombolo, Urrao
    ('WLW989', 'Bolombolo-Peñaliza', 1),
    ('WLW989', 'Urrao Martes Miercoles', 2),
    ('WLW989', 'Urrao Martes Miercoles', 3),
    ('WLW989', 'Urrao Viernes Sabado', 5),
    ('WLW989', 'Urrao Viernes Sabado', 6),

    -- GDX689 (Guillermo) - Venecia, Titiribi, Santa Barbara, Tamesis
    ('GDX689', 'Venecia', 1),
    ('GDX689', 'Titiribi', 2),
    ('GDX689', 'Santa Barbara Miercoles Jueves', 3),
    ('GDX689', 'Santa Barbara Miercoles Jueves', 4),
    ('GDX689', 'Tamesis Viernes', 5),

    -- LKM383 (Jose Manuel) - Fredonia, Tamesis, La Pintada
    ('LKM383', 'Fredonia Lunes', 1),
    ('LKM383', 'Tamesis Martes', 2),
    ('LKM383', 'Fredonia Jueves', 4),
    ('LKM383', 'La Pintada Viernes Sabado', 5),
    ('LKM383', 'La Pintada Viernes Sabado', 6),

    -- ZDA203 (Leydi 1) - Amaga, Jerico, Montebello
    ('ZDA203', 'Amaga Lunes', 1),
    ('ZDA203', 'Jerico Martes Miercoles', 2),
    ('ZDA203', 'Jerico Martes Miercoles', 3),
    ('ZDA203', 'Montebello', 4),
    ('ZDA203', 'Amaga Viernes', 5),

    -- ESP210 (Edwin) - Santa Barbara, Caramanta-Valparaiso, Tarso
    ('ESP210', 'Santa Barbara Lunes', 1),
    ('ESP210', 'Caramanta-Valparaiso', 2),
    ('ESP210', 'Caramanta-Valparaiso', 3),
    ('ESP210', 'Tarso-Pueblorico', 5),
    ('ESP210', 'Tarso-Pueblorico', 6),

    -- SNP135 (Leydi 2) - Concordia-Betulia, Salgar
    ('SNP135', 'Concordia-Betulia Lunes Martes', 1),
    ('SNP135', 'Concordia-Betulia Lunes Martes', 2),
    ('SNP135', 'Salgar', 4),
    ('SNP135', 'Concordia-Betulia Viernes Sabado', 5),
    ('SNP135', 'Concordia-Betulia Viernes Sabado', 6)

) AS datos(placa, nombre_ruta, dia_semana)
JOIN liq_vehiculos_terceros vt ON vt.placa = datos.placa
JOIN rutas_logisticas r ON r.nombre = datos.nombre_ruta
    AND r.escenario_id = 'd3751614-222a-4a48-a418-8de596027ee4';
