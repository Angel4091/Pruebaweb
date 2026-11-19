import { pool } from '../../config/database.js';
import { todas } from '../../utils/filas.js';

export async function insertarRegistro({ usuarioId, accion, entidad, entidadId, detalle }, db = pool) {
  await db.query(
    'insert into bitacora (usuario_id, accion, entidad, entidad_id, detalle) values ($1, $2, $3, $4, $5)',
    [usuarioId ?? null, accion, entidad, entidadId ?? null, detalle ?? null],
  );
}

// Filtros de la consulta; un parámetro nulo no filtra.
const FILTRO_BITACORA = `
  where ($1::bigint is null or b.usuario_id = $1)
    and ($2::text is null or b.entidad = $2)
    and ($3::text is null or b.accion = $3)
    and ($4::timestamptz is null or b.fecha >= $4)
    and ($5::timestamptz is null or b.fecha < $5)`;

/** Una página de la bitácora (de lo más reciente a lo más antiguo) con el nombre y rol de quién hizo cada cambio. */
export async function listarRegistros({ usuarioId, entidad, accion, desde, hasta }, { limite, desplazamiento }, db = pool) {
  const filtros = [usuarioId ?? null, entidad || null, accion || null, desde ?? null, hasta ?? null];
  const conteo = await db.query(`select count(*) as total from bitacora b ${FILTRO_BITACORA}`, filtros);
  const pagina = await db.query(
    `select b.id, b.fecha, b.usuario_id, u.nombre as usuario_nombre, u.rol as usuario_rol,
            b.accion, b.entidad, b.entidad_id, b.detalle
     from bitacora b
     left join usuarios u on u.id = b.usuario_id
     ${FILTRO_BITACORA}
     order by b.id desc
     limit $6 offset $7`,
    [...filtros, limite, desplazamiento],
  );
  return { filas: todas(pagina), total: conteo.rows[0].total };
}
