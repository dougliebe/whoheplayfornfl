document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    const playerNameElement = document.getElementById('player-name');
    const actionButton = document.getElementById('action-button');
    const difficultyButtons = document.querySelectorAll('.difficulty-button');
    const playerInfoContainer = document.querySelector('.player-info');
    const difficultySelect = document.getElementById('difficulty-select');
    let currentDifficulty = difficultySelect.value;

    console.log('Found elements:', {
        playerNameElement: !!playerNameElement,
        actionButton: !!actionButton,
        difficultyButtons: difficultyButtons.length,
        playerInfoContainer: !!playerInfoContainer
    });

    if (!playerInfoContainer) {
        console.error('Player info container not found');
        return;
    }

    let currentPlayerIndex = 0;
    let players = [];
    let filteredPlayers = [];
    let isShowingCollege = false;
    let correctCount = 0;
    let incorrectCount = 0;
    let collegeMatches = new Map();
    let shuffledIndices = [];
    let currentProgress = 0;

    // Create tally display
    const tallyDisplay = document.createElement('div');
    tallyDisplay.className = 'tally-display';
    tallyDisplay.innerHTML = 'Correct: 0 | Incorrect: 0';
    playerInfoContainer.appendChild(tallyDisplay);

    // Create correct/incorrect buttons container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'feedback-buttons';
    
    const correctButton = document.createElement('button');
    correctButton.textContent = 'Correct';
    correctButton.className = 'feedback-button correct-button';
    
    const incorrectButton = document.createElement('button');
    incorrectButton.textContent = 'Incorrect';
    incorrectButton.className = 'feedback-button incorrect-button';
    
    buttonContainer.appendChild(correctButton);
    buttonContainer.appendChild(incorrectButton);
    playerInfoContainer.appendChild(buttonContainer);
    
    // Hide feedback buttons initially
    buttonContainer.style.display = 'none';

    // Create progress display
    const progressDisplay = document.createElement('div');
    progressDisplay.className = 'progress-display';
    progressDisplay.innerHTML = '0 of 0 players done';
    playerInfoContainer.appendChild(progressDisplay);

    const difficultySettings = {
        'easy': {
            filter: (player, index) => index < 100
        },
        'medium': {
            positions: ['QB', 'RB', 'WR', 'TE', 'FB'],
            filter: (player) => difficultySettings.medium.positions.includes(player.position)
        },
        'recent': {
            positions: ['QB', 'RB', 'WR', 'TE', 'FB'],
            filter: (player) => {
                const isSkillPosition = difficultySettings.recent.positions.includes(player.position);
                const isRecent = parseInt(player.draftYear) > 2020;
                return isSkillPosition && isRecent;
            }
        },
        'sicko': {
            filter: () => true // Show all players
        },
        'pirate': {
            filter: (player) => {
                console.log('Checking player for pirate mode:', player.name, 'Teams:', player.team);
                return player.team && player.team.toUpperCase().includes('TAM');
            }
        }
    };

    function createTeamLogoElement(teamCode) {
        const logoContainer = document.createElement('div');
        logoContainer.className = 'team-logo';
        const logoImg = document.createElement('img');
        logoImg.src = `logos/${teamCode}.png`;
        logoImg.alt = teamCode;
        logoImg.title = teamCode;
        logoContainer.appendChild(logoImg);
        return logoContainer;
    }

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
        console.log('Setting difficulty:', difficulty);
        // Update UI
        difficultySelect.value = difficulty;
        
        // Update filter
        currentDifficulty = difficulty;
        updateFilteredPlayers();
    }

    function shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    function updateProgress() {
        progressDisplay.innerHTML = `${currentProgress} of ${shuffledIndices.length} players done`;
    }

    function updateFilteredPlayers() {
        console.log('Updating filtered players for difficulty:', currentDifficulty);
        console.log('Available difficulty settings:', Object.keys(difficultySettings));
        console.log('Current filter:', difficultySettings[currentDifficulty]?.filter);
        filteredPlayers = players.filter(difficultySettings[currentDifficulty].filter);
        console.log('Filtered players count:', filteredPlayers.length);
        
        // Create new shuffled order
        shuffledIndices = shuffleArray(Array.from({length: filteredPlayers.length}, (_, i) => i));
        currentProgress = 0;
        currentPlayerIndex = shuffledIndices[0];
        updateProgress();
        displayPlayer(currentPlayerIndex);
    }

    function loadCollegeMatches() {
        return fetch('college_matches.csv')
            .then(response => response.text())
            .then(data => {
                const lines = data.split('\n');
                // Skip header row
                for (let i = 1; i < lines.length; i++) {
                    const [sportsrefName, logosName] = lines[i].split(',');
                    if (sportsrefName && logosName) {
                        collegeMatches.set(sportsrefName.trim(), logosName.trim());
                    }
                }
                console.log('Loaded college matches:', collegeMatches.size);
            })
            .catch(error => {
                console.error('Error loading college matches:', error);
            });
    }

    function getStandardizedCollegeName(college) {
        return collegeMatches.get(college) || college;
    }

    function loadPlayers() {
        console.log('Loading players from CSV');
        Promise.all([
            fetch('sportsref_download.csv').then(response => response.text()),
            loadCollegeMatches()
        ])
        .then(([playerData]) => {
            console.log('CSV data received, length:', playerData.length);
            const lines = playerData.split('\n');
            players = lines.slice(1).map(line => {
                const columns = parseCSVLine(line);
                const college = columns[7];
                return { 
                    name: columns[1],
                    college: college,
                    standardizedCollege: getStandardizedCollegeName(college),
                    team: columns[19],
                    position: columns[18],
                    proBowls: parseInt(columns[13]) || 0,
                    draftYear: columns[6],
                    draftRound: columns[4],
                    draftPick: columns[5],
                    draftTeam: columns[3]
                };
            });
            console.log('Players loaded:', players.length);
            updateFilteredPlayers();
        })
        .catch(error => {
            console.error('Error loading data:', error);
            playerNameElement.innerHTML = 'Error loading player data. Please try refreshing the page.';
        });
    }

    function displayPlayer(index) {
        console.log('Displaying player at index:', index);
        const player = filteredPlayers[index];
        if (!player) {
            console.error('No player found at index:', index);
            return;
        }
        console.log('Displaying player:', player.name);
        
        // Create team logos container
        const teamsContainer = document.createElement('div');
        teamsContainer.className = 'teams-container';
        
        // Add team logos
        const teamCodes = player.team.split(',').map(t => t.trim());
        teamCodes.forEach(teamCode => {
            const logoElement = createTeamLogoElement(teamCode);
            teamsContainer.appendChild(logoElement);
        });
            
        // Create draft info container
        const draftContainer = document.createElement('div');
        draftContainer.className = 'draft-container';
        
        if (player.draftYear !== 'NA') {
            const draftLogo = createTeamLogoElement(player.draftTeam);
            draftContainer.innerHTML = `Drafted: ${player.draftYear}, Round ${player.draftRound} Pick ${player.draftPick} by `;
            draftContainer.appendChild(draftLogo);
        } else {
            draftContainer.textContent = 'Undrafted';
        }
            
        playerNameElement.innerHTML = `
            <div class="player-header">
                <span class="player-name">${player.name}</span>
                <span class="player-position">${player.position}</span>
            </div>
            <div class="player-teams">Teams: </div>
            <div class="player-draft"></div>
            <div class="player-college">${player.standardizedCollege}</div>
        `;
        
        // Insert teams container into the teams div
        const teamsDiv = playerNameElement.querySelector('.player-teams');
        teamsDiv.appendChild(teamsContainer);
        
        // Insert draft container
        const draftDiv = playerNameElement.querySelector('.player-draft');
        draftDiv.appendChild(draftContainer);
        
        isShowingCollege = false;
        actionButton.style.display = 'block';
        buttonContainer.style.display = 'none';
        actionButton.textContent = "Where'd He Play In College?";
        console.log('Player display updated');
    }

    function updateTallyDisplay() {
        tallyDisplay.innerHTML = `Correct: ${correctCount} | Incorrect: ${incorrectCount}`;
    }

    function getNextPlayer() {
        console.log('Getting next player');
        currentProgress++;
        if (currentProgress >= shuffledIndices.length) {
            // If we've gone through all players, reshuffle
            shuffledIndices = shuffleArray(Array.from({length: filteredPlayers.length}, (_, i) => i));
            currentProgress = 0;
        }
        currentPlayerIndex = shuffledIndices[currentProgress];
        updateProgress();
        displayPlayer(currentPlayerIndex);
        // Show action button and hide feedback buttons
        actionButton.style.display = 'block';
        buttonContainer.style.display = 'none';
        isShowingCollege = false;
    }

    // Add event listener for difficulty select
    difficultySelect.addEventListener('change', (event) => {
        console.log('Difficulty changed to:', event.target.value);
        console.log('Current difficulty settings:', difficultySettings);
        setDifficulty(event.target.value);
    });

    // Add event listeners for feedback buttons
    correctButton.addEventListener('click', () => {
        console.log('Correct button clicked');
        correctCount++;
        updateTallyDisplay();
        getNextPlayer();
    });

    incorrectButton.addEventListener('click', () => {
        console.log('Incorrect button clicked');
        incorrectCount++;
        updateTallyDisplay();
        getNextPlayer();
    });

    actionButton.addEventListener('click', () => {
        console.log('Action button clicked, isShowingCollege:', isShowingCollege);
        if (!isShowingCollege) {
            const collegeDiv = playerNameElement.querySelector('.player-college');
            collegeDiv.classList.add('visible');
            
            // Hide action button and show feedback buttons
            actionButton.style.display = 'none';
            buttonContainer.style.display = 'flex';
            isShowingCollege = true;
            console.log('College revealed, feedback buttons shown');
        }
    });

    // Initialize the game
    console.log('Initializing game');
    loadPlayers();
});
