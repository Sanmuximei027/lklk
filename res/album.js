// album.js - 旅途相册交互逻辑

// ========== 配置项 ==========
// 请在此配置你的照片文件夹路径和照片数量
const PHOTO_FOLDER = 'photos';          // 照片文件夹路径
const DESCRIPTION_FOLDER = 'descriptions';  // 描述文本文件夹路径
const PHOTO_COUNT = 20;                 // 照片数量（如果手动配置）
const PHOTO_FORMAT = 'jpg';             // 照片格式（jpg, png, jpeg）

// 或者直接配置照片列表（推荐）
// 请修改为你实际的照片文件名
const PHOTO_LIST = [
    '1.jpg',
    '2.jpg',
    '3.jpg',
    '4.jpg',
    '5.jpg',
    '6.jpg',
    '7.jpg',
    '8.jpg',
    '9.jpg',
    '10.jpg'
    // 继续添加更多照片...
];

// ========== DOM元素 ==========
const photoGrid = document.getElementById('photoGrid');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const closeBtn = document.getElementById('closeBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const imageIndex = document.getElementById('imageIndex');
const imageTotal = document.getElementById('imageTotal');

// ========== 状态变量 ==========
let currentIndex = 0;
let photos = [];

// ========== 初始化 ==========
function init() {
    loadPhotos();
    bindEvents();
}

// ========== 加载照片 ==========
async function loadPhotos() {
    // 使用配置的照片列表生成照片网格
    photos = PHOTO_LIST.map(filename => `${PHOTO_FOLDER}/${filename}`);
    
    // 更新总数
    imageTotal.textContent = photos.length;
    
    // 生成缩略图
    for (let index = 0; index < photos.length; index++) {
        const photoSrc = photos[index];
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        photoItem.dataset.index = index;
        
        const img = document.createElement('img');
        img.src = photoSrc;
        img.alt = `照片 ${index + 1}`;
        
        // 添加错误处理
        img.onerror = function() {
            this.parentElement.style.display = 'none';
            console.warn(`照片加载失败: ${photoSrc}`);
        };
        
        photoItem.appendChild(img);
        
        // 创建悬停预览层
        const hoverPreview = document.createElement('div');
        hoverPreview.className = 'hover-preview';
        
        const previewImg = document.createElement('img');
        previewImg.src = photoSrc;
        previewImg.alt = `预览 ${index + 1}`;
        
        const description = document.createElement('div');
        description.className = 'hover-description';
        description.textContent = '加载中...';
        
        hoverPreview.appendChild(previewImg);
        hoverPreview.appendChild(description);
        photoItem.appendChild(hoverPreview);
        
        photoGrid.appendChild(photoItem);
        
        // 点击事件
        photoItem.addEventListener('click', () => openLightbox(index));
        
        // 异步加载描述文本
        loadDescription(index, description);
    }
}

// ========== 加载描述文本 ==========
async function loadDescription(index, descElement) {
    try {
        // 获取照片文件名（不含扩展名）
        const photoFilename = PHOTO_LIST[index];
        const nameWithoutExt = photoFilename.substring(0, photoFilename.lastIndexOf('.'));
        
        // 构建描述文件路径
        const descPath = `${DESCRIPTION_FOLDER}/${nameWithoutExt}.txt`;
        
        // 尝试加载描述文件
        const response = await fetch(descPath);
        
        if (response.ok) {
            const text = await response.text();
            descElement.textContent = text.trim() || '暂无描述';
        } else {
            descElement.textContent = '暂无描述';
        }
    } catch (error) {
        descElement.textContent = '暂无描述';
        console.warn(`描述文件加载失败 (索引 ${index}):`, error);
    }
}

// ========== 绑定事件 ==========
function bindEvents() {
    // 关闭按钮
    closeBtn.addEventListener('click', closeLightbox);
    
    // 左右切换
    prevBtn.addEventListener('click', showPrevImage);
    nextBtn.addEventListener('click', showNextImage);
    
    // 点击背景关闭
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    
    // 键盘事件
    document.addEventListener('keydown', handleKeyboard);
}

// ========== 打开大图查看器 ==========
function openLightbox(index) {
    currentIndex = index;
    updateLightboxImage();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ========== 关闭大图查看器 ==========
function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// ========== 更新大图 ==========
function updateLightboxImage() {
    lightboxImg.src = photos[currentIndex];
    imageIndex.textContent = currentIndex + 1;
}

// ========== 上一张 ==========
function showPrevImage() {
    currentIndex = (currentIndex - 1 + photos.length) % photos.length;
    updateLightboxImage();
}

// ========== 下一张 ==========
function showNextImage() {
    currentIndex = (currentIndex + 1) % photos.length;
    updateLightboxImage();
}

// ========== 键盘控制 ==========
function handleKeyboard(e) {
    if (!lightbox.classList.contains('active')) return;
    
    switch(e.key) {
        case 'Escape':
            closeLightbox();
            break;
        case 'ArrowLeft':
            showPrevImage();
            break;
        case 'ArrowRight':
            showNextImage();
            break;
    }
}

// ========== 启动 ==========
init();
