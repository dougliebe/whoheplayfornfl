document.addEventListener('DOMContentLoaded', () => {
    const playerNameElement = document.getElementById('player-name');
    const actionButton = document.getElementById('action-button');
    let currentPlayerIndex = 0;
    let players = [];

    function loadPlayers() {
        fetch('good_players.csv')
            .then(response => response.text())
            .then(data => {
                const lines = data.split('\n');
                players = lines.slice(1).map(line => { // Ignore the header row
                    const columns = line.split(',');
                    const name = columns[1];
                    const college = columns[7];
                    return { name, college };
                });
                displayPlayer(currentPlayerIndex);
            });
    }

    function displayPlayer(index) {
        playerNameElement.textContent = players[index].name;
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
        if (actionButton.textContent === "Where'd He Play In College?") {
            playerNameElement.textContent += ` - ${players[currentPlayerIndex].college}`;
            actionButton.textContent = 'Next Player';
        } else {
            currentPlayerIndex = getRandomPlayerIndex();
            // log the current player index
            console.log(currentPlayerIndex);
            displayPlayer(currentPlayerIndex);
        }
    });

    loadPlayers();
});
