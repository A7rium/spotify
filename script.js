const clientId = 'cdae67bfd8c542f0980cf22d8f30ec55'; // Your Spotify Client ID
const redirectUri = 'https://<your-github-username>.github.io/<your-repository-name>/'; // Update this with your GitHub Pages URL

const scopes = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-modify-playback-state',
    'user-read-playback-state',
    'playlist-read-private',
    'playlist-read-collaborative'
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
                document.getElementById('track-title').textContent = trackName;
                const playPauseButton = document.getElementById('play-pause');
                playPauseButton.textContent = state.paused ? 'Play' : 'Pause';
            }
        });

        // Ready
        player.addListener('ready', ({ device_id }) => {
            console.log('Ready with Device ID', device_id);
            play(device_id, token);
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

        function play(device_id, token) {
            fetch(`https://api.spotify.com/v1/me/player/play?device_id=${device_id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    context_uri: 'spotify:playlist:7uMdU7HvGCIy7IBEk8ZX4U' // Replace with your playlist URI
                }),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });
        }
    };
}
