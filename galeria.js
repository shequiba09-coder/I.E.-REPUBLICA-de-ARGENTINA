/* Enlaza al final del <body>, DESPUÉS de tu app.js y de notas.js: <script src="galeria.js"></script>
   Llena la sección #historia-promociones con los datos de la hoja PROMOCIONES (ano | tipo | nombre | foto | descripcion) */
(function () {
  const API_URL = "https://script.google.com/macros/s/AKfycbyRHwq3oPelAhD3Qtzr7w5ReGhd1eAYLzINZG89z4tVYEMpLONj-NvwicAGs_QZ9BmOPg/exec";
  const ANIO_MIN = 2010, ANIO_MAX = 2026; // años que muestra la barra

  const $ = id => document.getElementById(id);
  const barOld = $('year-bar'), gE = $('gal-escolta'), gP = $('gal-promocion');
  if (!barOld || !gE || !gP) return;

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const img = u => {
    u = String(u || '').trim(); if (!/^https?:\/\//i.test(u)) return ''; // ignora textos que no son enlaces
    const m = u.match(/\/d\/([\w-]{20,})/) || u.match(/[?&]id=([\w-]{20,})/);
    return m ? 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w800' : u;
  };
  const esEscolta = i => String(i.tipo || '').toLowerCase().indexOf('escolta') === 0;
  const ON = 'bg-cyan-500/20 border border-cyan-500 text-cyan-300', OFF = 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white';

  // Quita los botones y eventos viejos de la barra de años para que no choquen con los nuevos
  const bar = barOld.cloneNode(false);
  barOld.parentNode.replaceChild(bar, barOld);

  fetch(API_URL + '?tipo=promociones&_=' + Date.now()).then(r => r.json()).then(d => {
    const items = (d.items || []).filter(i => i.ano);
    const conFotos = new Set(items.filter(i => img(i.foto)).map(i => i.ano));
    const pinta = (cont, lista, vacio) => {
      cont.innerHTML = lista.map(i => `<a href="${esc(img(i.foto))}" target="_blank" rel="noopener" title="${esc(i.nombre)}">
        <img loading="lazy" src="${esc(img(i.foto))}" alt="${esc(i.nombre)}" class="w-full aspect-square object-cover rounded-lg border border-cyan-500/30 hover:border-cyan-400 transition"></a>`).join('');
      cont.classList.toggle('hidden', !lista.length);
      $(vacio).classList.toggle('hidden', lista.length > 0);
    };
    const mostrar = a => {
      bar.querySelectorAll('button').forEach(b => b.className = 'px-4 py-2 rounded-xl font-semibold text-sm shrink-0 transition-all ' + (b.dataset.a === a ? ON : OFF));
      const del = items.filter(i => i.ano === a);
      const proms = del.filter(i => !esEscolta(i)), escs = del.filter(esEscolta);
      if ($('year-esc')) $('year-esc').textContent = a;
      if ($('year-pro')) $('year-pro').textContent = a;
      if ($('promo-title')) $('promo-title').textContent = (proms.find(i => i.nombre) || {}).nombre || ('Promoción ' + a);
      if ($('promo-desc')) $('promo-desc').textContent = (proms.find(i => i.descripcion) || {}).descripcion || '';
      pinta(gE, escs.filter(i => img(i.foto)), 'vacio-escolta');
      pinta(gP, proms.filter(i => img(i.foto)), 'vacio-promocion');
    };
    let b = '';
    for (let y = ANIO_MAX; y >= ANIO_MIN; y--) b += `<button type="button" data-a="${y}">${y}</button>`;
    bar.innerHTML = b;
    bar.addEventListener('click', e => { if (e.target.dataset && e.target.dataset.a) mostrar(e.target.dataset.a); });
    mostrar([...conFotos].filter(y => y >= ANIO_MIN && y <= ANIO_MAX).sort((x, y) => y - x)[0] || String(ANIO_MAX));
  }).catch(() => { $('vacio-promocion').textContent = 'No se pudieron cargar las fotos.'; $('vacio-promocion').classList.remove('hidden'); });
})();