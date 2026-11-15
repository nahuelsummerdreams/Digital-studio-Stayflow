# Avisos de seguridad de Supabase · revisión del 2026-11-15

Resultado de `get_advisors` (seguridad y rendimiento) sobre el proyecto `stayflow`. Lo que corrige la migración `0034_hardening.sql` y lo que se deja como está, con el motivo.

| Aviso | Nivel | Decisión |
|---|---|---|
| Funciones con ruta de búsqueda mutable (`ops_default_cleaning`, `ops_items_to_checklist`, `tags_ok`, `incident_stamp`) | WARN | **Corregido en 0034** (ruta fija `pg_catalog, public`); solo usan funciones de `pg_catalog`, el comportamiento no cambia (validado) |
| Política `profiles_self` reevalúa `auth.uid()` por fila | WARN | **Corregido en 0034** (`(select auth.uid())`) |
| 31 claves foráneas sin índice | INFO | **13 índices en 0034** (los que la app filtra: `org_id`, `property_id`, asignado, recurrencia). Se omiten las `created_by`: nadie consulta por ellas y cada índice frena las escrituras |
| `assistant_usage` y `license_codes`: RLS activo sin políticas | INFO | **Por diseño**: solo las funciones del servidor pueden tocarlas |
| 7 funciones `SECURITY DEFINER` ejecutables por `anon` | WARN | **Por diseño**: son los enlaces con token (guía pública, calendario iCal, equipo de limpieza y foto de evidencia). Cada una valida su token adentro. `ops_photo_path_ok` la usa la política del almacenamiento: no se puede quitar sin probar la subida de fotos |
| 28 funciones `SECURITY DEFINER` ejecutables por `authenticated` | WARN | **Por diseño**: es la API de la app; cada función verifica pertenencia o rol. Pendiente: revisión de seguridad externa |
| `start_trial` ejecutable | (parte del anterior) | **No es un agujero**: lanza error salvo que la base tenga `stayflow.allow_trials = 'on'` (decisión de no ofrecer prueba gratis). Verificar que ese ajuste no esté activo |
| 17 tablas con varias políticas permisivas (select + write) | WARN | Nota de rendimiento sin efecto a este tamaño; revisar con volumen real |
| 2 índices sin uso (`properties_parent_idx`, `property_incidents_property_idx`) | INFO | Se mantienen: aún no hay tráfico real |
| Protección contra contraseñas filtradas desactivada | WARN | **Acción de Nahuel** en el panel de Supabase (Auth → contraseñas). Puede requerir el plan Pro |

**Estado de la migración 0034:** validada con 5 comprobaciones dentro de una transacción que se revierte; **no aplicada** a producción hasta la aprobación de Nahuel.
