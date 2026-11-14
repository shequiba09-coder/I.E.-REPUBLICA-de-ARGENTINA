/* Enlaza al final del <body>: <script src="notas.js"></script> */
(function () {
  // ▼▼ PEGA AQUÍ TU URL DE APPS SCRIPT (la que termina en /exec, sin ?dni=) ▼▼
  const API_URL = "https://script.google.com/macros/s/AKfycbyRHwq3oPelAhD3Qtzr7w5ReGhd1eAYLzINZG89z4tVYEMpLONj-NvwicAGs_QZ9BmOPg/exec";
  // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

  const form = document.getElementById('pn-form');
  if (!form) return;
  const inp = document.getElementById('pn-dni'), out = document.getElementById('pn-resultado');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const celda = v => { const x = String(v || '').trim(); return `<td class="pn-n ${['AD','A','B','C'].includes(x) ? 'pn-' + x : ''}">${esc(x) || '-'}</td>`; };

  inp.addEventListener('input', () => inp.value = inp.value.replace(/\D/g, ''));
  ['keydown', 'keypress', 'keyup'].forEach(ev => inp.addEventListener(ev, e => e.stopPropagation()));
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const dni = inp.value.trim();
    if (!/^\d{8}$/.test(dni)) { out.innerHTML = '<div class="pn-msg pn-err">Ingrese un número de DNI válido de 8 dígitos.</div>'; return; }
    out.innerHTML = '<div class="pn-msg">Buscando calificaciones...</div>';
    try {
      const data = await (await fetch(API_URL + '?dni=' + encodeURIComponent(dni))).json();
      if (!data.encontrado) { out.innerHTML = '<div class="pn-msg pn-err">No se encontraron notas para el DNI ingresado.</div>'; return; }
      let filas = '', ult = null;
      data.calificaciones.forEach(c => {
        if (c.area !== ult) { filas += `<tr class="pn-area"><td colspan="5">${esc(c.area)}</td></tr>`; ult = c.area; }
        filas += `<tr><td></td><td>${esc(c.competencia)}</td>${celda(c.b1)}${celda(c.b2)}${celda(c.b3)}</tr>`;
      });
      out.innerHTML = `<div class="pn-ficha">
        <div class="pn-datos"><div class="pn-nom"><b>Estudiante:</b> ${esc(data.estudiante)}</div>
          <div><b>DNI:</b> ${esc(data.dni)}</div><div><b>Grado:</b> ${esc(data.grado)}</div></div>
        <div class="pn-scroll"><table><thead><tr><th style="width:30px"></th><th>Competencia</th><th>1° Bim</th><th>2° Bim</th><th>3° Bim</th></tr></thead>
        <tbody>${filas}</tbody></table></div>
        <div class="pn-leyenda">AD = Logro destacado · A = Logro esperado · B = En proceso · C = En inicio</div></div>`;
    } catch (err) {
      out.innerHTML = '<div class="pn-msg pn-err">Ocurrió un error al consultar las notas. Intente nuevamente.</div>';
    }
  });
})();