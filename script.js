player.addListener('player_state_changed', state => {
    if (state) {
        const trackName = state.track_window.current_track.name;
        const artistName = state.track_window.current_track.artists.map(artist => artist.name).join(', ');
        const albumArt = state.track_window.current_track.album.images[0]?.url;

        document.getElementById('track-title').textContent = trackName;
        document.getElementById('artist-name').textContent = artistName;
        if (albumArt) {
            document.getElementById('album-art').src = albumArt;
        } else {
            document.getElementById('album-art').src = 'default-image-url.jpg'; // Placeholder if no image is available
        }

        const playPauseButton = document.getElementById('play-pause');
        playPauseButton.innerHTML = state.paused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
    }
});
