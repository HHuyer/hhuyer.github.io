export class MusicPlayer {
    constructor() {
        this.audioElement = document.getElementById('background-music');
        if (!this.audioElement) {
            console.error('Background music audio element not found!');
            return;
        }

        this.playlist = [
            '/videoplayback (2).mp3',
            '/Relic - Minecraft Music Disc - Aaron Cherof.mp3',
            '/videoplayback (1).mp3',
            '/Otherside - Minecraft Music Disc - Lena Raine.mp3'
        ];
        this.currentTrackIndex = -1;
        this.isShuffled = false;
        
        // Start with a reasonable volume
        this.audioElement.volume = 1.0;

        this.audioElement.addEventListener('ended', () => {
            this.playNext();
        });

        this.shufflePlaylist();
    }

    shufflePlaylist() {
        for (let i = this.playlist.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.playlist[i], this.playlist[j]] = [this.playlist[j], this.playlist[i]];
        }
        this.isShuffled = true;
    }

    play() {
        if (!this.audioElement) return;

        if (this.audioElement.paused) {
            if (this.currentTrackIndex === -1) {
                this.playNext();
            } else {
                this.audioElement.play().catch(e => console.error("Audio play failed. User interaction might be required.", e));
            }
        }
    }

    playNext() {
        if (!this.audioElement) return;

        this.currentTrackIndex++;
        if (this.currentTrackIndex >= this.playlist.length) {
            this.shufflePlaylist();
            this.currentTrackIndex = 0;
        }
        this.audioElement.src = this.playlist[this.currentTrackIndex];
        this.audioElement.play().catch(e => console.error("Audio play failed. User interaction might be required.", e));
    }

    pause() {
        if (!this.audioElement) return;
        this.audioElement.pause();
    }
}