(function(){
  'use strict';

  /* ---- Top nav background on scroll ---- */
  var topnav = document.getElementById('topnav');
  function onScroll(){
    if(window.scrollY > 40){ topnav.classList.add('scrolled'); }
    else { topnav.classList.remove('scrolled'); }
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  /* ---- Selector strip: scroll to section + active state ---- */
  var selCards = document.querySelectorAll('.sel-card');
  var sections = Array.prototype.map.call(selCards, function(c){
    return document.querySelector(c.getAttribute('data-target'));
  });

  selCards.forEach(function(card){
    card.addEventListener('click', function(){
      var target = document.querySelector(card.getAttribute('data-target'));
      if(target){ target.scrollIntoView({behavior:'smooth', block:'start'}); }
    });
  });

  function updateActiveSelector(){
    var scrollPos = window.scrollY + window.innerHeight * 0.35;
    var activeIdx = 0;
    sections.forEach(function(sec, i){
      if(sec && sec.offsetTop <= scrollPos){ activeIdx = i; }
    });
    selCards.forEach(function(c, i){
      c.classList.toggle('active', i === activeIdx);
    });
  }
  window.addEventListener('scroll', updateActiveSelector, {passive:true});
  updateActiveSelector();

  /* ---- Lightbox ---- */
  var lightbox = document.getElementById('lightbox');
  var lbImage = document.getElementById('lbImage');
  var lbImgWrap = document.getElementById('lbImgWrap');
  var lbCaption = document.getElementById('lbCaption');
  var lbClose = document.getElementById('lbClose');
  var lbPrev = document.getElementById('lbPrev');
  var lbNext = document.getElementById('lbNext');

  // Build a registry of images grouped by category (data-cat on .gallery-grid)
  var categories = {}; // { catName: [ {src, alt, num} ] }
  document.querySelectorAll('.gallery-grid').forEach(function(grid){
    var cat = grid.getAttribute('data-cat');
    var items = [];
    grid.querySelectorAll('.art-card').forEach(function(card){
      var img = card.querySelector('img');
      items.push({ src: img.src, alt: img.alt });
    });
    categories[cat] = items;
    // attach click handlers
    grid.querySelectorAll('.art-card').forEach(function(card, idx){
      card.addEventListener('click', function(){
        openLightbox(cat, idx);
      });
    });
  });

  var currentCat = null;
  var currentIdx = 0;

  function openLightbox(cat, idx){
    currentCat = cat;
    currentIdx = idx;
    renderLightbox();
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function renderLightbox(){
    var items = categories[currentCat];
    if(!items || !items.length) return;
    resetZoom();
    var item = items[currentIdx];
    lbImage.src = item.src;
    lbImage.alt = item.alt;
    lbCaption.textContent = item.alt + '  —  ' + (currentIdx + 1) + ' / ' + items.length;
  }

  function closeLightbox(){
    resetZoom();
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  /* ---- Click-to-zoom + drag-to-pan ---- */
  function resetZoom(){
    lbImage.classList.remove('zoomed');
    lbImgWrap.classList.remove('zoomed');
    lbImgWrap.scrollLeft = 0;
    lbImgWrap.scrollTop = 0;
  }

  function toggleZoom(e){
    var zoomingIn = !lbImage.classList.contains('zoomed');
    // Capture click point relative to the image before layout changes.
    var rect = lbImage.getBoundingClientRect();
    var xPct = (e.clientX - rect.left) / rect.width;
    var yPct = (e.clientY - rect.top) / rect.height;

    lbImage.classList.toggle('zoomed', zoomingIn);
    lbImgWrap.classList.toggle('zoomed', zoomingIn);

    if(zoomingIn){
      requestAnimationFrame(function(){
        var wrapRect = lbImgWrap.getBoundingClientRect();
        lbImgWrap.scrollLeft = xPct * lbImage.offsetWidth - wrapRect.width / 2;
        lbImgWrap.scrollTop = yPct * lbImage.offsetHeight - wrapRect.height / 2;
      });
    } else {
      lbImgWrap.scrollLeft = 0;
      lbImgWrap.scrollTop = 0;
    }
  }

  var isPanning = false, dragMoved = false;
  var panStartX = 0, panStartY = 0, scrollStartX = 0, scrollStartY = 0;

  lbImage.addEventListener('mousedown', function(e){
    if(!lbImage.classList.contains('zoomed')) return;
    isPanning = true;
    dragMoved = false;
    panStartX = e.clientX; panStartY = e.clientY;
    scrollStartX = lbImgWrap.scrollLeft; scrollStartY = lbImgWrap.scrollTop;
    lbImgWrap.classList.add('panning');
    e.preventDefault();
  });
  window.addEventListener('mousemove', function(e){
    if(!isPanning) return;
    var dx = e.clientX - panStartX, dy = e.clientY - panStartY;
    if(Math.abs(dx) > 4 || Math.abs(dy) > 4){ dragMoved = true; }
    lbImgWrap.scrollLeft = scrollStartX - dx;
    lbImgWrap.scrollTop = scrollStartY - dy;
  });
  window.addEventListener('mouseup', function(){
    isPanning = false;
    lbImgWrap.classList.remove('panning');
  });

  lbImage.addEventListener('click', function(e){
    e.stopPropagation();
    if(dragMoved){ dragMoved = false; return; }
    toggleZoom(e);
  });

  function showPrev(){
    var items = categories[currentCat];
    if(!items) return;
    currentIdx = (currentIdx - 1 + items.length) % items.length;
    renderLightbox();
  }
  function showNext(){
    var items = categories[currentCat];
    if(!items) return;
    currentIdx = (currentIdx + 1) % items.length;
    renderLightbox();
  }

  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', function(e){ e.stopPropagation(); showPrev(); });
  lbNext.addEventListener('click', function(e){ e.stopPropagation(); showNext(); });

  lightbox.addEventListener('click', function(e){
    if(e.target === lightbox){ closeLightbox(); }
  });

  document.addEventListener('keydown', function(e){
    if(!lightbox.classList.contains('open')) return;
    if(e.key === 'Escape'){ closeLightbox(); }
    else if(e.key === 'ArrowLeft'){ showPrev(); }
    else if(e.key === 'ArrowRight'){ showNext(); }
  });

})();
