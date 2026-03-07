// record.js - 你的唱片柜交互逻辑

// ========== DOM元素缓存 ==========
const DOM = {
    bgLayer: document.getElementById('bgLayer'),
    bgImage: document.getElementById('bgImage'),
    mainUI: document.getElementById('mainUI'),
    audioPlayer: document.getElementById('audioPlayer'),
    playBtn: document.getElementById('playBtn'),
    stopBtn: document.getElementById('stopBtn'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    loopBtn: document.getElementById('loopBtn'),
    shuffleBtn: document.getElementById('shuffleBtn'),
    volumeSlider: document.getElementById('volumeSlider'),
    progressContainer: document.getElementById('progressContainer'),
    progressBar: document.getElementById('progressBar'),
    currentTimeEl: document.getElementById('currentTime'),
    totalTimeEl: document.getElementById('totalTime'),
    composerNameEl: document.getElementById('composerName'),
    trackTitleEl: document.getElementById('trackTitle'),
    trackItems: document.querySelectorAll('.track-item'),
    pageBtns: document.querySelectorAll('.page-btn'),
    body: document.body
};

// 保持向后兼容性
const bgLayer = DOM.bgLayer;
const bgImage = DOM.bgImage;
const mainUI = DOM.mainUI;
const audioPlayer = DOM.audioPlayer;
const playBtn = DOM.playBtn;
const stopBtn = DOM.stopBtn;
const prevBtn = DOM.prevBtn;
const nextBtn = DOM.nextBtn;
const loopBtn = DOM.loopBtn;
const shuffleBtn = DOM.shuffleBtn;
const volumeSlider = DOM.volumeSlider;
const progressContainer = DOM.progressContainer;
const progressBar = DOM.progressBar;
const currentTimeEl = DOM.currentTimeEl;
const totalTimeEl = DOM.totalTimeEl;
const composerNameEl = DOM.composerNameEl;
const trackTitleEl = DOM.trackTitleEl;
const trackItems = DOM.trackItems;
const pageBtns = DOM.pageBtns;

// ========== 性能优化工具函数 ==========
// 节流函数 - 用于高频事件
function throttle(func, delay) {
    let lastCall = 0;
    return function(...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            func.apply(this, args);
        }
    };
}

// 防抖函数 - 用于延迟执行
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// ========== 状态变量 ==========
let isPlaying = false;
let currentTrackIndex = -1;
let isLooping = false;
let isShuffling = false;
let mouseTimer = null;
let isMouseIdle = false;

// ========== CG轮播相关变量 ==========
let cgTimer = null;           // CG轮播定时器
let currentCgIndex = 0;       // 当前CG索引
let cgIndices = [];           // 当前轮播的CG索引池
const cgInterval = 5000;      // CG切换间隔（毫秒），可修改

// ========== 曲目数据（请在此修改作曲家信息和CG数量） ==========
// cgCount: 该曲目文件夹内的CG图片数量
const trackData = [
    { composer: "贝多芬", cgCount: 12  },
    { composer: "维瓦尔第", cgCount: 6},
    { composer: "J.S.巴赫", cgCount:6 },
    { composer: "J.S.巴赫", cgCount: 33},
    { composer: "埃尔加", cgCount: 5 },
    { composer: "克莱斯勒", cgCount:33},
    { composer: "小约翰·施特劳斯", cgCount: 33},
    { composer: "德彪西", cgCount: 33},
    { composer: "J.S.巴赫", cgCount:33},
    { composer: "肖斯塔科维奇", cgCount: 6 },
    { composer: "马勒", cgCount: 29},
    { composer: "帕赫贝尔", cgCount: 33},
    { composer: "肖邦", cgCount: 33},
    { composer: "德沃夏克", cgCount: 12 },
    { composer: "苏格兰民歌", cgCount: 33},
    { composer: "莫扎特", cgCount: 33},
    { composer: "鲍罗丁", cgCount: 33},
    { composer: "萨拉萨蒂", cgCount: 33},
    { composer: "肖邦", cgCount: 33},
    { composer: "神思者", cgCount: 33},
    { composer: "贝多芬", cgCount: 33},
    { composer: "莫扎特", cgCount: 33},
    { composer: "柴可夫斯基", cgCount: 33},
    { composer: "鹭巢诗郎", cgCount: 12 }
];

// ========== 初始化 ==========
function init() {
    // 设置初始音量
    audioPlayer.volume = volumeSlider.value / 100;
    
    // 使用事件委托处理曲目点击
    document.addEventListener('click', (e) => {
        const trackItem = e.target.closest('.track-item');
        if (trackItem) {
            const index = Array.from(trackItems).indexOf(trackItem);
            if (index !== -1) {
                playTrack(index);
            }
        }
    });
    
    // 绑定控制按钮事件
    playBtn.addEventListener('click', togglePlay);
    stopBtn.addEventListener('click', stopTrack);
    prevBtn.addEventListener('click', playPrev);
    nextBtn.addEventListener('click', playNext);
    loopBtn.addEventListener('click', toggleLoop);
    shuffleBtn.addEventListener('click', toggleShuffle);
    
    // 音量控制
    volumeSlider.addEventListener('input', (e) => {
        audioPlayer.volume = e.target.value / 100;
    });
    
    // 进度条点击
    progressContainer.addEventListener('click', seekTrack);
    
    // 音频事件
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('loadedmetadata', updateDuration);
    audioPlayer.addEventListener('ended', onTrackEnded);
    
    // 鼠标移动检测 - 使用节流优化
    document.addEventListener('mousemove', throttle(onMouseMove, 100));
    
    // 页码切换 - 使用事件委托
    document.addEventListener('click', (e) => {
        const pageBtn = e.target.closest('.page-btn');
        if (pageBtn) {
            switchPage(pageBtn.dataset.page);
        }
    });
}

// ========== 播放曲目 ==========
function playTrack(index) {
    // 优化：使用classList的remove方法优化
    trackItems.forEach(item => item.classList.remove('active'));
    
    // 设置当前曲目
    currentTrackIndex = index;
    const trackItem = trackItems[index];
    trackItem.classList.add('active');
    
    // 获取音频
    const audioSrc = trackItem.dataset.audio;
    const trackName = trackItem.querySelector('.track-name').textContent;
    const cgFolder = trackItem.dataset.cg; // 从data-cg属性获取文件夹路径
    
    // 播放音频
    audioPlayer.src = audioSrc;
    audioPlayer.play();
    isPlaying = true;
    playBtn.textContent = '⏸';
    
    // 更新曲目信息
    trackTitleEl.textContent = trackName;
    composerNameEl.textContent = trackData[index]?.composer || '--';
    
    // 开始CG轮播 - 使用data-cg属性中的实际文件夹路径
    startCgSlideshow(cgFolder, index);
}

// ========== 开始CG轮播 ==========
function startCgSlideshow(cgFolder, trackIndex) {
    // 停止之前的轮播
    stopCgSlideshow();
    
    // 获取该曲目的实际CG数量（动态获取）
    const cgCount = trackData[trackIndex]?.cgCount || 6;
    
    // 生成随机索引池（从1到cgCount）
    cgIndices = [];
    for (let i = 1; i <= cgCount; i++) {
        cgIndices.push(i);
    }
    // 打乱索引顺序
    cgIndices = cgIndices.sort(() => Math.random() - 0.5);
    
    currentCgIndex = 0;
    
    // 显示第一张CG
    showCg(cgFolder, currentCgIndex);
    
    // 如果有多张CG，启动轮播
    if (cgCount > 1) {
        cgTimer = setInterval(() => {
            currentCgIndex = (currentCgIndex + 1) % cgCount;
            showCg(cgFolder, currentCgIndex);
        }, cgInterval);
    }
}

// ========== 显示指定索引的CG ==========
function showCg(cgFolder, index) {
    // 从随机索引池中获取图片编号
    const cgNum = cgIndices[index % cgIndices.length];
    const cgPath = cgFolder + '/' + cgNum + '.jpg';
    changeBgCG(cgPath);
}

// ========== 停止CG轮播 ==========
function stopCgSlideshow() {
    if (cgTimer) {
        clearInterval(cgTimer);
        cgTimer = null;
    }
}

// ========== 切换背景CG ==========
function changeBgCG(cgSrc) {
    // 先淡出
    bgImage.classList.remove('show');
    
    // 等淡出完成后切换图片 - 优化：使用更高效的方式
    const timeoutId = setTimeout(() => {
        bgImage.src = cgSrc;
        bgImage.onload = () => {
            bgImage.classList.add('show');
        };
    }, 500);
    
    // 避免内存泄漏
    return timeoutId;
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
    
    // 停止CG轮播
    stopCgSlideshow();
    
    // 清除CG
    bgImage.classList.remove('show');
    
    // 清除曲目选中状态 - 优化
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
    
    // 优化：使用三元运算符简化逻辑
    const newIndex = currentTrackIndex <= 0 ? trackItems.length - 1 : currentTrackIndex - 1;
    playTrack(newIndex);
}

// ========== 下一曲 ==========
function playNext() {
    if (trackItems.length === 0) return;
    
    // 优化：使用三元运算符简化逻辑
    const newIndex = isShuffling 
        ? Math.floor(Math.random() * trackItems.length)
        : currentTrackIndex >= trackItems.length - 1 
            ? 0 
            : currentTrackIndex + 1;
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
    
    // 优化：缓存trackItems并使用更高效的方式
    trackItems.forEach((item, index) => {
        item.style.display = (index >= startIndex && index < startIndex + itemsPerPage) ? 'block' : 'none';
    });
}

// ========== 启动 ==========
init();
