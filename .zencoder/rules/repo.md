---
description: Repository Information Overview
alwaysApply: true
---

# Pokédex Hoenn Information

## Summary
A static web application showcasing Pokémon species from the Hoenn region (Generation III). The project provides interactive exploration of routes and areas with detailed information about wild Pokémon, encounter rates, and version-specific differences across multiple Pokémon game versions (Ruby, Sapphire, Emerald, Omega Ruby, Alpha Sapphire). Built with vanilla HTML, CSS, and JavaScript, consuming data from the public PokeAPI.

## Structure
- **index.html** (916 lines) - Main application file containing all markup, styles, and JavaScript logic
- **images/** - Asset directory with zone reference images
  - Ruta_101.jpg - Route 101 environment reference
  - VillaRaiz.jpg - Littleroot Town reference

## Language & Runtime
**Language**: HTML5 + CSS3 + JavaScript (ES6+)  
**Runtime**: Browser-based (client-side only)  
**No Build System**: Direct static deployment  
**Served**: Via XAMPP (Apache web server)

## Dependencies
**External APIs**:
- PokeAPI v2 (https://pokeapi.co/api/v2) - Pokémon species and sprite data
- CDN Resources:
  - Google Fonts: Press Start 2P, Silkscreen font families
  - Font Awesome 6.4.0 icons (font and stylesheet)

**No package manager required** - All resources loaded via CDN links

## Usage & Operations
**Deployment**: Copy files directly to XAMPP htdocs directory
```bash
xcopy /E . C:\xampp\htdocs\hoenn\
```

**Access**: http://localhost/hoenn/

**No build process required** - Open index.html in any modern browser

## Main Files & Resources

**Application Entry Point**: `index.html`

**Key Configuration**:
- API Base URL: `https://pokeapi.co/api/v2`
- Sprite Base URL: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/`
- Type color mapping defined in `TYPE_COLORS` constant (lines 586-605)

**Supported Zones**:
- Littleroot Town (Villa Raíz) - Initial town
- Route 101 - First route with 5 Pokémon species

**Version Tabs**:
- All Versions
- Ruby/Sapphire
- Emerald
- Omega Ruby/Alpha Sapphire

## Implementation Details

**State Management**: Single `APP_STATE` object (line 538) tracking:
- Current zone and version filter
- Zone metadata (descriptions, connections, Pokémon lists)

**Pokémon Loading**:
- Asynchronous fetching via PokeAPI
- Species data includes: ID, types, abilities, height, weight, base experience
- Version-specific exclusives supported (e.g., Seedot for Ruby, Lotad for Sapphire)

**Responsive Design**:
- Mobile breakpoints: 768px, 480px
- Grid-based layout using CSS Grid and Flexbox
- Touch-friendly interface elements

## Browser Support
- Modern browsers supporting ES6 JavaScript (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Responsive design supports mobile devices (iOS Safari, Chrome Mobile)

## Future Expansion
Comment in HTML (line 480) notes total Hoenn region has 34 routes; currently only 2 zones implemented with dynamic loading infrastructure ready for expansion.