import { House, ShoppingCart, ChefHat, Package, Truck, Calculator, Users, TrendingUp, Palette, UtensilsCrossed, ClipboardList } from 'lucide-react';

/**
 * Módulos del sistema y los roles que pueden usarlos.
 * El menú lateral, la guía y las rutas protegidas se construyen a partir de esta lista,
 * y coinciden con los permisos de la API (backend/src/routes/index.js).
 */
export const ETIQUETA_ROL = {
  administrador: 'Administrador',
  cajero: 'Cajero',
  cocinero: 'Cocina',
  cliente: 'Cliente',
};

export const MODULOS = [
  { ruta: '/', nombre: 'Inicio', icon: House, roles: ['administrador'], descripcion: 'Resumen de ventas, cajas y alertas del día.' },
  { ruta: '/menu', nombre: 'Menú', icon: UtensilsCrossed, roles: ['cliente'], descripcion: 'Elige tus platillos y haz tu pedido.' },
  { ruta: '/mis-pedidos', nombre: 'Mis pedidos', icon: ClipboardList, roles: ['cliente'], descripcion: 'Sigue el estado de tus pedidos.' },
  { ruta: '/pos', nombre: 'Punto de venta', icon: ShoppingCart, roles: ['administrador', 'cajero'], descripcion: 'Toma de pedidos y facturación FCF / CCF con IVA.' },
  { ruta: '/cocina', nombre: 'Cocina', icon: ChefHat, roles: ['administrador', 'cocinero', 'cajero'], descripcion: 'Comandas en preparación y pedidos listos para entregar.' },
  { ruta: '/caja', nombre: 'Caja', icon: Calculator, roles: ['administrador', 'cajero'], descripcion: 'Apertura, cierre y cuadre de caja por turno.' },
  { ruta: '/inventario', nombre: 'Inventario', icon: Package, roles: ['administrador', 'cocinero'], descripcion: 'Insumos, recetas, entradas y alertas de stock mínimo.' },
  { ruta: '/pronostico', nombre: 'Pronóstico', icon: TrendingUp, roles: ['administrador', 'cocinero'], descripcion: 'Proyección de consumo y pedidos sugeridos.' },
  { ruta: '/compras', nombre: 'Compras', icon: Truck, roles: ['administrador'], descripcion: 'Facturas de proveedores, gastos y cuentas por pagar.' },
  { ruta: '/personal', nombre: 'Personal', icon: Users, roles: ['administrador'], descripcion: 'Empleados y planilla quincenal con ISSS, AFP y renta.' },
  { ruta: '/identidad', nombre: 'Identidad Visual', icon: Palette, roles: ['administrador'], descripcion: 'Logo, nombre, colores y tipografía del restaurante.' },
];

/** Pantalla de inicio de cada rol después de iniciar sesión. */
export const INICIO_POR_ROL = {
  administrador: '/',
  cajero: '/pos',
  cocinero: '/cocina',
  cliente: '/menu',
};

export const modulosDe = (rol) => MODULOS.filter((m) => m.roles.includes(rol));

export const puedeVer = (rol, ruta) => MODULOS.some((m) => m.ruta === ruta && m.roles.includes(rol));
