en home constainer pasar solo 1 prop de next before
card mas generica
configurar eslint import orders
funciones en funciones fleche y poner los props Abajo
hacer un index en json para importer varios json en ese y luego poder llamar a ese index y no tener que hacer 5 imports
themetoggle va en component/elements
mejorar theme utils
crearme una funciona custom fetch
lo que esta en utilñs/languagueslect pasarlo a components/elements

en vite.config configurar el env para poder tener en enviroments dev … y que coja la carpeta esa y la general
poner otro tipo de layout


# 📋 TODO del Proyecto

### Home / Contenedores
- [ ] Unificar props en `Home` → pasar un único `step(delta)`.
- [ ] `HomeComponent` usa `model.name` y `model.step(-1|+1)`.

### Componentes reutilizables
- [ ] Crear **Card genérica** (`Card.tsx`).
- [ ] Imagen con `loading="lazy"`, soporte para `badge` y `actions`.

### i18n
- [ ] Index automático con `import.meta.glob` en `i18n/es/index.ts` y `i18n/en/index.ts`.
- [ ] Configuración centralizada en `i18n.ts` con `defaultNS = common`.

### Theme
- [ ] Mover `ThemeToggle` a `components/elements`.
- [ ] Mejorar `lib/theme.ts`:  
  - `getInitialTheme()`  
  - `applyTheme(theme)`  
  - `toggleTheme()`
- [ ] Persistir en `localStorage`.

### LanguageSelect
- [ ] Pasar de `utils` a `components/elements`.
- [ ] Estilos accesibles con icono + focus visible.

### Custom Fetch
- [ ] Crear `lib/http.ts` con wrapper genérico (`get/post/put/del<T>()`).
- [ ] Soporte para timeout + query params.
- [ ] `BASE_URL` desde `import.meta.env`.

### ESLint / Estilo
- [ ] Configurar `eslint-plugin-import` para `import/order`.
- [ ] Grupos: builtin / external / internal(@) / parent / sibling / index.
- [ ] Usar funciones flecha para componentes.
- [ ] Definir `Props` arriba y desestructurar en la firma.

### Vite / Envs
- [ ] Configurar `vite.config.ts` para leer `.env` global + específicos (`dev`, `prod`).
- [ ] Alias `@ -> src`.
- [ ] Reemplazar `__APP_NAME__` en `index.html`.

### Layouts
- [ ] Crear `SidebarLayout` en `components/layouts`.
- [ ] Añadir navegación con `NavLink` + `<Outlet />`.

### README
- [x] Añadir este documento con checklist ✅
