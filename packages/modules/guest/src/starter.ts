import type { GuideFields } from "./types";

export type StarterType = "hotel" | "hostel";

/**
 * Suggested texts for a hotel or hostel guide. They are plain, editable starting points:
 * the owner changes the hours and rules to match the establishment. Nothing here promises a service.
 */
const STARTERS: Record<StarterType, Pick<GuideFields, "welcome" | "checkin" | "checkout" | "houseRules" | "safety">> = {
  hotel: {
    welcome: "Bienvenido. Aquí encuentras todo lo que necesitas para tu estadía: horarios, servicios y cómo contactar con recepción.",
    checkin: "Check-in desde las [hora]. Si llegas antes, consulta en recepción por la guarda de equipaje.",
    checkout: "Check-out hasta las [hora]. Deja la llave en recepción al salir.",
    houseRules: "Respeta el descanso de otros huéspedes (silencio desde las [hora]).\nDesayuno: [horario y lugar].\nNo se permite fumar dentro de las habitaciones.",
    safety: "Salidas de emergencia y extintores: [ubicación]. Ante cualquier urgencia, llama a recepción: [teléfono].",
  },
  hostel: {
    welcome: "Bienvenido al hostel. Aquí tienes lo básico para convivir bien: horarios, normas de los dormitorios y cómo contactarnos.",
    checkin: "Check-in desde las [hora]. Te asignamos tu cama al llegar; trae tu documento.",
    checkout: "Check-out hasta las [hora]. Retira tus cosas de la cama y del locker.",
    houseRules: "Silencio en los dormitorios desde las [hora].\nUsa tu locker para tus pertenencias (candado propio o de alquiler).\nCocina compartida: lava lo que uses y guarda tu comida con tu nombre.\nNo se permite fumar en los dormitorios.",
    safety: "Salidas de emergencia y extintores: [ubicación]. Ante cualquier urgencia, contacta a recepción: [teléfono].",
  },
};

export function guideStarter(type: StarterType): (typeof STARTERS)[StarterType] {
  return STARTERS[type];
}

/** Fills only the fields that are still empty, so a starter never overwrites what the owner already wrote. */
export function applyStarter(form: GuideFields, type: StarterType): GuideFields {
  const s = STARTERS[type];
  const keep = (cur: string, next: string) => (cur.trim() === "" ? next : cur);
  return {
    ...form,
    welcome: keep(form.welcome, s.welcome),
    checkin: keep(form.checkin, s.checkin),
    checkout: keep(form.checkout, s.checkout),
    houseRules: keep(form.houseRules, s.houseRules),
    safety: keep(form.safety, s.safety),
  };
}
