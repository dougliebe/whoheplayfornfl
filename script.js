document.addEventListener('DOMContentLoaded', () => {
    const playerNameElement = document.getElementById('player-name');
    const actionButton = document.getElementById('action-button');
    let currentPlayerIndex = 0;
    let players = [];
    let isShowingCollege = false;

    function loadPlayers() {
        fetch('sportsref_download.csv')
            .then(response => response.text())
            .then(data => {
                const lines = data.split('\n');
                players = lines.slice(1).map(line => { // Ignore the header row
                    const columns = line.split(',');
                    const name = columns[1];
                    const college = columns[7];
                    const team = columns[18];
                    return { name, college, team };
                });
                displayPlayer(currentPlayerIndex);
            });
    }

    function displayPlayer(index) {
        playerNameElement.textContent = players[index].name;
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
            playerNameElement.textContent += ` - ${players[currentPlayerIndex].college}`;
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
