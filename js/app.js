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
    versionGroups: {
        'all': [],
        'ruby': ['ruby'],
        'sapphire': ['sapphire'],
        'emerald': ['emerald']
    }
};

const DOM_ELEMENTS = {
    mainView: null,
    zoneDetailView: null,
    backButton: null,
    zoneInfoContainer: null,
    pokemonSection: null,
    pokemonGrid: null,
    versionTabsContainer: null,
    detailZoneName: null
};

async function initializeApp() {
    await loadZonesData();
    cacheDOM();
    initializeEventListeners();
    console.log('Pokédex Hoenn inicializada. Lista para explorar!');
}

async function loadZonesData() {
    try {
        const response = await fetch('data/zones.json');
        const data = await response.json();
        APP_STATE.zonesData = data.zonesData;
        APP_STATE.typeColors = data.typeColors;
        APP_STATE.versionMap = data.versionMap;
    } catch (error) {
        console.error('Error loading zones data:', error);
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
}

function initializeEventListeners() {
    document.querySelectorAll('.zone-card').forEach(card => {
        card.addEventListener('click', function() {
            const zoneId = this.dataset.zone;
            loadZoneDetail(zoneId);
        });
    });

    DOM_ELEMENTS.backButton.addEventListener('click', showMainView);

    DOM_ELEMENTS.versionTabsContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('version-tab')) {
            const version = e.target.dataset.version;
            setActiveVersion(version);
        }
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const filterType = this.dataset.filter;
            applyZoneFilter(filterType);
            
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function applyZoneFilter(filterType) {
    const cards = document.querySelectorAll('.zone-card');
    cards.forEach(card => {
        const cardType = card.dataset.type;
        if (filterType === 'all' || cardType === filterType) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
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
        <div class="loading">
            <div class="loading-spinner"></div>
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
                    ${zoneData.isTown ? '<p><strong>Importancia:</strong> Pueblo inicial donde comienza la aventura</p>' : ''}
                </div>
            </div>
            <div>
                <img src="${zoneData.image}" alt="${zoneData.name}" class="zone-image">
            </div>
        </div>
    `;

    if (!zoneData.isTown && zoneData.pokemonList) {
        zoneInfoHTML += `<h3>Pokémon Encontrados Aquí</h3>`;
        zoneInfoHTML += `<p>Esta zona tiene ${zoneData.pokemonList.length} Pokémon salvajes disponibles. Selecciona una versión del juego para ver detalles específicos. Haz clic en <strong>Detalles</strong> en cualquier Pokémon para ver información completa de encuentro.</p>`;

        DOM_ELEMENTS.pokemonSection.style.display = 'block';

        if (zoneData.locationAreaId) {
            const encounters = await fetchLocationEncounters(zoneData.locationAreaId);
            APP_STATE.zoneEncounters = encounters;
        }

        await loadPokemonForZone(zoneData.pokemonList);
    } else {
        DOM_ELEMENTS.pokemonSection.style.display = 'none';
    }

    DOM_ELEMENTS.zoneInfoContainer.innerHTML = zoneInfoHTML;
}

async function loadPokemonForZone(pokemonList) {
    DOM_ELEMENTS.pokemonGrid.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <p>Cargando datos de Pokémon...</p>
        </div>
    `;

    const pokemonDataPromises = pokemonList.map(pokemon => fetchPokemonData(pokemon));
    const pokemonDataArray = await Promise.all(pokemonDataPromises);

    const filteredPokemon = filterPokemonByVersion(pokemonDataArray);

    renderPokemonGrid(filteredPokemon);
}

async function fetchPokemonData(pokemonInfo) {
    try {
        const response = await fetch(`${POKEAPI.baseURL}/pokemon/${pokemonInfo.name}`);
        if (!response.ok) throw new Error('Pokémon no encontrado');

        const data = await response.json();

        const speciesResponse = await fetch(data.species.url);
        const speciesData = await speciesResponse.ok ? await speciesResponse.json() : null;

        return {
            id: data.id,
            name: data.name,
            displayName: data.name.charAt(0).toUpperCase() + data.name.slice(1),
            sprite: `${POKEAPI.spriteBaseURL}${data.id}.png`,
            animatedSprite: `${POKEAPI.animatedSpriteURL}${data.id}.gif`,
            types: data.types.map(t => t.type.name),
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
        console.error(`Error loading ${pokemonInfo.name}:`, error);
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

function renderPokemonGrid(pokemonArray) {
    if (pokemonArray.length === 0) {
        DOM_ELEMENTS.pokemonGrid.innerHTML = `
            <div class="error-message">
                <p>No hay Pokémon disponibles para esta versión.</p>
            </div>
        `;
        return;
    }

    const methodOrder = ['starter', 'walk', 'surf', 'old-rod', 'good-rod', 'super-rod'];
    const methodLabels = {
        'starter': 'Pokémon Inicial',
        'walk': 'Hierba Alta',
        'surf': 'Surfeando',
        'old-rod': 'Caña Vieja',
        'good-rod': 'Caña Buena',
        'super-rod': 'Caña Suprema'
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
                html += '<div class="pokemon-method-separator"></div>';
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
    
    document.querySelectorAll('.pokemon-details-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const pokemonName = this.dataset.pokemon;
            const pokemon = pokemonArray.find(p => p.name === pokemonName);
            
            if (!APP_STATE.zoneEncounters || !Array.isArray(APP_STATE.zoneEncounters)) {
                console.error('zoneEncounters no es un array válido:', APP_STATE.zoneEncounters);
                openPokemonDetailsModal(pokemon, [], await fetchPokemonSpeciesDetails(pokemonName));
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
                                encounter_method: ed.method.name,
                                level_from: ed.min_level,
                                level_to: ed.max_level,
                                chance: ed.chance,
                                rarity: ed.rarity || 'desconocida'
                            }));
                    });
                });
            
            console.log(`Encuentros crudos para ${pokemonName}:`, rawEncounters);

            const properEncounters = Object.values(
                rawEncounters.reduce((acc, enc) => {
                    const key = `${enc.version}-${enc.encounter_method}`;
                    if (!acc[key]) {
                        acc[key] = {
                            version: { name: enc.version },
                            encounter_method: { name: enc.encounter_method },
                            level_from: enc.level_from,
                            level_to: enc.level_to,
                            chance: Math.min(100, enc.chance)
                        };
                    } else {
                        acc[key].chance = Math.min(100, acc[key].chance + enc.chance);
                        acc[key].level_from = Math.min(acc[key].level_from, enc.level_from);
                        acc[key].level_to = Math.max(acc[key].level_to, enc.level_to);
                    }
                    return acc;
                }, {})
            );
            
            console.log(`Encuentros procesados para ${pokemonName}:`, properEncounters);
            
            const speciesDetails = await fetchPokemonSpeciesDetails(pokemonName);
            
            openPokemonDetailsModal(pokemon, properEncounters, speciesDetails);
        });
    });
}

function getMethodLabel(method) {
    const methodLabels = {
        'walk': 'A pie (Hierba alta)',
        'surf': 'Surfeando',
        'old-rod': 'Caña vieja',
        'good-rod': 'Caña buena',
        'super-rod': 'Caña suprema',
        'starter': 'Pokémon Inicial'
    };
    return methodLabels[method] || (method.charAt(0).toUpperCase() + method.slice(1));
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
        ? '<span class="starter-badge" title="Pokémon Inicial"><i class="fas fa-star"></i> Starter</span>'
        : '';

    return `
        <div class="pokemon-card ${pokemon.isStarter ? 'pokemon-starter' : ''}">
            <div class="pokemon-header">
                <img src="${pokemon.sprite}" alt="${pokemon.displayName}" class="pokemon-sprite" onerror="this.src='https://via.placeholder.com/80'">
                <div class="pokemon-name-id">
                    <div class="pokemon-name">${pokemon.displayName}</div>
                    <div class="pokemon-id">#${pokemon.id}</div>
                    ${starterBadge}
                </div>
            </div>

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
                <button class="pokemon-details-btn" data-pokemon="${pokemon.name}" title="Ver detalles completos">
                    <i class="fas fa-info-circle"></i> Detalles
                </button>
            </div>
        </div>
    `;
}

function setActiveVersion(version) {
    APP_STATE.currentVersion = version;

    document.querySelectorAll('.version-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    document.querySelector(`[data-version="${version}"]`).classList.add('active');

    const zoneData = APP_STATE.zonesData[APP_STATE.currentZone];
    if (zoneData && zoneData.pokemonList) {
        loadPokemonForZone(zoneData.pokemonList);
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
        console.error(`Error loading encounters for ${locationAreaId}:`, error);
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
        console.error(`Error loading species details for ${pokemonName}:`, error);
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
    modal.innerHTML = `
        <div class="pokemon-modal">
            <div class="modal-header">
                <h3>${pokemon.displayName} #${pokemon.id}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-content">
                <div class="modal-section">
                    <h4>Información de Encuentro</h4>
                    ${encounters.length > 0 ? `
                        <table class="encounter-table">
                            <thead>
                                <tr>
                                    <th>Versión</th>
                                    <th>Método</th>
                                    <th>Nivel</th>
                                    <th>Tasa (%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${encounters.map(enc => {
                                    const levelRange = enc.level_from === enc.level_to 
                                        ? enc.level_from 
                                        : enc.level_from + (enc.level_to ? '-' + enc.level_to : '');
                                    return `
                                    <tr>
                                        <td>${enc.version.name}</td>
                                        <td>${enc.encounter_method.name}</td>
                                        <td>${levelRange}</td>
                                        <td>${enc.chance}%</td>
                                    </tr>
                                `;
                                }).join('')}
                            </tbody>
                        </table>
                    ` : '<p>Sin datos de encuentro</p>'}
                </div>
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
    
    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

document.addEventListener('DOMContentLoaded', initializeApp);
