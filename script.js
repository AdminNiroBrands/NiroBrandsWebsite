(function () {
  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function setupCarousel(root) {
    const track = root.querySelector(".carousel-track");
    const slides = Array.from(root.querySelectorAll(".carousel-slide"));
    const prevBtn = root.querySelector(".carousel-btn.prev");
    const nextBtn = root.querySelector(".carousel-btn.next");
    const dotsWrap = root.querySelector(".carousel-dots");
    const viewport = root.querySelector(".carousel-viewport");

    if (!track || slides.length === 0 || !viewport) return;

    // Build dots
    dotsWrap.innerHTML = "";
    const dots = slides.map((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "dot";
      b.setAttribute("aria-label", `Go to brand ${i + 1}`);
      b.addEventListener("click", () => goTo(i));
      dotsWrap.appendChild(b);
      return b;
    });

    let index = 0;
    let isDragging = false;
    let startX = 0;
    let startTranslate = 0;

    function getTranslateX() {
      const m = track.style.transform.match(/translate3d\(([-0-9.]+)px/);
      return m ? parseFloat(m[1]) : 0;
    }

    function setActive(i) {
      slides.forEach((s, idx) => s.classList.toggle("is-active", idx === i));
      dots.forEach((d, idx) => d.classList.toggle("is-active", idx === i));
      index = i;
    }

    function centerSlide(i) {
      // measure current slide center relative to track
      const slide = slides[i];
      const viewportRect = viewport.getBoundingClientRect();
      const slideRect = slide.getBoundingClientRect();

      // current transform
      const currentX = getTranslateX();

      // delta needed to align slide center to viewport center
      const viewportCenter = viewportRect.left + viewportRect.width / 2;
      const slideCenter = slideRect.left + slideRect.width / 2;
      const delta = viewportCenter - slideCenter;

      // Apply transform
      const nextX = currentX + delta;
      track.style.transform = `translate3d(${nextX}px, 0, 0)`;
    }

    function goTo(i) {
      const next = clamp(i, 0, slides.length - 1);
      setActive(next);

      // Allow active class to apply before centering (for scaled measurements)
      requestAnimationFrame(() => {
        centerSlide(next);
      });
    }

    function next() { goTo((index + 1) % slides.length) }
    function prev() { goTo((index - 1) + slides.length) }

    prevBtn && prevBtn.addEventListener("click", prev);
    nextBtn && nextBtn.addEventListener("click", next);

    // Keyboard support
    root.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    });

    // Touch/drag support
    function onDown(e) {
      isDragging = true;
      track.style.transition = "none";

      startX = (e.touches ? e.touches[0].clientX : e.clientX);
      startTranslate = getTranslateX();
    }

    function onMove(e) {
      if (!isDragging) return;
      const x = (e.touches ? e.touches[0].clientX : e.clientX);
      const dx = x - startX;
      track.style.transform = `translate3d(${startTranslate + dx}px, 0, 0)`;
    }

    function onUp(e) {
      if (!isDragging) return;
      isDragging = false;
      track.style.transition = "";

      const endX = (e.changedTouches ? e.changedTouches[0].clientX : e.clientX);
      const dx = endX - startX;

      // swipe threshold
      if (dx < -40) next();
      else if (dx > 40) prev();
      else goTo(index);
    }

    viewport.addEventListener("mousedown", onDown);
    viewport.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    viewport.addEventListener("touchstart", onDown, { passive: true });
    viewport.addEventListener("touchmove", onMove, { passive: true });
    viewport.addEventListener("touchend", onUp);

    // Recenter on resize
    let resizeTimer = null;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => goTo(index), 80);
    });

    // Init
    // Start centered on middle item if available
    const startIndex = Math.floor(slides.length / 2);
    setActive(startIndex);

    // Ensure track starts with no previous transform
    track.style.transform = "translate3d(0px,0,0)";
    requestAnimationFrame(() => goTo(startIndex));
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('[data-carousel="brands"]').forEach(setupCarousel);
  });
})();
