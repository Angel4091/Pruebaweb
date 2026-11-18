-- =====================================================================
-- Orígenes SV · Esquema de la base de datos (PostgreSQL 16)
--
-- Se puede ejecutar varias veces: cada objeto usa "if not exists".
-- Convenciones:
--   * Todo en minúsculas y con nombres en español (snake_case).
--   * Los catálogos usan identificadores de texto legibles ("prod-latte-grande")
--     porque el frontend los usa, por ejemplo, para encontrar la foto de cada
--     producto. Los registros internos (detalles, pagos, bitácora) usan bigserial.
--   * Las reglas del negocio que no dependen de otras tablas se validan aquí con
--     check; las demás se validan en los servicios del backend.
--   * Las cantidades de inventario están en kg, lt o und con 4 decimales
--     (18 g de café = 0.0180 kg).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Sucursales y cajas
-- ---------------------------------------------------------------------
create table if not exists sucursales (
  id          varchar(40)  primary key,
  codigo      char(2)      not null unique,
  nombre      varchar(120) not null,
  direccion   varchar(200) not null default '',
  telefono    varchar(30)  not null default '',
  creado_en   timestamptz  not null default now()
);

create table if not exists cajas (
  id           varchar(40) primary key,
  sucursal_id  varchar(40) not null references sucursales (id),
  nombre       varchar(60) not null,
  constraint cajas_nombre_por_sucursal unique (sucursal_id, nombre)
);

-- ---------------------------------------------------------------------
-- Proveedores, insumos y existencias por sucursal
-- ---------------------------------------------------------------------
create table if not exists proveedores (
  id              varchar(40)  primary key,
  nombre          varchar(150) not null,
  nit             varchar(20)  not null default '',
  nrc             varchar(12)  not null default '',
  telefono        varchar(30)  not null default '',
  correo          varchar(120) not null default '',
  contacto        varchar(120) not null default '',
  dias_credito    integer      not null default 0,
  activo          boolean      not null default true,
  creado_en       timestamptz  not null default now(),
  actualizado_en  timestamptz  not null default now(),
  constraint proveedores_dias_credito_check check (dias_credito >= 0)
);
create unique index if not exists proveedores_nombre_uidx on proveedores (lower(nombre));

create table if not exists insumos (
  id              varchar(40)   primary key,
  nombre          varchar(120)  not null,
  unidad          varchar(3)    not null,
  stock_minimo    numeric(14,4) not null default 0,
  costo_unitario  numeric(14,4) not null default 0,
  proveedor_id    varchar(40)   references proveedores (id),
  arte            varchar(40)   not null default 'grano',
  activo          boolean       not null default true,
  version         integer       not null default 1,
  creado_en       timestamptz   not null default now(),
  actualizado_en  timestamptz   not null default now(),
  constraint insumos_unidad_check  check (unidad in ('kg', 'lt', 'und')),
  constraint insumos_minimo_check  check (stock_minimo >= 0),
  constraint insumos_costo_check   check (costo_unitario >= 0)
);

-- Existencia de cada insumo en cada sucursal. Nunca puede quedar en negativo.
create table if not exists existencias (
  insumo_id    varchar(40)   not null references insumos (id) on delete cascade,
  sucursal_id  varchar(40)   not null references sucursales (id),
  cantidad     numeric(14,4) not null default 0,
  primary key (insumo_id, sucursal_id),
  constraint existencias_cantidad_check check (cantidad >= 0)
);

-- ---------------------------------------------------------------------
-- Menú: categorías, productos, recetas y existencias de reventa
-- ---------------------------------------------------------------------
create table if not exists categorias (
  id      varchar(40) primary key,
  nombre  varchar(80) not null unique
);

create table if not exists productos (
  id              varchar(40)   primary key,
  nombre          varchar(120)  not null,
  precio          numeric(10,2) not null,
  categoria_id    varchar(40)   not null references categorias (id),
  tipo            varchar(9)    not null,
  descripcion     text          not null default '',
  arte            varchar(40)   not null default 'pupusa',
  imagen          text,
  costo           numeric(10,2) not null default 0,   -- solo reventa: costo de compra
  stock_minimo    integer       not null default 0,   -- solo reventa
  activo          boolean       not null default true,
  version         integer       not null default 1,
  creado_en       timestamptz   not null default now(),
  actualizado_en  timestamptz   not null default now(),
  constraint productos_tipo_check    check (tipo in ('elaborado', 'reventa')),
  constraint productos_precio_check  check (precio > 0),
  constraint productos_costo_check   check (costo >= 0),
  constraint productos_minimo_check  check (stock_minimo >= 0)
);

-- Receta de un producto elaborado: qué insumos y cuánto de cada uno por unidad vendida.
create table if not exists recetas (
  producto_id  varchar(40)   not null references productos (id) on delete cascade,
  insumo_id    varchar(40)   not null references insumos (id),
  cantidad     numeric(12,4) not null,
  primary key (producto_id, insumo_id),
  constraint recetas_cantidad_check check (cantidad > 0)
);

-- Existencias de los productos empacados de reventa (se cuentan por unidad).
create table if not exists existencias_reventa (
  producto_id  varchar(40) not null references productos (id) on delete cascade,
  sucursal_id  varchar(40) not null references sucursales (id),
  cantidad     integer     not null default 0,
  primary key (producto_id, sucursal_id),
  constraint existencias_reventa_cantidad_check check (cantidad >= 0)
);

-- ---------------------------------------------------------------------
-- Clientes (el CCF exige NIT y NRC)
-- ---------------------------------------------------------------------
create table if not exists clientes (
  id         varchar(40)  primary key,
  nombre     varchar(150) not null,
  tipo       varchar(16)  not null,
  nit        varchar(20)  not null default '',
  nrc        varchar(12)  not null default '',
  giro       varchar(150) not null default '',
  direccion  varchar(200) not null default '',
  telefono   varchar(30)  not null default '',
  activo     boolean      not null default true,
  creado_en  timestamptz  not null default now(),
  constraint clientes_tipo_check check (tipo in ('consumidor_final', 'contribuyente')),
  constraint clientes_contribuyente_check check (tipo = 'consumidor_final' or (nit <> '' and nrc <> ''))
);

-- ---------------------------------------------------------------------
-- Recursos humanos y usuarios del sistema
-- ---------------------------------------------------------------------
create table if not exists empleados (
  id               varchar(40)   primary key,
  nombre           varchar(120)  not null,
  cargo            varchar(60)   not null,
  sucursal_id      varchar(40)   not null references sucursales (id),
  salario_mensual  numeric(10,2) not null,
  dui              varchar(10)   not null default '',
  afp              varchar(40)   not null default '',
  telefono         varchar(30)   not null default '',
  fecha_ingreso    date          not null default current_date,
  estado           varchar(8)    not null default 'activo',
  creado_en        timestamptz   not null default now(),
  actualizado_en   timestamptz   not null default now(),
  constraint empleados_salario_check check (salario_mensual > 0),
  constraint empleados_estado_check  check (estado in ('activo', 'inactivo'))
);
create unique index if not exists empleados_dui_uidx on empleados (dui) where dui <> '';

-- Cuentas para entrar al sistema. Las contraseñas se guardan como hash de bcrypt.
create table if not exists usuarios (
  id             bigserial    primary key,
  nombre         varchar(120) not null,
  email          varchar(120) not null,
  password_hash  text         not null,
  rol            varchar(8)   not null,
  sucursal_id    varchar(40)  references sucursales (id),
  empleado_id    varchar(40)  references empleados (id),
  activo         boolean      not null default true,
  creado_en      timestamptz  not null default now(),
  actualizado_en timestamptz  not null default now(),
  constraint usuarios_rol_check      check (rol in ('admin', 'gerente', 'cajero', 'barista')),
  constraint usuarios_sucursal_check check (rol = 'admin' or sucursal_id is not null)
);
create unique index if not exists usuarios_email_uidx on usuarios (lower(email));

-- ---------------------------------------------------------------------
-- Caja: turnos y correlativos de comprobantes
-- ---------------------------------------------------------------------
create table if not exists turnos (
  id                 varchar(40)   primary key,
  caja_id            varchar(40)   not null references cajas (id),
  sucursal_id        varchar(40)   not null references sucursales (id),
  fecha              date          not null,
  turno              varchar(6)    not null,
  responsable        varchar(120)  not null,
  monto_inicial      numeric(10,2) not null,
  denominaciones     jsonb,
  apertura           timestamptz   not null default now(),
  cierre             timestamptz,
  estado             varchar(7)    not null default 'abierta',
  efectivo_contado   numeric(10,2),
  total_ventas       numeric(12,2),
  total_efectivo     numeric(12,2),
  total_tarjeta      numeric(12,2),
  total_bitcoin      numeric(12,2),
  ordenes            integer,
  efectivo_esperado  numeric(12,2),
  diferencia         numeric(12,2),
  observaciones      text          not null default '',
  abierto_por        bigint        references usuarios (id),
  cerrado_por        bigint        references usuarios (id),
  constraint turnos_turno_check   check (turno in ('Mañana', 'Tarde')),
  constraint turnos_estado_check  check (estado in ('abierta', 'cerrada')),
  constraint turnos_monto_check   check (monto_inicial >= 0),
  constraint turnos_cierre_check  check (estado = 'abierta' or (cierre is not null and efectivo_contado is not null))
);
-- Una caja solo puede tener un turno abierto a la vez.
create unique index if not exists turnos_un_abierto_por_caja_uidx on turnos (caja_id) where estado = 'abierta';

-- Último número emitido por sucursal y tipo de comprobante (FCF-01-000123).
create table if not exists correlativos (
  sucursal_id  varchar(40) not null references sucursales (id),
  tipo         varchar(3)  not null,
  ultimo       integer     not null default 0,
  primary key (sucursal_id, tipo),
  constraint correlativos_tipo_check   check (tipo in ('FCF', 'CCF')),
  constraint correlativos_ultimo_check check (ultimo >= 0)
);

-- ---------------------------------------------------------------------
-- Ventas
-- ---------------------------------------------------------------------
create table if not exists ventas (
  id                varchar(40)   primary key,
  numero            varchar(20)   not null unique,
  tipo_comprobante  varchar(3)    not null,
  sucursal_id       varchar(40)   not null references sucursales (id),
  caja_id           varchar(40)   not null references cajas (id),
  turno_id          varchar(40)   not null references turnos (id),
  fecha             timestamptz   not null default now(),
  tipo_orden        varchar(11)   not null,
  cliente_id        varchar(40)   not null references clientes (id),
  metodo_pago       varchar(8)    not null,
  referencia_pago   varchar(80)   not null default '',
  subtotal          numeric(12,2) not null,
  iva               numeric(12,2) not null,
  total             numeric(12,2) not null,
  monto_recibido    numeric(12,2) not null,
  cambio            numeric(12,2) not null default 0,
  estado            varchar(7)    not null default 'emitida',
  motivo_anulacion  text,
  creado_por        bigint        references usuarios (id),
  version           integer       not null default 1,
  constraint ventas_comprobante_check check (tipo_comprobante in ('FCF', 'CCF')),
  constraint ventas_orden_check       check (tipo_orden in ('comer_aqui', 'para_llevar', 'delivery')),
  constraint ventas_metodo_check      check (metodo_pago in ('efectivo', 'tarjeta', 'bitcoin')),
  constraint ventas_estado_check      check (estado in ('emitida', 'anulada')),
  constraint ventas_montos_check      check (subtotal >= 0 and iva >= 0 and total >= 0 and cambio >= 0),
  constraint ventas_pago_check        check (monto_recibido >= total)
);

create table if not exists venta_detalles (
  id               bigserial     primary key,
  venta_id         varchar(40)   not null references ventas (id) on delete cascade,
  producto_id      varchar(40)   not null references productos (id),
  nombre           varchar(120)  not null,
  cantidad         integer       not null,
  precio_unitario  numeric(10,2) not null,
  total            numeric(12,2) not null,
  constraint venta_detalles_cantidad_check check (cantidad > 0)
);

-- ---------------------------------------------------------------------
-- Compras, cuentas por pagar y órdenes de compra
-- ---------------------------------------------------------------------
create sequence if not exists compras_numero_seq;

create table if not exists ordenes_compra (
  id                varchar(40)   primary key,
  proveedor_id      varchar(40)   references proveedores (id),
  proveedor_nombre  varchar(150)  not null default '',
  sucursal_id       varchar(40)   not null references sucursales (id),
  fecha             timestamptz   not null default now(),
  total             numeric(12,2) not null default 0,
  estado            varchar(9)    not null default 'pendiente',
  compra_id         varchar(40),  -- compra que la recibió (se llena al registrar la factura)
  constraint ordenes_compra_estado_check check (estado in ('pendiente', 'recibida'))
);

create table if not exists orden_compra_detalles (
  id               bigserial     primary key,
  orden_id         varchar(40)   not null references ordenes_compra (id) on delete cascade,
  insumo_id        varchar(40)   not null references insumos (id),
  nombre           varchar(120)  not null,
  unidad           varchar(3)    not null,
  cantidad         numeric(14,4) not null,
  costo_estimado   numeric(12,2) not null default 0,
  constraint orden_compra_detalles_cantidad_check check (cantidad > 0)
);

create table if not exists compras (
  id                varchar(40)   primary key,
  numero_factura    varchar(40)   not null,
  proveedor_id      varchar(40)   references proveedores (id),
  proveedor_nombre  varchar(150)  not null default '',
  sucursal_id       varchar(40)   not null references sucursales (id),
  tipo              varchar(5)    not null,
  descripcion       text          not null default '',
  fecha             timestamptz   not null default now(),
  subtotal          numeric(12,2) not null,
  iva               numeric(12,2) not null,
  total             numeric(12,2) not null,
  condicion         varchar(7)    not null,
  orden_compra_id   varchar(40)   references ordenes_compra (id),
  creado_por        bigint        references usuarios (id),
  version           integer       not null default 1,
  constraint compras_tipo_check       check (tipo in ('costo', 'gasto')),
  constraint compras_condicion_check  check (condicion in ('contado', 'credito')),
  constraint compras_montos_check     check (subtotal >= 0 and iva >= 0 and total >= 0),
  constraint compras_costo_proveedor  check (tipo = 'gasto' or proveedor_id is not null)
);
-- La misma factura no se registra dos veces para el mismo proveedor.
create unique index if not exists compras_factura_uidx on compras (coalesce(proveedor_id, ''), numero_factura);

create table if not exists compra_detalles (
  id              bigserial     primary key,
  compra_id       varchar(40)   not null references compras (id) on delete cascade,
  insumo_id       varchar(40)   not null references insumos (id),
  nombre          varchar(120)  not null,
  cantidad        numeric(14,4) not null,
  costo_unitario  numeric(14,4) not null,
  total           numeric(12,2) not null,
  constraint compra_detalles_cantidad_check check (cantidad > 0),
  constraint compra_detalles_costo_check    check (costo_unitario >= 0)
);

create table if not exists cuentas_por_pagar (
  id                 varchar(40)   primary key,
  compra_id          varchar(40)   not null unique references compras (id),
  proveedor_id       varchar(40)   references proveedores (id),
  proveedor_nombre   varchar(150)  not null default '',
  numero_factura     varchar(40)   not null,
  monto              numeric(12,2) not null,
  saldo              numeric(12,2) not null,
  fecha_vencimiento  timestamptz   not null,
  constraint cuentas_por_pagar_monto_check check (monto > 0),
  constraint cuentas_por_pagar_saldo_check check (saldo >= 0 and saldo <= monto)
);

create table if not exists pagos_cuentas (
  id              bigserial     primary key,
  cuenta_id       varchar(40)   not null references cuentas_por_pagar (id) on delete cascade,
  fecha           timestamptz   not null default now(),
  monto           numeric(12,2) not null,
  registrado_por  bigint        references usuarios (id),
  constraint pagos_cuentas_monto_check check (monto > 0)
);

-- ---------------------------------------------------------------------
-- Bitácora de movimientos de inventario (entradas, consumos y reversiones)
-- ---------------------------------------------------------------------
create table if not exists movimientos_inventario (
  id           bigserial     primary key,
  fecha        timestamptz   not null default now(),
  tipo         varchar(9)    not null,
  insumo_id    varchar(40)   references insumos (id),
  producto_id  varchar(40)   references productos (id),
  sucursal_id  varchar(40)   not null references sucursales (id),
  cantidad     numeric(14,4) not null,
  referencia   varchar(80)   not null default '',
  motivo       varchar(20)   not null default '',
  constraint movimientos_tipo_check     check (tipo in ('entrada', 'consumo', 'reversion')),
  constraint movimientos_articulo_check check (insumo_id is not null or producto_id is not null)
);

-- ---------------------------------------------------------------------
-- Planilla quincenal
-- ---------------------------------------------------------------------
create table if not exists planillas (
  id                varchar(40)  primary key,
  periodo_inicio    date         not null unique,  -- no se genera dos veces la misma quincena
  periodo_fin       date         not null,
  etiqueta          varchar(40)  not null,
  fecha_generacion  timestamptz  not null default now(),
  fecha_pago        timestamptz,
  estado            varchar(8)   not null default 'generada',
  generada_por      bigint       references usuarios (id),
  constraint planillas_estado_check  check (estado in ('generada', 'pagada')),
  constraint planillas_periodo_check check (periodo_fin >= periodo_inicio)
);

create table if not exists planilla_detalles (
  id                 bigserial     primary key,
  planilla_id        varchar(40)   not null references planillas (id) on delete cascade,
  empleado_id        varchar(40)   not null references empleados (id),
  nombre             varchar(120)  not null,
  cargo              varchar(60)   not null,
  salario_quincenal  numeric(10,2) not null,
  isss               numeric(10,2) not null,
  afp                numeric(10,2) not null,
  base_gravada       numeric(10,2) not null,
  renta              numeric(10,2) not null,
  tramo_renta        varchar(3)    not null,
  total_deducciones  numeric(10,2) not null,
  liquido            numeric(10,2) not null,
  constraint planilla_detalles_empleado_unico unique (planilla_id, empleado_id)
);

-- ---------------------------------------------------------------------
-- Identidad visual (una sola fila) y bitácora de auditoría
-- ---------------------------------------------------------------------
create table if not exists configuracion (
  id              smallint    primary key default 1,
  datos           jsonb       not null,
  actualizado_en  timestamptz not null default now(),
  constraint configuracion_una_fila check (id = 1)
);

-- Quién hizo qué y cuándo (se llena desde los servicios en la Fase 5).
create table if not exists bitacora (
  id          bigserial   primary key,
  fecha       timestamptz not null default now(),
  usuario_id  bigint      references usuarios (id),
  accion      varchar(40) not null,
  entidad     varchar(40) not null,
  entidad_id  varchar(40),
  detalle     jsonb
);

-- ---------------------------------------------------------------------
-- Índices para las consultas más frecuentes
-- ---------------------------------------------------------------------
create index if not exists ventas_sucursal_fecha_idx       on ventas (sucursal_id, fecha);
create index if not exists ventas_turno_idx                on ventas (turno_id);
create index if not exists venta_detalles_venta_idx        on venta_detalles (venta_id);
create index if not exists venta_detalles_producto_idx     on venta_detalles (producto_id);
create index if not exists recetas_insumo_idx              on recetas (insumo_id);
create index if not exists existencias_sucursal_idx        on existencias (sucursal_id);
create index if not exists turnos_sucursal_fecha_idx       on turnos (sucursal_id, fecha);
create index if not exists compras_sucursal_fecha_idx      on compras (sucursal_id, fecha);
create index if not exists compra_detalles_compra_idx      on compra_detalles (compra_id);
create index if not exists cuentas_vencimiento_idx         on cuentas_por_pagar (fecha_vencimiento);
create index if not exists pagos_cuentas_cuenta_idx        on pagos_cuentas (cuenta_id);
create index if not exists orden_compra_detalles_orden_idx on orden_compra_detalles (orden_id);
create index if not exists movimientos_sucursal_fecha_idx  on movimientos_inventario (sucursal_id, fecha);
create index if not exists movimientos_insumo_idx          on movimientos_inventario (insumo_id);
create index if not exists empleados_sucursal_idx          on empleados (sucursal_id);
create index if not exists planilla_detalles_planilla_idx  on planilla_detalles (planilla_id);
create index if not exists bitacora_fecha_idx              on bitacora (fecha);
create index if not exists bitacora_entidad_idx            on bitacora (entidad, entidad_id);
