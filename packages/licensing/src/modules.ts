/** Modules are switched on per organization by its category (see 0027_org_modules.sql). They shape the menu, never the data. */

/** True when the organization has the module. An empty or missing list means "not known": show everything, never hide by accident. */
export function hasModule(modules: readonly string[] | null | undefined, key: string | undefined): boolean {
  if (!key) return true;
  if (!modules || modules.length === 0) return true;
  return modules.includes(key);
}

/** The menu items the organization actually has. Items without a module key are always shown. */
export function visibleNav<T extends { module?: string }>(nav: readonly T[], modules: readonly string[] | null | undefined): T[] {
  return nav.filter((n) => hasModule(modules, n.module));
}
