document.addEventListener('DOMContentLoaded', () => {
    const playerNameElement = document.getElementById('player-name');
    const actionButton = document.getElementById('action-button');
    const positionFilter = document.getElementById('position-filter');
    let currentPlayerIndex = 0;
    let players = [];
    let filteredPlayers = [];
    let isShowingCollege = false;
    let selectedPositions = new Set();

    function parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }

    function getUniquePositions() {
        const positions = new Set();
        players.forEach(player => {
            if (player.position) {
                positions.add(player.position);
            }
        });
        return Array.from(positions).sort();
    }

    function populatePositionFilter() {
        const positions = getUniquePositions();
        positionFilter.innerHTML = positions.map(pos => 
            `<button class="position-button" data-position="${pos}">${pos}</button>`
        ).join('');

        // Add click handlers to all position buttons
        document.querySelectorAll('.position-button').forEach(button => {
            button.addEventListener('click', () => {
                const position = button.dataset.position;
                button.classList.toggle('selected');
                if (button.classList.contains('selected')) {
                    selectedPositions.add(position);
                } else {
                    selectedPositions.delete(position);
                }
                updateFilteredPlayers();
            });
        });
    }

    function updateFilteredPlayers() {
        if (selectedPositions.size === 0) {
            filteredPlayers = [...players];
        } else {
            filteredPlayers = players.filter(player => 
                selectedPositions.has(player.position)
            );
        }
        // Reset current player if it's no longer in filtered list
        if (!filteredPlayers.includes(players[currentPlayerIndex])) {
            currentPlayerIndex = 0;
        }
        displayPlayer(currentPlayerIndex);
    }

    function loadPlayers() {
        fetch('sportsref_download.csv')
            .then(response => response.text())
            .then(data => {
                const lines = data.split('\n');
                players = lines.slice(1).map(line => { // Ignore the header row
                    const columns = parseCSVLine(line);
                    const name = columns[1];
                    const college = columns[7];
                    const team = columns[19];
                    const position = columns[18];
                    return { name, college, team, position };
                });
                filteredPlayers = [...players];
                populatePositionFilter();
                displayPlayer(currentPlayerIndex);
            });
    }

    function displayPlayer(index) {
        const player = filteredPlayers[index];
        if (!player) return;
        playerNameElement.textContent = `${player.name} (${player.position}) - ${player.team}`;
        isShowingCollege = false;
        actionButton.textContent = "Where'd He Play In College?";
    }

    function getRandomPlayerIndex() {
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * (filteredPlayers.length-1));
        } while (randomIndex === currentPlayerIndex);
        return randomIndex;
    }

    actionButton.addEventListener('click', () => {
        if (!isShowingCollege) {
            const player = filteredPlayers[currentPlayerIndex];
            playerNameElement.textContent = `${player.name} (${player.position}) - ${player.team} - ${player.college}`;
            actionButton.textContent = 'Next Player';
            isShowingCollege = true;
        } else {
            currentPlayerIndex = getRandomPlayerIndex();
            console.log(currentPlayerIndex);
            displayPlayer(currentPlayerIndex);
        }
    });

    loadPlayers();
});
