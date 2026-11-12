---
tipo: guía
actualizado: 2026-11-12
---
# Cómo usar este cerebro (Claude + Obsidian)

## 1. Abrirlo en Obsidian
1. Instala Obsidian (gratis).
2. *Open folder as vault* → elige la carpeta `cerebro`.
3. Ajustes → **Core plugins**: activa *Templates* y *Daily notes*. La carpeta de plantillas es `08 Plantillas` y la de notas diarias `09 Diario` (ya vienen configuradas).
4. Abre [[Home]].

## 2. Conectar Claude (elige una)
**A) Claude Code (la mejor, Claude edita tus notas)**
```bash
cd cerebro
claude
```
Claude lee `CLAUDE.md` solo y sabe cómo trabajar. Pídele, por ejemplo: *"Procesa mi Inbox"* o *"Haz la retro semanal"* (los textos listos están en [[Biblioteca de prompts]]).

**B) Claude.ai con un Proyecto (sin instalar nada)**
Crea un Proyecto, sube `CLAUDE.md`, `Home.md` y las notas de `01 Negocio`, `02 Productos` y `03 Clientes` como conocimiento. Actualiza esos archivos cuando cambien.

**C) Claude Desktop con acceso a archivos**
Dale acceso a la carpeta `cerebro` (herramienta de sistema de archivos) y trabaja igual que en A.

## 3. Rutina (15 minutos al día)
- **Mañana:** abre la nota del día (`09 Diario`) y escribe las 3 cosas que mueven ventas hoy.
- **Durante el día:** todo lo que se te ocurra, a `00 Inbox` (una nota, sin ordenar).
- **Viernes:** *"Procesa mi Inbox"* + *"Haz la retro semanal"* (20 min).

## 4. Reglas de oro
1. Una idea por nota, enlazada con corchetes dobles.
2. Toda decisión va a [[Decisiones]].
3. Todo experimento tiene hipótesis, métrica y resultado ([[Experimentos]]).
4. Nada de claves ni datos de clientes dentro del vault.
5. Lo que no esté verificado se marca `[VERIFICAR]`.

## 5. Sincronizar y proteger
Está en un repositorio privado. Puedes usar el plugin *Obsidian Git* o Obsidian Sync. Si algún día compartes el vault, revisa antes que no haya estrategia sensible.

## 6. Agregar otro negocio
Duplica `02 Productos` con una subcarpeta por marca, o crea otro vault. Mantén `CLAUDE.md` por vault.
