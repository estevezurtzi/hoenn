# Pokédex Hoenn

Una guía completa e interactiva de la región de Hoenn de Pokémon, con información detallada sobre Pokémon salvajes, rutas, encuentros y diferencias entre versiones del juego (Rubí, Zafiro, Esmeralda).

## 🎮 Características

- **57 Zonas**: Exploración completa de la región de Hoenn (ciudades, pueblos, rutas, cuevas, bosques)
- **300+ Pokémon**: Información detallada de encuentros salvajes por ubicación y versión
- **Búsqueda Inteligente**: Busca zonas, rutas o Pokémon con resultados en tiempo real
- **Filtros de Zonas**: Filtra por tipo (todas, ciudades, rutas, cuevas, bosques, otros)
- **Detalles de Pokémon**: Visualiza:
  - Métodos de encuentro (walk, fish, rock smash, etc.)
  - Tasas de rareza según versión
  - Rangos de nivel
  - Ratios de género
  - Tasas de captura
  - Ciclos de incubación
  - Imágenes de Pokémon
- **3 Temas**: Esmeralda (por defecto), Rubí y Zafiro con colores de versión
- **Responsive**: Diseño adaptable para dispositivos móviles, tablets y escritorio
- **Accesibilidad**: Soporte completo de ARIA roles y navegación por teclado

## 🚀 Cómo Usar

1. Abre `index.html` en tu navegador
2. Selecciona un tema de versión (Esmeralda, Rubí, Zafiro)
3. Explora zonas desde la vista principal o usa la búsqueda
4. Haz clic en una zona para ver detalles y Pokémon disponibles
5. Selecciona una versión del juego para filtrar encuentros específicos
6. Haz clic en "Detalles" en cualquier Pokémon para ver información completa

## 🔍 Búsqueda

La barra de búsqueda permite:
- **Buscar zonas**: Por nombre o descripción (ej: "Ruta", "Cueva", "Petalia")
- **Buscar Pokémon**: Por nombre y obtener todas las localizaciones donde aparecen (ej: "Zigzagoon", "Rayquaza")
- **Resultados combinados**: Visualiza Pokémon encontrados y zonas coincidentes

## 📁 Estructura del Proyecto

```
hoenn/
├── index.html           # Estructura HTML principal
├── css/
│   └── styles.css       # Estilos y 3 temas dinámicos
├── js/
│   └── app.js          # Lógica de la aplicación
├── data/
│   └── zones.json      # Datos de todas las zonas y Pokémon
├── images/             # Imágenes de zonas y Pokémon
├── README.md           # Este archivo
└── LICENSE             # Licencia del proyecto
```

## 🛠️ Tecnologías Usadas

- **HTML5**: Estructura semántica con ARIA roles
- **CSS3**: Diseño responsive, variables CSS, animaciones suaves
- **JavaScript Vanilla**: Sin dependencias externas
- **Font Awesome**: Iconografía
- **Google Fonts**: Tipografía (Press Start 2P, Silkscreen)
- **PokeAPI**: Datos de Pokémon y encuentros

## 📊 Datos Incluidos

- **57 zonas**: Desde pueblos iniciales hasta legendarias y multiversión
- **300+ Pokémon**: Con información completa de encuentros
- **Soporta 3 versiones**: Rubí, Zafiro, Esmeralda
- **JSON estructurado**: Información de:
  - Nombres y descripciones de zonas
  - Conexiones entre zonas
  - Métodos de encuentro
  - Tasas de rareza y niveles
  - Diferencias por versión

## 🎨 Temas de Color

- **Esmeralda**: Verde esmeralda (#4AD87A) - Tema por defecto
- **Rubí**: Rojo rubí (#E63946) - Versión Rubí
- **Zafiro**: Azul zafiro (#1E90FF) - Versión Zafiro

## ⌨️ Accesibilidad

- Navegación completa por teclado
- Roles ARIA para lectores de pantalla
- Contraste de colores accesible
- Labels descriptivos en todos los campos
- Atributos alt en imágenes

## 📝 Notas de Desarrollo

- La aplicación es completamente estática (no requiere servidor)
- Todos los datos están en `data/zones.json`
- Los encuentros de Pokémon se obtienen de la PokeAPI en tiempo real
- Las imágenes de Pokémon se cargan lazy loading para optimización

## 📄 Licencia

Este proyecto utiliza datos de Pokémon bajo la licencia de PokeAPI. 

---

**Versión**: 1.0  
**Última actualización**: Diciembre 2025  
**Región**: Hoenn (Pokémon Ruby/Sapphire/Emerald)
