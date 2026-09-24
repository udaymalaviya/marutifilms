// Videos page: reads video/wedding.csv and video/reels.csv and shows every row as a player.
//
// CSV columns: No. | Title | Embed Code
//   No.        - order on the page (1 shows first)
//   Title      - text shown under the video
//   Embed Code - the "Embed" code copied from Instagram or YouTube, or just the video link.
//                Supported: Instagram reels/posts, YouTube (normal, youtu.be, Shorts), Vimeo or any iframe embed code.
(function () {
  var INSTAGRAM_PROFILE = 'https://www.instagram.com/maruti_films_27/';

  // Minimal CSV parser: handles quoted fields, "" escapes and line breaks inside quotes.
  function parseCsv(text) {
    var rows = [], row = [], field = '', inQuotes = false;
    text = text.replace(/^﻿/, '');
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inQuotes) {
        if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') { inQuotes = false; }
        else { field += c; }
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(field); field = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') { i++; }
        row.push(field); rows.push(row); row = []; field = '';
      } else {
        field += c;
      }
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (v) { return v.trim() !== ''; }); });
  }

  function rowsToVideos(rows) {
    if (!rows.length) { return []; }
    var header = rows[0].map(function (h) { return h.trim().toLowerCase(); });
    var col = function (name, fallback) {
      var index = header.findIndex(function (h) { return h.indexOf(name) === 0; });
      return index === -1 ? fallback : index;
    };
    var noCol = col('no', 0), titleCol = col('title', 1), codeCol = col('embed', 2);
    return rows.slice(1)
      .map(function (r, i) {
        return {
          order: parseFloat(r[noCol]) || i + 1,
          title: (r[titleCol] || '').trim(),
          code: (r[codeCol] || '').trim()
        };
      })
      .filter(function (v) { return v.code; })
      .sort(function (a, b) { return a.order - b.order; });
  }

  // Works out what to play from an embed code or a plain link.
  function toPlayer(code) {
    var decoded = code.replace(/&amp;/g, '&');
    var match;
    if ((match = decoded.match(/instagram\.com\/(?:[\w.]+\/)?(reel|reels|p|tv)\/([\w-]+)/))) {
      var kind = match[1] === 'reels' ? 'reel' : match[1];
      return { type: 'instagram', permalink: 'https://www.instagram.com/' + kind + '/' + match[2] + '/' };
    }
    if ((match = decoded.match(/youtu\.be\/([\w-]{6,})/)) ||
        (match = decoded.match(/youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^"'\s]*&)?v=|shorts\/|embed\/|live\/)([\w-]{6,})/))) {
      return { type: 'youtube', src: 'https://www.youtube-nocookie.com/embed/' + match[1] + '?rel=0' };
    }
    if ((match = decoded.match(/<iframe[^>]+src=["']([^"']+)["']/i)) || (match = decoded.match(/^(https:\/\/\S+)$/))) {
      return { type: 'other', src: match[1] };
    }
    return null;
  }

  function iframeFor(src, title) {
    var iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = title || 'Maruti Films video';
    iframe.loading = 'lazy';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    // YouTube refuses to play (error 153) when the page address is not sent along.
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.setAttribute('frameborder', '0');
    return iframe;
  }

  function videoCard(video) {
    var player = toPlayer(video.code);
    if (!player) { return null; }
    var card = document.createElement('div');
    card.className = 'video_card';

    var frame = document.createElement('div');
    frame.className = 'video_frame video_' + player.type;
    if (player.type === 'instagram') {
      // Instagram's own embed script turns this into the player and sizes it to fit.
      var quote = document.createElement('blockquote');
      quote.className = 'instagram-media';
      quote.setAttribute('data-instgrm-permalink', player.permalink);
      quote.setAttribute('data-instgrm-version', '14');
      var link = document.createElement('a');
      link.href = player.permalink;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = 'Watch on Instagram';
      quote.appendChild(link);
      frame.appendChild(quote);
    } else {
      frame.appendChild(iframeFor(player.src, video.title));
    }
    card.appendChild(frame);

    if (video.title) {
      var title = document.createElement('p');
      title.className = 'video_title';
      title.textContent = video.title;
      card.appendChild(title);
    }
    return card;
  }

  function note(html) {
    var p = document.createElement('p');
    p.className = 'video_empty';
    p.innerHTML = html;
    return p;
  }

  var instagramScriptLoaded = false;
  function renderInstagram() {
    if (!document.querySelector('.video_frame blockquote.instagram-media')) { return; }
    if (window.instgrm) { window.instgrm.Embeds.process(); return; }
    if (instagramScriptLoaded) { return; }
    instagramScriptLoaded = true;
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.instagram.com/embed.js';
    document.body.appendChild(script);
  }

  function loadGrid(grid) {
    var file = grid.getAttribute('data-csv');
    return fetch(file, { cache: 'no-cache' })
      .then(function (response) {
        if (!response.ok) { throw new Error(file + ' ' + response.status); }
        return response.text();
      })
      .then(function (text) {
        var cards = rowsToVideos(parseCsv(text)).map(videoCard).filter(Boolean);
        if (!cards.length) {
          grid.classList.add('is_empty');
          grid.appendChild(note('New videos coming soon. Meanwhile, watch our latest work on ' +
            '<a href="' + INSTAGRAM_PROFILE + '" target="_blank" rel="noopener">Instagram</a>.'));
          return;
        }
        cards.forEach(function (card) { grid.appendChild(card); });
      })
      .catch(function () {
        grid.classList.add('is_empty');
        if (window.location.protocol === 'file:') {
          // Browsers do not let a page opened from disk read other files, so the CSV cannot be loaded.
          grid.appendChild(note('Preview note: videos are read from <strong>' + file + '</strong>, which browsers ' +
            'block when the page is opened as a file. Open the site through a local server ' +
            '(for example <strong>http://localhost:8000/videos.html</strong>) or on the live website.'));
          return;
        }
        grid.appendChild(note('Videos could not be loaded right now. Watch them on ' +
          '<a href="' + INSTAGRAM_PROFILE + '" target="_blank" rel="noopener">Instagram</a>.'));
      });
  }

  var grids = Array.prototype.slice.call(document.querySelectorAll('[data-csv]'));
  Promise.all(grids.map(loadGrid)).then(renderInstagram);
})();
