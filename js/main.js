/**
 * 5cubix — Main JavaScript Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  /* ------------------------------------------------------------------------
     1. Text Split & Title Reveal Animations
     ------------------------------------------------------------------------ */
  const splitTitle = (title) => {
    title.classList.add('title-animate');
    title.setAttribute('aria-label', title.innerText.trim());

    const textNodes = [];
    const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    const animateWords = title.matches('.case h3');
    let characterIndex = 0;

    textNodes.forEach((node) => {
      const fragment = document.createDocumentFragment();
      const parts = animateWords
        ? node.textContent.split(/(\s+)/)
        : [...node.textContent];

      parts.forEach((character) => {
        if (animateWords && /^\s+$/.test(character)) {
          fragment.append(document.createTextNode(character));
          return;
        }
        const letter = document.createElement('span');
        letter.className = animateWords ? 'title-word' : 'title-char';
        letter.setAttribute('aria-hidden', 'true');
        letter.textContent = character === ' ' ? '\u00a0' : character;
        letter.style.setProperty(
          '--char-delay',
          `${Math.min(characterIndex++ * (animateWords ? 105 : 24), 900)}ms`
        );
        fragment.append(letter);
      });
      node.replaceWith(fragment);
    });
  };

  const titles = document.querySelectorAll(
    '.hero-title, .section-head h2, .contact > .wrap > h2, .case h3'
  );
  titles.forEach(splitTitle);

  const revealTitle = (title) => title.classList.add('title-is-visible');
  const titleObserver = new IntersectionObserver(
    (entries, observer) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        revealTitle(entry.target);
        observer.unobserve(entry.target);
      }),
    { threshold: 0.42 }
  );

  titles.forEach((title) => {
    if (title.classList.contains('hero-title')) {
      if (document.readyState === 'complete') {
        setTimeout(() => revealTitle(title), 170);
      } else {
        window.addEventListener('load', () => setTimeout(() => revealTitle(title), 170), {
          once: true,
        });
      }
    } else {
      titleObserver.observe(title);
    }
  });

  /* ------------------------------------------------------------------------
     2. Scroll Reveal Animations (.reveal elements)
     ------------------------------------------------------------------------ */
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      }),
    { threshold: 0.14 }
  );

  document.querySelectorAll('.reveal').forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index % 4, 3) * 80}ms`;
    observer.observe(element);
  });

  /* ------------------------------------------------------------------------
     3. Header & Mobile Menu Controls
     ------------------------------------------------------------------------ */
  const header = document.querySelector('.site-header');
  const menuToggle = document.querySelector('.mobile-toggle');

  const closeMenu = () => {
    if (!header || !menuToggle) return;
    header.classList.remove('is-menu-open');
    document.body.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
  };

  if (menuToggle && header) {
    menuToggle.addEventListener('click', () => {
      const isOpen = header.classList.toggle('is-menu-open');
      document.body.classList.toggle('menu-open', isOpen);
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    });
  }

  document
    .querySelectorAll('.mobile-menu a')
    .forEach((link) => link.addEventListener('click', closeMenu));

  let lastScrollY = window.scrollY;
  window.addEventListener(
    'scroll',
    () => {
      if (!header) return;
      const currentScrollY = window.scrollY;
      header.classList.toggle('is-scrolled', currentScrollY > 8);
      header.classList.toggle(
        'is-hidden',
        !header.classList.contains('is-menu-open') &&
          currentScrollY > 120 &&
          currentScrollY > lastScrollY
      );
      lastScrollY = currentScrollY;
    },
    { passive: true }
  );

  window.addEventListener('resize', () => {
    if (window.innerWidth > 720) closeMenu();
  });

  /* ------------------------------------------------------------------------
     4. Contact Form Modal Logic
     ------------------------------------------------------------------------ */
  const modal = document.querySelector('#contact-modal');
  const formTrigger = document.querySelector('.form-trigger');

  if (modal && formTrigger) {
    const modalDialog = modal.querySelector('.modal-dialog');

    const closeModal = () => {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      formTrigger.focus();
    };

    formTrigger.addEventListener('click', () => {
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      const nameInput = modal.querySelector('#contact-name');
      if (nameInput) nameInput.focus();
    });

    modal
      .querySelectorAll('[data-modal-close]')
      .forEach((element) => element.addEventListener('click', closeModal));

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && modal.classList.contains('is-open')) {
        closeModal();
      }
    });

    if (modalDialog) {
      modalDialog.addEventListener('click', (event) => event.stopPropagation());
    }

    const contactForm = modal.querySelector('.contact-form');
    if (contactForm) {
      contactForm.addEventListener('submit', (event) => {
        event.preventDefault();
        
        const form = event.currentTarget;
        const statusEl = form.querySelector('.form-status');
        const submitBtn = form.querySelector('.form-submit');
        
        // Disable form elements and show loading state
        submitBtn.disabled = true;
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Sending... <span>⏳</span>';
        if (statusEl) {
          statusEl.textContent = 'Sending your enquiry...';
          statusEl.style.color = 'inherit';
        }
        
        const formData = new FormData(form);
        const data = {
          name: formData.get('name'),
          email: formData.get('email'),
          message: formData.get('message'),
          _subject: `New 5cubix enquiry from ${formData.get('name')}`
        };
        
        fetch('https://formsubmit.co/ajax/info@5cubix.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(data)
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to send message');
          }
          return response.json();
        })
        .then(resData => {
          if (statusEl) {
            statusEl.textContent = 'Enquiry sent successfully!';
            statusEl.style.color = '#0a5a15'; // Success green
          }
          submitBtn.innerHTML = 'Enquiry Sent! <span>✓</span>';
          form.reset();
          
          // Close modal after a short delay
          setTimeout(() => {
            closeModal();
            // Reset button and status text after modal hides
            setTimeout(() => {
              submitBtn.disabled = false;
              submitBtn.innerHTML = originalBtnText;
              if (statusEl) statusEl.textContent = '';
            }, 500);
          }, 2000);
        })
        .catch(error => {
          console.error('Error submitting form:', error);
          if (statusEl) {
            statusEl.textContent = 'Failed to send. Please try again or email info@5cubix.com directly.';
            statusEl.style.color = '#d00a0a'; // Error red
          }
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        });
      });
    }
  }

  /* ------------------------------------------------------------------------
     5. Facts Section Count-Up Animation
     ------------------------------------------------------------------------ */
  const reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  const renderCount = (counter, value) => {
    counter.textContent = `${value}${counter.dataset.suffix || ''}`;
  };

  const countUp = (counter) => {
    const target = Number(counter.dataset.count);
    if (reduceMotion) return renderCount(counter, target);
    const start = performance.now();
    const duration = 1150;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      renderCount(counter, Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const factsEl = document.querySelector('.facts');
  if (factsEl) {
    const factsObserver = new IntersectionObserver(
      (entries, observer) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.querySelectorAll('.count').forEach(countUp);
          observer.unobserve(entry.target);
        }),
      { threshold: 0.45 }
    );
    factsObserver.observe(factsEl);
  }

  /* ------------------------------------------------------------------------
     6. Scroll to Top Floating Button Logic
     ------------------------------------------------------------------------ */
  const scrollTopBtn = document.querySelector('#scroll-top');
  if (scrollTopBtn) {
    window.addEventListener(
      'scroll',
      () => {
        scrollTopBtn.classList.toggle('is-visible', window.scrollY > 300);
      },
      { passive: true }
    );

    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    });
  }
});
