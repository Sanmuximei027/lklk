/**
 * listen.js - Monster Siren 风格音乐播放器
 * 完整交互逻辑：专辑网格、详情页、播放器、播放列表、频谱可视化
 */
document.addEventListener('DOMContentLoaded', () => {
    // ===== DOM =====
    const $ = id => document.getElementById(id);
    const audio = $('audioPlayer');
    const albumsView = $('albumsView');
    const detailView = $('detailView');
    const albumCards = document.querySelectorAll('.ms-album-card');

    // 详情页
    const detailBg = $('detailBg');
    const detailCover = $('detailCover');
    const detailTitle = $('detailTitle');
    const detailSubtitle = $('detailSubtitle');
    const detailArtist = $('detailArtist');
    const detailDesc = $('detailDesc');
    const detailPlayBtn = $('detailPlayBtn');
    const backToAlbums = $('backToAlbums');
    const prevAlbum = $('prevAlbum');
    const nextAlbum = $('nextAlbum');
    const detailWaveform = $('detailWaveform');

    // 播放器
    const msPlayer = $('msPlayer');
    const playPauseBtn = $('playPauseBtn');
    const playIcon = $('playIcon');
    const progressContainer = $('progressContainer');
    const progressBar = $('progressBar');
    const progressThumb = $('progressThumb');
    const currentTimeEl = $('currentTime');
    const durationEl = $('duration');
    const playerThumb = $('playerThumb');
    const playerTrackName = $('playerTrackName');
    const playerTrackArtist = $('playerTrackArtist');
    const prevBtn = $('prevBtn');
    const nextBtn = $('nextBtn');
    const modeBtn = $('modeBtn');
    const volBtn = $('volBtn');
    const volumeSlider = $('volumeSlider');
    const volumeBar = $('volumeBar');
    const marqueeText = $('marqueeText');

    // 播放列表
    const playlistBtn = $('playlistBtn');
    const playlistPanel = $('playlistPanel');
    const playlistOverlay = $('playlistOverlay');
    const playlistClose = $('playlistClose');
    const playlistList = $('playlistList');

    // 频谱
    const visualizerCanvas = $('visualizerCanvas');
    const visCtx = visualizerCanvas.getContext('2d');

    // 搜索
    const searchInput = $('searchInput');

    // ===== 状态 =====
    let tracks = [];
    let currentIndex = -1;
    let isPlaying = false;
    let playMode = 'loop'; // loop, single, shuffle
    let audioContext = null;
    let analyser = null;
    let sourceNode = null;
    let visAnimId = null;
    let waveAnimId = null;

    // ===== 初始化曲目列表 =====
    albumCards.forEach((card, i) => {
        tracks.push({
            index: i,
            title: card.dataset.title,
            subtitle: card.dataset.subtitle,
            artist: card.dataset.artist,
            src: card.dataset.src,
            cover: card.dataset.cover,
            desc: card.dataset.desc
        });
    });

    // 构建播放列表
    function buildPlaylist() {
        playlistList.innerHTML = '';
        tracks.forEach((t, i) => {
            const li = document.createElement('li');
            li.dataset.index = i;
            li.innerHTML = `
                <img src="${t.cover}" alt="${t.title}">
                <div class="track-info">
                    <span class="track-name">${t.title}</span>
                    <span class="track-sub">${t.subtitle} · ${t.artist}</span>
                </div>
                <span class="track-eq">${currentIndex === i && isPlaying ? '<i class="fas fa-signal"></i>' : ''}</span>
            `;
            if (currentIndex === i) li.classList.add('playing');
            li.addEventListener('click', () => playTrack(i));
            playlistList.appendChild(li);
        });
    }
    buildPlaylist();

    // ===== 专辑卡片点击 -> 打开详情 =====
    albumCards.forEach(card => {
        card.addEventListener('click', () => {
            const idx = parseInt(card.dataset.index);
            showDetail(idx);
        });
    });

    function showDetail(idx) {
        const t = tracks[idx];
        if (!t) return;
        currentIndex = idx;

        detailBg.style.backgroundImage = `url('${t.cover}')`;
        detailCover.src = t.cover;
        detailTitle.textContent = t.title;
        detailSubtitle.textContent = t.subtitle;
        detailArtist.textContent = t.artist;
        detailDesc.textContent = t.desc;

        startDetailWave();

        albumsView.style.display = 'none';
        detailView.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    backToAlbums.addEventListener('click', () => {
        detailView.classList.remove('active');
        albumsView.style.display = '';
    });

    prevAlbum.addEventListener('click', () => {
        let idx = currentIndex - 1;
        if (idx < 0) idx = tracks.length - 1;
        showDetail(idx);
    });

    nextAlbum.addEventListener('click', () => {
        let idx = currentIndex + 1;
        if (idx >= tracks.length) idx = 0;
        showDetail(idx);
    });

    // 详情页播放按钮
    detailPlayBtn.addEventListener('click', () => {
        playTrack(currentIndex);
    });

    // ===== 播放控制 =====
    function playTrack(idx) {
        if (idx < 0 || idx >= tracks.length) return;
        currentIndex = idx;
        const t = tracks[idx];

        audio.src = t.src;
        audio.play().catch(() => {});

        // 更新 UI
        playerThumb.src = t.cover;
        playerTrackName.textContent = t.title;
        playerTrackArtist.textContent = t.artist;
        marqueeText.textContent = t.title + ' - ' + t.subtitle;
        msPlayer.classList.add('visible');

        // 详情页如果打开，更新
        if (detailView.classList.contains('active')) {
            showDetail(idx);
        }

        buildPlaylist();
        initAudioContext();
    }

    function togglePlay() {
        if (!audio.src) return;
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play().catch(() => {});
        }
    }

    playPauseBtn.addEventListener('click', togglePlay);

    audio.addEventListener('play', () => {
        isPlaying = true;
        playIcon.className = 'fas fa-pause';
        buildPlaylist();
        startVisualizer();
    });

    audio.addEventListener('pause', () => {
        isPlaying = false;
        playIcon.className = 'fas fa-play';
        buildPlaylist();
    });

    audio.addEventListener('ended', () => {
        switch (playMode) {
            case 'single':
                audio.currentTime = 0;
                audio.play().catch(() => {});
                break;
            case 'shuffle':
                let ri;
                do { ri = Math.floor(Math.random() * tracks.length); } while (ri === currentIndex && tracks.length > 1);
                playTrack(ri);
                break;
            default: // loop
                playTrack((currentIndex + 1) % tracks.length);
        }
    });

    // 进度更新
    audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        const pct = (audio.currentTime / audio.duration) * 100;
        progressBar.style.width = pct + '%';
        progressThumb.style.left = pct + '%';
        currentTimeEl.textContent = fmt(audio.currentTime);
        durationEl.textContent = fmt(audio.duration);
    });

    audio.addEventListener('loadedmetadata', () => {
        durationEl.textContent = fmt(audio.duration);
    });

    // 点击进度条
    progressContainer.addEventListener('click', e => {
        if (!audio.duration) return;
        const rect = progressContainer.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        audio.currentTime = pct * audio.duration;
    });

    // 上一曲 / 下一曲
    prevBtn.addEventListener('click', () => {
        if (tracks.length === 0) return;
        let idx = currentIndex - 1;
        if (idx < 0) idx = tracks.length - 1;
        playTrack(idx);
    });
    nextBtn.addEventListener('click', () => {
        if (tracks.length === 0) return;
        playTrack((currentIndex + 1) % tracks.length);
    });

    // 播放模式
    modeBtn.addEventListener('click', () => {
        const modes = ['loop', 'single', 'shuffle'];
        const icons = ['fa-redo', 'fa-exchange-alt', 'fa-random'];
        const i = modes.indexOf(playMode);
        const next = (i + 1) % modes.length;
        playMode = modes[next];
        modeBtn.querySelector('i').className = 'fas ' + icons[next];
    });

    // 音量
    audio.volume = 0.8;
    volumeBar.style.width = '80%';

    volumeSlider.addEventListener('click', e => {
        const rect = volumeSlider.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        audio.volume = pct;
        volumeBar.style.width = (pct * 100) + '%';
    });

    volBtn.addEventListener('click', () => {
        if (audio.volume > 0) {
            audio.dataset.prevVol = audio.volume;
            audio.volume = 0;
            volumeBar.style.width = '0%';
            volBtn.querySelector('i').className = 'fas fa-volume-mute';
        } else {
            audio.volume = parseFloat(audio.dataset.prevVol || 0.8);
            volumeBar.style.width = (audio.volume * 100) + '%';
            volBtn.querySelector('i').className = 'fas fa-volume-up';
        }
    });

    // ===== 播放列表面板 =====
    playlistBtn.addEventListener('click', () => {
        playlistPanel.classList.toggle('open');
        playlistOverlay.classList.toggle('open');
    });
    playlistClose.addEventListener('click', closePlaylist);
    playlistOverlay.addEventListener('click', closePlaylist);

    function closePlaylist() {
        playlistPanel.classList.remove('open');
        playlistOverlay.classList.remove('open');
    }

    // ===== 搜索 =====
    searchInput.addEventListener('input', () => {
        const q = searchInput.value.trim().toLowerCase();
        albumCards.forEach(card => {
            const title = (card.dataset.title + card.dataset.subtitle).toLowerCase();
            card.style.display = q === '' || title.includes(q) ? '' : 'none';
        });
    });

    // ===== 频谱可视化 =====
    function initAudioContext() {
        if (audioContext) return;
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 128;
            sourceNode = audioContext.createMediaElementSource(audio);
            sourceNode.connect(analyser);
            analyser.connect(audioContext.destination);
        } catch (e) {
            console.warn('AudioContext not available', e);
        }
    }

    function startVisualizer() {
        if (visAnimId) cancelAnimationFrame(visAnimId);
        if (!analyser) {
            drawFakeVisualizer();
            return;
        }
        const bufLen = analyser.frequencyBinCount;
        const dataArr = new Uint8Array(bufLen);

        function draw() {
            visAnimId = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArr);

            const W = visualizerCanvas.width;
            const H = visualizerCanvas.height;
            visCtx.clearRect(0, 0, W, H);

            const barW = 2;
            const gap = 1.5;
            const total = Math.floor(W / (barW + gap));

            for (let i = 0; i < total; i++) {
                const idx = Math.floor((i / total) * bufLen);
                const val = dataArr[idx] / 255;
                const bH = Math.max(1, val * H * 0.85);
                const x = i * (barW + gap);
                const y = (H - bH) / 2;

                visCtx.fillStyle = `rgba(255,255,255,${0.3 + val * 0.55})`;
                visCtx.fillRect(x, y, barW, bH);
            }
        }
        draw();
    }

    function drawFakeVisualizer() {
        const W = visualizerCanvas.width;
        const H = visualizerCanvas.height;
        const barW = 2;
        const gap = 1.5;
        const total = Math.floor(W / (barW + gap));

        function draw() {
            visAnimId = requestAnimationFrame(draw);
            visCtx.clearRect(0, 0, W, H);
            for (let i = 0; i < total; i++) {
                const val = isPlaying ? (Math.sin(Date.now() / 200 + i * 0.3) * 0.5 + 0.5) * 0.7 + 0.1 : 0.08;
                const bH = Math.max(1, val * H * 0.85);
                const x = i * (barW + gap);
                const y = (H - bH) / 2;
                visCtx.fillStyle = `rgba(255,255,255,${0.15 + val * 0.4})`;
                visCtx.fillRect(x, y, barW, bH);
            }
        }
        draw();
    }

    // 动态波形（详情页 - Monster Siren 风格多线交织）
    function startDetailWave() {
        if (waveAnimId) cancelAnimationFrame(waveAnimId);
        const canvas = detailWaveform;
        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const H = canvas.height;
        const mid = H / 2;

        // 定义5条波形线，各有不同参数
        const waveLines = [
            { freq: 0.008, speed: 0.8, amp: 18, phase: 0,    opacity: 0.45, width: 1.5 },
            { freq: 0.012, speed: 1.2, amp: 14, phase: 1.2,  opacity: 0.30, width: 1.2 },
            { freq: 0.018, speed: 1.8, amp: 10, phase: 2.5,  opacity: 0.22, width: 1.0 },
            { freq: 0.006, speed: 0.5, amp: 22, phase: 3.8,  opacity: 0.18, width: 0.8 },
            { freq: 0.022, speed: 2.2, amp: 7,  phase: 5.0,  opacity: 0.14, width: 0.7 },
        ];

        // 每条线的平滑缓存
        const smoothedLines = waveLines.map(() => new Float32Array(W).fill(0));

        // 散布粒子
        const particles = [];
        for (let i = 0; i < 30; i++) {
            particles.push({
                x: Math.random() * W,
                baseY: mid + (Math.random() - 0.5) * H * 0.5,
                r: Math.random() * 1.8 + 0.5,
                opacity: Math.random() * 0.25 + 0.05,
                drift: Math.random() * 0.3 + 0.1,
                phase: Math.random() * Math.PI * 2,
            });
        }

        function draw() {
            waveAnimId = requestAnimationFrame(draw);
            ctx.clearRect(0, 0, W, H);
            const t = Date.now() / 1000;
            const ampMult = isPlaying ? 1.0 : 0.2;

            // 获取音频数据（如有）
            let freqData = null;
            if (analyser && isPlaying) {
                const bufLen = analyser.frequencyBinCount;
                freqData = new Uint8Array(bufLen);
                analyser.getByteFrequencyData(freqData);
            }

            // 绘制每条波形线
            waveLines.forEach((line, li) => {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(255,255,255,${line.opacity * (isPlaying ? 1 : 0.6)})`;
                ctx.lineWidth = line.width;

                for (let x = 0; x < W; x++) {
                    let target;
                    // 基础多谐波合成
                    const base =
                        Math.sin(x * line.freq + t * line.speed + line.phase) * line.amp +
                        Math.sin(x * line.freq * 2.3 + t * line.speed * 0.7 + line.phase * 1.5) * line.amp * 0.4 +
                        Math.sin(x * line.freq * 0.5 + t * line.speed * 1.3 + line.phase * 0.8) * line.amp * 0.55;

                    // 乘以音频能量
                    if (freqData) {
                        const dataIdx = Math.floor((x / W) * freqData.length);
                        const energy = freqData[dataIdx] / 255;
                        target = base * (0.3 + energy * 1.2) * ampMult;
                    } else {
                        target = base * ampMult;
                    }

                    // 平滑插值
                    smoothedLines[li][x] += (target - smoothedLines[li][x]) * 0.12;
                    const y = mid + smoothedLines[li][x];

                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            });

            // 散点粒子
            particles.forEach(p => {
                const py = p.baseY + Math.sin(t * p.drift + p.phase) * 8;
                const pOpacity = p.opacity * (isPlaying ? 1 : 0.4);
                ctx.fillStyle = `rgba(255,255,255,${pOpacity})`;
                ctx.beginPath();
                ctx.arc(p.x, py, p.r, 0, Math.PI * 2);
                ctx.fill();
            });

            // 进度指示器圆点 (Monster Siren 风格：带空心环 + 发光)
            const progress = audio.duration ? (audio.currentTime / audio.duration) : 0;
            const dotX = Math.max(10, progress * W);
            // 圆点Y跟随第一条波形线
            const dotY = mid + smoothedLines[0][Math.min(Math.floor(dotX), W - 1)];

            // 外层光晕
            const glowR = isPlaying ? 14 : 10;
            const grad = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, glowR);
            grad.addColorStop(0, `rgba(255,255,255,${isPlaying ? 0.12 : 0.06})`);
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(dotX, dotY, glowR, 0, Math.PI * 2);
            ctx.fill();

            // 空心环
            ctx.beginPath();
            ctx.arc(dotX, dotY, isPlaying ? 6 : 4.5, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255,255,255,${isPlaying ? 0.7 : 0.35})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // 实心小圆心
            ctx.beginPath();
            ctx.arc(dotX, dotY, isPlaying ? 2.5 : 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${isPlaying ? 0.85 : 0.4})`;
            ctx.fill();
        }
        draw();
    }

    // ===== 工具函数 =====
    function fmt(s) {
        if (isNaN(s) || !isFinite(s)) return '00:00';
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m < 10 ? '0' : ''}${m}:${sec < 10 ? '0' : ''}${sec}`;
    }

    // ===== 键盘快捷键 =====
    document.addEventListener('keydown', e => {
        if (e.target.tagName === 'INPUT') return;
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                togglePlay();
                break;
            case 'ArrowLeft':
                if (audio.duration) audio.currentTime = Math.max(0, audio.currentTime - 5);
                break;
            case 'ArrowRight':
                if (audio.duration) audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
                break;
            case 'Escape':
                if (detailView.classList.contains('active')) {
                    detailView.classList.remove('active');
                    albumsView.style.display = '';
                }
                break;
        }
    });

    // 启动假频谱
    drawFakeVisualizer();
});
