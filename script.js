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
            console.log('No tracks found for the specified record labels and distributors.');
        }
    })
    .catch(error => console.error('Error fetching tracks:', error));
}
