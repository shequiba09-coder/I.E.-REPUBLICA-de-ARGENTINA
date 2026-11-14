/* Enlaza antes de </body>: <script src="contenido.js"></script>
   Llena "Últimos Comunicados" (hoja COMUNICADOS) y "Próximas Actividades y Exámenes" (hoja ACTIVIDADES).
   Si la hoja está vacía o falla, se queda el texto que ya tiene tu HTML. */
(function () {
  const API_URL = "https://script.google.com/macros/s/AKfycbyRHwq3oPelAhD3Qtzr7w5ReGhd1eAYLzINZG89z4tVYEMpLONj-NvwicAGs_QZ9BmOPg/exec";

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const rich = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'); // **negrita**
  const get = t => fetch(API_URL + '?tipo=' + t + '&_=' + Date.now()).then(r => r.json()).then(d => d.items || []);
  function reemplazar(cont, html) {
    cont.querySelectorAll('.neon-border-card').forEach(n => n.remove());
    cont.insertAdjacentHTML('beforeend', html);
  }

  // ---------- Últimos Comunicados: fecha | titulo | texto ----------
  const cc = document.getElementById('act-comunicados');
  if (cc) get('comunicados').then(items => {
    items = items.filter(i => i.titulo);
    if (!items.length) return;
    reemplazar(cc, items.slice().reverse().map(i => `
      <div class="neon-border-card p-5 space-y-2">
        <div class="flex justify-between items-start">
          <h4 class="font-bold text-white text-base">${esc(i.titulo)}</h4>
          ${i.fecha ? `<span class="text-xs font-semibold px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">${esc(i.fecha)}</span>` : ''}
        </div>
        <p class="text-slate-300 text-xs sm:text-sm leading-relaxed">${rich(i.texto)}</p>
      </div>`).join(''));
  }).catch(() => {});

  // ---------- Próximas Actividades: titulo | etiqueta | estilo | detalle ----------
  // estilo = destacado (tarjeta celeste brillante)  ·  vacío = normal (etiqueta verde)
  // detalle: si tiene varias líneas (Alt+Enter o separadas con |) sale como lista; si no, como párrafo
  const ca = document.getElementById('act-actividades');
  if (ca) get('actividades').then(items => {
    items = items.filter(i => i.titulo);
    if (!items.length) return;
    reemplazar(ca, items.map(i => {
      const dest = String(i.estilo || '').toLowerCase().indexOf('destac') === 0;
      const partes = String(i.detalle || '').split(/\n|\|/).map(x => x.trim()).filter(Boolean);
      const cuerpo = partes.length > 1
        ? `<ul class="text-slate-300 text-xs sm:text-sm space-y-1.5 list-disc list-inside">${partes.map(p => {
            const k = p.indexOf(':'); return k > 0 && k < 25 ? `<li><strong>${esc(p.slice(0, k + 1))}</strong>${rich(p.slice(k + 1))}</li>` : `<li>${rich(p)}</li>`; }).join('')}</ul>`
        : `<p class="${dest ? 'text-slate-200' : 'text-slate-300'} text-xs sm:text-sm leading-relaxed">${rich(partes[0] || '')}</p>`;
      return `
      <div class="neon-border-card p-5 space-y-2${dest ? ' border-cyan-400/60 shadow-[0_0_15px_rgba(0,212,255,0.25)]' : ''}">
        <div class="flex justify-between items-start">
          <h4 class="font-bold ${dest ? 'text-cyan-300' : 'text-white'} text-base">${esc(i.titulo)}</h4>
          ${i.etiqueta ? (dest
            ? `<span class="text-xs font-bold px-2.5 py-1 rounded bg-cyan-400 text-slate-950">${esc(i.etiqueta)}</span>`
            : `<span class="text-xs font-semibold px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">${esc(i.etiqueta)}</span>`) : ''}
        </div>
        ${cuerpo}
      </div>`;
    }).join(''));
  }).catch(() => {});
})();