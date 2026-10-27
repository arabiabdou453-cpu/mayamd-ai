(function(){
  var U = 'assets/video/6ad5139e0020923d27ef6cbe_mayamd-care-loop.mp4', n = 0;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var st = document.createElement('style');
  st.textContent = '.mmx-duo-bg .mmx-vid{position:absolute;top:-12px;left:-12px;width:calc(100% + 24px);height:calc(100% + 24px);object-fit:cover;filter:grayscale(1) sepia(1) hue-rotate(218deg) saturate(3.2) contrast(1.35) brightness(1.15) blur(1px);opacity:0;transition:opacity 1.4s ease}.mmx-duo-bg .mmx-vid.on{opacity:1}';
  document.head.appendChild(st);
  function add() {
    var hs = document.querySelectorAll('h1,h2'), sec = null;
    for (var i = 0; i < hs.length; i++) {
      if (hs[i].textContent.toLowerCase().indexOf('make every discharge a safe one') > -1) {
        sec = hs[i].closest('section');
        break;
      }
    }
    var bg = sec && sec.querySelector('.mmx-duo-bg');
    if (!bg) {
      if (n++ < 30) setTimeout(add, 200);
      return;
    }
    if (bg.querySelector('video')) return;
    var v = document.createElement('video');
    v.className = 'mmx-vid';
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    v.setAttribute('aria-hidden', 'true');
    v.preload = 'auto';
    v.src = U;
    v.addEventListener('playing', function () { v.classList.add('on'); });
    bg.insertBefore(v, bg.children[1]);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) {
          var p = v.play();
          if (p && p.catch) p.catch(function () {});
        } else {
          v.pause();
        }
      }, { threshold: .1 }).observe(sec);
    } else {
      v.play();
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(add, 50); });
  } else {
    add();
  }
})();
