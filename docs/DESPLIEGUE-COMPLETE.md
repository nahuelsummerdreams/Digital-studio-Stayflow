# Despliegue de STAYflow Complete (`apps/complete`)

> Estado: **preparado, NO desplegado.** Nada de esto se ejecuta sin el visto bueno de Nahuel. Esta guía es para que, cuando se decida, el despliegue sea un trámite y no una investigación.

## 0. Antes de empezar (bloqueos)
| Condición | Por qué |
|---|---|
| Vercel en un plan que **no frene despliegues** | El plan gratuito alcanzó su límite el 12/11. Un proyecto nuevo lo agrava |
| Supabase en **plan Pro** (respaldos diarios, sin pausa por inactividad) | Con clientes reales no se puede perder la base |
| Migraciones **0034 y 0035 aplicadas** y probadas | La app tolera que falte la 0035 (no guarda fechas límite), pero no es el estado final |
| Rama revisada y **fusionada con el visto bueno de Nahuel** | Regla de trabajo: cambios oficiales, en rama, a la principal solo con su OK |

## 1. Orden (importante)
1. **Base primero:** aplicar `0034_hardening.sql` y `0035_booking_due_dates.sql` (en ese orden) y correr `supabase/tests/*.sql` (incluidos `complete_suite.sql` y, ya con la 0035, `booking_due_dates.sql`). Todos terminan con «ALL … PASSED».
2. **Después, la app:** crear el proyecto en Vercel y desplegar.
3. **Por último,** la landing y el cobro (ver `PREPARACION_COMERCIAL_STAYFLOW_COMPLETE`, en el vault).

## 2. Proyecto en Vercel
| Ajuste | Valor |
|---|---|
| Repositorio | `nahuelsummerdreams/Digital-studio-Stayflow` |
| Root Directory | `apps/complete` (con «Include files outside the Root Directory» activado) |
| Framework | Next.js |
| Install Command | `cd ../.. && npx pnpm@10.28.0 install --frozen-lockfile` (o `pnpm install`, como las otras apps) |
| Build Command | `next build` |
| Rama de producción | la que decida Nahuel |
| Cron | ya definido en `apps/complete/vercel.json` (`/api/cron/digest`, diario 11:00 UTC) |

> **Copiar la configuración de `stayflow-host` en Vercel** (Settings → General / Build) y cambiar solo el nombre y la carpeta es lo más seguro. Lo que pude confirmar de ese proyecto: framework Next.js y Node **22.x**. **No pude leer** su carpeta raíz ni sus comandos de instalación/compilación con las herramientas disponibles, así que los valores de la tabla de arriba son una propuesta, no copia de lo que usa Host.

## 3. Variables de entorno
| Variable | Obligatoria | Para qué |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | Dirección del proyecto de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Clave pública (publishable). Es pública por diseño; la seguridad está en las reglas de la base |
| `NEXT_PUBLIC_WEB_URL` | Recomendada | Dirección de la landing (enlace «Comprar» de la pantalla de activación) |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo para el correo matinal | **Clave de servidor. Nunca con prefijo `NEXT_PUBLIC_`. Nunca en el navegador ni en el chat** |
| `RESEND_API_KEY` | Solo para el correo matinal | Envío de correos |
| `DIGEST_FROM` | Solo para el correo matinal | Remitente verificado en Resend |
| `CRON_SECRET` | Solo para el correo matinal | Vercel lo envía como `Authorization: Bearer …`. Sin él la ruta responde 401 |
| `NEXT_PUBLIC_GUEST_PUBLIC_URL` | **No poner** | Si se deja vacía, los QR usan la dirección de la propia app (lo correcto en COMPLETE) |

### Ayuda dentro de la aplicación (chatbot)
El botón de ayuda responde «¿cómo hago…?» con **temas propios de la aplicación** (gratis, instantáneo, en inglés, español y portugués) y **funciona sin ninguna clave**. La IA es un extra opcional para las preguntas que los temas no cubren: solo recibe esos temas (no ve datos de la cuenta ni cambia nada).
| Variable | Obligatoria | Para qué |
|---|---|---|
| `ANTHROPIC_API_KEY` | No | Activa la IA de la ayuda. **Clave de servidor; nunca en el navegador ni en el chat.** Sin ella la ayuda sigue funcionando con los temas |
| `HELP_DAILY_CAP` | No | Preguntas a la IA por negocio y por día (por defecto 40) |
| `HELP_MODEL` | No | Modelo (por defecto `claude-haiku-5-5`, el más barato) |
| `NEXT_PUBLIC_SUPPORT_URL` | No | Enlace de soporte (`mailto:` o WhatsApp) que se muestra bajo las respuestas de la IA |
> **Antes de activar la IA:** poner un **tope de gasto mensual en la consola del proveedor** (ver `COSTO_POR_CLIENTE_STAYFLOW`, sección 9). El tope por negocio no alcanza si alguien abusa del servicio.

## 4. Supabase: direcciones permitidas
En **Authentication → URL Configuration** agregar la dirección de COMPLETE a *Redirect URLs* (el restablecimiento de contraseña usa `window.location.origin`). Sin esto, el enlace del correo no vuelve a la app. Activar además, en **Authentication → Providers/Passwords**, la **protección contra contraseñas filtradas**.

## 5. Verificación después de desplegar (10 minutos)
1. Abrir la app: carga la pantalla de ingreso. Revisar que el candado/instalación como app (PWA) funcione en un celular.
2. `curl -I https://<dominio>/` → trae `X-Frame-Options: DENY` y `Referrer-Policy`.
3. `https://<dominio>/api/cron/digest` sin secreto → **401**. `https://<dominio>/api/ical/no-es-un-uuid.ics` → **404**.
4. Con una cuenta de prueba **con licencia `suite`**: crear propiedad → reserva → cobro → ver «Por cobrar» en Inicio → salida → limpieza en Operaciones → ingreso en Finanzas → guía publicada visible en `/g/<enlace>` sin sesión.
5. Generar un enlace del personal en Operaciones → Personal y abrirlo en una ventana privada (`/t/<token>`).
6. Con una cuenta **sin** `suite`: debe mostrar la pantalla de activación, no los datos.

## 6. Códigos de licencia (los ejecuta Nahuel en el editor SQL de Supabase)
```sql
-- 10 códigos de piloto para COMPLETE (la función solo la ejecuta el rol de servicio):
select public.create_license_codes(array['suite']::public.product_key[], 10, 'piloto COMPLETE');
```
> **Ojo:** `create_license_codes` no tiene parámetro de plan: todos los códigos dan plan `starter`. Hoy los límites de plan no se aplican; si se decide aplicarlos, hay que agregar el plan al código (por ejemplo `pro` para COMPLETE) **antes** de vender.
> Un reembolso se hace con `select public.revoke_license_code('SF-XXXX-XXXX-XXXX');` (si no se usó, se borra; si se usó, se cancelan sus licencias y el cliente conserva sus datos).

## 7. Marcha atrás
- La app nueva es independiente: si algo falla, **se pausa el proyecto de Vercel** y las cuatro apps actuales siguen igual.
- Las migraciones 0034/0035 no borran nada. La 0035 solo agrega dos columnas opcionales; el código funciona con o sin ellas.
- Si hace falta quitar la 0035: `alter table public.bookings drop constraint bookings_due_order, drop column deposit_due_on, drop column balance_due_on;` (se pierden solo las fechas límite cargadas).

## 8. Integración continua
`.github/workflows/ci.yml` ahora también compila COMPLETE (con valores de ejemplo, sin tocar ninguna base) además de los tipos, las pruebas y la landing.
