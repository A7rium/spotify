import butterchurn from 'butterchurn';
import butterchurnPresets from 'butterchurn-presets';

const clientId = 'cdae67bfd8c542f0980cf22d8f30ec55'; // Your Spotify Client ID
const redirectUri = 'https://a7rium.github.io/spotify/'; // Your GitHub Pages URL
const scopes = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-modify-playback-state',
    'user-read-playback-state',
    'playlist-read-private',
    'playlist-modify-public',
    'playlist-modify-private'
];

const authEndpoint = 'https://accounts.spotify.com/authorize';

const hash = window.location.hash
    .substring(1)
    .split('&')
    .reduce((initial, item) => {
        if (item) {
            const parts = item.split('=');
            initial[parts[0]] = decodeURIComponent(parts[1]);
        }
        return initial;
    }, {});

window.location.hash = '';

let _token = hash.access_token;

if (!_token) {
    window.location = `${authEndpoint}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes.join(
        '%20'
    )}&response_type=token&show_dialog=true`;
} else {
    initSpotifyPlayer(_token);
}

function initSpotifyPlayer(token) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const canvas = document.getElementById('visualizer');
    const visualizer = butterchurn.createVisualizer(audioContext, canvas, {
        width: canvas.width,
        height: canvas.height
    });

    // Load Butterchurn preset
    const presets = butterchurnPresets.getPresets();
    const preset = presets['Flexi, martin + geiss - dedicated to the sherwin maxawow'];
    visualizer.loadPreset(preset, 0.0);

    window.onSpotifyWebPlaybackSDKReady = () => {
        const player = new Spotify.Player({
            name: 'Spotify Player by RT8MG',
            getOAuthToken: cb => { cb(token); },
            volume: 0.5
        });

        // Error handling
        player.addListener('initialization_error', ({ message }) => { console.error(message); });
        player.addListener('authentication_error', ({ message }) => { console.error(message); });
        player.addListener('account_error', ({ message }) => { console.error(message); });
        player.addListener('playback_error', ({ message }) => { console.error(message); });

        // Playback status updates
        player.addListener('player_state_changed', state => {
            if (state) {
                const trackName = state.track_window.current_track.name;
                const albumArt = state.track_window.current_track.album.images[0]?.url;

                document.getElementById('track-title').textContent = trackName || "Spotify Player by RT8MG";
                const albumArtElement = document.getElementById('album-art');
                if (albumArt) {
                    albumArtElement.src = albumArt;
                } else {
                    albumArtElement.src = 'https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg'; // Fallback to the Spotify logo
                }

                const playPauseButton = document.getElementById('play-pause');
                playPauseButton.innerHTML = state.paused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';

                if (!state.paused) {
                    const audioElement = new Audio(state.track_window.current_track.preview_url);
                    const audioNode = audioContext.createMediaElementSource(audioElement);
                    visualizer.connectAudio(audioNode);
                    audioElement.play();
                }
            }
        });

        // Ready
        player.addListener('ready', ({ device_id }) => {
            console.log('Ready with Device ID', device_id);
            playDefaultPlaylist(device_id, token);
            loadPlaylistCatalog(token); // Load catalog after player is ready
        });

        // Not Ready
        player.addListener('not_ready', ({ device_id }) => {
            console.log('Device ID has gone offline', device_id);
        });

        // Connect the player
        player.connect();

        // Playback controls
        document.getElementById('play-pause').addEventListener('click', () => {
            player.togglePlay();
        });

        document.getElementById('next').addEventListener('click', () => {
            player.nextTrack();
        });

        document.getElementById('prev').addEventListener('click', () => {
            player.previousTrack();
        });

        // Catalog menu
        document.getElementById('catalog-menu').addEventListener('click', () => {
            document.getElementById('catalog').classList.remove('hidden');
        });

        // Close catalog
        document.getElementById('close-catalog').addEventListener('click', () => {
            document.getElementById('catalog').classList.add('hidden');
        });
    };
}

function playDefaultPlaylist(device_id, token) {
    const playlistUri = 'spotify:playlist:7uMdU7HvGCIy7IBEk8ZX4U'; // Your fallback playlist URI
    fetch(`https://api.spotify.com/v1/me/player/play?device_id=${device_id}`, {
        method: 'PUT',
        body: JSON.stringify({
            context_uri: playlistUri
        }),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    })
    .then(() => {
        console.log('Default playlist is playing.');
    })
    .catch(error => console.error('Error playing default playlist:', error));
}

function loadPlaylistCatalog(token) {
    const playlistId = '7uMdU7HvGCIy7IBEk8ZX4U'; // Your playlist ID
    fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const catalogList = document.getElementById('catalog-list');
        catalogList.innerHTML = '';
        data.items.forEach(item => {
            const track = item.track;
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <img src="${track.album.images[0].url}" alt="Album Art">
                <div>
                    <h4>${track.name}</h4>
                    <p>${track.artists.map(artist => artist.name).join(', ')}</p>
                </div>
            `;
            listItem.onclick = () => playSpecificTrack(track.uri);
            catalogList.appendChild(listItem);
        });
    })
    .catch(error => console.error('Error loading playlist catalog:', error));
}

function playSpecificTrack(trackUri) {
    fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({ uris: [trackUri] }),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${_token}`
        },
    }).catch(error => console.error('Error playing specific track:', error));
}
