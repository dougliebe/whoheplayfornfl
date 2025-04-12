document.addEventListener('DOMContentLoaded', () => {
    const playerNameElement = document.getElementById('player-name');
    const actionButton = document.getElementById('action-button');
    const difficultyButtons = document.querySelectorAll('.difficulty-button');
    let currentPlayerIndex = 0;
    let players = [];
    let filteredPlayers = [];
    let isShowingCollege = false;
    let currentDifficulty = 'easy';

    const difficultySettings = {
        'easy': {
            positions: ['QB', 'RB', 'WR', 'TE', 'FB'],
            filter: (player) => difficultySettings.easy.positions.includes(player.position)
        },
        'medium': {
            filter: (player) => {
                const topPlayers = players
                    .filter(p => p.proBowls > 0)
                    .sort((a, b) => b.proBowls - a.proBowls)
                    .slice(0, 100)
                    .map(p => p.name);
                return topPlayers.includes(player.name);
            }
        },
        'sicko': {
            filter: () => true // Show all players
        }
    };

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

    function setDifficulty(difficulty) {
        // Update UI
        difficultyButtons.forEach(button => {
            button.classList.remove('selected');
            if (button.dataset.difficulty === difficulty) {
                button.classList.add('selected');
            }
        });

        // Update filter
        currentDifficulty = difficulty;
        updateFilteredPlayers();
    }

    function updateFilteredPlayers() {
        filteredPlayers = players.filter(difficultySettings[currentDifficulty].filter);
        
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
                    const proBowls = parseInt(columns[13]) || 0; // Column 14 is index 13
                    return { name, college, team, position, proBowls };
                });
                updateFilteredPlayers();
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

    // Add click handlers to difficulty buttons
    difficultyButtons.forEach(button => {
        button.addEventListener('click', () => {
            setDifficulty(button.dataset.difficulty);
        });
    });

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
