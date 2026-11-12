# Licencias de Stayflow: cómo se emiten y se entregan

El acceso a cada app se activa con un **código de licencia** (`SF-XXXX-XXXX-XXXX`). No hay prueba gratis.
Las funciones de emisión **solo** las puede ejecutar quien tiene acceso de administrador a la base (la conexión de Supabase de Claude o el editor SQL). Desde el navegador nadie puede.

Proyecto de Supabase: `eigsajmshgrmnhascghr`.

## Qué producto lleva cada compra
| Compra | `products` |
|---|---|
| Host | `host` |
| Guest | `guest` |
| Business | `profit` (así se llama por dentro) |
| Operations | `operations` |
| Pack Esencial | `host`, `guest`, `profit` |
| Megapack | `host`, `guest`, `profit`, `operations` |

## Emitir
```sql
-- 1 código de Host para la orden 1234 (no pongas correos ni nombres en la nota)
select * from public.create_license_codes(array['host']::public.product_key[], 1, 'Orden 1234');

-- Megapack
select * from public.create_license_codes(array['host','guest','profit','operations']::public.product_key[], 1, 'Orden 1235');

-- Lote de 50 códigos de Host (para vender por otra plataforma)
select * from public.create_license_codes(array['host']::public.product_key[], 50, 'Lote plataforma X');
```
Cada código sirve **una sola vez**, no vence y registra 12 meses de actualizaciones (`licenses.updates_until`).

## Consultar
```sql
select * from public.license_codes_overview limit 50;                  -- todo: qué abre, si se usó y por qué negocio
select * from public.license_codes_overview where redeemed_at is null;  -- los que siguen sin usar
```

## Reembolso (dentro de los 14 días)
```sql
select public.revoke_license_code('SF-XXXX-XXXX-XXXX');
-- Si no se usó: lo borra. Si se usó: cancela las licencias que dio (el cliente conserva sus datos).
```

## Reglas
- El código es una credencial: no lo guardes en notas, repositorios ni capturas. La base es la única fuente de verdad.
- La nota del código lleva solo un número de orden o de lote, nunca correo, nombre ni teléfono del cliente.
- Cuando exista el cobro automático, el webhook llamará a estas mismas funciones.
