# EDUC FISICA 🏃‍♂️

Una plataforma educativa moderna para la enseñanza de educación física, desarrollada con las mejores tecnologías web actuales.

## 🚀 Tecnologías Utilizadas

- **[Next.js 15](https://nextjs.org/)** - Framework de React con App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Tipado estático para JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** - Framework de CSS utilitario
- **[Zustand](https://github.com/pmndrs/zustand)** - Gestión de estado ligera
- **[TanStack Query](https://tanstack.com/query)** - Fetching y caching de datos
- **[Lucide React](https://lucide.dev/)** - Iconos SVG
- **[ESLint](https://eslint.org/)** & **[Prettier](https://prettier.io/)** - Linting y formateo de código

## 📦 Instalación

1. **Clona el repositorio**
   ```bash
   git clone <url-del-repo>
   cd EDUC-FISICA
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Configura las variables de entorno**
   ```bash
   cp .env.example .env.local
   # Edita .env.local con tus configuraciones
   ```

4. **Inicia el servidor de desarrollo**
   ```bash
   npm run dev
   ```

5. **Abre tu navegador**
   
   Visita [http://localhost:3000](http://localhost:3000) para ver la aplicación.

## 🛠️ Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter (ESLint)
- `npm run lint:fix` - Ejecuta el linter y corrige errores automáticamente
- `npm run format` - Formatea el código con Prettier

## 📁 Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── globals.css        # Estilos globales
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página de inicio
├── components/
│   ├── ui/                # Componentes de interfaz reutilizables
│   └── common/            # Componentes comunes (Header, Footer)
├── hooks/                 # Custom hooks de React
├── lib/                   # Utilidades y configuraciones
├── stores/                # Stores de Zustand
├── types/                 # Definiciones de tipos TypeScript
└── utils/                 # Funciones utilitarias
```

## 🎨 Características

- ✅ **Next.js 15** con App Router y Server Components
- ✅ **TypeScript** para tipado estático
- ✅ **Tailwind CSS** para diseño responsivo
- ✅ **Componentes reutilizables** con variantes
- ✅ **Gestión de estado** con Zustand
- ✅ **Hooks personalizados** para lógica reutilizable
- ✅ **ESLint y Prettier** configurados
- ✅ **Estructura modular** y escalable
- ✅ **Configuración lista para producción**

## 🚀 Despliegue

### Render.com

1. **Configura las variables de entorno** en Render
2. **Configura el build command:**
   ```bash
   npm install && npm run build
   ```
3. **Configura el start command:**
   ```bash
   npm run start
   ```

### Vercel

El proyecto está optimizado para despliegue en Vercel:

```bash
npx vercel
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: Amazing Feature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Convenciones de Código

- Utiliza **TypeScript** para todos los archivos
- Sigue las reglas de **ESLint** configuradas
- Formatea el código con **Prettier** antes de hacer commit
- Usa **nombres descriptivos** para variables y funciones
- Comenta el código cuando sea necesario para claridad

## 🐛 Reporte de Problemas

Si encuentras algún problema, por favor crea un issue en el repositorio con:
- Descripción del problema
- Pasos para reproducirlo
- Comportamiento esperado
- Capturas de pantalla (si aplica)

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🔗 Enlaces Útiles

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de TypeScript](https://www.typescriptlang.org/docs/)
- [Documentación de Tailwind CSS](https://tailwindcss.com/docs)
- [Guía de Zustand](https://github.com/pmndrs/zustand)

---

Desarrollado con ❤️ para la educación física moderna
