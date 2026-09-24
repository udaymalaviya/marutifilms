// Portfolio: category filter buttons and a full-size photo viewer.
(function () {
  var categories = document.querySelectorAll('.portfolio_category');
  var buttons = document.querySelectorAll('.portfolio_filter button');

  function showCategory(name) {
    buttons.forEach(function (button) {
      button.classList.toggle('active', button.getAttribute('data-filter') === name);
    });
    categories.forEach(function (category) {
      category.hidden = name !== 'all' && category.getAttribute('data-category') !== name;
    });
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      showCategory(button.getAttribute('data-filter'));
    });
  });

  // Links like portfolio.html#wedding open with that category selected.
  var hash = window.location.hash.slice(1);
  if (hash && document.querySelector('.portfolio_filter button[data-filter="' + hash + '"]')) {
    showCategory(hash);
  }

  var lightbox = document.getElementById('lightbox');
  if (!lightbox) {
    return;
  }
  var lightboxImg = lightbox.querySelector('img');

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImg.src = '';
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.gallery_item').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      lightboxImg.src = link.getAttribute('href');
      lightboxImg.alt = link.querySelector('img').alt;
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });
  });

  lightbox.addEventListener('click', function (event) {
    if (event.target !== lightboxImg) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && lightbox.classList.contains('open')) {
      closeLightbox();
    }
  });
})();
