// ===== MODULE: MUSIC PLAYER & CARD STACK =====
(function () {
  // ===== PLAYLIST DATA =====
  const songFiles = [
    'Aashiq Tera_spotdown.org.mp3',
    'Afsos_spotdown.org.mp3',
    'Be Intehaan_spotdown.org.mp3',
    'Darkhaast_spotdown.org.mp3',
    'Dekha Hi Nahi_spotdown.org.mp3',
    'Dooriyan_spotdown.org.mp3',
    'Dooron Dooron_spotdown.org.mp3',
    'Fakira_spotdown.org.mp3',
    'Haareya_spotdown.org.mp3',
    'Haseen_spotdown.org.mp3',
    'Hona Tha Pyar_spotdown.org.mp3',
    'Hua Hain Aaj Pehli Baar_spotdown.org.mp3',
    'Humsafar (From _Saiyaara_)_spotdown.org.mp3',
    'Ishq - From _Lost;Found__spotdown.org.mp3',
    'Ishq Sufiyana (Male)_spotdown.org.mp3',
    'Jeene Laga Hoon_spotdown.org.mp3',
    'Jugraafiya - From _Super 30__spotdown.org.mp3',
    'Mann Mera - Original Version_spotdown.org.mp3',
    'Mitti Di Khushboo_spotdown.org.mp3',
    'Mitwa_spotdown.org.mp3',
    'Paaro_spotdown.org.mp3',
    'Pal Pal - Talwiinder Verse_spotdown.org.mp3',
    'Pal Pal Dil Ke Paas - Title Track - From _Pal Pal Dil Ke Paas__spotdown.org.mp3',
    'Phir Le Aya Dil_spotdown.org.mp3',
    'Sahiba_spotdown.org.mp3',
    'Tere Liye_spotdown.org.mp3',
    'Teri Meri Kahaani_spotdown.org.mp3',
    'Tu Chahiye_spotdown.org.mp3',
    'Tu Hi Hai Aashiqui - Duet_spotdown.org.mp3',
    'Tum Ho Toh (From _Saiyaara_)_spotdown.org.mp3',
    'Yeh Fitoor Mera_spotdown.org.mp3',
    'Zehnaseeb_spotdown.org.mp3',
  ];

  const tracks = songFiles.map(file => ({
    file,
    name: file.replace(/_spotdown\.org\.mp3$/, '').replace(/_/g, ' ').trim(),
    src: `music/${encodeURIComponent(file)}`,
    e: '&#9835;'
  }));

  const trackImages = [
    'images/track1.png',
    'images/track2.jpg',
    'images/track3.png',
    'images/track4.png',
    'images/track5.png',
    'images/track6.png',
    'images/track7.png',
    'images/track8.png',
    'images/track9.png',
    'images/track10.png',
    'images/track11.png',
    'images/track12.jpg',
    'images/track13.jpg',
    'images/track14.png',
    'images/track15.jpg'
  ];

  const assignedImages = [];
  // Pre-calculate track images to ensure no repeats in any window of 5 tracks (current + next 4)
  for (let i = 0; i < tracks.length; i++) {
    let trackName = tracks[i].name;
    let hash = 0;
    for (let j = 0; j < trackName.length; j++) {
      hash = trackName.charCodeAt(j) + ((hash << 5) - hash);
    }
    let baseIdx = Math.abs(hash) % trackImages.length;
    
    let finalIdx = baseIdx;
    let usedInLast4 = true;
    while (usedInLast4) {
      usedInLast4 = false;
      for (let step = 1; step <= 4; step++) {
        let prevIdx = i - step;
        if (prevIdx >= 0) {
          if (assignedImages[prevIdx] === trackImages[finalIdx]) {
            usedInLast4 = true;
            break;
          }
        }
      }
      if (usedInLast4) {
        finalIdx = (finalIdx + 1) % trackImages.length;
      }
    }
    assignedImages.push(trackImages[finalIdx]);
  }

  function getTrackImage(index) {
    return assignedImages[index] || trackImages[0];
  }

  // ===== MUSIC CUSTOM STACK WRAPPER =====
  var EMOJIS = ['🎵','🎶','🎼','🎸','🎹','🎷','🎺','🥁','violin','✨'];
  var SWIPE_THRESHOLD = 70;
  let curTrack = 0, isPlaying = false, playlistPage = 0;
  const tracksPerSlide = 10;

  // DOM Elements
  const plEl = document.getElementById('playlist');
  const playlistMeta = document.getElementById('playlistMeta');
  const playlistPrev = document.getElementById('playlistPrev');
  const playlistNext = document.getElementById('playlistNext');
  const audioEl = document.getElementById('audioPlayer');
  const progressFill = document.getElementById('progressFill');
  const playBtn = document.getElementById('playBtn');
  const stack = document.getElementById('musicStack');

  var mcTotal = tracks.length;
  var mcAnimating = false;
  var mcCards = [];

  // Initialize source
  if (audioEl && tracks.length > 0) {
    audioEl.src = tracks[0].src;
  }

  // Helper: Random Durations
  function getRandomDuration() {
    var minutes = Math.floor(Math.random() * 3) + 2;
    var seconds = Math.floor(Math.random() * 60);
    return String(minutes) + ':' + String(seconds).padStart(2, '0');
  }

  // Update track meta details
  function updateTrackInfo() {
    const nameEl = document.getElementById('trackName');
    const moodEl = document.getElementById('trackMood');
    if (nameEl) nameEl.textContent = tracks[curTrack].name;
    if (moodEl) moodEl.textContent = `Downloaded playlist - ${String(curTrack + 1).padStart(2, '0')} of ${tracks.length}`;
    if (progressFill) progressFill.style.width = '0%';
  }

  // Playing state sync
  function setPlayingState(playing) {
    isPlaying = playing;
    if (playBtn) playBtn.innerHTML = playing ? '&#10074;&#10074;' : '&#9654;';
    const vinyl = document.getElementById('vinyl');
    if (vinyl) vinyl.classList.toggle('spinning', playing);
    updateMcPlayState();
  }

  function playCurrent() {
    // Stop background letter music immediately to prevent mixing
    if (window.khatAudio && !window.khatAudio.paused) {
      window.khatAudio.pause();
    }
    if (!audioEl) return;
    const playPromise = audioEl.play();
    if (playPromise) {
      playPromise.catch(() => setPlayingState(false));
    }
  }

  // Load track info internally
  function selectTrack(i, autoPlay = false) {
    curTrack = (i + tracks.length) % tracks.length;
    if (audioEl) {
      audioEl.src = tracks[curTrack].src;
      audioEl.load();
    }
    playlistPage = Math.floor(curTrack / tracksPerSlide);
    updateTrackInfo();
    renderPlaylist();
    if (autoPlay) playCurrent();
    
    // In-place virtual stack sync
    setTimeout(syncMcLabel, 30);
  }

  function togglePlay() {
    if (!audioEl) return;
    if (audioEl.paused) playCurrent();
    else audioEl.pause();
  }

  function updateProgress() {
    if (!audioEl) return;
    const duration = audioEl.duration;
    const pct = Number.isFinite(duration) && duration > 0 ? (audioEl.currentTime / duration) * 100 : 0;
    if (progressFill) progressFill.style.width = pct + '%';
    
    // Update active music card progress bar
    var mcProgressFill = document.getElementById('mc-progress-fill-' + curTrack);
    if (mcProgressFill) mcProgressFill.style.width = pct + '%';
  }

  function prevTrack() { selectTrack(curTrack - 1, isPlaying); }
  function nextTrack(autoPlay = isPlaying) { selectTrack(curTrack + 1, autoPlay); }

  function slidePlaylist(dir) {
    playlistPage += dir;
    renderPlaylist();
  }

  function seekTrack(e, bar) {
    if (!audioEl) return;
    const duration = audioEl.duration;
    if (!Number.isFinite(duration) || duration <= 0) return;
    const r = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    audioEl.currentTime = pct * duration;
    if (progressFill) progressFill.style.width = (pct * 100) + '%';
  }

  // Core Playlist Renderer (updates the hidden DOM node list cleanly for compatibility)
  function renderPlaylist() {
    if (!plEl) return;
    const pageCount = Math.ceil(tracks.length / tracksPerSlide);
    playlistPage = Math.max(0, Math.min(playlistPage, pageCount - 1));
    const start = playlistPage * tracksPerSlide;
    const end = Math.min(start + tracksPerSlide, tracks.length);
    plEl.innerHTML = '';
    for (let i = start; i < end; i++) {
      const t = tracks[i];
      const el = document.createElement('div');
      el.className = 'pi' + (i === curTrack ? ' active' : '');
      el.title = t.name;
      el.innerHTML = `<span class="pi-num">${String(i + 1).padStart(2, '0')}</span><span class="pi-title">${t.name}</span><span class="pi-e">${t.e}</span>`;
      el.onclick = () => selectTrack(i, true);
      plEl.appendChild(el);
    }
    if (playlistPrev) playlistPrev.disabled = playlistPage === 0;
    if (playlistNext) playlistNext.disabled = playlistPage === pageCount - 1;
    if (playlistMeta) playlistMeta.textContent = `Songs ${String(start + 1).padStart(2, '0')}-${String(end).padStart(2, '0')} of ${tracks.length}`;
  }

  // Audio Listeners
  if (audioEl) {
    audioEl.addEventListener('timeupdate', updateProgress);
    audioEl.addEventListener('loadedmetadata', function() {
      updateProgress();
      updateMcDuration();
    });
    audioEl.addEventListener('play', () => setPlayingState(true));
    audioEl.addEventListener('pause', () => setPlayingState(false));
    audioEl.addEventListener('ended', () => nextTrack(true));
  }

  // ===== VIRTUALIZED MUSIC CARD STACK =====
  // Generates only 5 cards in the stack to reduce DOM footprint to virtually zero and optimize scroll & swiping physics!
  function buildMusicCards() {
    if (!stack) return;
    stack.innerHTML = '';
    mcTotal = tracks.length;

    // Render exactly 5 sliding window cards in reverse order (bottom-first, top-active-last)
    for (var offset = 4; offset >= 0; offset--) {
      var i = (curTrack + offset) % mcTotal;
      var t = tracks[i];
      var card = document.createElement('div');
      
      card.className = 'stack-card music-card' + (offset === 0 ? ' active' : '');
      card.setAttribute('data-track-index', i);
      card.setAttribute('data-offset', offset);

      var emoji = EMOJIS[i % EMOJIS.length];
      var duration = t.duration || getRandomDuration();
      if (!t.duration) t.duration = duration; // cache it
      var artist = t.artist || "munni's's Playlist";

      var trackImgSrc = getTrackImage(i);
      card.innerHTML =
        '<div class="music-card-cover">' +
          '<img class="cover-bg-image" src="' + trackImgSrc + '" alt="' + t.name + ' cover">' +
          '<div class="cover-overlay"></div>' +
          '<span class="music-swipe-arrow left">◀</span>' +
          '<span class="music-swipe-arrow right">▶</span>' +
        '</div>' +
        '<div class="card-content">' +
          '<div class="music-card-track-info">' +
            '<div class="music-card-title" id="mc-title-' + i + '">' + t.name + '</div>' +
            '<div class="music-card-meta">' +
              '<span class="music-card-artist">' + artist + '</span>' +
              '<span class="music-card-duration" id="mc-duration-' + i + '">' + duration + '</span>' +
            '</div>' +
            '<div class="music-progress-bar" id="mc-progress-' + i + '">' +
              '<div class="music-progress-fill" id="mc-progress-fill-' + i + '"></div>' +
            '</div>' +
            '<div class="music-card-controls">' +
              '<button class="mc-nav-btn mc-prev" data-track="' + i + '" aria-label="Previous">' +
                '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="display: block;"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>' +
              '</button>' +
              '<button class="mc-play-btn" data-track="' + i + '" aria-label="Play track">' +
                '<span class="play-icon">' +
                  '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="display: block; transform: translateX(1px);"><path d="M8 5v14l11-7z"/></svg>' +
                '</span>' +
              '</button>' +
              '<button class="mc-nav-btn mc-next" data-track="' + i + '" aria-label="Next">' +
                '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="display: block;"><path d="M6 18l8.5-6L6 6zm9-12h2v12h-2z"/></svg>' +
              '</button>' +
              '<div class="music-playing-indicator">' +
                '<span></span><span></span><span></span>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';

      stack.appendChild(card);
    }

    mcCards = Array.from(stack.querySelectorAll('.stack-card'));

    // Apply stacking translations based on virtual offset
    mcCards.forEach(function (card) {
      var offset = parseInt(card.getAttribute('data-offset'));
      card.style.zIndex = 5 - offset;
      card.style.transform = 'translateY(' + (offset * 4) + 'px) scale(' + (1 - offset * 0.03) + ')';
      card.style.opacity = offset < 4 ? '1' : '0';
    });

    updateMcCounter();
    updateMcPlayState();
  }

  // Update card counter text
  function updateMcCounter() {
    var el = document.getElementById('musicCounter');
    if (el) el.textContent = (curTrack + 1) + ' / ' + mcTotal;
  }

  // Sync labels in-place
  function syncMcLabel() {
    var activeCard = stack ? stack.querySelector('.stack-card.active') : null;
    if (!activeCard) return;
    var nameEl = activeCard.querySelector('.music-card-title');
    if (nameEl) nameEl.textContent = tracks[curTrack].name;
    var numEl = activeCard.querySelector('.cover-track-num');
    if (numEl) numEl.textContent = 'Track ' + String(curTrack + 1).padStart(2, '0') + ' of ' + mcTotal;
    
    // Reset progress fill
    var progressFillEl = activeCard.querySelector('.music-progress-fill');
    if (progressFillEl) progressFillEl.style.width = '0%';
    updateMcCounter();
    updateMcPlayState();
  }

  // Set visual play states on button indicators
  function updateMcPlayState() {
    document.querySelectorAll('.mc-play-btn').forEach(function (btn) {
      var trackIndex = parseInt(btn.getAttribute('data-track'));
      var isCurrentTrack = trackIndex === curTrack;
      var icon = btn.querySelector('.play-icon');
      if (icon) {
        icon.innerHTML = isCurrentTrack && isPlaying 
          ? '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="display: block;"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>'
          : '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="display: block; transform: translateX(1px);"><path d="M8 5v14l11-7z"/></svg>';
      }
    });
    
    var activeCard = stack ? stack.querySelector('.stack-card.active') : null;
    if (activeCard) {
      activeCard.classList.toggle('is-playing', isPlaying);
    }
  }

  // Sync track duration once loaded
  function updateMcDuration() {
    var activeCard = stack ? stack.querySelector('.stack-card.active') : null;
    if (!activeCard || !audioEl) return;
    var durationEl = activeCard.querySelector('.music-card-duration');
    if (durationEl && audioEl.duration) {
      var mins = Math.floor(audioEl.duration / 60);
      var secs = Math.floor(audioEl.duration % 60);
      durationEl.textContent = mins + ':' + String(secs).padStart(2, '0');
      tracks[curTrack].duration = mins + ':' + String(secs).padStart(2, '0');
    }
  }

  // Card fly-off animation
  function flyMusicCard(direction) {
    if (mcAnimating || !stack) return;
    mcAnimating = true;

    var active = stack.querySelector('.stack-card.active');
    if (!active) { mcAnimating = false; return; }

    var xTarget = direction === 'right' ? '130%' : '-130%';
    var rot = direction === 'right' ? '14deg' : '-14deg';

    active.style.transition = 'transform 0.32s ease-out, opacity 0.32s';
    active.style.transform = 'translateX(' + xTarget + ') rotate(' + rot + ')';
    active.style.opacity = '0';

    // Slide up remaining stack cards smoothly
    mcCards.forEach(function (c) {
      if (c === active) return;
      var offset = parseInt(c.getAttribute('data-offset'));
      var newOffset = offset - 1;
      c.style.transition = 'transform 0.38s cubic-bezier(0.34,1.56,0.64,1), opacity 0.38s';
      c.style.transform = 'translateY(' + (newOffset * 4) + 'px) scale(' + (1 - newOffset * 0.03) + ')';
      c.style.opacity = newOffset < 4 ? '1' : '0';
    });

    setTimeout(function () {
      // Rebuild the 5 virtual cards representing the new window of current track
      buildMusicCards();
      mcAnimating = false;
    }, 325);
  }

  // Debounces for sliding actions
  var mcNextDebounce = false;
  var mcPrevDebounce = false;

  function mcGoNext() {
    if (mcNextDebounce || mcAnimating) return;
    mcNextDebounce = true;
    flyMusicCard('left');
    nextTrack(isPlaying);
    setTimeout(function () { mcNextDebounce = false; }, 500);
  }

  function mcGoPrev() {
    if (mcPrevDebounce || mcAnimating) return;
    mcPrevDebounce = true;
    flyMusicCard('right');
    prevTrack();
    setTimeout(function () { mcPrevDebounce = false; }, 500);
  }

  // Navigation Arrows
  const musicNextBtn = document.getElementById('musicNextBtn');
  const musicPrevBtn = document.getElementById('musicPrevBtn');
  if (musicNextBtn) musicNextBtn.addEventListener('click', mcGoNext);
  if (musicPrevBtn) musicPrevBtn.addEventListener('click', mcGoPrev);

  // ===== TOUCH DRAG & SWIPE DETECTIONS =====
  var mcTouchStartX = 0;
  var mcDragStateRight = false;
  var mcDragStateLeft = false;
  var mcCurrentCard = null;

  if (stack) {
    stack.addEventListener('touchstart', function (e) {
      if (mcAnimating) return;
      mcTouchStartX = e.touches[0].clientX;
      mcCurrentCard = stack.querySelector('.stack-card.active');
      if (mcCurrentCard) mcCurrentCard.style.transition = 'none';
      mcDragStateRight = false;
      mcDragStateLeft = false;
    }, { passive: true });

    stack.addEventListener('touchmove', function (e) {
      if (!mcCurrentCard || mcAnimating) return;
      var dx = e.touches[0].clientX - mcTouchStartX;
      mcCurrentCard.style.transform = 'translateX(' + dx + 'px) rotate(' + (dx * 0.025) + 'deg)';
      
      var nextRight = dx > 10;
      var nextLeft = dx < -10;
      if (nextRight !== mcDragStateRight) {
        mcDragStateRight = nextRight;
        stack.classList.toggle('dragging-right', nextRight);
      }
      if (nextLeft !== mcDragStateLeft) {
        mcDragStateLeft = nextLeft;
        stack.classList.toggle('dragging-left', nextLeft);
      }
    }, { passive: true });

    stack.addEventListener('touchend', function (e) {
      if (mcDragStateRight || mcDragStateLeft) {
        stack.classList.remove('dragging-right', 'dragging-left');
        mcDragStateRight = false;
        mcDragStateLeft = false;
      }
      if (!mcCurrentCard) return;
      var dx = e.changedTouches[0].clientX - mcTouchStartX;
      if (Math.abs(dx) >= SWIPE_THRESHOLD) {
        if (dx > 0) {
          // Swipe right -> Next Track
          mcGoNext();
        } else {
          // Swipe left -> Prev Track
          mcGoPrev();
        }
      } else {
        mcCurrentCard.style.transition = 'transform 0.3s ease';
        mcCurrentCard.style.transform = '';
      }
      mcCurrentCard = null;
    }, { passive: true });

    // ===== MOUSE DRAG DETECTIONS =====
    var mcDragging = false;
    var mcDragStartX = null;

    stack.addEventListener('mousedown', function (e) {
      if (mcAnimating) return;
      mcDragging = true;
      mcDragStartX = e.clientX;
      mcCurrentCard = stack.querySelector('.stack-card.active');
      if (mcCurrentCard) mcCurrentCard.style.transition = 'none';
      mcDragStateRight = false;
      mcDragStateLeft = false;
    });

    document.addEventListener('mousemove', function (e) {
      if (!mcDragging || !mcCurrentCard || mcAnimating) return;
      var dx = e.clientX - mcDragStartX;
      mcCurrentCard.style.transform = 'translateX(' + dx + 'px) rotate(' + (dx * 0.025) + 'deg)';
      
      var nextRight = dx > 10;
      var nextLeft = dx < -10;
      if (nextRight !== mcDragStateRight) {
        mcDragStateRight = nextRight;
        stack.classList.toggle('dragging-right', nextRight);
      }
      if (nextLeft !== mcDragStateLeft) {
        mcDragStateLeft = nextLeft;
        stack.classList.toggle('dragging-left', nextLeft);
      }
    });

    document.addEventListener('mouseup', function (e) {
      if (mcDragStateRight || mcDragStateLeft) {
        stack.classList.remove('dragging-right', 'dragging-left');
        mcDragStateRight = false;
        mcDragStateLeft = false;
      }
      if (!mcDragging || !mcCurrentCard) return;
      mcDragging = false;
      var dx = e.clientX - mcDragStartX;
      if (Math.abs(dx) >= SWIPE_THRESHOLD) {
        if (dx > 0) {
          // Swipe right -> Next Track
          mcGoNext();
        } else {
          // Swipe left -> Prev Track
          mcGoPrev();
        }
      } else {
        mcCurrentCard.style.transition = 'transform 0.3s ease';
        mcCurrentCard.style.transform = '';
      }
      mcCurrentCard = null;
      mcDragStartX = null;
    });

    // ===== PARENT EVENT DELEGATION (PERFORMANCE BOOST) =====
    stack.addEventListener('click', function (e) {
      // 1. Play/Pause card toggle
      var playBtn = e.target.closest('.mc-play-btn');
      if (playBtn) {
        e.stopPropagation();
        e.preventDefault();
        var trackIndex = parseInt(playBtn.getAttribute('data-track'));
        if (trackIndex === curTrack) {
          togglePlay();
        } else {
          selectTrack(trackIndex, true);
        }
        return;
      }

      // 2. Next track button on card
      var nextBtn = e.target.closest('.mc-next');
      if (nextBtn) {
        e.stopPropagation();
        e.preventDefault();
        mcGoNext();
        return;
      }

      // 3. Previous track button on card
      var prevBtn = e.target.closest('.mc-prev');
      if (prevBtn) {
        e.stopPropagation();
        e.preventDefault();
        mcGoPrev();
        return;
      }

      // 4. Progress bar seek on card
      var progressBar = e.target.closest('.music-progress-bar');
      if (progressBar && audioEl && audioEl.duration) {
        e.stopPropagation();
        var rect = progressBar.getBoundingClientRect();
        var pct = (e.clientX - rect.left) / rect.width;
        audioEl.currentTime = pct * audioEl.duration;
        return;
      }

      // 5. Click on card body — open track picker modal
      var cardBody = e.target.closest('.music-card');
      if (cardBody) {
        e.stopPropagation();
        e.preventDefault();
        openTrackPicker();
        return;
      }
    });
  }

  // ===== STOP LETTER BACKGROUND MUSIC WHEN REACHING MUSIC SECTION =====
  try {
    const musicSection = document.getElementById('music');
    if (musicSection) {
      const musicObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Fade out and pause the birthday letter's background music
            if (window.khatAudio && !window.khatAudio.paused) {
              console.log("Reached music section - fading out background music...");
              let vol = window.khatAudio.volume;
              const fadeInterval = setInterval(() => {
                if (vol > 0.05) {
                  vol -= 0.05;
                  window.khatAudio.volume = Math.max(0, vol);
                } else {
                  clearInterval(fadeInterval);
                  window.khatAudio.pause();
                  console.log("Background music paused.");
                }
              }, 40);
            }
          }
        });
      }, { threshold: 0.1 });
      musicObserver.observe(musicSection);
    }
  } catch (e) {
    console.warn("Could not set up scroll audio observer:", e);
  }

  // Global exports for controls (keep compatibility for navigation, etc.)
  window.selectTrack = selectTrack;
  window.togglePlay = togglePlay;
  window.prevTrack = prevTrack;
  window.nextTrack = nextTrack;
  window.slidePlaylist = slidePlaylist;
  window.seekTrack = seekTrack;

  // ===== TRACK PICKER MODAL =====
  var pickerOverlay = document.getElementById('musicPickerOverlay');
  var pickerGrid = document.getElementById('musicPickerGrid');
  var pickerClose = document.getElementById('musicPickerClose');

  window.openTrackPicker = function openTrackPicker() {
    if (!pickerOverlay || !pickerGrid) return;

    pickerGrid.innerHTML = '';
    tracks.forEach(function(t, i) {
      var item = document.createElement('div');
      item.className = 'music-picker-item' + (i === curTrack ? ' active' : '');
      item.setAttribute('data-track-idx', i);

      var img = document.createElement('img');
      img.className = 'music-picker-item-img';
      img.src = getTrackImage(i);
      img.alt = t.name;
      img.loading = 'lazy';

      var name = document.createElement('div');
      name.className = 'music-picker-item-name';
      name.textContent = t.name;

      item.appendChild(img);
      item.appendChild(name);

      item.addEventListener('click', function(e) {
        e.stopPropagation();
        var idx = parseInt(this.getAttribute('data-track-idx'));
        selectTrack(idx, true);
        closeTrackPicker();
      });

      pickerGrid.appendChild(item);
    });

    pickerOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  };

  function closeTrackPicker() {
    if (!pickerOverlay) return;
    pickerOverlay.classList.remove('show');
    document.body.style.overflow = '';
  }
  window.closeTrackPicker = closeTrackPicker;

  if (pickerClose) {
    pickerClose.addEventListener('click', closeTrackPicker);
  }

  if (pickerOverlay) {
    pickerOverlay.addEventListener('click', function(e) {
      if (e.target === pickerOverlay) closeTrackPicker();
    });
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && pickerOverlay && pickerOverlay.classList.contains('show')) {
      closeTrackPicker();
    }
  });

  // Initialize
  buildMusicCards();
  renderPlaylist();
  updateTrackInfo();
})();
