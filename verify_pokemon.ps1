Write-Host "Fetching Hoenn Route 101 location data..."
$response = Invoke-WebRequest -Uri "https://pokeapi.co/api/v2/location/hoenn-route-101" -UseBasicParsing
$data = $response.Content | ConvertFrom-Json

Write-Host "Location: $($data.name)"
Write-Host "Areas found: $($data.areas.Count)`n"

foreach ($area in $data.areas) {
    Write-Host "Fetching area: $($area.name)..."
    $areaResponse = Invoke-WebRequest -Uri $area.url -UseBasicParsing
    $areaData = $areaResponse.Content | ConvertFrom-Json
    
    Write-Host "  Pokemon encounters: $($areaData.pokemon_encounters.Count)"
    
    $areaData.pokemon_encounters | ForEach-Object {
        $pokemonName = $_.pokemon.name
        $methods = $_.version_details | Select-Object -ExpandProperty version | Select-Object -ExpandProperty name
        Write-Host "    - $pokemonName (versions: $($methods -join ', '))"
    }
}
