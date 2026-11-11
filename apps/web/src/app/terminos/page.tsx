import type { Metadata } from "next";
import { Contact, LegalPage } from "@/components/legal";

export const metadata: Metadata = { title: "Términos y condiciones · Stayflow", alternates: { canonical: "/terminos" } };

export default function Page() {
  return (
    <LegalPage title="Términos y condiciones" updated="noviembre de 2026">
      <section><h2>El servicio</h2><p>Stayflow ofrece aplicaciones web para gestionar alojamientos de alquiler temporal. Cada herramienta se vende por separado o en packs, con pago único.</p></section>
      <section><h2>Qué incluye tu compra</h2><ul><li>Acceso a la herramienta comprada y sus actualizaciones mientras exista.</li><li>Uso para tus propios alojamientos. No puedes revenderla ni compartir tu acceso con terceros.</li></ul></section>
      <section><h2>Próximamente</h2><p>Los productos marcados como «Próximamente» no están a la venta. Dejar tu email solo sirve para avisarte cuando salgan: no es una compra ni una reserva, y no anunciamos ni garantizamos fechas.</p></section>
      <section><h2>Resultados</h2><p>Las herramientas te ayudan a organizarte. No garantizamos ocupación, ingresos ni ningún resultado económico concreto: dependen de tu negocio.</p></section>
      <section><h2>Tu cuenta y tus datos</h2><p>Eres responsable de la información que cargas y de mantener tu contraseña segura. Tus datos siguen siendo tuyos; ver la política de privacidad.</p></section>
      <section><h2>Disponibilidad</h2><p>Trabajamos para que el servicio funcione sin interrupciones, pero puede haber mantenimientos o fallos puntuales. No es un servicio de disponibilidad garantizada.</p></section>
      <section><h2>Reembolsos y contacto</h2><p>Consulta la política de reembolsos. Dudas: <Contact />.</p></section>
    </LegalPage>
  );
}
