import * as usuarios from './usuarios.service.js';

export const listar = async (req, res) => res.json(await usuarios.listarUsuarios());
export const crear = async (req, res) => res.status(201).json(await usuarios.crearUsuario(req.body));
export const actualizar = async (req, res) => res.json(await usuarios.actualizarUsuario(req.params.id, req.body, req.usuario));
export const desactivar = async (req, res) => res.json(await usuarios.desactivarUsuario(req.params.id, req.usuario));
