// album.js - 旅途相册交互逻辑

// ========== 配置项 ==========
// 请在此配置你的照片文件夹路径和照片数量
const PHOTO_FOLDER = 'photos';          // 照片文件夹路径
const DESCRIPTION_FOLDER = 'descriptions';  // 描述文本文件夹路径
const PHOTO_COUNT = 20;                 // 照片数量（如果手动配置）
const PHOTO_FORMAT = 'jpg';             // 照片格式（jpg, png, jpeg）

// 照片分区配置（请根据实际情况修改）
// category: 分区名称，photos: 该分区包含的照片文件名数组
const PHOTO_CATEGORIES = [
    {
        category: '全部照片',
        photos: 'all'  // 特殊值，表示显示所有照片
    },
    {
        category: '德国',
        photos: ['1.jpg', '2.jpg', '3.jpg']
    },
    {
        category: '俄罗斯',
        photos: ['4.jpg', '5.jpg', '6.jpg']
    },
    {
        category: '法国',
        photos: ['7.jpg', '8.jpg']
    },
    {
        category: '波兰',
        photos: ['9.jpg', '10.jpg']
    },
    {
        category: '奥地利',
        photos: ['1.jpg', '10.jpg']
    }
];

// 从分区配置生成完整照片列表
const PHOTO_LIST = [];
PHOTO_CATEGORIES.forEach(cat => {
    if (cat.photos !== 'all') {
        PHOTO_LIST.push(...cat.photos);
    }
});
// 去重
const uniquePhotoList = [...new Set(PHOTO_LIST)];

// ========== DOM元素 ==========
const photoGrid = document.getElementById('photoGrid');
const categoryList = document.getElementById('categoryList');
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
let currentCategory = 'all';
let allPhotoElements = [];  // 存储所有照片元素

// ========== 初始化 ==========
function init() {
    loadCategories();
    loadPhotos();
    bindEvents();
}

// ========== 加载分区列表 ==========
function loadCategories() {
    PHOTO_CATEGORIES.forEach((cat, index) => {
        const li = document.createElement('li');
        li.className = 'category-item';
        if (index === 0) li.classList.add('active');
        li.textContent = cat.category;
        li.dataset.category = cat.photos === 'all' ? 'all' : cat.category;
        
        li.addEventListener('click', () => filterByCategory(cat, li));
        
        categoryList.appendChild(li);
    });
}

// ========== 加载照片 ==========
async function loadPhotos() {
    // 使用去重后的照片列表
    photos = uniquePhotoList.map(filename => `${PHOTO_FOLDER}/${filename}`);
    
    // 更新总数
    imageTotal.textContent = photos.length;
    
    // 清空网格
    photoGrid.innerHTML = '';
    allPhotoElements = [];
    
    // 生成缩略图
    for (let index = 0; index < uniquePhotoList.length; index++) {
        const filename = uniquePhotoList[index];
        const photoSrc = `${PHOTO_FOLDER}/${filename}`;
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        photoItem.dataset.index = index;
        photoItem.dataset.filename = filename;
        
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
        allPhotoElements.push(photoItem);
        
        // 点击事件
        photoItem.addEventListener('click', () => openLightbox(index));
        
        // 异步加载描述文本
        loadDescription(filename, description);
    }
}

// ========== 按分区过滤照片 ==========
function filterByCategory(category, clickedItem) {
    // 更新分区选中状态
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('active');
    });
    clickedItem.classList.add('active');
    
    // 根据分区显示/隐藏照片
    if (category.photos === 'all') {
        // 显示全部
        allPhotoElements.forEach(item => {
            item.style.display = 'block';
        });
        photos = uniquePhotoList.map(filename => `${PHOTO_FOLDER}/${filename}`);
    } else {
        // 只显示该分区的照片
        const categoryPhotos = category.photos;
        allPhotoElements.forEach(item => {
            const filename = item.dataset.filename;
            if (categoryPhotos.includes(filename)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
        photos = categoryPhotos.map(filename => `${PHOTO_FOLDER}/${filename}`);
    }
    
    // 更新总数
    imageTotal.textContent = photos.length;
}

// ========== 加载描述文本 ==========
async function loadDescription(filename, descElement) {
    try {
        // 获取照片文件名（不含扩展名）
        const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
        
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
        console.warn(`描述文件加载失败 (${filename}):`, error);
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
