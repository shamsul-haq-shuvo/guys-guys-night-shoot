/**
 * GUYS GUYS - NIGHT SHOOT 2026
 * Interactive Editorial Photo Gallery Engine
 */

(function () {
  'use strict';

  // State Management
  const state = {
    data: window.GUYS_GALLERY_DATA || [],
    randomizedList: [],
    currentPersonId: null,
    currentPerson: null,
    activePhotoIndex: 0,
    lightboxOpen: false,
    slideshowRunning: false,
    slideshowInterval: null,
    slideshowProgressInterval: null,
    slideshowDuration: 5000,
    ambientAudioPlaying: false,
    audioCtx: null,
    audioNodes: null,
    filterQuery: ''
  };

  // DOM Elements
  const elements = {
    body: document.body,
    homeView: document.getElementById('home-view'),
    personView: document.getElementById('person-view'),
    galleryGrid: document.getElementById('gallery-grid'),
    filterContainer: document.getElementById('filter-container'),
    searchInput: document.getElementById('search-input'),
    audioToggleBtn: document.getElementById('audio-toggle-btn'),
    siteHeader: document.querySelector('.site-header'),

    // Person View
    personTitle: document.getElementById('person-title'),
    personSubtitle: document.getElementById('person-subtitle'),
    personMasonry: document.getElementById('person-masonry'),
    personJumpSelect: document.getElementById('person-jump-select'),
    startSlideshowBtn: document.getElementById('start-slideshow-btn'),
    downloadAllZipBtn: document.getElementById('download-all-zip-btn'),
    prevFriendCard: document.getElementById('prev-friend-card'),
    nextFriendCard: document.getElementById('next-friend-card'),

    // Lightbox
    lightboxModal: document.getElementById('lightbox-modal'),
    lightboxImgWrapper: document.getElementById('lightbox-img-wrapper'),
    lightboxImg: document.getElementById('lightbox-img'),
    lightboxFriendName: document.getElementById('lightbox-friend-name'),
    lightboxCounter: document.getElementById('lightbox-counter'),
    lightboxPrevBtn: document.getElementById('lightbox-prev-btn'),
    lightboxNextBtn: document.getElementById('lightbox-next-btn'),
    lightboxCloseBtn: document.getElementById('lightbox-close-btn'),
    lightboxPlayBtn: document.getElementById('lightbox-play-btn'),
    lightboxDownloadBtn: document.getElementById('lightbox-download-btn'),
    lightboxFullscreenBtn: document.getElementById('lightbox-fullscreen-btn'),
    lightboxThumbStrip: document.getElementById('lightbox-thumb-strip'),
    slideshowProgressBar: document.getElementById('slideshow-progress-bar'),

    toast: document.getElementById('toast'),
    toastMsg: document.getElementById('toast-msg')
  };

  // Aspect ratio rhythms for cards (all vertical portrait ratios, no wide crops)
  const aspectRhythms = [
    'aspect-tall',
    'aspect-standard',
    'aspect-tall',
    'aspect-standard',
    'aspect-tall',
    'aspect-standard'
  ];

  // Fisher-Yates array shuffle for randomizing thumbnail order
  function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /* ==========================================================================
     Initialization
     ========================================================================== */
  function init() {
    setupBokehCanvas();
    setupCursorSpotlight();
    setupHeaderScroll();
    setupJumpSelect();
    setupSearch();
    renderMainGrid();
    setupLightboxEvents();
    setupRouter();
    setupAudioToggle();
  }

  function setupCursorSpotlight() {
    window.addEventListener('mousemove', (e) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    }, { passive: true });
  }

  /* ==========================================================================
     Routing (SPA with Hash Navigation)
     ========================================================================== */
  function setupRouter() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
  }

  function handleRoute() {
    const hash = window.location.hash;
    if (hash.startsWith('#/person/')) {
      const personId = hash.replace('#/person/', '').trim();
      const person = state.data.find(p => p.id === personId);
      if (person) {
        showPersonView(person);
        return;
      }
    }
    // Default to Home
    showHomeView();
  }

  function navigateTo(hash) {
    window.location.hash = hash;
  }

  function showHomeView() {
    state.currentPersonId = null;
    state.currentPerson = null;
    elements.body.classList.remove('person-view-active');
    // Randomize thumbnails order every time we come to the main page
    state.randomizedList = shuffle(state.data);
    renderMainGrid();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showPersonView(person) {
    state.currentPersonId = person.id;
    state.currentPerson = person;
    elements.body.classList.add('person-view-active');

    // Update Jump Select
    if (elements.personJumpSelect) {
      elements.personJumpSelect.value = person.id;
    }

    // Render Person Details
    elements.personTitle.textContent = person.name;
    elements.personSubtitle.textContent = `Night Shoot Portfolio • ${person.count} High-Res Portraits`;

    // Render Photos
    renderPersonPhotos(person);

    // Setup Next / Prev Navigation
    setupPersonPagination(person);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ==========================================================================
     Main Grid Rendering (Reference Style with Iconic White Badges)
     ========================================================================== */
  function renderMainGrid() {
    elements.galleryGrid.innerHTML = '';

    // If randomized list is empty, generate a fresh random order
    if (!state.randomizedList || state.randomizedList.length === 0) {
      state.randomizedList = shuffle(state.data);
    }

    const sourceList = state.randomizedList;
    const query = state.filterQuery.toLowerCase().trim();
    const filtered = sourceList.filter(p => p.name.toLowerCase().includes(query));

    if (filtered.length === 0) {
      elements.galleryGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
          <p style="font-size: 1.25rem; font-family: var(--font-serif); margin-bottom: 0.5rem;">No portraits found for "${query}"</p>
          <button class="action-btn" onclick="document.getElementById('search-input').value=''; state.filterQuery=''; renderMainGrid();">Show All 13 Portfolios</button>
        </div>
      `;
      return;
    }

    filtered.forEach((person, index) => {
      const card = document.createElement('div');
      const rhythmClass = aspectRhythms[index % aspectRhythms.length];
      card.className = `friend-card ${rhythmClass}`;
      card.style.animationDelay = `${index * 0.06}s`;

      card.innerHTML = `
        <div class="card-media">
          <img class="card-img" src="${person.cover}" alt="${person.name}" loading="lazy" />
          <div class="card-overlay"></div>
          <div class="card-shine"></div>
          <div class="card-photo-count">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            ${person.count} Photos
          </div>
          <!-- Iconic White Badge (User's Reference Image Style) -->
          <div class="card-badge-container">
            <div class="card-badge">
              <span class="card-name">${person.name}</span>
            </div>
          </div>
        </div>
      `;

      // 3D Parallax & Tilt Effect
      setup3DTilt(card);

      // Click to open person portfolio
      card.addEventListener('click', () => {
        navigateTo(`#/person/${person.id}`);
      });

      elements.galleryGrid.appendChild(card);
    });
  }

  /* ==========================================================================
     3D Interactive Tilt Effect
     ========================================================================== */
  function setup3DTilt(card) {
    let bounds;

    function onMouseMove(e) {
      if (!bounds) bounds = card.getBoundingClientRect();
      const mouseX = e.clientX - bounds.left;
      const mouseY = e.clientY - bounds.top;

      const xPct = (mouseX / bounds.width - 0.5) * 2;
      const yPct = (mouseY / bounds.height - 0.5) * 2;

      const rotateX = -yPct * 8; // degrees
      const rotateY = xPct * 8;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
    }

    function onMouseLeave() {
      card.style.transform = '';
      bounds = null;
    }

    card.addEventListener('mouseenter', () => {
      bounds = card.getBoundingClientRect();
    });
    card.addEventListener('mousemove', onMouseMove);
    card.addEventListener('mouseleave', onMouseLeave);
  }

  /* ==========================================================================
     Person Portfolio Photos
     ========================================================================== */
  function renderPersonPhotos(person) {
    elements.personMasonry.innerHTML = '';

    person.photos.forEach((photo, idx) => {
      const card = document.createElement('div');
      card.className = 'photo-card';

      card.innerHTML = `
        <img src="${photo.url}" alt="${person.name} - Portrait ${idx + 1}" loading="lazy" />
        <div class="photo-hover-overlay">
          <div class="photo-overlay-top">
            <button class="photo-action-btn download-btn" title="Download High-Res Photo" data-url="${photo.url}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
          </div>
          <div class="photo-overlay-bottom">
            <span class="photo-badge-index">${String(idx + 1).padStart(2, '0')} / ${String(person.count).padStart(2, '0')}</span>
            <span class="photo-badge-zoom">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              View
            </span>
          </div>
        </div>
      `;

      // Download button click
      const dlBtn = card.querySelector('.download-btn');
      dlBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        downloadPhoto(photo.url, `${person.name}-${photo.filename}`);
      });

      // Card click opens Lightbox at this photo
      card.addEventListener('click', () => {
        openLightbox(person, idx);
      });

      elements.personMasonry.appendChild(card);
    });

    // Start Slideshow button
    if (elements.startSlideshowBtn) {
      elements.startSlideshowBtn.onclick = () => {
        openLightbox(person, 0);
        startSlideshow();
      };
    }

    // Download All Photos as ZIP
    if (elements.downloadAllZipBtn) {
      elements.downloadAllZipBtn.onclick = () => {
        downloadAllAsZip(person);
      };
    }
  }

  async function downloadAllAsZip(person) {
    if (typeof JSZip === 'undefined' || typeof saveAs === 'undefined') {
      showToast('ZIP library initializing, downloading individual photos...');
      person.photos.forEach((p, i) => {
        setTimeout(() => downloadPhoto(p.url, `${person.name}-${p.filename}`), i * 300);
      });
      return;
    }

    showToast(`Preparing ZIP archive for ${person.name}...`);
    const zip = new JSZip();
    const folder = zip.folder(`${person.name} - Night Shoot 2026`);

    try {
      let loaded = 0;
      const promises = person.photos.map(async (photo) => {
        const res = await fetch(photo.url);
        const blob = await res.blob();
        folder.file(photo.filename, blob);
        loaded++;
      });

      await Promise.all(promises);
      showToast(`Compressing ${person.count} high-res portraits...`);
      const zipContent = await zip.generateAsync({ type: 'blob' });
      saveAs(zipContent, `${person.name}-Night-Shoot-2026.zip`);
      showToast(`ZIP ready! Downloaded ${person.name}'s portfolio.`);
    } catch (err) {
      console.error('ZIP generation error:', err);
      showToast('Failed to generate ZIP. Downloading individual photos...');
      person.photos.forEach((p, i) => {
        setTimeout(() => downloadPhoto(p.url, `${person.name}-${p.filename}`), i * 300);
      });
    }
  }

  /* ==========================================================================
     Person Pagination (Next & Previous Friend)
     ========================================================================== */
  function setupPersonPagination(currentPerson) {
    const currentIndex = state.data.findIndex(p => p.id === currentPerson.id);
    const prevIndex = (currentIndex - 1 + state.data.length) % state.data.length;
    const nextIndex = (currentIndex + 1) % state.data.length;

    const prevFriend = state.data[prevIndex];
    const nextFriend = state.data[nextIndex];

    if (elements.prevFriendCard) {
      elements.prevFriendCard.innerHTML = `
        <img class="nav-friend-thumb" src="${prevFriend.cover}" alt="${prevFriend.name}" />
        <div class="nav-friend-info">
          <div class="nav-friend-direction">← Previous Portfolio</div>
          <div class="nav-friend-name">${prevFriend.name}</div>
        </div>
      `;
      elements.prevFriendCard.onclick = () => navigateTo(`#/person/${prevFriend.id}`);
    }

    if (elements.nextFriendCard) {
      elements.nextFriendCard.innerHTML = `
        <img class="nav-friend-thumb" src="${nextFriend.cover}" alt="${nextFriend.name}" />
        <div class="nav-friend-info">
          <div class="nav-friend-direction">Next Portfolio →</div>
          <div class="nav-friend-name">${nextFriend.name}</div>
        </div>
      `;
      elements.nextFriendCard.onclick = () => navigateTo(`#/person/${nextFriend.id}`);
    }
  }

  function setupJumpSelect() {
    if (!elements.personJumpSelect) return;
    elements.personJumpSelect.innerHTML = state.data.map(p => `
      <option value="${p.id}">${p.name} (${p.count} photos)</option>
    `).join('');

    elements.personJumpSelect.addEventListener('change', (e) => {
      navigateTo(`#/person/${e.target.value}`);
    });
  }

  /* ==========================================================================
     Fullscreen Lightbox (Soft & Slow Opening & Transitions)
     ========================================================================== */
  function openLightbox(person, photoIndex) {
    state.currentPerson = person;
    state.activePhotoIndex = photoIndex;
    state.lightboxOpen = true;

    // Reset image wrapper and stage with soft opening animation
    if (elements.lightboxImgWrapper) {
      elements.lightboxImgWrapper.innerHTML = '';
      const photo = person.photos[photoIndex];
      if (photo) {
        const initialImg = document.createElement('img');
        initialImg.className = 'lightbox-img opening';
        initialImg.alt = `${person.name} - Portrait ${photoIndex + 1}`;
        initialImg.src = photo.url;
        elements.lightboxImgWrapper.appendChild(initialImg);

        // After the soft 850ms blooming opening completes, remove opening class
        setTimeout(() => {
          if (initialImg.parentNode === elements.lightboxImgWrapper) {
            initialImg.className = 'lightbox-img';
          }
        }, 880);
      }
    }

    updateLightboxMeta();
    renderLightboxThumbStrip();

    elements.lightboxModal.classList.add('active');
    elements.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    stopSlideshow();
    state.lightboxOpen = false;
    elements.lightboxModal.classList.remove('active');
    elements.body.style.overflow = '';
  }

  function updateLightboxMeta() {
    if (!state.currentPerson) return;
    elements.lightboxFriendName.textContent = state.currentPerson.name;
    elements.lightboxCounter.textContent = `${String(state.activePhotoIndex + 1).padStart(2, '0')} / ${String(state.currentPerson.count).padStart(2, '0')}`;

    // Highlight active thumbnail in strip
    const thumbs = elements.lightboxThumbStrip.querySelectorAll('.strip-thumb');
    thumbs.forEach((thumb, idx) => {
      thumb.classList.toggle('active', idx === state.activePhotoIndex);
      if (idx === state.activePhotoIndex) {
        thumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    });
  }

  function transitionPhoto(targetIndex, direction = 'next') {
    if (!state.currentPerson) return;
    const total = state.currentPerson.photos.length;
    const newIdx = (targetIndex + total) % total;

    // If already at target index and only 1 image exists, nothing to do
    if (newIdx === state.activePhotoIndex && elements.lightboxImgWrapper.children.length === 1) {
      return;
    }

    state.activePhotoIndex = newIdx;
    const nextPhotoData = state.currentPerson.photos[state.activePhotoIndex];
    if (!nextPhotoData) return;

    updateLightboxMeta();

    const wrapper = elements.lightboxImgWrapper;

    // If rapid clicks occurred, remove all but the most recent outgoing image
    while (wrapper.children.length > 1) {
      wrapper.removeChild(wrapper.firstChild);
    }
    const currentImg = wrapper.querySelector('.lightbox-img');

    const nextImg = document.createElement('img');
    nextImg.alt = `${state.currentPerson.name} - Portrait ${state.activePhotoIndex + 1}`;
    nextImg.src = nextPhotoData.url;

    if (currentImg) {
      if (direction === 'next') {
        currentImg.className = 'lightbox-img slide-out-left';
        nextImg.className = 'lightbox-img slide-in-right';
      } else if (direction === 'prev') {
        currentImg.className = 'lightbox-img slide-out-right';
        nextImg.className = 'lightbox-img slide-in-left';
      } else {
        currentImg.className = 'lightbox-img soft-fade-out';
        nextImg.className = 'lightbox-img soft-fade-in';
      }

      wrapper.appendChild(nextImg);

      // Once the soft 750ms transition completes, cleanly remove the outgoing image
      setTimeout(() => {
        if (currentImg && currentImg.parentNode === wrapper) {
          wrapper.removeChild(currentImg);
        }
        nextImg.className = 'lightbox-img';
      }, 760);
    } else {
      nextImg.className = 'lightbox-img opening';
      wrapper.appendChild(nextImg);
      setTimeout(() => {
        nextImg.className = 'lightbox-img';
      }, 880);
    }
  }

  function nextPhoto() {
    if (!state.currentPerson) return;
    transitionPhoto(state.activePhotoIndex + 1, 'next');
  }

  function prevPhoto() {
    if (!state.currentPerson) return;
    transitionPhoto(state.activePhotoIndex - 1, 'prev');
  }

  function renderLightboxThumbStrip() {
    if (!state.currentPerson) return;
    elements.lightboxThumbStrip.innerHTML = '';

    state.currentPerson.photos.forEach((photo, idx) => {
      const thumb = document.createElement('img');
      thumb.className = `strip-thumb ${idx === state.activePhotoIndex ? 'active' : ''}`;
      thumb.src = photo.url;
      thumb.alt = `Thumbnail ${idx + 1}`;
      thumb.addEventListener('click', () => {
        if (idx === state.activePhotoIndex) return;
        const dir = idx > state.activePhotoIndex ? 'next' : 'prev';
        transitionPhoto(idx, dir);
      });
      elements.lightboxThumbStrip.appendChild(thumb);
    });
  }

  /* Slideshow Controls */
  function toggleSlideshow() {
    if (state.slideshowRunning) {
      stopSlideshow();
      showToast('Slideshow paused');
    } else {
      startSlideshow();
      showToast('Starting automated slideshow...');
    }
  }

  function startSlideshow() {
    state.slideshowRunning = true;
    if (elements.lightboxPlayBtn) {
      elements.lightboxPlayBtn.classList.add('active');
      elements.lightboxPlayBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
      `;
    }

    let progress = 0;
    const intervalTime = 50; // ms
    const step = (intervalTime / state.slideshowDuration) * 100;

    clearInterval(state.slideshowProgressInterval);
    clearInterval(state.slideshowInterval);

    state.slideshowProgressInterval = setInterval(() => {
      progress += step;
      if (elements.slideshowProgressBar) {
        elements.slideshowProgressBar.style.width = `${progress}%`;
      }
      if (progress >= 100) {
        progress = 0;
        nextPhoto();
      }
    }, intervalTime);
  }

  function stopSlideshow() {
    state.slideshowRunning = false;
    clearInterval(state.slideshowProgressInterval);
    clearInterval(state.slideshowInterval);
    if (elements.slideshowProgressBar) {
      elements.slideshowProgressBar.style.width = '0%';
    }
    if (elements.lightboxPlayBtn) {
      elements.lightboxPlayBtn.classList.remove('active');
      elements.lightboxPlayBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      `;
    }
  }

  function downloadPhoto(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'guys-guys-photo.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Downloading photo...');
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  function setupLightboxEvents() {
    if (elements.lightboxPrevBtn) elements.lightboxPrevBtn.addEventListener('click', prevPhoto);
    if (elements.lightboxNextBtn) elements.lightboxNextBtn.addEventListener('click', nextPhoto);
    if (elements.lightboxCloseBtn) elements.lightboxCloseBtn.addEventListener('click', closeLightbox);
    if (elements.lightboxPlayBtn) elements.lightboxPlayBtn.addEventListener('click', toggleSlideshow);
    if (elements.lightboxFullscreenBtn) elements.lightboxFullscreenBtn.addEventListener('click', toggleFullscreen);

    if (elements.lightboxDownloadBtn) {
      elements.lightboxDownloadBtn.addEventListener('click', () => {
        if (!state.currentPerson) return;
        const photo = state.currentPerson.photos[state.activePhotoIndex];
        downloadPhoto(photo.url, `${state.currentPerson.name}-${photo.filename}`);
      });
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (!state.lightboxOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        toggleSlideshow();
      }
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    });

    // Touch Swipe for Mobile
    let touchStartX = 0;
    let touchEndX = 0;

    elements.lightboxModal.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    elements.lightboxModal.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchEndX - touchStartX;
      if (Math.abs(diff) > 50) {
        if (diff < 0) nextPhoto();
        else prevPhoto();
      }
    }, { passive: true });
  }

  /* ==========================================================================
     Canvas Bokeh & Night Sky Animation
     ========================================================================== */
  function setupBokehCanvas() {
    const canvas = document.getElementById('bokeh-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    // Generate bokeh circles & twinkling stars
    const bokehParticles = [];
    const particleCount = 42;

    const colors = [
      'rgba(223, 186, 115, ',  // Gold
      'rgba(244, 217, 156, ',  // Light Gold
      'rgba(147, 197, 253, ',  // Soft Blue
      'rgba(255, 255, 255, '   // White
    ];

    for (let i = 0; i < particleCount; i++) {
      bokehParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 50 + 15,
        baseAlpha: Math.random() * 0.12 + 0.03,
        alpha: 0,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3 - 0.1,
        colorPrefix: colors[Math.floor(Math.random() * colors.length)],
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.02 + 0.005
      });
    }

    // Stars
    const stars = [];
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        phase: Math.random() * Math.PI * 2
      });
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);

      // Render Stars
      stars.forEach(star => {
        star.phase += star.twinkleSpeed;
        const currentAlpha = (Math.sin(star.phase) * 0.5 + 0.5) * star.alpha;
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Render Bokeh circles
      bokehParticles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.phase += p.pulseSpeed;

        if (p.x < -p.radius) p.x = width + p.radius;
        if (p.x > width + p.radius) p.x = -p.radius;
        if (p.y < -p.radius) p.y = height + p.radius;
        if (p.y > height + p.radius) p.y = -p.radius;

        const currentAlpha = p.baseAlpha * (0.8 + 0.2 * Math.sin(p.phase));

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        gradient.addColorStop(0, `${p.colorPrefix}${currentAlpha})`);
        gradient.addColorStop(0.6, `${p.colorPrefix}${currentAlpha * 0.4})`);
        gradient.addColorStop(1, `${p.colorPrefix}0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    }

    animate();
  }

  /* ==========================================================================
     Soft Piano Rhythm Synthesizer (Acoustic Nocturne Engine)
     ========================================================================== */
  const pianoScore = [
    // Measure 1: Fm9 (F minor 9 - Emotional nocturne opening)
    { time: 0.00, freq: 87.31, dur: 3.6, vel: 0.65, pan: -0.35 },  // F2
    { time: 0.00, freq: 130.81, dur: 3.2, vel: 0.48, pan: -0.2 },  // C3
    { time: 0.48, freq: 207.65, dur: 2.8, vel: 0.40, pan: -0.1 },  // Ab3
    { time: 0.96, freq: 311.13, dur: 2.6, vel: 0.52, pan: 0.1 },   // Eb4
    { time: 1.44, freq: 392.00, dur: 2.5, vel: 0.58, pan: 0.25 },  // G4
    { time: 1.92, freq: 311.13, dur: 2.2, vel: 0.38, pan: 0.1 },   // Eb4
    { time: 2.40, freq: 207.65, dur: 2.2, vel: 0.36, pan: -0.1 },  // Ab3
    { time: 2.88, freq: 261.63, dur: 2.2, vel: 0.44, pan: 0.0 },   // C4
    { time: 3.36, freq: 311.13, dur: 2.0, vel: 0.46, pan: 0.1 },   // Eb4

    // Measure 2: Dbmaj9 (Warm nocturnal resolution)
    { time: 3.84, freq: 69.30, dur: 3.8, vel: 0.70, pan: -0.4 },   // Db2
    { time: 3.84, freq: 103.83, dur: 3.4, vel: 0.48, pan: -0.25 }, // Ab2
    { time: 4.32, freq: 174.61, dur: 2.8, vel: 0.42, pan: -0.15 }, // F3
    { time: 4.80, freq: 261.63, dur: 2.6, vel: 0.50, pan: 0.05 },  // C4
    { time: 5.28, freq: 311.13, dur: 2.5, vel: 0.56, pan: 0.15 },  // Eb4
    { time: 5.76, freq: 349.23, dur: 2.6, vel: 0.62, pan: 0.3 },   // F4
    { time: 6.24, freq: 261.63, dur: 2.2, vel: 0.40, pan: 0.05 },  // C4
    { time: 6.72, freq: 207.65, dur: 2.2, vel: 0.36, pan: -0.1 },  // Ab3
    { time: 7.20, freq: 261.63, dur: 2.0, vel: 0.44, pan: 0.05 },  // C4

    // Measure 3: Abadd9 (Lyrical clarity)
    { time: 7.68, freq: 103.83, dur: 3.8, vel: 0.68, pan: -0.3 },  // Ab2
    { time: 7.68, freq: 155.56, dur: 3.3, vel: 0.48, pan: -0.2 },  // Eb3
    { time: 8.16, freq: 261.63, dur: 2.8, vel: 0.44, pan: 0.0 },   // C4
    { time: 8.64, freq: 466.16, dur: 2.6, vel: 0.60, pan: 0.35 },  // Bb4
    { time: 9.12, freq: 415.30, dur: 2.5, vel: 0.52, pan: 0.25 },  // Ab4
    { time: 9.60, freq: 311.13, dur: 2.2, vel: 0.40, pan: 0.1 },   // Eb4
    { time: 10.08, freq: 261.63, dur: 2.2, vel: 0.38, pan: 0.0 },  // C4
    { time: 10.56, freq: 233.08, dur: 2.2, vel: 0.44, pan: -0.05 }, // Bb3
    { time: 11.04, freq: 311.13, dur: 2.0, vel: 0.46, pan: 0.1 },  // Eb4

    // Measure 4: Ebsus4 -> Eb (Gentle turnaround)
    { time: 11.52, freq: 77.78, dur: 3.8, vel: 0.68, pan: -0.38 }, // Eb2
    { time: 11.52, freq: 116.54, dur: 3.3, vel: 0.46, pan: -0.25 }, // Bb2
    { time: 12.00, freq: 196.00, dur: 2.8, vel: 0.42, pan: -0.1 },  // G3
    { time: 12.48, freq: 277.18, dur: 2.6, vel: 0.52, pan: 0.1 },   // Db4
    { time: 12.96, freq: 349.23, dur: 2.6, vel: 0.60, pan: 0.28 },  // F4
    { time: 13.44, freq: 311.13, dur: 2.4, vel: 0.56, pan: 0.15 },  // Eb4
    { time: 13.92, freq: 233.08, dur: 2.2, vel: 0.40, pan: -0.05 }, // Bb3
    { time: 14.40, freq: 196.00, dur: 2.2, vel: 0.38, pan: -0.1 },  // G3
    { time: 14.88, freq: 233.08, dur: 2.0, vel: 0.44, pan: -0.05 }  // Bb3
  ];
  const pianoLoopLength = 15.36; // seconds per cycle

  let pianoSchedulerTimer = null;
  let pianoLoopStartTime = 0;
  let pianoMasterGain = null;

  function playPianoKey(ctx, destination, freq, time, duration = 2.4, velocity = 0.5, pan = 0) {
    if (!ctx || ctx.state === 'closed') return;

    // Gain envelope (instant hammer strike + exponential acoustic decay)
    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, time);
    noteGain.gain.exponentialRampToValueAtTime(velocity * 0.14, time + 0.005);
    noteGain.gain.exponentialRampToValueAtTime(velocity * 0.035, time + 0.55);
    noteGain.gain.exponentialRampToValueAtTime(0.00001, time + duration);

    // Dynamic lowpass filter (piano string string-damping frequency drop)
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const cutoff = Math.min(freq * 5.2, 3800);
    filter.frequency.setValueAtTime(cutoff, time);
    filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.3, 260), time + duration * 0.85);

    // Stereo Panner (gentle acoustic piano spread across keyboard)
    if (ctx.createStereoPanner) {
      const panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(pan, time);
      noteGain.connect(filter);
      filter.connect(panner);
      panner.connect(destination);
    } else {
      noteGain.connect(filter);
      filter.connect(destination);
    }

    // Three layered oscillators with subtle organic detuning
    // 1. Fundamental
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, time);

    // 2. Warm 2nd harmonic (octave overtone)
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2 + 0.25, time);
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.32, time);
    osc2.connect(osc2Gain);
    osc2Gain.connect(noteGain);

    // 3. Delicate 3rd harmonic (octave + 5th)
    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 3 - 0.35, time);
    const osc3Gain = ctx.createGain();
    osc3Gain.gain.setValueAtTime(0.10, time);
    osc3.connect(osc3Gain);
    osc3Gain.connect(noteGain);

    osc1.connect(noteGain);

    osc1.start(time);
    osc2.start(time);
    osc3.start(time);

    osc1.stop(time + duration + 0.1);
    osc2.stop(time + duration + 0.1);
    osc3.stop(time + duration + 0.1);
  }

  function setupAudioToggle() {
    if (!elements.audioToggleBtn) return;

    elements.audioToggleBtn.addEventListener('click', () => {
      if (!state.audioCtx) {
        initWebAudio();
      }

      if (state.ambientAudioPlaying) {
        stopWebAudio();
        elements.audioToggleBtn.classList.remove('active');
        showToast('Piano muted');
      } else {
        startWebAudio();
        elements.audioToggleBtn.classList.add('active');
        showToast('Playing soft piano rhythm ♫');
      }
    });
  }

  function initWebAudio() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    state.audioCtx = new AudioContext();
  }

  function startWebAudio() {
    if (!state.audioCtx) return;
    if (state.audioCtx.state === 'suspended') {
      state.audioCtx.resume();
    }

    const ctx = state.audioCtx;

    // Master Gain
    pianoMasterGain = ctx.createGain();
    pianoMasterGain.gain.setValueAtTime(0.001, ctx.currentTime);
    pianoMasterGain.gain.exponentialRampToValueAtTime(0.40, ctx.currentTime + 1.5);

    // Warm stereo delay/reverb unit
    const delayL = ctx.createDelay();
    const delayR = ctx.createDelay();
    delayL.delayTime.value = 0.28;
    delayR.delayTime.value = 0.42;

    const delayFeedback = ctx.createGain();
    delayFeedback.gain.value = 0.25;

    const delayFilter = ctx.createBiquadFilter();
    delayFilter.type = 'lowpass';
    delayFilter.frequency.value = 1600;

    pianoMasterGain.connect(delayL);
    pianoMasterGain.connect(delayR);

    delayL.connect(delayFilter);
    delayR.connect(delayFilter);
    delayFilter.connect(delayFeedback);
    delayFeedback.connect(delayL);

    delayFilter.connect(ctx.destination);
    pianoMasterGain.connect(ctx.destination);

    // Lookahead scheduling loop
    pianoLoopStartTime = ctx.currentTime + 0.1;
    let scheduledUpToTime = pianoLoopStartTime;

    function scheduleAhead() {
      if (!state.ambientAudioPlaying) return;
      const currentTime = ctx.currentTime;
      const lookahead = 2.0; // schedule 2 seconds ahead

      while (scheduledUpToTime < currentTime + lookahead) {
        const cycleOffset = (scheduledUpToTime - pianoLoopStartTime) % pianoLoopLength;
        const currentCycleStart = scheduledUpToTime - cycleOffset;

        // Schedule notes in the score that fall into this window
        pianoScore.forEach(note => {
          const noteAbsoluteTime = currentCycleStart + note.time;
          if (noteAbsoluteTime >= scheduledUpToTime && noteAbsoluteTime < scheduledUpToTime + 1.0) {
            playPianoKey(ctx, pianoMasterGain, note.freq, noteAbsoluteTime, note.dur, note.vel, note.pan);
          }
        });

        scheduledUpToTime += 1.0;
      }
    }

    state.ambientAudioPlaying = true;
    scheduleAhead();
    pianoSchedulerTimer = setInterval(scheduleAhead, 450);
  }

  function stopWebAudio() {
    state.ambientAudioPlaying = false;
    clearInterval(pianoSchedulerTimer);
    pianoSchedulerTimer = null;

    if (pianoMasterGain && state.audioCtx) {
      const ctx = state.audioCtx;
      pianoMasterGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.0);
      setTimeout(() => {
        pianoMasterGain = null;
      }, 1100);
    }
  }

  /* ==========================================================================
     Search & Filtering
     ========================================================================== */
  function setupSearch() {
    if (!elements.searchInput) return;

    elements.searchInput.addEventListener('input', (e) => {
      state.filterQuery = e.target.value;
      if (state.currentPersonId) {
        showHomeView();
      }
      renderMainGrid();
    });
  }

  /* ==========================================================================
     Header Scroll Effects
     ========================================================================== */
  function setupHeaderScroll() {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        elements.siteHeader.classList.add('scrolled');
      } else {
        elements.siteHeader.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  /* Toast Notification */
  function showToast(msg) {
    if (!elements.toast || !elements.toastMsg) return;
    elements.toastMsg.textContent = msg;
    elements.toast.classList.add('show');
    setTimeout(() => {
      elements.toast.classList.remove('show');
    }, 3200);
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
