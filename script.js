'use strict';

/* ── Guest personalization (?guest=Іванку or #Іванку) ── */
(function () {
  const raw = new URLSearchParams(window.location.search).get('guest')
    || (window.location.hash.length > 1 ? window.location.hash.slice(1) : null);

  if (!raw) return;

  const name = decodeURIComponent(raw.replace(/\+/g, ' '));

  // Personalize the salutation on the letter slide
  const salutation = document.getElementById('intro-salutation');
  if (salutation) salutation.textContent = name + '!';

  // Pre-fill and hide the name field in the RSVP form
  const nameInput = document.getElementById('f-name');
  if (nameInput) {
    nameInput.value = name;
    const nameField = nameInput.closest('.field');
    if (nameField) nameField.hidden = true;
  }
})();

/* ── Opening ritual ── */
const inviteStart = document.getElementById('invite-start');
const inviteOpen  = document.getElementById('invite-open');
const heroSection = document.getElementById('top');

function openInvite() {
  heroSection.classList.remove('hero--sealed');
  inviteStart.classList.add('is-leaving');

  const hideOverlay = () => {
    inviteStart.hidden = true;
    window.dispatchEvent(new Event('scroll'));
  };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    hideOverlay();
    return;
  }

  setTimeout(hideOverlay, 500);
}

inviteOpen.addEventListener('click', openInvite);

/* ── Nav: add scrolled class once past most of the hero ── */
const nav = document.getElementById('site-nav');
function updateNavScrolled() {
  const threshold = Math.max(120, window.innerHeight * 0.7);
  nav.classList.toggle('scrolled', window.scrollY > threshold);
}
window.addEventListener('scroll', updateNavScrolled, { passive: true });
window.addEventListener('resize', updateNavScrolled, { passive: true });
updateNavScrolled();


/* ── Countdown timer ── */
(function () {
  const cdDays    = document.getElementById('cd-days');
  if (!cdDays) return;

  const cdHours   = document.getElementById('cd-hours');
  const cdMinutes = document.getElementById('cd-minutes');
  const cdSeconds = document.getElementById('cd-seconds');
  const cdEl      = document.getElementById('countdown');
  const cdDaysLabel    = cdDays.nextElementSibling;
  const cdHoursLabel   = cdHours.nextElementSibling;
  const cdMinutesLabel = cdMinutes.nextElementSibling;
  const cdSecondsLabel = cdSeconds.nextElementSibling;

  const wedding = new Date('2026-06-06T14:00:00');

  function pluralUk(n, one, few, many) {
    const mod100 = n % 100, mod10 = n % 10;
    if (mod100 >= 11 && mod100 <= 19) return many;
    if (mod10 === 1) return one;
    if (mod10 >= 2 && mod10 <= 4) return few;
    return many;
  }

  function pad(n) { return String(Math.max(0, n)).padStart(2, '0'); }

  function setDigit(el, val) {
    const str = pad(val);
    if (el.textContent === str) return;
    el.textContent = str;
    el.classList.remove('ticking');
    void el.offsetWidth;
    el.classList.add('ticking');
  }

  function updateCountdown() {
    const diff = wedding - Date.now();
    if (diff <= 0) {
      cdEl.classList.add('countdown--expired');
      cdEl.innerHTML = '<p class="countdown__value" style="font-style:italic;min-width:unset;font-size:clamp(1rem,2.5vw,1.5rem)">Сьогодні щасливий день!</p>';
      return;
    }
    const total   = Math.floor(diff / 1000);
    const days    = Math.floor(total / 86400);
    const hours   = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    setDigit(cdDays, days);    setDigit(cdHours, hours);
    setDigit(cdMinutes, minutes); setDigit(cdSeconds, seconds);
    cdDaysLabel.textContent    = pluralUk(days,    'день',    'дні',    'днів');
    cdHoursLabel.textContent   = pluralUk(hours,   'година',  'години',  'годин');
    cdMinutesLabel.textContent = pluralUk(minutes, 'хвилина', 'хвилини', 'хвилин');
    cdSecondsLabel.textContent = pluralUk(seconds, 'секунда', 'секунди', 'секунд');
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
})();

/* ── Slide reveal ── */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const items = Array.from(entry.target.querySelectorAll('.reveal-item'));
      items.forEach((item, i) => {
        item.style.transitionDelay = `${i * 110}ms`;
      });
      entry.target.classList.add('slide--entered');
      slideObserver.unobserve(entry.target);
    });
  }, { threshold: 0.10 });

  document.querySelectorAll('.slide').forEach((slide) => {
    /* Hero already animates via CSS keyframes — just mark entered */
    if (slide.classList.contains('hero')) {
      slide.classList.add('slide--entered');
    } else {
      slideObserver.observe(slide);
    }
  });
}

/* ── Parallax for [data-parallax] images ── */
if (!prefersReducedMotion) {
  const parallaxImgs = Array.from(document.querySelectorAll('[data-parallax]'));

  if (parallaxImgs.length > 0) {
    const viewportH = () => window.innerHeight;
    let parallaxRaf = null;

    const updateParallax = () => {
      const vh = viewportH();
      const center = vh / 2;
      parallaxImgs.forEach((img) => {
        const speed = parseFloat(img.dataset.parallax) || 0.18;
        const container = img.parentElement;
        const rect = container.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > vh + 200) return;
        const elementCenter = rect.top + rect.height / 2;
        const offset = (elementCenter - center) * speed;
        img.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      });
      parallaxRaf = null;
    };

    const onScroll = () => {
      if (parallaxRaf !== null) return;
      parallaxRaf = requestAnimationFrame(updateParallax);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    updateParallax();
  }
}


/* ── Photo carousel ── */
(function () {
  const track = document.getElementById('gallery-track');
  if (!track) return;

  const slides = Array.from(track.querySelectorAll('.gallery__slide'));
  const total  = slides.length;
  const dots   = Array.from(document.querySelectorAll('.gallery__dot'));
  let current  = 0;

  track.style.width = (total * 100) + '%';
  slides.forEach(s => { s.style.width = (100 / total) + '%'; });

  const announce = document.getElementById('gallery-announce');

  function goTo(index) {
    current = ((index % total) + total) % total;
    track.style.transform = `translateX(-${(current / total) * 100}%)`;
    dots.forEach((d, i) => {
      const active = i === current;
      d.classList.toggle('gallery__dot--active', active);
      d.setAttribute('aria-pressed', String(active));
    });
    if (announce) announce.textContent = `Фото ${current + 1} з ${total}`;
  }

  document.getElementById('gallery-prev')?.addEventListener('click', () => goTo(current - 1));
  document.getElementById('gallery-next')?.addEventListener('click', () => goTo(current + 1));
  dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));

  let startX = 0;
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const delta = startX - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) goTo(delta > 0 ? current + 1 : current - 1);
  }, { passive: true });
})();

/* ── Telegram RSVP ── */
const TELEGRAM_TOKEN   = '8746072923:AAFMEGVxBUHgRFrEcnN1MMRenQhoRyZypzQ';
const TELEGRAM_CHAT_ID = '634140443';

function sendRsvp(name, attending, guest) {
  const status = attending === 'yes' ? 'Так, буде' : 'Не зможе';
  let text = `Підтвердження RSVP\n\nІм'я: ${name}\nПрисутність: ${status}`;
  if (guest) text += `\nСупутник: ${guest}`;
  fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text }),
  }).catch(() => {});
}

/* ── RSVP form ── */
const form    = document.getElementById('rsvp-form');
const success = document.getElementById('rsvp-success');

const nameInput      = document.getElementById('f-name');
const nameError      = document.getElementById('name-error');
const attendingRadios = form.querySelectorAll('input[name="attending"]');
const attendingError = document.getElementById('attending-error');
const guestField     = document.getElementById('guest-field');

function showError(input, errorEl) {
  input.classList.add('is-error');
  errorEl.hidden = false;
}

function clearError(input, errorEl) {
  input.classList.remove('is-error');
  errorEl.hidden = true;
}

nameInput.addEventListener('input', () => clearError(nameInput, nameError));
attendingRadios.forEach((r) => {
  r.addEventListener('change', () => {
    attendingError.hidden = true;
    guestField.hidden = r.value !== 'yes';
  });
});

form.addEventListener('submit', (e) => {
  e.preventDefault();

  let valid = true;

  if (!nameInput.value.trim()) {
    showError(nameInput, nameError);
    valid = false;
  } else {
    clearError(nameInput, nameError);
  }

  const attendingChecked = Array.from(attendingRadios).some((r) => r.checked);
  if (!attendingChecked) {
    attendingError.hidden = false;
    valid = false;
  } else {
    attendingError.hidden = true;
  }

  if (!valid) {
    const errorInput = form.querySelector('.is-error');
    if (errorInput) {
      errorInput.focus();
    } else {
      attendingRadios[0].focus();
    }
    return;
  }

  const attendingVal = Array.from(attendingRadios).find((r) => r.checked)?.value;
  const isAttending  = attendingVal === 'yes';
  const guestVal     = guestField.hidden ? '' : document.getElementById('f-guest').value.trim();

  sendRsvp(nameInput.value.trim(), attendingVal, guestVal);

  if (!isAttending) {
    success.querySelector('.rsvp-success__text').textContent = 'Дякуємо, що повідомили нас.';
    document.getElementById('rsvp-success-sub').textContent = "Будемо пам'ятати про вас у цей день.";
  }

  form.classList.add('is-fading');
  setTimeout(() => {
    form.hidden = true;
    form.classList.remove('is-fading');
    success.hidden = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        success.classList.add('is-visible');
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
  }, 350);
});
