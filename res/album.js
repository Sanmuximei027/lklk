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
        photos: ['4.jpg', '5.jpg']
    },
    {
        category: '法国',
        photos: ['6.jpg', '7.jpg']
    },
    {
        category: '波兰',
        photos: ['8.jpg', '9.jpg']
    },
    {
        category: '奥地利',
        photos: ['10.jpg', '11.jpg']
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

// ========== DOM元素缓存 ==========
const DOM = {
    photoGrid: document.getElementById('photoGrid'),
    categoryList: document.getElementById('categoryList'),
    lightbox: document.getElementById('lightbox'),
    lightboxImg: document.getElementById('lightboxImg'),
    closeBtn: document.getElementById('closeBtn'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    imageIndex: document.getElementById('imageIndex'),
    imageTotal: document.getElementById('imageTotal'),
    body: document.body
};

// 简化使用（保持向后兼容）
const photoGrid = DOM.photoGrid;
const categoryList = DOM.categoryList;
const lightbox = DOM.lightbox;
const lightboxImg = DOM.lightboxImg;
const closeBtn = DOM.closeBtn;
const prevBtn = DOM.prevBtn;
const nextBtn = DOM.nextBtn;
const imageIndex = DOM.imageIndex;
const imageTotal = DOM.imageTotal;

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
    const fragment = document.createDocumentFragment();
    
    PHOTO_CATEGORIES.forEach((cat, index) => {
        const li = document.createElement('li');
        li.className = 'category-item';
        if (index === 0) li.classList.add('active');
        li.textContent = cat.category;
        li.dataset.category = cat.photos === 'all' ? 'all' : cat.category;
        
        // 使用事件委托替代单个监听器
        li.dataset.category = cat.photos === 'all' ? 'all' : cat.category;
        
        fragment.appendChild(li);
    });
    
    // 批量添加元素，减少重排
    categoryList.appendChild(fragment);
    
    // 使用事件委托处理分类点击
    categoryList.addEventListener('click', (e) => {
        const categoryItem = e.target.closest('.category-item');
        if (!categoryItem) return;
        
        const categoryName = categoryItem.dataset.category;
        const category = PHOTO_CATEGORIES.find(cat => 
            (cat.photos === 'all' && categoryName === 'all') || 
            (cat.photos !== 'all' && cat.category === categoryName)
        );
        
        if (category) {
            filterByCategory(category, categoryItem);
        }
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
    
    // 使用DocumentFragment批量插入，减少重排
    const fragment = document.createDocumentFragment();
    
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
        
        fragment.appendChild(photoItem);
        allPhotoElements.push(photoItem);
        
        // 异步加载描述文本
        loadDescription(filename, description);
    }
    
    // 一次性添加所有元素，减少重排次数
    photoGrid.appendChild(fragment);
}

// ========== 按分区过滤照片 ==========
function filterByCategory(category, clickedItem) {
    // 更新分区选中状态 - 优化：使用更高效的方式
    const categoryItems = DOM.categoryList.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
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
        // 只显示该分区的照片 - 优化：构建Set以提高查询速度
        const categoryPhotosSet = new Set(category.photos);
        allPhotoElements.forEach(item => {
            const filename = item.dataset.filename;
            item.style.display = categoryPhotosSet.has(filename) ? 'block' : 'none';
        });
        photos = category.photos.map(filename => `${PHOTO_FOLDER}/${filename}`);
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
    
    // 使用事件委托处理照片点击
    photoGrid.addEventListener('click', (e) => {
        const photoItem = e.target.closest('.photo-item');
        if (photoItem) {
            const index = parseInt(photoItem.dataset.index);
            openLightbox(index);
        }
    });
}

// ========== 打开大图查看器 ==========
function openLightbox(index) {
    currentIndex = index;
    updateLightboxImage();
    lightbox.classList.add('active');
    DOM.body.style.overflow = 'hidden';
}

// ========== 关闭大图查看器 ==========
function closeLightbox() {
    lightbox.classList.remove('active');
    DOM.body.style.overflow = 'auto';
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
