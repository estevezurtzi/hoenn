const POKEAPI = {
    baseURL: 'https://pokeapi.co/api/v2',
    spriteBaseURL: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/',
    animatedSpriteURL: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/'
};

let APP_STATE = {
    currentZone: null,
    currentVersion: 'all',
    zonesData: {},
    typeColors: {},
    versionMap: {},
    zoneEncounters: {},
    pokemonSpecies: {},
    zoneOrder: ['littleroot', 'route101', 'oldale', 'route102', 'route103', 'petalburg', 'petalburgforest', 'route104', 'route110', 'route111', 'route112', 'route113', 'route114', 'route115', 'route116', 'route117', 'route118', 'route119', 'route120', 'route121', 'route122', 'route123', 'route124', 'route125', 'route126', 'route127', 'route128', 'route129', 'route130', 'route131', 'route132', 'route133', 'route134', 'tunnel-fervergal', 'verdanturf', 'route105', 'route106', 'granite-cave', 'meteor-falls', 'dewford', 'ferrica', 'mauville', 'slateport', 'fallarbor', 'lavaridge', 'fortree', 'lilycove', 'mossdeep', 'sootopolis', 'pacifidlog', 'evergrande', 'route107', 'route108', 'abandoned-ship', 'mirage-tower', 'route109', 'instituto-meteorologico', 'monte-pirico', 'cueva-cardumen', 'caverna-abisal', 'pilar-celeste', 'calle-victoria', 'isla-del-sur', 'isla-espejismo', 'frente-batalla'],
    versionGroups: {
        'all': [],
        'ruby': ['ruby'],
        'sapphire': ['sapphire'],
        'emerald': ['emerald']
    },
    eventListeners: []
};

const DOM_ELEMENTS = {
    mainView: null,
    zoneDetailView: null,
    backButton: null,
    zoneInfoContainer: null,
    pokemonSection: null,
    pokemonGrid: null,
    versionTabsContainer: null,
    detailZoneName: null,
    prevZoneBtn: null,
    nextZoneBtn: null
};

const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
};

async function initializeApp() {
    initializeThemeSelector();
    await loadZonesData();
    cacheDOM();
    initializeEventListeners();
}

async function loadZonesData() {
    try {
        const response = await fetch('data/zones.json');
        if (!response.ok) throw new Error('Failed to load zones data');
        const data = await response.json();
        APP_STATE.zonesData = data.zonesData;
        APP_STATE.typeColors = data.typeColors;
        APP_STATE.versionMap = data.versionMap;
    } catch (error) {
        showError('Error cargando datos de zonas');
    }
}

function cacheDOM() {
    DOM_ELEMENTS.mainView = document.getElementById('main-view');
    DOM_ELEMENTS.zoneDetailView = document.getElementById('zone-detail');
    DOM_ELEMENTS.backButton = document.getElementById('back-to-main');
    DOM_ELEMENTS.zoneInfoContainer = document.getElementById('zone-info-container');
    DOM_ELEMENTS.pokemonSection = document.getElementById('pokemon-section');
    DOM_ELEMENTS.pokemonGrid = document.getElementById('pokemon-grid');
    DOM_ELEMENTS.versionTabsContainer = document.getElementById('version-tabs');
    DOM_ELEMENTS.detailZoneName = document.getElementById('detail-zone-name');
    DOM_ELEMENTS.prevZoneBtn = document.getElementById('prev-zone');
    DOM_ELEMENTS.nextZoneBtn = document.getElementById('next-zone');
}

function initializeEventListeners() {
    const zoneCards = document.querySelectorAll('.zone-card');
    const handleZoneCardClick = function() {
        const zoneId = this.dataset.zone;
        loadZoneDetail(zoneId);
    };
    const handleZoneCardKeyPress = function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const zoneId = this.dataset.zone;
            loadZoneDetail(zoneId);
        }
    };

    zoneCards.forEach(card => {
        card.addEventListener('click', handleZoneCardClick);
        card.addEventListener('keypress', handleZoneCardKeyPress);
        APP_STATE.eventListeners.push({ element: card, event: 'click', handler: handleZoneCardClick });
        APP_STATE.eventListeners.push({ element: card, event: 'keypress', handler: handleZoneCardKeyPress });
    });

    DOM_ELEMENTS.backButton.addEventListener('click', showMainView);
    APP_STATE.eventListeners.push({ element: DOM_ELEMENTS.backButton, event: 'click', handler: showMainView });

    DOM_ELEMENTS.versionTabsContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('version-tab')) {
            const version = e.target.dataset.version;
            setActiveVersion(version);
            updateTabAriaSelected(e.target);
        }
    });

    const handleFilterButtonClick = function() {
        const filterType = this.dataset.filter;
        applyZoneFilter(filterType);
        
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        updateFilterButtonAriaPressed();
    };

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', handleFilterButtonClick);
        APP_STATE.eventListeners.push({ element: btn, event: 'click', handler: handleFilterButtonClick });
    });

    DOM_ELEMENTS.prevZoneBtn.addEventListener('click', navigatePrevZone);
    DOM_ELEMENTS.nextZoneBtn.addEventListener('click', navigateNextZone);
    APP_STATE.eventListeners.push({ element: DOM_ELEMENTS.prevZoneBtn, event: 'click', handler: navigatePrevZone });
    APP_STATE.eventListeners.push({ element: DOM_ELEMENTS.nextZoneBtn, event: 'click', handler: navigateNextZone });

    initializeSearchFunctionality();
}

function updateTabAriaSelected(activeTab) {
    document.querySelectorAll('.version-tab').forEach(tab => {
        tab.setAttribute('aria-selected', tab === activeTab ? 'true' : 'false');
    });
}

function updateFilterButtonAriaPressed() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.setAttribute('aria-pressed', btn.classList.contains('active') ? 'true' : 'false');
    });
}

function applyZoneFilter(filterType) {
    const cards = document.querySelectorAll('.zone-card');
    const searchTerm = document.getElementById('zone-search').value.toLowerCase();
    
    cards.forEach(card => {
        const cardType = card.dataset.type;
        const cardTitle = card.querySelector('h3').textContent.toLowerCase();
        
        const typeMatch = filterType === 'all' || cardType === filterType;
        const searchMatch = !searchTerm || cardTitle.includes(searchTerm);
        
        card.classList.toggle('hidden', !(typeMatch && searchMatch));
    });

    hideEmptySections();
}

function hideEmptySections() {
    const sections = document.querySelectorAll('.zone-section');
    sections.forEach(section => {
        const visibleCards = section.querySelectorAll('.zone-card:not(.hidden)');
        section.style.display = visibleCards.length === 0 ? 'none' : 'block';
    });
}

function initializeSearchFunctionality() {
    const searchInput = document.getElementById('zone-search');
    const searchClearBtn = document.getElementById('search-clear');
    const searchSuggestions = document.getElementById('search-suggestions');

    if (!searchInput) return;

    const debouncedSearch = debounce(function(searchTerm) {
        if (searchTerm.length > 0) {
            searchClearBtn.style.display = 'flex';
            showSearchSuggestions(searchTerm);
            applyZoneFilter('all');
        } else {
            searchClearBtn.style.display = 'none';
            searchSuggestions.style.display = 'none';
            applyZoneFilter('all');
        }
    }, 200);

    const handleSearchInput = function() {
        const searchTerm = this.value.toLowerCase().trim();
        debouncedSearch(searchTerm);
    };

    const handleSearchClear = function() {
        searchInput.value = '';
        searchClearBtn.style.display = 'none';
        searchSuggestions.style.display = 'none';
        applyZoneFilter('all');
        searchInput.focus();
    };

    const handleDocumentClick = function(e) {
        if (!e.target.closest('.search-bar-container')) {
            searchSuggestions.style.display = 'none';
        }
    };

    searchInput.addEventListener('input', handleSearchInput);
    searchClearBtn.addEventListener('click', handleSearchClear);
    document.addEventListener('click', handleDocumentClick);

    APP_STATE.eventListeners.push({ element: searchInput, event: 'input', handler: handleSearchInput });
    APP_STATE.eventListeners.push({ element: searchClearBtn, event: 'click', handler: handleSearchClear });
    APP_STATE.eventListeners.push({ element: document, event: 'click', handler: handleDocumentClick });
}

function showSearchSuggestions(searchTerm) {
    const suggestionsContainer = document.getElementById('search-suggestions');
    const cards = document.querySelectorAll('.zone-card');
    const matches = [];

    cards.forEach(card => {
        const title = card.querySelector('h3').textContent;
        const desc = card.querySelector('.zone-desc').textContent;
        
        if (title.toLowerCase().includes(searchTerm) || desc.toLowerCase().includes(searchTerm)) {
            matches.push({
                title: title,
                zone: card.dataset.zone,
                type: card.dataset.type
            });
        }
    });

    if (matches.length === 0) {
        suggestionsContainer.innerHTML = '<div class="search-suggestion-item">No se encontraron zonas</div>';
    } else {
        suggestionsContainer.innerHTML = matches.slice(0, 8).map(match => `
            <div class="search-suggestion-item" data-zone="${match.zone}" role="option">
                <strong>${match.title}</strong>
                <br><small style="color: var(--text-secondary);">${capitalizeFirst(match.type)}</small>
            </div>
        `).join('');

        suggestionsContainer.querySelectorAll('.search-suggestion-item').forEach(item => {
            item.addEventListener('click', function() {
                const zoneId = this.dataset.zone;
                loadZoneDetail(zoneId);
            });
        });
    }

    suggestionsContainer.style.display = 'block';
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function showMainView() {
    DOM_ELEMENTS.mainView.style.display = 'block';
    DOM_ELEMENTS.zoneDetailView.style.display = 'none';
    APP_STATE.currentZone = null;
    APP_STATE.currentVersion = 'all';
}

function showZoneDetailView() {
    DOM_ELEMENTS.mainView.style.display = 'none';
    DOM_ELEMENTS.zoneDetailView.style.display = 'block';
}

async function loadZoneDetail(zoneId) {
    APP_STATE.currentZone = zoneId;
    APP_STATE.currentVersion = 'all';
    const zoneData = APP_STATE.zonesData[zoneId];

    if (!zoneData) {
        showError('Zona no encontrada');
        return;
    }

    DOM_ELEMENTS.detailZoneName.textContent = zoneData.name;
    showZoneDetailView();

    DOM_ELEMENTS.zoneInfoContainer.innerHTML = `
        <div class="loading" aria-live="polite" aria-busy="true">
            <div class="loading-spinner" aria-hidden="true"></div>
            <p>Cargando información de la zona...</p>
        </div>
    `;

    let zoneInfoHTML = `
        <div class="zone-info">
            <div>
                <h3>Información de la Zona</h3>
                <p class="zone-description">${zoneData.description}</p>
                <div class="zone-meta">
                    <p><strong>Tipo:</strong> ${zoneData.type}</p>
                    <p><strong>Conexiones:</strong> ${zoneData.connections.join(', ')}</p>
                    ${zoneData.importance ? `<p><strong>Importancia:</strong> ${zoneData.importance}</p>` : ''}
                    ${zoneData.motto !== undefined ? `<p><strong>Lema:</strong> "${zoneData.motto}"</p>` : ''}
                </div>
            </div>
            <div>
                <img src="${zoneData.image}" alt="${zoneData.name}" class="zone-image" loading="lazy">
            </div>
        </div>
    `;

    if (zoneData.areas) {
        zoneInfoHTML += `<h3>Zonas</h3>`;
        zoneInfoHTML += `<div class="cave-areas-overview">`;
        
        for (const area of zoneData.areas) {
            zoneInfoHTML += `
                <div class="cave-area">
                    <h4>${area.name}</h4>
                    <p class="area-description">${area.description}</p>
                    <p class="pokemon-count"><strong>${area.pokemonList.length} Pokémon</strong> encontrados en esta zona</p>
                </div>
            `;
        }
        
        zoneInfoHTML += `</div>`;

        DOM_ELEMENTS.pokemonSection.style.display = 'block';

        if (zoneData.locationAreaId) {
            const encounters = await fetchLocationEncounters(zoneData.locationAreaId);
            APP_STATE.zoneEncounters = encounters;
        }

        await loadPokemonForAreas(zoneData.areas);
    } else if (zoneData.zones) {
        zoneInfoHTML += `<h3>Pokémon Encontrados Aquí</h3>`;
        
        let totalPokemon = 0;
        for (const zone of zoneData.zones) {
            const uniquePokemon = new Set();
            zone.pokemonList.forEach(p => uniquePokemon.add(p.name));
            totalPokemon += uniquePokemon.size;
        }
        
        zoneInfoHTML += `<p>Esta zona tiene ${totalPokemon} Pokémon salvajes disponibles en diferentes áreas. Selecciona una versión del juego para ver detalles específicos.</p>`;

        DOM_ELEMENTS.pokemonSection.style.display = 'block';

        if (zoneData.locationAreaId) {
            const encounters = await fetchLocationEncounters(zoneData.locationAreaId);
            APP_STATE.zoneEncounters = encounters;
        }

        await loadPokemonForZones(zoneData.zones);
    } else if (zoneData.pokemonList) {
        zoneInfoHTML += `<h3>Pokémon Encontrados Aquí</h3>`;
        zoneInfoHTML += `<p>Esta zona tiene ${zoneData.pokemonList.length} Pokémon salvajes disponibles. Selecciona una versión del juego para ver detalles específicos. Haz clic en <strong>Detalles</strong> en cualquier Pokémon para ver información completa de encuentro.</p>`;

        DOM_ELEMENTS.pokemonSection.style.display = 'block';

        if (zoneData.locationAreaId) {
            const encounters = await fetchLocationEncounters(zoneData.locationAreaId);
            APP_STATE.zoneEncounters = encounters;
        }

        await loadPokemonForZone(zoneData.pokemonList, zoneData.isTown);
    } else {
        DOM_ELEMENTS.pokemonSection.style.display = 'none';
    }

    DOM_ELEMENTS.zoneInfoContainer.innerHTML = zoneInfoHTML;
    updateNavigationButtons();
}

async function loadPokemonForZone(pokemonList, isTown = false) {
    DOM_ELEMENTS.pokemonGrid.innerHTML = `
        <div class="loading" aria-live="polite" aria-busy="true">
            <div class="loading-spinner" aria-hidden="true"></div>
            <p>Cargando datos de Pokémon...</p>
        </div>
    `;

    const hadOriginalPokemon = pokemonList.length > 0;
    const pokemonDataPromises = pokemonList.map(pokemon => fetchPokemonData(pokemon));
    const pokemonDataArray = await Promise.all(pokemonDataPromises);

    const filteredPokemon = filterPokemonByVersion(pokemonDataArray);

    renderPokemonGrid(filteredPokemon, isTown && !hadOriginalPokemon);
}

async function loadPokemonForAreas(areas) {
    DOM_ELEMENTS.pokemonGrid.innerHTML = `
        <div class="loading" aria-live="polite" aria-busy="true">
            <div class="loading-spinner" aria-hidden="true"></div>
            <p>Cargando datos de Pokémon...</p>
        </div>
    `;

    let areasHTML = '';
    let allPokemonData = [];

    for (const area of areas) {
        const pokemonDataPromises = area.pokemonList.map(pokemon => {
            const pokemonWithArea = { ...pokemon, areaName: area.name };
            return fetchPokemonData(pokemonWithArea);
        });
        
        const pokemonDataArray = await Promise.all(pokemonDataPromises);
        const filteredPokemon = filterPokemonByVersion(pokemonDataArray);
        allPokemonData = allPokemonData.concat(filteredPokemon);

        areasHTML += `
            <div class="cave-section-separator">
                <h3 class="cave-section-title">${area.name}</h3>
            </div>
        `;

        areasHTML += renderPokemonGridHTML(filteredPokemon);
    }

    DOM_ELEMENTS.pokemonGrid.innerHTML = areasHTML;
    
    attachPokemonDetailsListeners(allPokemonData);
}

async function loadPokemonForZones(zones) {
    DOM_ELEMENTS.pokemonGrid.innerHTML = `
        <div class="loading" aria-live="polite" aria-busy="true">
            <div class="loading-spinner" aria-hidden="true"></div>
            <p>Cargando datos de Pokémon...</p>
        </div>
    `;

    let allZonesContent = '';
    let allPokemonData = [];

    for (let i = 0; i < zones.length; i++) {
        const zone = zones[i];
        const pokemonDataPromises = zone.pokemonList.map(pokemon => {
            const pokemonWithZone = { ...pokemon, zoneName: zone.name };
            return fetchPokemonData(pokemonWithZone);
        });
        
        const pokemonDataArray = await Promise.all(pokemonDataPromises);
        const filteredPokemon = filterPokemonByVersion(pokemonDataArray);
        allPokemonData = allPokemonData.concat(filteredPokemon);

        allZonesContent += `
            <div class="zone-section-wrapper">
                <div class="cave-section-separator">
                    <h3 class="cave-section-title">${zone.name}</h3>
                </div>
                <p class="zone-separator-description">${zone.description}</p>
                <div class="zone-pokemon-grid">
                    ${renderPokemonGridHTML(filteredPokemon)}
                </div>
            </div>
        `;
    }

    DOM_ELEMENTS.pokemonGrid.innerHTML = allZonesContent;
    
    attachPokemonDetailsListeners(allPokemonData);
}

function attachPokemonDetailsListeners(allPokemonData) {
    document.querySelectorAll('.pokemon-details-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const pokemonName = this.dataset.pokemon;
            const pokemon = allPokemonData.find(p => p.name === pokemonName);
            
            if (!APP_STATE.zoneEncounters || !Array.isArray(APP_STATE.zoneEncounters)) {
                const speciesDetails = await fetchPokemonSpeciesDetails(pokemonName);
                openPokemonDetailsModal(pokemon, [], speciesDetails);
                return;
            }

            const rawEncounters = APP_STATE.zoneEncounters
                .filter(enc => enc.pokemon && enc.pokemon.name === pokemonName)
                .flatMap(enc => {
                    if (!Array.isArray(enc.version_details)) return [];
                    return enc.version_details.flatMap(vd => {
                        if (!vd.version || !vd.version.name || !Array.isArray(vd.encounter_details)) return [];
                        return vd.encounter_details
                            .filter(ed => ed.method && ed.method.name && ed.min_level !== undefined && ed.max_level !== undefined && ed.chance !== undefined)
                            .map(ed => ({
                                version: vd.version.name,
                                method: ed.method.name,
                                minLevel: ed.min_level,
                                maxLevel: ed.max_level,
                                chance: ed.chance
                            }));
                    });
                });

            const speciesDetails = await fetchPokemonSpeciesDetails(pokemonName);
            openPokemonDetailsModal(pokemon, rawEncounters, speciesDetails);
        });
    });
}

async function fetchPokemonData(pokemonInfo) {
    try {
        const response = await fetch(`${POKEAPI.baseURL}/pokemon/${pokemonInfo.name}`);
        if (!response.ok) throw new Error('Pokémon no encontrado');

        const data = await response.json();
        const speciesResponse = await fetch(data.species.url);
        const speciesData = await speciesResponse.ok ? await speciesResponse.json() : null;

        const types = data.types
            .map(t => t.type.name)
            .filter(t => t !== 'fairy');

        return {
            id: data.id,
            name: data.name,
            displayName: data.name.charAt(0).toUpperCase() + data.name.slice(1),
            sprite: `${POKEAPI.spriteBaseURL}${data.id}.png`,
            animatedSprite: `${POKEAPI.animatedSpriteURL}${data.id}.gif`,
            types: types,
            abilities: data.abilities.map(a => a.ability.name),
            baseExperience: data.base_experience,
            height: data.height / 10,
            weight: data.weight / 10,
            stats: data.stats,
            versions: pokemonInfo.versions,
            exclusive: pokemonInfo.exclusive,
            method: pokemonInfo.method,
            rarity: pokemonInfo.rarity,
            levelRange: pokemonInfo.levelRange,
            encounterRate: pokemonInfo.encounterRate,
            isStarter: pokemonInfo.isStarter || false,
            note: pokemonInfo.note
        };
    } catch (error) {
        return {
            id: 0,
            name: pokemonInfo.name,
            displayName: pokemonInfo.name,
            sprite: 'https://via.placeholder.com/80?text=Error',
            types: [],
            error: true
        };
    }
}

function filterPokemonByVersion(pokemonArray) {
    if (APP_STATE.currentVersion === 'all') {
        return pokemonArray;
    }
    
    const selectedVersions = APP_STATE.versionGroups[APP_STATE.currentVersion] || [];
    
    return pokemonArray.filter(pokemon => 
        pokemon.versions.some(version => selectedVersions.includes(version))
    );
}

function renderPokemonGrid(pokemonArray, isTown = false) {
    if (pokemonArray.length === 0) {
        const message = isTown 
            ? 'En este pueblo/ciudad no hay pokemon salvajes.' 
            : 'No hay Pokémon disponibles para esta versión.';
        DOM_ELEMENTS.pokemonGrid.innerHTML = `
            <div class="error-message">
                <p>${message}</p>
            </div>
        `;
        return;
    }

    const methodOrder = ['starter', 'walk', 'surf', 'old-rod', 'good-rod', 'super-rod', 'dive', 'rock-smash', 'egg', 'gift', 'trade', 'fossil'];
    const methodLabels = {
        'starter': 'Pokémon Inicial',
        'walk': 'Caminando',
        'surf': 'Surfeando',
        'old-rod': 'Caña Vieja',
        'good-rod': 'Caña Buena',
        'super-rod': 'Supercaña',
        'dive': 'Buceando',
        'rock-smash': 'Golpe Roca',
        'egg': 'Huevo',
        'gift': 'Regalo',
        'trade': 'Intercambio',
        'fossil': 'Revivir Fósil'
    };

    const groupedByMethod = {};
    pokemonArray.forEach(pokemon => {
        const method = pokemon.method || 'walk';
        if (!groupedByMethod[method]) {
            groupedByMethod[method] = [];
        }
        groupedByMethod[method].push(pokemon);
    });

    let html = '';
    methodOrder.forEach((method, index) => {
        if (groupedByMethod[method]) {
            if (index > 0) {
                html += '<div class="pokemon-method-separator" aria-hidden="true"></div>';
            }
            html += `<div class="pokemon-method-section">
                <h4 class="pokemon-method-title">${methodLabels[method]}</h4>
                <div class="pokemon-method-content">
                    ${groupedByMethod[method].map(pokemon => createPokemonCard(pokemon)).join('')}
                </div>
            </div>`;
        }
    });

    DOM_ELEMENTS.pokemonGrid.innerHTML = html;
    
    attachPokemonDetailsListeners(pokemonArray);
}

function renderPokemonGridHTML(pokemonArray) {
    if (pokemonArray.length === 0) {
        return `<div class="error-message"><p>No hay Pokémon disponibles para esta zona/versión.</p></div>`;
    }

    const methodOrder = ['starter', 'walk', 'surf', 'old-rod', 'good-rod', 'super-rod', 'dive', 'rock-smash', 'egg', 'gift', 'trade', 'fossil'];
    const methodLabels = {
        'starter': 'Pokémon Inicial',
        'walk': 'Caminando',
        'surf': 'Surfeando',
        'old-rod': 'Caña Vieja',
        'good-rod': 'Caña Buena',
        'super-rod': 'Supercaña',
        'dive': 'Buceando',
        'rock-smash': 'Golpe Roca',
        'egg': 'Huevo',
        'gift': 'Regalo',
        'trade': 'Intercambio',
        'fossil': 'Revivir Fósil'
    };

    const groupedByMethod = {};
    pokemonArray.forEach(pokemon => {
        const method = pokemon.method || 'walk';
        if (!groupedByMethod[method]) {
            groupedByMethod[method] = [];
        }
        groupedByMethod[method].push(pokemon);
    });

    let html = '';
    methodOrder.forEach((method, index) => {
        if (groupedByMethod[method]) {
            if (index > 0) {
                html += '<div class="pokemon-method-separator" aria-hidden="true"></div>';
            }
            html += `<div class="pokemon-method-section">
                <h4 class="pokemon-method-title">${methodLabels[method]}</h4>
                <div class="pokemon-method-content">
                    ${groupedByMethod[method].map(pokemon => createPokemonCard(pokemon)).join('')}
                </div>
            </div>`;
        }
    });

    return html;
}

function createPokemonCard(pokemon) {
    const typeBadgesHTML = pokemon.types
        .map(type => {
            const color = APP_STATE.typeColors[type] || '#A8A878';
            return `<span class="type-badge" style="background-color: ${color}; color: white;">${type}</span>`;
        })
        .join('');

    const encounterNote = pokemon.note 
        ? `<p><em>${pokemon.note}</em></p>` 
        : '';

    const starterBadge = pokemon.isStarter 
        ? '<span class="starter-badge" title="Pokémon Inicial"><i class="fas fa-star" aria-hidden="true"></i> Starter</span>'
        : '';

    const versionIndicators = `
        <div class="version-indicators" aria-hidden="true">
            <span class="version-box ${pokemon.versions && pokemon.versions.includes('ruby') ? 'active-ruby' : ''}" title="Rubí">R</span>
            <span class="version-box ${pokemon.versions && pokemon.versions.includes('sapphire') ? 'active-sapphire' : ''}" title="Zafiro">Z</span>
            <span class="version-box ${pokemon.versions && pokemon.versions.includes('emerald') ? 'active-emerald' : ''}" title="Esmeralda">E</span>
        </div>
    `;

    return `
        <div class="pokemon-card ${pokemon.isStarter ? 'pokemon-starter' : ''}">
            <div class="pokemon-header">
                <img src="${pokemon.sprite}" alt="${pokemon.displayName}" class="pokemon-sprite" onerror="this.src='https://via.placeholder.com/80?text=Error'" loading="lazy">
                <div class="pokemon-name-id">
                    <div class="pokemon-name">${pokemon.displayName}</div>
                    <div class="pokemon-id">#${pokemon.id}</div>
                    ${starterBadge}
                </div>
            </div>

            ${versionIndicators}

            <div class="pokemon-details">
                <div>
                    <span class="detail-label">Tipo:</span>
                </div>
                <div>
                    ${typeBadgesHTML}
                </div>

                <div>
                    <span class="detail-label">Altura:</span>
                </div>
                <div>
                    <span class="detail-value">${pokemon.height}m</span>
                </div>

                <div>
                    <span class="detail-label">Peso:</span>
                </div>
                <div>
                    <span class="detail-value">${pokemon.weight}kg</span>
                </div>

                <div>
                    <span class="detail-label">Rareza:</span>
                </div>
                <div>
                    <span class="detail-value">${pokemon.rarity || 'común'}</span>
                </div>
            </div>

            <div class="encounter-info">
                <p><strong>Método:</strong> ${getMethodLabel(pokemon.method)}</p>
                ${pokemon.levelRange ? `<p><strong>Nivel:</strong> ${pokemon.levelRange}</p>` : ''}
                ${pokemon.encounterRate ? `<p><strong>Aparición:</strong> ${pokemon.encounterRate}</p>` : ''}
                ${encounterNote}
                <button class="pokemon-details-btn" data-pokemon="${pokemon.name}" title="Ver detalles completos" aria-label="Ver detalles de ${pokemon.displayName}">
                    <i class="fas fa-info-circle" aria-hidden="true"></i> Detalles
                </button>
            </div>
        </div>
    `;
}

function getMethodLabel(method) {
    const methodLabels = {
        'walk': 'A pie (Caminando)',
        'surf': 'Surfeando',
        'old-rod': 'Caña vieja',
        'good-rod': 'Caña buena',
        'super-rod': 'Supercaña',
        'dive': 'Buceando',
        'starter': 'Pokémon Inicial',
        'trade': 'Intercambio',
        'fossil': 'Revivir Fósil'
    };
    return methodLabels[method] || (method.charAt(0).toUpperCase() + method.slice(1));
}

function setActiveVersion(version) {
    APP_STATE.currentVersion = version;

    document.querySelectorAll('.version-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    document.querySelector(`[data-version="${version}"]`).classList.add('active');

    const zoneData = APP_STATE.zonesData[APP_STATE.currentZone];
    if (zoneData) {
        if (zoneData.areas) {
            loadPokemonForAreas(zoneData.areas);
        } else if (zoneData.pokemonList) {
            loadPokemonForZone(zoneData.pokemonList);
        }
    }
}

function updateNavigationButtons() {
    const currentIndex = APP_STATE.zoneOrder.indexOf(APP_STATE.currentZone);
    
    DOM_ELEMENTS.prevZoneBtn.disabled = currentIndex === 0;
    DOM_ELEMENTS.nextZoneBtn.disabled = currentIndex === APP_STATE.zoneOrder.length - 1;
}

function navigatePrevZone() {
    const currentIndex = APP_STATE.zoneOrder.indexOf(APP_STATE.currentZone);
    if (currentIndex > 0) {
        const prevZoneId = APP_STATE.zoneOrder[currentIndex - 1];
        loadZoneDetail(prevZoneId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function navigateNextZone() {
    const currentIndex = APP_STATE.zoneOrder.indexOf(APP_STATE.currentZone);
    if (currentIndex < APP_STATE.zoneOrder.length - 1) {
        const nextZoneId = APP_STATE.zoneOrder[currentIndex + 1];
        loadZoneDetail(nextZoneId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function showError(message) {
    DOM_ELEMENTS.zoneInfoContainer.innerHTML = `
        <div class="error-message">
            <p>${message}</p>
        </div>
    `;
}

async function fetchLocationEncounters(locationAreaId) {
    try {
        const response = await fetch(`${POKEAPI.baseURL}/location-area/${locationAreaId}`);
        if (!response.ok) throw new Error('Encuentros no encontrados');
        
        const data = await response.json();
        return data.pokemon_encounters;
    } catch (error) {
        return [];
    }
}

async function fetchPokemonSpeciesDetails(pokemonName) {
    try {
        const response = await fetch(`${POKEAPI.baseURL}/pokemon-species/${pokemonName}`);
        if (!response.ok) throw new Error('Especie no encontrada');
        
        const data = await response.json();
        return {
            genderRate: data.gender_rate,
            captureRate: data.capture_rate,
            hatchCounter: data.hatch_counter
        };
    } catch (error) {
        return { genderRate: -1, captureRate: 0, hatchCounter: 0 };
    }
}

function formatGenderRatio(genderRate) {
    if (genderRate === -1) return 'Sin género';
    if (genderRate === 0) return '100% ♂ Macho';
    if (genderRate === 8) return '100% ♀ Hembra';
    const femalePercent = (genderRate / 8) * 100;
    const malePercent = 100 - femalePercent;
    return `${malePercent.toFixed(0)}% ♂ / ${femalePercent.toFixed(0)}% ♀`;
}

function openPokemonDetailsModal(pokemon, encounters, speciesDetails) {
    const modal = document.createElement('div');
    modal.className = 'pokemon-modal-overlay';
    modal.role = 'dialog';
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', `modal-title-${pokemon.id}`);
    
    modal.innerHTML = `
        <div class="pokemon-modal">
            <div class="modal-header">
                <h3 id="modal-title-${pokemon.id}">${pokemon.displayName} #${pokemon.id}</h3>
                <button class="modal-close" aria-label="Cerrar modal">&times;</button>
            </div>
            <div class="modal-content">
                <div class="modal-section">
                    <h4>Información de Especie</h4>
                    <div class="species-info">
                        <p><strong>Género:</strong> ${formatGenderRatio(speciesDetails.genderRate)}</p>
                        <p><strong>Tasa de Captura:</strong> ${speciesDetails.captureRate}/255</p>
                        <p><strong>Ciclos de Huevo:</strong> ${speciesDetails.hatchCounter}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const closeBtn = modal.querySelector('.modal-close');
    const handleClose = () => modal.remove();
    
    closeBtn.addEventListener('click', handleClose);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            handleClose();
        }
    });

    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            handleClose();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    
    document.addEventListener('keydown', handleEscape);
}

function initializeThemeSelector() {
    const savedTheme = localStorage.getItem('hoenn-theme') || 'emerald';
    setTheme(savedTheme);
    
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            setTheme(theme);
            localStorage.setItem('hoenn-theme', theme);
        });
    });
}

function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[data-theme="${theme}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

function cleanupEventListeners() {
    APP_STATE.eventListeners.forEach(({ element, event, handler }) => {
        if (element) {
            element.removeEventListener(event, handler);
        }
    });
    APP_STATE.eventListeners = [];
}

window.addEventListener('beforeunload', cleanupEventListeners);

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});