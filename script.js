document.addEventListener('DOMContentLoaded', () => {
    const playerNameElement = document.getElementById('player-name');
    const actionButton = document.getElementById('action-button');
    let currentPlayerIndex = 0;
    let players = [];
    let isShowingCollege = false;

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

    function loadPlayers() {
        fetch('sportsref_download.csv')
            .then(response => response.text())
            .then(data => {
                const lines = data.split('\n');
                players = lines.slice(1).map(line => { // Ignore the header row
                    const columns = parseCSVLine(line);
                    const name = columns[1];
                    const college = columns[7];
                    const team = columns[19]
                    const position = columns[18];
                    return { name, college, team, position };
                });
                displayPlayer(currentPlayerIndex);
            });
    }

    function displayPlayer(index) {
        const player = players[index];
        playerNameElement.textContent = `${player.name} (${player.position}) - ${player.team}`;
        isShowingCollege = false;
        actionButton.textContent = "Where'd He Play In College?";
    }

    function getRandomPlayerIndex() {
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * (players.length-1));
        } while (randomIndex === currentPlayerIndex);
        return randomIndex;
    }

    actionButton.addEventListener('click', () => {
        if (!isShowingCollege) {
            const player = players[currentPlayerIndex];
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
