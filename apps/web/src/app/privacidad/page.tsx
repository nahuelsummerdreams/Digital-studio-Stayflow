import type { Metadata } from "next";
import { Contact, LegalPage } from "@/components/legal";

export const metadata: Metadata = { title: "Política de privacidad · Stayflow", alternates: { canonical: "/privacidad" } };

export default function Page() {
  return (
    <LegalPage title="Política de privacidad" updated="noviembre de 2026">
      <section><h2>Quién es responsable</h2><p>Stayflow es una línea de productos de Digital Studio. Para cualquier consulta sobre tus datos escribe a <Contact />.</p></section>
      <section><h2>Qué datos recogemos</h2>
        <ul>
          <li><strong>Tu email</strong>, cuando lo dejas en un formulario (avisos de apertura del pago, preventas, planes).</li>
          <li><strong>El contenido de tu carrito</strong> y la página desde la que llegaste (por ejemplo, un anuncio), para saber qué te interesa.</li>
          <li><strong>Datos de uso del sitio</strong>, solo si aceptas las cookies de medición (ver abajo).</li>
          <li><strong>Datos de tu cuenta y de tu alojamiento</strong>, cuando usas las apps (reservas, huéspedes, fotos). Son tuyos: solo tú y tu organización pueden verlos.</li>
        </ul></section>
      <section><h2>Para qué los usamos</h2><p>Para responderte, avisarte cuando se abra el pago, entregarte los productos que compres, mejorar el sitio y medir si nuestros anuncios funcionan. No vendemos tus datos.</p></section>
      <section><h2>Cookies y Meta Pixel</h2><p>Si aceptas las cookies de medición, cargamos el Píxel de Meta (Facebook e Instagram), que registra acciones como ver un producto, añadirlo al carrito o dejar tu email, para medir y optimizar anuncios. Si las rechazas, no se carga. Puedes cambiar tu decisión en cualquier momento desde «Cookies» al pie de la página.</p></section>
      <section><h2>Con quién compartimos datos</h2><p>Con proveedores que los procesan por nosotros: Supabase (base de datos y cuentas), Vercel (alojamiento del sitio), Meta (medición de anuncios, solo con tu consentimiento), el procesador de pagos que se conecte al abrir las ventas y, para el asistente de IA de Host, un proveedor de modelos de lenguaje que recibe solo las preguntas que le haces y los datos de tu cuenta necesarios para responder.</p></section>
      <section><h2>Tus derechos</h2><p>Puedes pedir acceso, corrección o eliminación de tus datos, y retirar tu consentimiento cuando quieras, escribiendo a <Contact />. Conservamos los datos mientras sean útiles para el fin descrito o la ley lo exija.</p></section>
      <section><h2>Cambios</h2><p>Si cambiamos esta política, actualizaremos la fecha de arriba.</p></section>
    </LegalPage>
  );
}
