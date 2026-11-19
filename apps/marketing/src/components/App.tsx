"use client";

import { Gate } from "./Gate";
import { Studio } from "./Studio";

/** The page is a server component, so the render function that links the gate to the app has to live on the client side. */
export function App() {
  return <Gate>{(signOut) => <Studio onSignOut={signOut} />}</Gate>;
}
