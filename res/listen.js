document.addEventListener('DOMContentLoaded', () => {
    // ========== DOM元素缓存 ==========
    const DOM = {
        audioPlayer: document.getElementById('audioPlayer'),
        playPauseBtn: document.getElementById('playPauseBtn'),
        playIcon: document.getElementById('playPauseBtn').querySelector('i'),
        progressBar: document.getElementById('progressBar'),
        progressContainer: document.getElementById('progressContainer'),
        currentTimeEl: document.getElementById('currentTime'),
        durationEl: document.getElementById('duration'),
        currentTrackTitle: document.getElementById('currentTrackTitle'),
        musicNodes: document.querySelectorAll('.music-node')
    };

    let isPlaying = false;

    // 格式化时间 (秒 -> mm:ss)
    function formatTime(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    }

    // 播放/暂停切换
    function togglePlay() {
        if (DOM.audioPlayer.src) {
            if (isPlaying) {
                DOM.audioPlayer.pause();
            } else {
                DOM.audioPlayer.play();
            }
        } else {
            alert("请先选择一首音乐！");
        }
    }

    // 更新播放状态图标
    function updatePlayIcon() {
        if (isPlaying) {
            DOM.playIcon.classList.remove('fa-play');
            DOM.playIcon.classList.add('fa-pause');
        } else {
            DOM.playIcon.classList.remove('fa-pause');
            DOM.playIcon.classList.add('fa-play');
        }
    }

    // 播放器事件监听
    DOM.playPauseBtn.addEventListener('click', togglePlay);

    DOM.audioPlayer.addEventListener('play', () => {
        isPlaying = true;
        updatePlayIcon();
    });

    DOM.audioPlayer.addEventListener('pause', () => {
        isPlaying = false;
        updatePlayIcon();
    });

    DOM.audioPlayer.addEventListener('timeupdate', (e) => {
        const { duration, currentTime } = e.srcElement;
        if (duration) {
            const progressPercent = (currentTime / duration) * 100;
            DOM.progressBar.style.width = `${progressPercent}%`;
            DOM.currentTimeEl.innerText = formatTime(currentTime);
            DOM.durationEl.innerText = formatTime(duration);
        }
    });

    // 点击进度条跳转
    DOM.progressContainer.addEventListener('click', (e) => {
        const width = DOM.progressContainer.clientWidth;
        const clickX = e.offsetX;
        const duration = DOM.audioPlayer.duration;
        if (duration) {
            DOM.audioPlayer.currentTime = (clickX / width) * duration;
        }
    });

    // 点击音乐节点播放 - 使用事件委托
    document.addEventListener('click', (e) => {
        const musicNode = e.target.closest('.music-node');
        if (!musicNode) return;
        
        const src = musicNode.getAttribute('data-src');
        const title = musicNode.getAttribute('data-title');
        
        if (DOM.audioPlayer.src.includes(src) && isPlaying) {
            togglePlay(); // 如果点击当前正在播放的，则暂停
        } else {
            DOM.audioPlayer.src = src;
            DOM.currentTrackTitle.innerText = title;
            DOM.audioPlayer.play();
        }
    });
});
