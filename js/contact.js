// Sends the contact form to Hitesh Prajapati on WhatsApp with the message pre-filled.
(function () {
  var WHATSAPP_NUMBER = '919723324227';

  document.querySelectorAll('.whatsapp_form').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var value = function (name) {
        return form.elements[name].value.trim();
      };

      var lines = ['Hello Maruti Films,', '', value('message'), '', 'Name: ' + value('name'), 'Phone: ' + value('phone')];
      if (value('email')) {
        lines.push('Email: ' + value('email'));
      }

      var url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(lines.join('\n'));
      if (!window.open(url, '_blank', 'noopener')) {
        window.location.href = url;
      }
    });
  });
})();
