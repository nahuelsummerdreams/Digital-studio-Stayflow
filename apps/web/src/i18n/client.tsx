"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_LOCALE, getMessages, type Locale, type Messages } from "./index";

const Ctx = createContext<{ locale: Locale; m: Messages }>({ locale: DEFAULT_LOCALE, m: getMessages() });

export function MessagesProvider({ locale = DEFAULT_LOCALE, children }: { locale?: Locale; children: ReactNode }) {
  return <Ctx.Provider value={{ locale, m: getMessages(locale) }}>{children}</Ctx.Provider>;
}
export const useMessages = () => useContext(Ctx);
