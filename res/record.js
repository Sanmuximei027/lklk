// record.js - 你的唱片柜交互逻辑

// ========== 获取DOM元素 ==========
const bgLayer = document.getElementById('bgLayer');
const bgImage = document.getElementById('bgImage');
const mainUI = document.getElementById('mainUI');
const audioPlayer = document.getElementById('audioPlayer');
const playBtn = document.getElementById('playBtn');
const stopBtn = document.getElementById('stopBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const loopBtn = document.getElementById('loopBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const volumeSlider = document.getElementById('volumeSlider');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const composerNameEl = document.getElementById('composerName');
const trackTitleEl = document.getElementById('trackTitle');
const trackItems = document.querySelectorAll('.track-item');
const pageBtns = document.querySelectorAll('.page-btn');

// ========== 状态变量 ==========
let isPlaying = false;
let currentTrackIndex = -1;
let isLooping = false;
let isShuffling = false;
let mouseTimer = null;
let isMouseIdle = false;

// ========== 曲目数据（请在此修改作曲家信息） ==========
const trackData = [
    { composer: "贝多芬" },
    { composer: "维瓦尔第" },
    { composer: "帕赫贝尔" },
    { composer: "贝多芬" },
    { composer: "柴可夫斯基" },
    { composer: "贝多芬" },
    { composer: "小约翰·施特劳斯" },
    { composer: "莫扎特" },
    { composer: "巴赫" },
    { composer: "贝多芬" },
    { composer: "舒曼" },
    { composer: "里姆斯基-科萨科夫" },
    { composer: "舒伯特" },
    { composer: "勃拉姆斯" },
    { composer: "小约翰·施特劳斯" },
    { composer: "李斯特" },
    { composer: "肖邦" },
    { composer: "肖邦" },
    { composer: "肖邦" },
    { composer: "肖邦" },
    { composer: "李斯特" },
    { composer: "拉威尔" },
    { composer: "柴可夫斯基" },
    { composer: "柴可夫斯基" }
];

// ========== 初始化 ==========
function init() {
    // 设置初始音量
    audioPlayer.volume = volumeSlider.value / 100;
    
    // 绑定曲目点击事件
    trackItems.forEach((item, index) => {
        item.addEventListener('click', () => playTrack(index));
    });
    
    // 绑定控制按钮事件
    playBtn.addEventListener('click', togglePlay);
    stopBtn.addEventListener('click', stopTrack);
    prevBtn.addEventListener('click', playPrev);
    nextBtn.addEventListener('click', playNext);
    loopBtn.addEventListener('click', toggleLoop);
    shuffleBtn.addEventListener('click', toggleShuffle);
    
    // 音量控制
    volumeSlider.addEventListener('input', () => {
        audioPlayer.volume = volumeSlider.value / 100;
    });
    
    // 进度条点击
    progressContainer.addEventListener('click', seekTrack);
    
    // 音频事件
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('loadedmetadata', updateDuration);
    audioPlayer.addEventListener('ended', onTrackEnded);
    
    // 鼠标移动检测
    document.addEventListener('mousemove', onMouseMove);
    
    // 页码切换
    pageBtns.forEach(btn => {
        btn.addEventListener('click', () => switchPage(btn.dataset.page));
    });
}

// ========== 播放曲目 ==========
function playTrack(index) {
    // 移除之前的active状态
    trackItems.forEach(item => item.classList.remove('active'));
    
    // 设置当前曲目
    currentTrackIndex = index;
    const trackItem = trackItems[index];
    trackItem.classList.add('active');
    
    // 获取音频和CG路径
    const audioSrc = trackItem.dataset.audio;
    const cgSrc = trackItem.dataset.cg;
    const trackName = trackItem.querySelector('.track-name').textContent;
    
    // 播放音频
    audioPlayer.src = audioSrc;
    audioPlayer.play();
    isPlaying = true;
    playBtn.textContent = '⏸';
    
    // 更新曲目信息
    trackTitleEl.textContent = trackName;
    composerNameEl.textContent = trackData[index]?.composer || '--';
    
    // 切换背景CG（渐变效果）
    changeBgCG(cgSrc);
}

// ========== 切换背景CG ==========
function changeBgCG(cgSrc) {
    // 先淡出
    bgImage.classList.remove('show');
    
    // 等淡出完成后切换图片
    setTimeout(() => {
        bgImage.src = cgSrc;
        bgImage.onload = () => {
            bgImage.classList.add('show');
        };
    }, 500);
}

// ========== 播放/暂停切换 ==========
function togglePlay() {
    if (currentTrackIndex === -1) return;
    
    if (isPlaying) {
        audioPlayer.pause();
        playBtn.textContent = '▶';
    } else {
        audioPlayer.play();
        playBtn.textContent = '⏸';
    }
    isPlaying = !isPlaying;
}

// ========== 停止播放 ==========
function stopTrack() {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    isPlaying = false;
    playBtn.textContent = '▶';
    
    // 清除CG
    bgImage.classList.remove('show');
    
    // 清除曲目选中状态
    trackItems.forEach(item => item.classList.remove('active'));
    currentTrackIndex = -1;
    
    // 重置信息
    trackTitleEl.textContent = '--';
    composerNameEl.textContent = '--';
    currentTimeEl.textContent = '0:00';
    totalTimeEl.textContent = '0:00';
    progressBar.style.width = '0%';
}

// ========== 上一曲 ==========
function playPrev() {
    if (trackItems.length === 0) return;
    
    let newIndex;
    if (currentTrackIndex <= 0) {
        newIndex = trackItems.length - 1;
    } else {
        newIndex = currentTrackIndex - 1;
    }
    playTrack(newIndex);
}

// ========== 下一曲 ==========
function playNext() {
    if (trackItems.length === 0) return;
    
    let newIndex;
    if (isShuffling) {
        newIndex = Math.floor(Math.random() * trackItems.length);
    } else if (currentTrackIndex >= trackItems.length - 1) {
        newIndex = 0;
    } else {
        newIndex = currentTrackIndex + 1;
    }
    playTrack(newIndex);
}

// ========== 循环切换 ==========
function toggleLoop() {
    isLooping = !isLooping;
    audioPlayer.loop = isLooping;
    loopBtn.style.color = isLooping ? '#7fdbda' : '';
    loopBtn.style.background = isLooping ? 'rgba(127, 219, 218, 0.3)' : '';
}

// ========== 随机切换 ==========
function toggleShuffle() {
    isShuffling = !isShuffling;
    shuffleBtn.style.color = isShuffling ? '#7fdbda' : '';
    shuffleBtn.style.background = isShuffling ? 'rgba(127, 219, 218, 0.3)' : '';
}

// ========== 曲目结束处理 ==========
function onTrackEnded() {
    if (!isLooping) {
        playNext();
    }
}

// ========== 进度条点击跳转 ==========
function seekTrack(e) {
    const rect = progressContainer.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioPlayer.currentTime = percent * audioPlayer.duration;
}

// ========== 更新进度条 ==========
function updateProgress() {
    if (audioPlayer.duration) {
        const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressBar.style.width = percent + '%';
        currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
    }
}

// ========== 更新总时长 ==========
function updateDuration() {
    totalTimeEl.textContent = formatTime(audioPlayer.duration);
}

// ========== 格式化时间 ==========
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
}

// ========== 鼠标移动检测 ==========
function onMouseMove() {
    // 显示UI
    if (isMouseIdle) {
        mainUI.classList.remove('hidden');
        isMouseIdle = false;
    }
    
    // 清除之前的定时器
    if (mouseTimer) {
        clearTimeout(mouseTimer);
    }
    
    // 只有在播放音乐时才隐藏UI
    if (isPlaying && currentTrackIndex !== -1) {
        mouseTimer = setTimeout(() => {
            mainUI.classList.add('hidden');
            isMouseIdle = true;
        }, 3000); // 3秒无操作后隐藏
    }
}

// ========== 页码切换 ==========
function switchPage(page) {
    pageBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === page);
    });
    
    // 这里可以添加分页逻辑
    // 比如显示/隐藏不同页的曲目
    const itemsPerPage = 24;
    const startIndex = (page - 1) * itemsPerPage;
    
    trackItems.forEach((item, index) => {
        if (index >= startIndex && index < startIndex + itemsPerPage) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// ========== 启动 ==========
init();
