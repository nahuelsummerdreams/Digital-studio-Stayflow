import type { Metadata } from "next";
import { Contact, LegalPage } from "@/components/legal";

export const metadata: Metadata = { title: "Política de reembolsos · Stayflow", alternates: { canonical: "/reembolsos" } };

export default function Page() {
  return (
    <LegalPage title="Política de reembolsos" updated="noviembre de 2026">
      <section><h2>Garantía de 14 días</h2><p>Si dentro de los 14 días posteriores a tu compra la herramienta no te sirve, escríbenos a <Contact /> y te devolvemos el importe pagado.</p></section>
      <section><h2>Preventas</h2><p>Si reservaste un producto en preventa y aún no se te entregó, puedes pedir el reembolso completo en cualquier momento antes de la entrega.</p></section>
      <section><h2>Cómo se procesa</h2><p>El reembolso se hace por el mismo medio de pago. El plazo en que aparece en tu cuenta depende de tu banco o procesador.</p></section>
    </LegalPage>
  );
}
