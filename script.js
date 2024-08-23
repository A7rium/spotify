const clientId = 'cdae67bfd8c542f0980cf22d8f30ec55'; // Your Spotify Client ID
const redirectUri = 'https://a7rium.github.io/spotify/'; // Your GitHub Pages URL
const scopes = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-modify-playback-state',
    'user-read-playback-state',
    'playlist-read-private',
    'playlist-read-collaborative'
];

const recordLabels = [
    'Night Moon Records',
    'Aurorafields Records',
    'SonicBass Records',
    'DWNSMPL Records',
    'Sanctimony Records',
    'BeNaam Music',
    'Spearhawk Records',
    'Autsome Records',
    'BundooDoof Records',
    'Kozmo Records'
];

const distributors = ['Label Worx', 'Vydia'];

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
    window.onSpotifyWebPlaybackSDKReady = () => {
        const player = new Spotify.Player({
            name: 'Web Playback SDK Player',
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

                document.getElementById('track-title').textContent = trackName || "Spotify Player & RT8MG";
                if (albumArt) {
                    document.getElementById('album-art').src = albumArt;
                } else {
                    document.getElementById('album-art').src = 'https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg'; // Fallback to the Spotify logo
                }

                const playPauseButton = document.getElementById('play-pause');
                playPauseButton.innerHTML = state.paused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
            }
        });

        // Ready
        player.addListener('ready', ({ device_id }) => {
            console.log('Ready with Device ID', device_id);
            playFromLabelCatalog(device_id, token);
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

        // Volume control
        document.getElementById('volume').addEventListener('input', function() {
            const volume = this.value / 100;
            player.setVolume(volume).then(() => {
                console.log(`Volume set to ${volume}`);
            });
        });
    };
}

function playFromLabelCatalog(device_id, token) {
    const query = recordLabels.map(label => `label:"${label}"`).join(' OR ');
    const distributorQuery = distributors.map(dist => `distributed_by:"${dist}"`).join(' OR ');

    fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)} AND ${encodeURIComponent(distributorQuery)}&type=track&limit=50`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.tracks.items.length > 0) {
            const uris = data.tracks.items.map(track => track.uri);
            fetch(`https://api.spotify.com/v1/me/player/play?device_id=${device_id}`, {
                method: 'PUT',
                body: JSON.stringify({ uris }),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });
        } else {
            console.log('No tracks found for the specified record labels and distributors. Falling back to default playlist.');
            playDefaultPlaylist(device_id, token);
        }
    })
    .catch(error => {
        console.error('Error fetching tracks:', error);
        playDefaultPlaylist(device_id, token); // Fallback in case of an error
    });
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
        console.log('Fallback playlist is playing.');
    })
    .catch(error => console.error('Error playing fallback playlist:', error));
}
git add .
git commit -m "Updated Spotify player implementation"
git push origin main
