const searchButton = document.getElementById("search-button");
const searchInput = document.getElementById("search");

searchButton.addEventListener("click", () => {
    searchInput.hidden = !searchInput.hidden;

    if (!searchInput.hidden) {
        searchInput.focus();
    }
});

const notes = [
    "C", "C#", "D", "D#", "E", "F",
    "F#", "G", "G#", "A", "B♭", "B"
];

const majorScale = [0, 2, 4, 5, 7, 9, 11];

function getMajorScale(key) {
    const keyIndex = notes.indexOf(key);

    return majorScale.map(interval => {
        return notes[(keyIndex + interval) % notes.length];
    });
}

function convertChord(number, key) {
    const scale = getMajorScale(key);

    // Check for slash chord
    const slashChord = number.match(/^(.+)\/(.+)$/);

    if (slashChord) {
        const root = convertChord(slashChord[1], key);
        const bass = convertChord(slashChord[2], key);

        return `${root}/${bass}`;
    }

    const chord = number.match(/^([♯♭]?)([1-7])([♯♭]?)(.*)$/);

    if (!chord) {
        return number;
    }

    const accidentalBefore = chord[1];
    const degree = Number(chord[2]);
    const accidentalAfter = chord[3];
    const quality = chord[4];

    const accidental = accidentalAfter || accidentalBefore;

    let note = scale[degree - 1];
    let noteIndex = notes.indexOf(note);

    if (accidental === "♭") {
        noteIndex--;
    }

    if (accidental === "♯") {
        noteIndex++;
    }

    noteIndex = (noteIndex + notes.length) % notes.length;

    return notes[noteIndex] + quality;
}

function convertProgression(progression, key) {
    return progression
        .split("\n")
        .map(line => {
            return line
                .split(/\s+/)
                .map(chord => {
                    if (chord === "|") {
                        return "|";
                    }

                    if (chord.startsWith("(")) {
                        return chord;
                    }

                    return convertChord(chord, key);
                })
                .join(" ");
        })
        .join("\n");
}

let songs = [];
let displayMode = "numbers";
let currentSong = null;
let currentKey = null;

async function loadSongs() {
    const response = await fetch("songs.json");
    songs = await response.json();

    songs.sort((a, b) => a.title.localeCompare(b.title));

    displaySongList();
}

loadSongs();

function displaySongList(songArray = songs) {
    const songList = document.getElementById("song-list");

    songList.innerHTML = "";

    songArray
        .sort((a, b) => a.title.localeCompare(b.title))
        .forEach((song, index) => {
            const songElement = document.createElement("div");

            songElement.innerHTML = `
                <h2>${song.title}</h2>
                <p>${song.artist}</p>
            `;

            songElement.addEventListener("click", () => {
                showSong(index);
            });

            songList.appendChild(songElement);
        });
}

function showSong(index) {
    const song = songs[index];

    currentSong = song;
    currentKey = song.key;
    displayMode = "numbers";

    document.getElementById("key-selector").value = currentKey;

    document.getElementById("song-list").hidden = true;
    document.getElementById("song-viewer").hidden = false;

    document.getElementById("song-title").textContent = song.title;
    document.getElementById("song-artist").textContent = song.artist;

    document.getElementById("display-toggle").textContent = "Numbers";

    displaySections(song);
    displaySingerKeys(song);
}

function displaySingerKeys(song) {
    const singerKeys = document.getElementById("singer-keys");

    singerKeys.innerHTML = "";

    if (!song.singerKeys) {
        return;
    }

    song.singerKeys.forEach(singer => {
        const button = document.createElement("button");

        button.textContent = `${singer.name}: ${singer.key}`;

        button.addEventListener("click", () => {
            currentKey = singer.key;

            document.getElementById("key-selector").value = currentKey;

            if (displayMode === "chords") {
                displaySections(currentSong);
            }
        });

        singerKeys.appendChild(button);
    });
}

const keySelector = document.getElementById("key-selector");

keySelector.addEventListener("change", () => {
    currentKey = keySelector.value;

    displaySections(currentSong);
});

function displaySections(song) {
    const sections = document.getElementById("song-sections");

    sections.innerHTML = "";

    song.sections.forEach(section => {
        const sectionElement = document.createElement("div");

        const progression = displayMode === "numbers"
            ? section.progression
            : convertProgression(section.progression, currentKey);

        sectionElement.innerHTML = `
            <h4>${section.name}</h4>
            <pre>${progression}</pre>
        `;

        sections.appendChild(sectionElement);
    });
}

const backButton = document.getElementById("back-button");

backButton.addEventListener("click", () => {
    document.getElementById("song-viewer").hidden = true;
    document.getElementById("song-list").hidden = false;
});

const displayToggle = document.getElementById("display-toggle");

displayToggle.addEventListener("click", () => {
    if (displayMode === "numbers") {
        displayMode = "chords";
    } else {
        displayMode = "numbers";
    }

    displayToggle.textContent = displayMode === "numbers"
        ? "Numbers"
        : "Chords";

    displaySections(currentSong);
});

searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.toLowerCase().trim();

    const songList = document.getElementById("song-list");

    const filteredSongs = songs.filter(song => {
        return (
            song.title.toLowerCase().includes(searchTerm) ||
            song.artist.toLowerCase().includes(searchTerm)
        );
    });

    displaySongList(filteredSongs);
});