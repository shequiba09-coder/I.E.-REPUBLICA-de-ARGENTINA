'use strict';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const CFG = (typeof CONFIG !== 'undefined') ? CONFIG : {};
const API = "https://script.google.com/macros/s/AKfycbyRHwq3oPelAhD3Qtzr7w5ReGhd1eAYLzINZG89z4tVYEMpLONj-NvwicAGs_QZ9BmOPg/exec";
const MAX_MB = CFG.MAX_MB || 5;
const ANIO_INICIO = 2010, ANIO_FIN = 2026;
const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
const tactil = matchMedia('(pointer: coarse)').matches;

const ejecutar = fn => { try { fn(); } catch (e) { console.error('[' + fn.name + ']', e); } };

const waLink = (numero, texto) => `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
const gmailLink = (para, asunto = '', cuerpo = '') => tactil
? `mailto:${para}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`
: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(para)}&su=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
const fmtFecha = iso => new Date(String(iso).length === 10 ? iso + 'T00:00' : iso)
.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
const fotoRespaldo = nombre => `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=0b1329&color=00d4ff&size=400&bold=true`;

const aBase64 = file => new Promise((ok, no) => {
const r = new FileReader();
r.onload = () => ok(String(r.result).split(',')[1]);
r.onerror = () => no(new Error('No se pudo leer el archivo'));
r.readAsDataURL(file);
});

function mostrarMensaje(el, tipo, html, desplazar = true) {
if (!el) return;
const extra = el.dataset.base || '';
el.className = `${extra} p-4 rounded-xl text-sm msg-${tipo}`.trim();
el.innerHTML = html;
el.classList.remove('hidden');
if (desplazar) el.scrollIntoView({ behavior: reducido ? 'auto' : 'smooth', block: 'nearest' });
}

const archivosDe = form => $$('#' + form.id + ' input[type=file]').flatMap(i => [...i.files]);

async function enviarAGmail({ tipo, asunto, campos, archivos = [], replyTo = '' }) {
if (!API) throw new Error('El envío a Gmail aún no está conectado.');
const adj = [];
for (const f of archivos) adj.push({ nombre: f.name, tipo: f.type || 'application/octet-stream', base64: await aBase64(f) });
const r = await fetch(API, { method: 'POST', body: JSON.stringify({ tipo, asunto, campos, archivos: adj, replyTo }) });
const data = await r.json();
if (!data.ok) throw new Error(data.error || 'El servidor rechazó el envío.');
return data;
}

async function procesarFormulario({ form, msg, reglas, armar, textoEnviando, textoOk }) {
const v = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
const errores = [];
reglas.forEach(([id, valido, nombre]) => {
const malo = !valido(v(id));
const el = document.getElementById(id); if (el) el.classList.toggle('error', malo);
if (malo) errores.push(nombre);
});
if (errores.length) { mostrarMensaje(msg, 'err', 'Revisa: ' + esc(errores.join(', ')) + '.'); return; }
const btn = form.querySelector('button[type=submit]'); if (btn) btn.disabled = true;
mostrarMensaje(msg, 'info', `<i class="fa-solid fa-spinner fa-spin mr-1"></i> ${textoEnviando}`);
try {
await enviarAGmail({ ...armar(v), archivos: archivosDe(form) });
mostrarMensaje(msg, 'ok', textoOk);
form.reset();
} catch (err) { mostrarMensaje(msg, 'err', 'No se pudo enviar: ' + esc(err.message)); }
if (btn) btn.disabled = false;
}

function zonasDeCarga() {
const MAX = MAX_MB * 1024 * 1024;
$$('[data-drop]').forEach(zona => {
const input = zona.querySelector('input[type=file]');
const nombre = zona.querySelector('.drop-name');
const prev = zona.querySelector('.drop-preview');
if (!input) return;
const mostrar = () => {
const f = input.files[0];
zona.classList.remove('ok', 'error');
if (prev) prev.classList.add('hidden');
if (!f) return;
if (f.size > MAX) { input.value = ''; if (nombre) nombre.textContent = `Archivo muy pesado (máx. ${MAX_MB} MB).`; zona.classList.add('error'); return; }
if (nombre) nombre.textContent = `✓ ${f.name}`;
zona.classList.add('ok');
if (prev && f.type.startsWith('image/')) { prev.src = URL.createObjectURL(f); prev.classList.remove('hidden'); }
};
input.addEventListener('change', mostrar);
});
}

function menuMovil() {
const burger = $('#burger'), menu = $('#menu');
if (!burger || !menu) return;
const icono = burger.querySelector('i');
const abrir = abierto => {
menu.classList.toggle('hidden', !abierto);
burger.setAttribute('aria-expanded', String(abierto));
if (icono) { icono.classList.toggle('fa-bars', !abierto); icono.classList.toggle('fa-xmark', abierto); }
};
burger.addEventListener('click', () => abrir(menu.classList.contains('hidden')));
menu.addEventListener('click', e => { if (e.target.closest('a')) abrir(false); });
}

function accesosRapidos() {
const ACC = [
['fa-landmark', 'Nosotros', 'Misión, visión, valores e historia', '#nosotros'],
['fa-medal', 'Escoltas', 'Fotos por año, 2010 – 2026', '#historia-promociones'],
['fa-trophy', 'Logros', 'Reconocimientos y campeonatos', '#logros'],
['fa-crown', 'Honor', 'Primeros puestos y brigadieres', '#honor'],
['fa-chalkboard-user', 'Maestros', 'WhatsApp, Gmail y llamadas', '#staff'],
['fa-book-open-reader', 'Académico', 'Plan de estudios y malla', '#academico'],
['fa-newspaper', 'Comunicados', 'Noticias y exámenes', '#actualidad'],
['fa-file-circle-check', 'Justificar', 'Con evidencia adjunta', '#justificacion'],
['fa-comments', 'Citas', 'Por WhatsApp al maestro', '#citas-whatsapp'],
['fa-calendar-week', 'Horarios', 'Cursos y docentes por grado', '#horarios'],
['fa-lock', 'Portales', 'Notas, horarios y ubicación', '#portales']
];
const track = $('#track'), dots = $('#dots');
if (!track || !dots) return;
track.innerHTML = ACC.map(a => `
<a class="neon-border-card p-5 flex flex-col justify-between flex-shrink-0 w-64 cursor-pointer group" href="${a[3]}">
<div>
<div class="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xl mb-3 shadow-md"><i class="fa-solid ${a[0]}"></i></div>
<h4 class="font-lexend font-bold text-white text-base mb-1">${a[1]}</h4>
<p class="text-slate-400 text-xs">${a[2]}</p>
</div>
<span class="inline-flex items-center gap-2 mt-4 font-bold text-xs text-cyan-400 group-hover:translate-x-1 transition-transform">Ir a ${a[1]} <i class="fa-solid fa-arrow-right"></i></span>
</a>`).join('');
dots.innerHTML = ACC.map(() => '<span class="w-2 h-2 rounded-full bg-slate-700 transition-all"></span>').join('');
const paso = () => { const a = track.querySelector('a'); return a ? a.offsetWidth + 16 : 280; };
const prevBtn = $('#prev'), nextBtn = $('#next');
if (prevBtn) prevBtn.onclick = () => track.scrollBy({ left: -paso(), behavior: 'smooth' });
if (nextBtn) nextBtn.onclick = () => track.scrollBy({ left: paso(), behavior: 'smooth' });
const alFinal = () => track.scrollLeft + track.clientWidth >= track.scrollWidth - 5;
track.addEventListener('scroll', () => {
if (prevBtn) prevBtn.disabled = track.scrollLeft < 5;
if (nextBtn) nextBtn.disabled = alFinal();
}, { passive: true });
}

function efectoEscritura() {
const h1 = $('#hero-title');
if (!h1) return;
const texto = h1.textContent.trim();
h1.setAttribute('aria-label', texto);
if (reducido) return;
h1.innerHTML = `<span class="typing-ghost" aria-hidden="true">${esc(texto)}</span><span class="typing-live" aria-hidden="true"><span id="typed"></span><span class="typing-cursor"></span></span>`;
const out = $('#typed'); let i = 0;
(function escribir() { out.textContent = texto.slice(0, ++i); if (i < texto.length) setTimeout(escribir, 85); })();
}

function estrellas() {
const c = $('#bg-particles');
if (!c) return;
const ctx = c.getContext('2d');
let w = 0, h = 0, stars = [];
const iniciar = () => {
w = c.width = innerWidth; h = c.height = innerHeight;
stars = Array.from({ length: 120 }, () => ({
x: Math.random() * w, y: Math.random() * h,
r: Math.random() * 1.6 + .4,
fase: Math.random() * 6.283, vel: Math.random() * .03 + .008,
dy: -(Math.random() * .18 + .03), cian: Math.random() < .4
}));
};
const pintar = () => {
ctx.clearRect(0, 0, w, h);
for (const s of stars) {
s.fase += s.vel;
s.y += s.dy; if (s.y < -5) { s.y = h + 5; s.x = Math.random() * w; }
const a = .35 + .65 * Math.abs(Math.sin(s.fase));
ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283);
ctx.fillStyle = `rgba(${s.cian ? '0,212,255' : '255,255,255'},${a})`;
ctx.fill();
}
requestAnimationFrame(pintar);
};
addEventListener('resize', iniciar);
iniciar();
requestAnimationFrame(pintar);
}

function aparicionScroll() {
if (reducido || !('IntersectionObserver' in window)) return;
const obs = new IntersectionObserver(es => es.forEach(e => {
if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
}), { threshold: .05 });
$$('main > section:not(#inicio)').forEach(s => { s.classList.add('reveal'); obs.observe(s); });
}

/* ---------- HORARIOS OFICIALES (1.º a 5.º) ---------- */
const HORARIOS = {
  1: [
    { n: 1, h: '8:00 - 8:40', dias: [
      { c: 'Ciencia y Tecnología', d: 'Ayme GONZALES' },
      { c: 'Matemática', d: 'Adelia TORRES' },
      { c: 'Ciencias Sociales', d: 'Fuller CARHUAPOMA', r: true },
      { c: 'Comunicación', d: 'Javier ALVARADO' },
      { c: 'Inglés', d: 'Fuller CARHUAPOMA' }
    ]},
    { n: 2, h: '8:40 - 9:20', dias: [
      { c: 'Ciencia y Tecnología', d: 'Ayme GONZALES' },
      { c: 'Matemática', d: 'Adelia TORRES' },
      { c: 'Ciencias Sociales', d: 'Jacquelin VICENTE' },
      { c: 'Comunicación', d: 'Javier ALVARADO' },
      { c: 'Desarrollo Personal', d: 'Maritza VALENZUELA' }
    ]},
    { n: 3, h: '9:20 - 10:00', dias: [
      { c: 'Ciencia y Tecnología', d: 'Ayme GONZALES', r: true },
      { c: 'Matemática', d: 'Adelia TORRES' },
      { c: 'Ciencias Sociales', d: 'Jacquelin VICENTE' },
      { c: 'Inglés', d: 'Fuller CARHUAPOMA' },
      { c: 'Desarrollo Personal', d: 'Maritza VALENZUELA' }
    ]},
    { n: 4, h: '10:00 - 10:40', dias: [
      { c: 'Arte y Cultura', d: 'Marco SOTO' },
      { c: 'Religión', d: 'Jhovanna VEGA' },
      { c: 'Educación para el Trabajo', d: 'Maritza VALENZUELA' },
      { c: 'Tutoría', d: 'Zenaida TRAVEZAÑO' },
      { c: 'Comunicación', d: 'Javier ALVARADO' }
    ]},
    { n: 5, h: '11:00 - 11:40', dias: [
      { c: 'Arte y Cultura', d: 'Marco SOTO' },
      { c: 'Religión', d: 'Jhovanna VEGA' },
      { c: 'Educación para el Trabajo', d: 'Maritza VALENZUELA' },
      { c: 'Desarrollo Personal', d: 'Maritza VALENZUELA' },
      { c: 'Comunicación', d: 'Javier ALVARADO' }
    ]},
    { n: 6, h: '11:40 - 12:20', dias: [
      { c: 'Matemática', d: 'Adelia TORRES' },
      { c: 'Comunicación', d: 'Zenaida TRAVEZAÑO', r: true },
      { c: 'Educación Física', d: 'Adelia TORRES' },
      { c: 'Ciencia y Tecnología', d: 'Ayme GONZALES' },
      { c: 'Comunicación', d: 'Javier ALVARADO' }
    ]},
    { n: 7, h: '12:20 - 13:00', dias: [
      { c: 'Matemática', d: 'Adelia TORRES' },
      { c: 'Comunicación', d: 'Zenaida TRAVEZAÑO', r: true },
      { c: 'Educación Física', d: 'Adelia TORRES' },
      { c: 'Ciencias Sociales', d: 'Jacquelin VICENTE', r: true },
      { c: 'Ciencias Sociales', d: 'Jacquelin VICENTE' }
    ]},
    { n: 8, h: '13:00 - 13:40', dias: [
      { c: 'Matemática', d: 'Adelia TORRES' },
      { c: 'Tutoría', d: 'Zenaida TRAVEZAÑO' },
      { c: 'Educación Física', d: 'Adelia TORRES' },
      { c: 'Ciencia y Tecnología', d: 'Ayme GONZALES' },
      { c: 'Arte y Cultura', d: 'Marco SOTO' }
    ]}
  ],
  2: [
    { n: 1, h: '8:00 - 8:40', dias: [
      { c: 'Religión', d: 'Jhovanna VEGA' },
      { c: 'Ciencia y Tecnología', d: 'Ayme GONZALES' },
      { c: 'Matemática', d: 'Marco SOTO' },
      { c: 'Desarrollo Personal', d: 'Adelia TORRES' },
      { c: 'Técnicas de Estudio', d: 'Maritza VALENZUELA', r: true }
    ]},
    { n: 2, h: '8:40 - 9:20', dias: [
      { c: 'Religión', d: 'Jhovanna VEGA' },
      { c: 'Tutoría', d: 'Ayme GONZALES' },
      { c: 'Matemática', d: 'Marco SOTO' },
      { c: 'Desarrollo Personal', d: 'Adelia TORRES' },
      { c: 'Inglés', d: 'Javier ALVARADO' }
    ]},
    { n: 3, h: '9:20 - 10:00', dias: [
      { c: 'Comunicación', d: 'Zenaida TRAVEZAÑO' },
      { c: 'Tutoría', d: 'Ayme GONZALES' },
      { c: 'Matemática', d: 'Marco SOTO' },
      { c: 'Desarrollo Personal', d: 'Adelia TORRES' },
      { c: 'Inglés', d: 'Javier ALVARADO' }
    ]},
    { n: 4, h: '10:00 - 10:40', dias: [
      { c: 'Comunicación', d: 'Zenaida TRAVEZAÑO' },
      { c: 'Comunicación', d: 'Zenaida TRAVEZAÑO' },
      { c: 'Matemática', d: 'Adelia TORRES', r: true },
      { c: 'Ciencia y Tecnología', d: 'Ayme GONZALES', r: true },
      { c: 'Ciencia y Tecnología', d: 'Ayme GONZALES' }
    ]},
    { n: 5, h: '11:00 - 11:40', dias: [
      { c: 'Matemática', d: 'Marco SOTO' },
      { c: 'Comunicación', d: 'Zenaida TRAVEZAÑO' },
      { c: 'Educación para el Trabajo', d: 'Maritza VALENZUELA' },
      { c: 'Arte y Cultura', d: 'Marco SOTO' },
      { c: 'Ciencia y Tecnología', d: 'Ayme GONZALES' }
    ]},
    { n: 6, h: '11:40 - 12:20', dias: [
      { c: 'Matemática', d: 'Marco SOTO' },
      { c: 'Educación para el Trabajo', d: 'Maritza VALENZUELA' },
      { c: 'Matemática', d: 'Adelia TORRES', r: true },
      { c: 'Arte y Cultura', d: 'Marco SOTO' },
      { c: 'Ciencias Sociales', d: 'Jacquelin VICENTE' }
    ]},
    { n: 7, h: '12:20 - 13:00', dias: [
      { c: 'Matemática', d: 'Marco SOTO' },
      { c: 'Técnicas de Estudio', d: 'Maritza VALENZUELA', r: true },
      { c: 'Educación Física', d: 'Maritza VALENZUELA' },
      { c: 'Ciencias Sociales', d: 'Jacquelin VICENTE' },
      { c: 'Ciencias Sociales', d: 'Jacquelin VICENTE' }
    ]},
    { n: 8, h: '13:00 - 13:40', dias: [
      { c: 'Matemática', d: 'Marco SOTO' },
      { c: 'Técnicas de Estudio', d: 'Maritza VALENZUELA', r: true },
      { c: 'Educación Física', d: 'Maritza VALENZUELA' },
      { c: 'Ciencias Sociales', d: 'Jacquelin VICENTE' },
      { c: 'Arte y Cultura', d: 'Marco SOTO' }
    ]}
  ],
  3: [
    { n: 1, h: '8:00 - 8:40', dias: [
      { c: 'Matemática', d: 'Marco SOTO' },
      { c: 'Educación para el Trabajo', d: 'Maritza VALENZUELA' },
      { c: 'Comunicación', d: 'Zenaida TRAVEZAÑO' },
      { c: 'Comunicación', d: 'Zenaida TRAVEZAÑO' },
      { c: 'Educación Física', d: 'Jacquelin VICENTE' }
    ]},
    { n: 2, h: '8:40 - 9:20', dias: [
      { c: 'Matemática', d: 'Marco SOTO' },
      { c: 'Educación para el Trabajo', d: 'Maritza VALENZUELA' },
      { c: 'Comunicación', d: 'Zenaida TRAVEZAÑO' },
      { c: 'Comunicación', d: 'Zenaida TRAVEZAÑO' },
      { c: 'Educación Física', d: 'Jacquelin VICENTE' }
    ]},
    { n: 3, h: '9:20 - 10:00', dias: [
      { c: 'Matemática', d: 'Marco SOTO' },
      { c: 'Tutoría', d: 'Maritza VALENZUELA' },
      { c: 'Arte y Cultura', d: 'Adelia TORRES' },
      { c: 'Comunicación', d: 'Zenaida TRAVEZAÑO' },
      { c: 'Educación Física', d: 'Jacquelin VICENTE' }
    ]},
    { n: 4, h: '10:00 - 10:40', dias: [
      { c: 'Ciencias Sociales', d: 'Jacquelin VICENTE' },
      { c: 'Ciencia y Tecnología', d: 'Ayme GONZALES' },
      { c: 'Matemática', d: 'Marco SOTO' },
      { c: 'Arte y Cultura', d: 'Adelia TORRES' },
      { c: 'Desarrollo Personal', d: 'Marco SOTO' }
    ]},
    { n: 5, h: '11:00 - 11:40', dias: [
      { c: 'Ciencias Sociales', d: 'Jacquelin VICENTE' },
      { c: 'Ciencia y Tecnología', d: 'Ayme GONZALES', r: true },
      { c: 'Matemática', d: 'Marco SOTO' },
      { c: 'Tutoría', d: 'Maritza VALENZUELA' },
      { c: 'Desarrollo Personal', d: 'Marco SOTO' }
    ]},
    { n: 6, h: '11:40 - 12:20', dias: [
      { c: 'Ciencia y Tecnología', d: 'Ayme GONZALES' },
      { c: 'Ciencia y Tecnología', d: 'Ayme GONZALES', r: true },
      { c: 'Matemática', d: 'Marco SOTO' },
      { c: 'Arte y Cultura', d: 'Adelia TORRES' },
      { c: 'Desarrollo Personal', d: 'Marco SOTO' }
    ]},
    { n: 7, h: '12:20 - 13:00', dias: [
      { c: 'Ciencia y Tecnología', d: 'Ayme GONZALES' },
      { c: 'Religión', d: 'Jhovanna VEGA' },
      { c: 'Ciencias Sociales', d: 'Jacquelin VICENTE', r: true },
      { c: 'Matemática', d: 'Marco SOTO', r: true },
      { c: 'Inglés', d: 'Javier ALVARADO' }
    ]},
    { n: 8, h: '13:00 - 13:40', dias: [
      { c: 'Ciencia y Tecnología', d: 'Ayme GONZALES' },
      { c: 'Religión', d: 'Jhovanna VEGA' },
      { c: 'Ciencias Sociales', d: 'Jacquelin VICENTE' },
      { c: 'Matemática', d: 'Marco SOTO', r: true },
      { c: 'Inglés', d: 'Javier ALVARADO' }
    ]}
  ],
  4: [
    { n: 1, h: '8:00 - 8:40', dias: [
      { c: 'Desarrollo Personal', d: 'Jacquelin VICENTE' },
      { c: 'Religión', d: 'Jhovanna VEGA' },
      { c: 'Arte y Cultura', d: 'Adelia TORRES' },
      { c: 'Ciencia y Tecnología', d: 'Ayme GONZALES' },
      { c: 'Educación Física', d: 'Marco SOTO' }
    ]},
    { n: 2, h: '8:40 - 9:20', dias: [
      { c: 'Desarrollo Personal', d: 'Jacquelin VICENTE' },
      { c: 'Religión', d: 'Jhovanna VEGA' },
      { c: 'Matemática', d: 'Fuller CARHUAPOMA' },
      { c: 'Ciencia y Tecnología', d: 'Ayme GONZALES' },
      { c: 'Educación Física', d: 'Marco SOTO' }
    ]},
    { n: 3, h: '9:20 - 10:00', dias: [
      { c: 'Desarrollo Personal', d: 'Jacquelin VICENTE' },
      { c: 'Tutoría', d: 'Zenaida TRAVEZAÑO' },
      { c: 'Matemática', d: 'Fuller CARHUAPOMA' },
      { c: 'Ciencias Sociales', d: 'Jacquelin VICENTE' },
      { c: 'Educación Física', d: 'Marco SOTO' }
    ]},
    { n: 4, h: '10:00 - 10:40', dias: [
      { c: 'Matemática', d: 'Adelia TORRES', r: true },
      { c: 'Arte y Cultura', d: 'Adelia TORRES' },
      { c: 'Matemática', d: 'Fuller CARHUAPOMA' },
      { c: 'Ciencias Sociales', d: 'Jacquelin VICENTE' },
      { c: 'Técnicas de Estudio', d: 'Maritza VALENZUELA', r: true }
    ]},
    { n: 5, h: '11:00 - 11:40', dias: [
      { c: 'Matemática', d: 'Adelia TORRES', r: true },
      { c: 'Arte y Cultura', d: 'Adelia TORRES' },
      { c: 'Ciencias Sociales', d: 'Jacquelin VICENTE' },
      { c: 'Ciencias Sociales', d: 'Jacquelin VICENTE', r: true },
      { c: 'Inglés', d: 'Maritza VALENZUELA' }
    ]},
    { n: 6, h: '11:40 - 12:20', dias: [
      { c: 'Comunicación', d: 'Zenaida TRAVEZAÑO' },
      { c: 'Matemática', d: 'Fuller CARHUAPOMA' },
      { c: 'Comunicación', d: 'Zenaida TRAVEZAÑO' },
      { c: 'Tutoría', d: 'Zenaida TRAVEZAÑO' },
      { c: 'Inglés', d: 'Maritza VALENZUELA' }
    ]},
    { n: 7, h: '12:20 - 13:00', dias: [
      { c: 'Comunicación', d: 'Zenaida TRAVEZAÑO' },
      { c: 'Matemática', d: 'Fuller CARHUAPOMA' },
      { c: 'Comunicación', d: 'Zenaida TRAVEZAÑO' },
      { c: 'Educación para el Trabajo', d: 'Maritza VALENZUELA' },
      { c: 'Ciencia y Tecnología', d: 'Ayme GONZALES' }
    ]},
    { n: 8, h: '13:00 - 13:40', dias: [
      { c: 'Comunicación', d: 'Zenaida TRAVEZAÑO' },
      { c: 'Matemática', d: 'Fuller CARHUAPOMA' },
      { c: 'Comunicación', d: 'Zenaida TRAVEZAÑO', r: true },
      { c: 'Educación para el Trabajo', d: 'Maritza VALENZUELA' },
      { c: 'Ciencia y Tecnología', d: 'Ayme GONZALES' }
    ]}
  ],
  5: [
    { n: 1, h: '8:00 - 8:40', dias: [
      { c: 'Comunicación', d: 'Zenaida TRAVEZAÑO' },
      { c: 'Comunicación', d: 'Zenaida TRAVEZAÑO' },
      { c: 'Inglés', d: 'Maritza VALENZUELA' },
      { c: 'Ciencias Sociales', d: 'Jacquelin VICENTE' },
      { c: 'Educación Física', d: 'Ayme GONZALES' }
    ]},
    { n: 2, h: '8:40 - 9:20', dias: [
      { c: 'Comunicación', d: 'Zenaida TRAVEZAÑO' },
      { c: 'Comunicación', d: 'Zenaida TRAVEZAÑO', r: true },
      { c: 'Inglés', d: 'Maritza VALENZUELA' },
      { c: 'Ciencias Sociales', d: 'Jacquelin VICENTE' },
      { c: 'Educación Física', d: 'Ayme GONZALES' }
    ]},
    { n: 3, h: '9:20 - 10:00', dias: [
      { c: 'Religión', d: 'Jhovanna VEGA' },
      { c: 'Religión', d: 'Jhovanna VEGA' },
      { c: 'Técnicas de Estudio', d: 'Maritza VALENZUELA', r: true },
      { c: 'Arte y Cultura', d: 'Ayme GONZALES' },
      { c: 'Educación Física', d: 'Ayme GONZALES' }
    ]},
    { n: 4, h: '10:00 - 10:40', dias: [
      { c: 'Arte y Cultura', d: 'Ayme GONZALES' },
      { c: 'Educación para el Trabajo', d: 'Maritza VALENZUELA' },
      { c: 'Comunicación', d: 'Zenaida TRAVEZAÑO' },
      { c: 'Ciencia y Tecnología', d: 'Fuller CARHUAPOMA' },
      { c: 'Desarrollo Personal', d: 'Jacquelin VICENTE' }
    ]},
    { n: 5, h: '11:00 - 11:40', dias: [
      { c: 'Arte y Cultura', d: 'Ayme GONZALES' },
      { c: 'Educación para el Trabajo', d: 'Maritza VALENZUELA' },
      { c: 'Comunicación', d: 'Zenaida TRAVEZAÑO' },
      { c: 'Ciencia y Tecnología', d: 'Fuller CARHUAPOMA' },
      { c: 'Desarrollo Personal', d: 'Jacquelin VICENTE' }
    ]},
    { n: 6, h: '11:40 - 12:20', dias: [
      { c: 'Ciencias Sociales', d: 'Jacquelin VICENTE' },
      { c: 'Matemática', d: 'Adelia TORRES' },
      { c: 'Ciencias Sociales', d: 'Jacquelin VICENTE', r: true },
      { c: 'Matemática', d: 'Adelia TORRES' },
      { c: 'Desarrollo Personal', d: 'Jacquelin VICENTE' }
    ]},
    { n: 7, h: '12:20 - 13:00', dias: [
      { c: 'Ciencia y Tecnología', d: 'Fuller CARHUAPOMA' },
      { c: 'Matemática', d: 'Adelia TORRES' },
      { c: 'Matemática', d: 'Marco SOTO', r: true },
      { c: 'Matemática', d: 'Adelia TORRES' },
      { c: 'Tutoría', d: 'Maritza VALENZUELA' }
    ]},
    { n: 8, h: '13:00 - 13:40', dias: [
      { c: 'Ciencia y Tecnología', d: 'Fuller CARHUAPOMA' },
      { c: 'Matemática', d: 'Adelia TORRES' },
      { c: 'Matemática', d: 'Marco SOTO', r: true },
      { c: 'Matemática', d: 'Adelia TORRES' },
      { c: 'Tutoría', d: 'Maritza VALENZUELA' }
    ]}
  ]
};

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const COLOR_CURSO = {
'Ciencia y Tecnología': '250,204,21', 'Matemática': '251,146,60', 'Comunicación': '186,230,253', 'Ciencias Sociales': '163,230,53',
'Inglés': '244,63,94', 'Desarrollo Personal': '34,211,238', 'Arte y Cultura': '34,197,94', 'Religión': '236,72,153',
'Educación para el Trabajo': '56,189,248', 'Educación Física': '234,179,8', 'Tutoría': '232,121,249', 'Técnicas de Estudio': '148,163,184'
};

// Asegúrate de que tu array TEACHERS esté actualizado con los datos que pasaste antes
let TEACHERS = [
  { nombre: 'CARHUAPOMA CAMPO, Fuller Victoriano', area: 'Director', wa: '51963954647' },
  { nombre: 'ALVARADO DIONICIO, Javier', area: 'Comunicacion', wa: '51977238138' },
  { nombre: 'GONZALES MEDRANO, Ayme Noelia', area: 'Comunicación', wa: '51966518787' },
  { nombre: 'SOTO CHUQUIYAURI, Mercedes Carolina', area: 'Computación e Informática', wa: '51964591289' },
  { nombre: 'SOTO INOCENTE, Marco Antonio', area: 'Matemática', wa: '51928812982' },
  { nombre: 'TORRES ROSALES, Adelia Elvira', area: 'Matemática', wa: '51975554364' },
  { nombre: 'VICENTE CONDOR, Jacquelin Edith', area: 'Ciencias Sociales', wa: '51973660804' },
  { nombre: 'TRAVEZAÑO BARRERA, Zenaida', area: 'Comunicación', wa: '51963999913' },
  { nombre: 'TRAVEZAÑO MELGAREJO, Raúl Rolando', area: 'Auxiliar de Educación', wa: '51918565087' },
  { nombre: 'VALENZUELA DÁVILA, Marithza', area: 'Educación para el trabajo', wa: '51963988566' },
  { nombre: 'VEGA HUERTAS, Jhovanna Alice', area: 'Educación Religiosa', wa: '51963945061' },
  { nombre: 'CARO IBAZETA, Luis Héctor', area: 'Personal de Servicio', wa: '51920044821' }
];

document.addEventListener("DOMContentLoaded", () => {
 

  const director = TEACHERS.find(t => t.area === 'Director');
  const auxiliar = TEACHERS.find(t => t.area.includes('Auxiliar'));
  const servicio = TEACHERS.find(t => t.area.includes('Servicio'));
  const docentes = TEACHERS.filter(t => !['Director', 'Auxiliar de Educación', 'Personal de Servicio'].includes(t.area));
  
  // (El resto de código del organigrama que ya tienes abajo...)

  // 1. Pintar Director
  const dirContainer = document.getElementById('org-director-container');
  if (director && dirContainer) {
    dirContainer.innerHTML = `
      <p class="text-xs text-blue-300 font-bold uppercase">Dirección</p>
      <p class="text-sm font-bold text-white mt-1">${director.nombre}</p>
      <p class="text-xs text-cyan-200 mt-1">📧 ${director.email}</p>
      <a href="https://wa.me/${director.wa}" target="_blank" class="inline-block mt-2 text-xs bg-emerald-600/80 hover:bg-emerald-600 text-white px-2 py-1 rounded">💬 WhatsApp</a>
    `;
  }

  // 2. Pintar Auxiliar
  const auxContainer = document.getElementById('org-auxiliar-container');
  if (auxiliar && auxContainer) {
    auxContainer.innerHTML = `
      <p class="text-xs text-amber-300 font-bold uppercase">Auxiliar de Educación</p>
      <p class="text-sm font-semibold text-white mt-1">${auxiliar.nombre}</p>
      <p class="text-xs text-gray-400 mt-1">✉️ ${auxiliar.email}</p>
      <a href="https://wa.me/${auxiliar.wa}" target="_blank" class="text-xs text-emerald-400 hover:underline mt-1 inline-block">💬 WhatsApp: +${auxiliar.wa}</a>
    `;
  }

  // 3. Pintar Plana Docente
  const listaDocentesContainer = document.getElementById('org-lista-docentes');
  if (listaDocentesContainer) {
    listaDocentesContainer.innerHTML = docentes.map(doc => `
      <div class="org-item-docente">
        <p class="font-bold text-amber-200 text-xs">${doc.nombre}</p>
        <p class="text-cyan-300 text-[11px] font-semibold">📚 ${doc.area}</p>
        <div class="mt-1">
          <a href="https://wa.me/${doc.wa}" target="_blank" class="text-[10px] text-emerald-400 hover:underline">💬 WhatsApp</a>
        </div>
      </div>
    `).join('');
  }

  // 4. Pintar Personal de Servicio
  const servContainer = document.getElementById('org-servicio-container');
  if (servicio && servContainer) {
    servContainer.innerHTML = `
      <p class="text-xs text-blue-300 font-bold uppercase">Personal de Mantenimiento / Servicio</p>
      <p class="text-sm font-semibold text-white mt-1">${servicio.nombre}</p>
      <a href="https://wa.me/${servicio.wa}" target="_blank" class="text-xs text-emerald-400 hover:underline mt-1 inline-block">💬 WhatsApp: +${servicio.wa}</a>
    `;
  }
});

const LOGROS_DATA = [
  { titulo: "Gallardete por el primer puesto en declamacion en quechua", desc: "I.E PEDRO PAULET COCHAMARCA", fecha: "2016-09-2", img: "imagenes/honor2.jpeg" },
  { titulo: "Primer Lugar etapa regional", desc: "juegos florales ESCOLARES nacionales", fecha: "2017-07-4", img: "imagenes/honor1.jpeg" },
  { titulo: "Primer puesto", desc: "XXVII feria escolar nacional de ciennci y tecnologia EUREKA", fecha: "2017-08-4", img: "imagenes/honor3.jpeg" }
];
window.HONOR_DATA = [];
window.BRIGADIERES = [];

const CAMPUS_DATA = [
  { titulo: "Sede Principal Villa de Pasco", desc: "Instalaciones de la I.E. República de Argentina", img: "imagenes/colegio2.jpeg" },
  { titulo: "Laboratorios e Innovación", desc: "Aulas equipadas para el aprendizaje tecnológico", img: "imagenes/colegio1.jpeg" }
];

const COMUNICADOS = [
  { titulo: "Inicio del Año Lectivo 2026", texto: "Se comunica a todos los padres de familia que el inicio de clases se encuentra en marcha." },
  { titulo: "Reunión de Apoderados", texto: "Convocatoria general para entrega de informes del periodo académico." }
];

const EXAMENES = [
  { curso: "Matemática", tipo: "Evaluación Bimestral", grado: "Todos los grados" },
  { curso: "Ciencia y Tecnología", tipo: "FENCYT", grado: "3.º, 4.º y 5.º" }
];

const DEMO_ALUMNOS = {
  "78268454": {
    alumno: { nombre: "ATACHAGUA ARROYO STEISY ISABEL", grado: "1.º", seccion: "Única" },
    notas: [
      { curso: "Matemática", b1: 15, b2: 16, b3: 17, b4: "-", promedio: 16 },
      { curso: "Comunicación", b1: 14, b2: 15, b3: 16, b4: "-", promedio: 15 },
      { curso: "Ciencia y Tecnología", b1: 16, b2: 17, b3: 17, b4: "-", promedio: 17 },
      { curso: "Ciencias Sociales", b1: 14, b2: 14, b3: 15, b4: "-", promedio: 14 },
      { curso: "Inglés", b1: 15, b2: 15, b3: 16, b4: "-", promedio: 15 }
    ]
  },
  "60647252": {
    alumno: { nombre: "JUSTINIANO BAUTISTA BRISA DAYAN", grado: "5.º", seccion: "Única" },
    notas: [
      { curso: "Matemática", b1: 17, b2: 18, b3: 18, b4: "-", promedio: 18 },
      { curso: "Comunicación", b1: 16, b2: 17, b3: 17, b4: "-", promedio: 17 },
      { curso: "Ciencia y Tecnología", b1: 18, b2: 18, b3: 19, b4: "-", promedio: 18 },
      { curso: "Ciencias Sociales", b1: 16, b2: 16, b3: 17, b4: "-", promedio: 16 },
      { curso: "Inglés", b1: 17, b2: 18, b3: 18, b4: "-", promedio: 18 }
    ]
  }
};

let gradoSeleccionado = 1;
const gradosDesbloqueados = {};

function htmlHorarioGrado(n) {
const per = HORARIOS[n];
if (!per) return '';
const hoy = new Date().getDay();
const aMin = h => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };
let filas = '';
per.forEach((p, i) => {
if (i > 0) {
const fin = aMin(per[i - 1].h.split(' - ')[1]), ini = aMin(p.h.split(' - ')[0]);
if (ini - fin >= 10) filas += `<tr class="hz-recreo"><td colspan="6">RECREO · ${per[i - 1].h.split(' - ')[1]} – ${p.h.split(' - ')[0]}</td></tr>`;
}
filas += `<tr><td class="hora"><b>${esc(p.n)}</b>${esc(p.h)}</td>${p.dias.map((c, k) => {
if (!c) return '<td></td>';
const col = COLOR_CURSO[c.c] || '148,163,184';
return `<td><div class="hz-celda ${hoy === k + 1 ? 'hz-hoy' : ''}" style="background:rgba(${col},.2);border-color:rgba(${col},.55)"><b>${esc(c.c)}</b>${c.r ? '<em>REF.</em>' : ''}<small>${esc(c.d)}</small></div></td>`;
}).join('')}</tr>`;
});
return `<div class="horario-wrap"><table class="horario-tabla"><thead><tr><th></th>${DIAS_SEMANA.map((d, k) => `<th class="${hoy === k + 1 ? 'hz-th-hoy' : ''}">${d}</th>`).join('')}</tr></thead><tbody>${filas}</tbody></table></div>`;
}

function horariosPublicos() {
const caja = $('#horario-publico'), botones = $('#horario-grados');
const promptBox = $('#horario-auth-box');
if (!caja || !botones) return;

const NOMBRES = { 1: '1.º', 2: '2.º', 3: '3.º', 4: '4.º', 5: '5.º' };
botones.innerHTML = Object.keys(HORARIOS).map(n =>
`<button type="button" data-g="${n}" class="year-btn">${NOMBRES[n] || n} grado</button>`
).join('');

const renderizarHorario = (n) => {
gradoSeleccionado = n;
if (gradosDesbloqueados[n]) {
if (promptBox) promptBox.classList.add('hidden');
caja.classList.remove('hidden');
caja.innerHTML = htmlHorarioGrado(n);
} else {
if (promptBox) {
promptBox.classList.remove('hidden');
const inputPass = $('#horario-pass');
const errPass = $('#horario-pass-err');
if (inputPass) inputPass.value = '';
if (errPass) errPass.classList.add('hidden');
}
caja.classList.add('hidden');
caja.innerHTML = '';
}
};

const cambiarGrado = n => {
botones.querySelectorAll('button').forEach(b => {
const match = b.textContent.includes(n + '°') || b.textContent.includes(n + '.º');
b.classList.toggle('active', match);
});
renderizarHorario(n);
};

botones.addEventListener('click', e => {
const b = e.target.closest('button[data-g]');
if (b) cambiarGrado(b.dataset.g);
});

cambiarGrado(1);
}

document.addEventListener('click', (e) => {
const botonSeguro = e.target.closest('#horario-pass-btn');
if (!botonSeguro) return;

const inputSeguro = document.getElementById('horario-pass');
const errorSeguro = document.getElementById('horario-pass-err');
const passIngresada = inputSeguro ? inputSeguro.value.trim() : '';
const clavesValidas = { 1: 'arg2026-1', 2: 'arg2026-2', 3: 'arg2026-3', 4: 'arg2026-4', 5: 'arg2026-5' };
const claveReal = clavesValidas[gradoSeleccionado] || 'argentina';
if (passIngresada === claveReal) {
gradosDesbloqueados[gradoSeleccionado] = true;
const caja = $('#horario-publico');
const promptBox = $('#horario-auth-box');
if (promptBox) promptBox.classList.add('hidden');
if (caja) {
caja.classList.remove('hidden');
caja.innerHTML = htmlHorarioGrado(gradoSeleccionado);
}
} else {
if (errorSeguro) {
errorSeguro.textContent = `Contraseña incorrecta para el ${gradoSeleccionado}.º grado.`;
errorSeguro.classList.remove('hidden');
}
}
});

let anioActual = ANIO_FIN;

function escoltasYPromociones() {
const barra = $('#year-bar');
if (!barra) return;
const fichas = {
escolta: { grid: $('#gal-escolta'), vacio: $('#vacio-escolta'), token: 0 },
promocion: { grid: $('#gal-promocion'), vacio: $('#vacio-promocion'), token: 0 }
};

barra.innerHTML = Array.from({ length: ANIO_FIN - ANIO_INICIO + 1 }, (_, i) => ANIO_INICIO + i)
.map(y => `<button type="button" role="tab" class="year-btn" data-year="${y}">${y}</button>`).join('');

const pintarFotos = (f, tipo, year, fotos) => {
if (!fotos.length) { f.vacio.classList.remove('hidden'); return; }
f.grid.innerHTML = fotos.map((x, n) =>
`<button type="button" class="gal-item" data-full="${esc(x.full)}" aria-label="Ampliar foto ${n + 1}"><img src="${esc(x.url)}" alt="${esc(tipo)} ${year}" loading="lazy"></button>`).join('');
};

function cargarGaleria(tipo, year) {
const f = fichas[tipo], mi = ++f.token;
if (!f.grid || !f.vacio) return;
f.grid.innerHTML = ''; f.vacio.classList.add('hidden');
const rutas = Array.from({ length: CFG.MAX_FOTOS || 6 }, (_, i) => `imagenes/${tipo}/${year}/${i + 1}.jpg`);
Promise.all(rutas.map(src => new Promise(res => {
const im = new Image(); im.onload = () => res(src); im.onerror = () => res(null); im.src = src;
}))).then(lista => {
if (mi !== f.token) return;
const todas = lista.filter(Boolean).map(src => ({ url: src, full: src }));
pintarFotos(f, tipo, year, todas);
});
}

function seleccionar(year) {
anioActual = year;
$$('.year-btn').forEach(b => { const on = +b.dataset.year === year; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); });
const pt = $('#promo-title'), ye = $('#year-esc'), yp = $('#year-pro');
if (pt) pt.textContent = `Promoción ${year}`;
if (ye) ye.textContent = year;
if (yp) yp.textContent = year;
cargarGaleria('escolta', year); cargarGaleria('promocion', year);
}

barra.addEventListener('click', e => { const b = e.target.closest('.year-btn'); if (b) seleccionar(+b.dataset.year); });
seleccionar(ANIO_FIN);
}

function lightbox() {
const lb = $('#lightbox'), img = $('#lightbox-img');
if (!lb || !img) return;
const cerrar = () => { lb.classList.add('hidden'); img.removeAttribute('src'); };
document.addEventListener('click', e => {
const it = e.target.closest('.gal-item');
if (it) { img.src = it.dataset.full; lb.classList.remove('hidden'); return; }
if (e.target.closest('#lightbox-close') || e.target === lb) cerrar();
});
}

function logros() {
const grid = $('#grid-logros');
if (!grid || typeof LOGROS_DATA === 'undefined') return;
grid.innerHTML = LOGROS_DATA.map(l => `
<div class="neon-border-card overflow-hidden flex flex-col justify-between group">
<div>
<div class="aspect-video w-full overflow-hidden bg-[#070c19] relative border-b border-cyan-500/20">
<img src="${esc(l.img)}" alt="${esc(l.titulo)}" loading="lazy" class="w-full h-full object-cover">
<span class="absolute top-3 right-3 bg-[#0b1329]/90 backdrop-blur-md text-cyan-400 border border-cyan-500/40 text-[10px] font-bold px-2.5 py-1 rounded-full"><i class="fa-solid fa-calendar-days mr-1"></i> ${esc(fmtFecha(l.fecha))}</span>
</div>
<div class="p-5">
<h4 class="font-lexend font-bold text-white text-base mb-2">${esc(l.titulo)}</h4>
<p class="text-slate-400 text-xs leading-relaxed">${esc(l.desc)}</p>
</div>
</div>
</div>`).join('');
}

function cuadroHonor() {
const grid = $('#grid-honor'), filtros = $('#filtros-honor');
if (!grid || !filtros || typeof HONOR_DATA === 'undefined') return;
const grados = ['1.º', '2.º', '3.º', '4.º', '5.º'];
const marco = { 1: 'honor-oro', 2: 'honor-plata', 3: 'honor-bronce' };
const tarjeta = (clase, foto, nombre, etiqueta, pie, icono, color) => `
<div class="neon-border-card ${clase} p-4 text-center flex flex-col items-center">
<div class="w-20 h-20 rounded-full overflow-hidden border-2 border-cyan-400 mb-3 bg-[#070c19]">
<img src="${esc(foto)}" alt="${esc(nombre)}" loading="lazy" class="w-full h-full object-cover" onerror="this.onerror=null;this.src='${fotoRespaldo(nombre)}'">
</div>
<span class="${color} text-sm font-bold mb-1"><i class="fa-solid ${icono} mr-1"></i> ${etiqueta}</span>
<h4 class="font-lexend font-bold text-white text-base">${esc(nombre)}</h4>
<p class="text-cyan-400 text-xs mt-1">${pie}</p>
</div>`;
const pintar = f => {
if (f === 'brig' && typeof BRIGADIERES !== 'undefined') {
grid.innerHTML = BRIGADIERES.map(b => tarjeta('honor-brig', b.foto, b.nombre, esc(b.cargo), 'Brigadier destacado', 'fa-shield-halved', 'text-cyan-300')).join('');
} else {
grid.innerHTML = HONOR_DATA.filter(h => h.grado === f).sort((a, b) => a.puesto - b.puesto)
.map(h => tarjeta(marco[h.puesto] || '', h.foto, h.nombre, `Puesto ${h.puesto} · ${esc(h.grado)}`, `Promedio: ${esc(h.promedio)}`, 'fa-medal', 'text-amber-300')).join('');
}
};
filtros.innerHTML = [...grados.map(g => [g, `${g} grado`]), ['brig', 'Brigadieres']].map(([v, t], i) =>
`<button type="button" data-honor="${v}" class="year-btn ${i === 0 ? 'active' : ''}">${t}</button>`).join('');
filtros.addEventListener('click', e => {
const b = e.target.closest('button[data-honor]'); if (!b) return;
filtros.querySelectorAll('button').forEach(x => x.classList.remove('active'));
b.classList.add('active');
pintar(b.dataset.honor);
});
pintar(grados[0]);
}
function campus() {
const slides = $('#campus-slides'), dotsBox = $('#campus-dots'), box = $('#campus-carousel');
if (!slides || !dotsBox || !box || typeof CAMPUS_DATA === 'undefined') return;
slides.innerHTML = CAMPUS_DATA.map(c => `
<div class="aspect-video relative min-w-full">
<img src="${esc(c.img)}" alt="${esc(c.titulo)}" loading="lazy" class="w-full h-full object-cover">
<div class="campus-caption"><h4 class="font-lexend font-bold text-white text-lg">${esc(c.titulo)}</h4><p class="text-slate-300 text-sm">${esc(c.desc)}</p></div>
</div>`).join('');
dotsBox.innerHTML = CAMPUS_DATA.map((_, i) => `<button type="button" class="campus-dot" data-i="${i}"></button>`).join('');
let idx = 0;
const ir = n => {
idx = (n + CAMPUS_DATA.length) % CAMPUS_DATA.length;
slides.style.transform = `translateX(-${idx * 100}%)`;
[...dotsBox.children].forEach((d, k) => d.classList.toggle('active', k === idx));
};
dotsBox.addEventListener('click', e => { const b = e.target.closest('.campus-dot'); if (b) ir(+b.dataset.i); });
ir(0);
}
function staff() {
const grid = $('#staff-grid');
if (!grid || typeof TEACHERS === 'undefined') return;
grid.innerHTML = TEACHERS.map(t => `
<div class="neon-border-card p-5 text-center flex flex-col items-center">
<img src="${esc(t.foto || fotoRespaldo(t.nombre))}" alt="${esc(t.nombre)}" loading="lazy" class="teacher-photo mb-4" onerror="this.onerror=null;this.src='${fotoRespaldo(t.nombre)}'">
<h4 class="font-lexend font-bold text-white text-sm">${esc(t.nombre)}</h4>
<p class="text-cyan-400 text-xs font-semibold mt-1 mb-4">${esc(t.area)}</p>
<div class="flex gap-2 w-full mt-auto">
<a href="${waLink(t.wa, `Hola ${t.nombre}, le escribo desde la web de la I.E. República de Argentina.`)}" target="_blank" rel="noopener" class="flex-1 py-2 rounded-full bg-emerald-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(52,211,153,0.3)]"><i class="fa-brands fa-whatsapp text-sm"></i> WhatsApp</a>
<a href="tel:+${esc(t.wa)}" class="w-10 py-2 rounded-full border border-cyan-400/50 text-cyan-400 flex items-center justify-center hover:bg-cyan-500/10"><i class="fa-solid fa-phone"></i></a>
</div>
</div>`).join('');
}

// ==========================================
// 2. FUNCIÓN DE JUSTIFICACIONES VINCULADA A WHATSAPP
// ==========================================
function justificacion() {
  const form = $('#formJust'); 
  if (!form) return;
  const msg = $('#msgJust');

  const selectDocente = form.querySelector('select[name="docente"]') || $('#jf-docente');
  if (selectDocente && typeof TEACHERS !== 'undefined') {
    selectDocente.innerHTML = '<option value="">-- Seleccione un docente --</option>' + 
      TEACHERS.map(t => `<option value="${t.nombre}">${t.nombre} (${t.area})</option>`).join('');
  }

  form.addEventListener('submit', e => {
    e.preventDefault();

    const alumno = $('#jf-alumno')?.value.trim() || '';
    const dni = $('#jf-dni')?.value.trim() || '';
    const detalle = $('#jf-detalle')?.value.trim() || '';
    const telApoderado = $('#jf-tel')?.value.trim() || '';
    const nombreDocenteSelect = selectDocente?.value || '';

    if (alumno.length < 5 || !/^\d{8}$/.test(dni) || detalle.length < 5 || !/^\d{9}$/.test(telApoderado) || !nombreDocenteSelect) {
      if(msg) msg.innerHTML = '<div class="msg err" style="background:#b00020;color:#fff;padding:10px;border-radius:8px;text-align:center;">Por favor, complete todos los datos correctamente (DNI de 8 dígitos y celular de 9).</div>';
      return;
    }

    const docenteEncontrado = TEACHERS.find(t => t.nombre === nombreDocenteSelect);
    if (!docenteEncontrado || !docenteEncontrado.wa) {
      if(msg) msg.innerHTML = '<div class="msg err" style="background:#b00020;color:#fff;padding:10px;border-radius:8px;text-align:center;">Seleccione un docente válido para enviar el mensaje.</div>';
      return;
    }

    const textoMensaje = `*JUSTIFICACIÓN DE INASISTENCIA*%0A` +
      `----------------------------------%0A` +
      `*Estudiante:* ${encodeURIComponent(alumno)}%0A` +
      `*DNI:* ${encodeURIComponent(dni)}%0A` +
      `*Motivo / Detalle:* ${encodeURIComponent(detalle)}%0A` +
      `*Celular del Apoderado:* ${encodeURIComponent(telApoderado)}`;

    const urlWhatsApp = `https://wa.me/${docenteEncontrado.wa}?text=${textoMensaje}`;
    window.open(urlWhatsApp, '_blank');

    if(msg) {
      msg.innerHTML = '<div class="msg" style="background:#c6e0b4;color:#12263a;padding:10px;border-radius:8px;text-align:center;"><b>¡Redirigiendo al WhatsApp del docente con éxito!</b></div>';
    }
  });
}
function citasWhatsApp() {
  const form = $('#formCita'), sel = $('#ct-maestro');
  if (!form || !sel || typeof TEACHERS === 'undefined') return;
  const msg = $('#msgCita');
  const conWa = TEACHERS.filter(t => t.wa);
  sel.innerHTML = conWa.map((t, i) => `<option value="${i}">${esc(t.nombre)} — ${esc(t.area)}</option>`).join('');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const v = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    const t = conWa[+sel.value]; if (!t) return;
    const texto = `Hola, ${t.nombre}. Soy ${v('ct-nombre')}, apoderado(a) de ${v('ct-alumno')}. Motivo: ${v('ct-motivo')}`;
    window.open(waLink(t.wa, texto), '_blank', 'noopener');
    mostrarMensaje(msg, 'ok', `Abriendo WhatsApp con <b>${esc(t.nombre)}</b>…`);
  });
}
function actualidad() {
const pc = $('#panel-comunicados'), pe = $('#panel-examenes');
if (pc && typeof COMUNICADOS !== 'undefined') pc.innerHTML = COMUNICADOS.map(c => `
<article class="p-4 rounded-xl bg-[#0b1329] border border-cyan-500/20">
<h4 class="font-lexend font-bold text-white text-sm mb-1">${esc(c.titulo)}</h4>
<p class="text-slate-300 text-xs mb-2">${esc(c.texto)}</p>
</article>`).join('');
if (pe && typeof EXAMENES !== 'undefined') pe.innerHTML = EXAMENES.map(x => `
<article class="p-4 rounded-xl bg-[#0b1329] border border-cyan-500/20">
<h4 class="font-lexend font-bold text-white text-sm">${esc(x.curso)} <span class="text-cyan-400">· ${esc(x.tipo)}</span></h4>
<p class="text-slate-400 text-xs">${esc(x.grado)}</p>
</article>`).join('');
}

function portales() {
$$('.tab-portal').forEach(bt => bt.onclick = () => {
$$('.tab-portal').forEach(b => { b.classList.remove('bg-cyan-500', 'text-slate-950', 'shadow-[0_0_12px_rgba(0,212,255,0.4)]'); b.classList.add('bg-[#0b1329]', 'text-slate-300'); });
bt.classList.remove('bg-[#0b1329]', 'text-slate-300'); bt.classList.add('bg-cyan-500', 'text-slate-950', 'shadow-[0_0_12px_rgba(0,212,255,0.4)]');
const pEst = $('#p-est'), pDoc = $('#p-doc');
if (pEst) pEst.classList.toggle('hidden', bt.dataset.p !== 'est');
if (pDoc) pDoc.classList.toggle('hidden', bt.dataset.p !== 'doc');
});

const form = $('#f'), out = $('#resultado');
if (out) out.dataset.base = 'mt-6';

async function consultar(idSecreto) {
if (!API) {
const d = (typeof DEMO_ALUMNOS !== 'undefined') ? DEMO_ALUMNOS[idSecreto.trim()] : null;
return d ? { ok: true, demo: true, ...d } : { ok: false, error: 'Código de acceso incorrecto o DNI no registrado (ej. 78268454).' };
}
const r = await fetch(`${API}?action=notas&id=${encodeURIComponent(idSecreto)}`);
return r.json();
}

function pintar(d) {
if (!out) return;
const a = d.alumno;
const notas = (d.notas || []).map(n => `<tr><td class="font-semibold">${esc(n.curso)}</td><td>${n.b1}</td><td>${n.b2}</td><td>${n.b3}</td><td>${n.b4}</td><td><b>${n.promedio}</b></td></tr>`).join('');
out.className = 'mt-6';
out.innerHTML = `
<div class="p-5 rounded-xl bg-[#0b1329] border border-cyan-500/40 space-y-4 shadow-[0_0_20px_rgba(0,212,255,0.2)]">
<div class="flex items-center justify-between">
<div><h3 class="font-lexend font-bold text-lg text-cyan-400">${esc(a.nombre)}</h3><p class="text-xs text-slate-400">${esc(a.grado)} grado · Sección ${esc(a.seccion)}</p></div>
<span class="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold"><i class="fa-solid fa-shield-halved mr-1"></i> ID Protegido</span>
</div>
<div class="overflow-x-auto"><table class="tabla-datos"><thead><tr><th>Curso</th><th>B1</th><th>B2</th><th>B3</th><th>B4</th><th>Prom.</th></tr></thead><tbody>${notas}</tbody></table></div>
<button type="button" id="cerrar-notas" class="text-xs text-slate-400 hover:text-cyan-300 underline">Cerrar sesión de notas</button>
</div>`;
$('#cerrar-notas').onclick = () => { out.innerHTML = ''; out.classList.add('hidden'); };
}

if (form) form.addEventListener('submit', async e => {
e.preventDefault();
const idSecreto = $('#dni').value.trim();
if (idSecreto.length < 8) { mostrarMensaje(out, 'err', 'Por favor ingresa tu DNI / ID completo de estudiante.'); return; }
const btn = form.querySelector('button[type=submit]'); if (btn) btn.disabled = true;
mostrarMensaje(out, 'info', '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Verificando credenciales de alumno…', false);
try {
const d = await consultar(idSecreto);
if (!d.ok) mostrarMensaje(out, 'err', esc(d.error));
else pintar(d);
} catch (err) { mostrarMensaje(out, 'err', 'Error de conexión.'); }
if (btn) btn.disabled = false;
});

const mapa = $('#mapa-colegio');
if (mapa) {
mapa.src = `https://maps.google.com/maps?q=${encodeURIComponent('Villa de Pasco')}&hl=es&z=16&output=embed`;
}
}

/* ===================== ARRANQUE GENERAL ===================== */
[menuMovil, accesosRapidos, efectoEscritura, estrellas, aparicionScroll, zonasDeCarga, escoltasYPromociones, lightbox, logros, cuadroHonor, campus, staff, justificacion, citasWhatsApp, actualidad, portales, horariosPublicos].forEach(ejecutar);
// ==========================================
// ORGANIGRAMA INSTITUCIONAL - ESTILO MAPA CONCEPTUAL
// ==========================================
(function() { 

  function popularOrganigramaArbol() {
    const dirContainer = document.getElementById('org-director-container');
    const auxContainer = document.getElementById('org-auxiliar-container');
    const listaDocentesContainer = document.getElementById('org-lista-docentes');
    const servContainer = document.getElementById('org-servicio-container');

    if (!dirContainer || !listaDocentesContainer) return;

    const director = TEACHERS.find(t => t.area === 'Director');
    const auxiliar = TEACHERS.find(t => t.area === 'Auxiliar de Educación');
    const servicio = TEACHERS.find(t => t.area === 'Personal de Servicio');
    const docentes = TEACHERS.filter(t => t.area !== 'Director' && t.area !== 'Auxiliar de Educación' && t.area !== 'Personal de Servicio');

    // Director
    if (director) {
      dirContainer.innerHTML = `
        <span class="text-xs text-cyan-300 font-extrabold uppercase tracking-widest bg-cyan-950 px-3 py-1 rounded-full border border-cyan-500/40">🏛️ Dirección General</span>
        <p class="text-base sm:text-lg font-bold text-white mt-2">${director.nombre}</p>
        <p class="text-xs text-slate-300 mt-1">📧 <span class="select-all">${director.email}</span></p>
        <div class="mt-3">
          <a href="https://wa.me/${director.wa}" target="_blank" class="inline-flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3.5 py-1.5 rounded-lg shadow transition-all">
            💬 WhatsApp Directo
          </a>
        </div>
      `;
    }

    // Auxiliar
    if (auxiliar && auxContainer) {
      auxContainer.innerHTML = `
        <span class="text-xs text-amber-300 font-bold uppercase tracking-wider bg-amber-950 px-2.5 py-0.5 rounded-full border border-amber-500/30">📋 Auxiliar de Educación</span>
        <p class="text-sm sm:text-base font-semibold text-white mt-2">${auxiliar.nombre}</p>
        <p class="text-xs text-slate-400 mt-1">📧 <span class="select-all">${auxiliar.email}</span></p>
        <div class="mt-2">
          <a href="https://wa.me/${auxiliar.wa}" target="_blank" class="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline font-medium">
            💬 WhatsApp Auxiliar
          </a>
        </div>
      `;
    }

    // Docentes (Nivel central del mapa)
    if (listaDocentesContainer) {
      listaDocentesContainer.innerHTML = docentes.map(doc => `
        <div class="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-cyan-400 shadow-lg flex flex-col justify-between transition-all hover:-translate-y-1">
          <div>
            <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">${doc.area}</span>
            <p class="font-bold text-white text-xs sm:text-sm mt-2">${doc.nombre}</p>
            <p class="text-slate-400 text-[11px] mt-1 truncate">📧 ${doc.email}</p>
          </div>
          <div class="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
            <span class="text-[10px] text-slate-500">Docente</span>
            <a href="https://wa.me/${doc.wa}" target="_blank" class="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold">
              💬 WhatsApp
            </a>
          </div>
        </div>
      `).join('');
    }

    // Personal de Servicio
    if (servicio && servContainer) {
      servContainer.innerHTML = `
        <span class="text-xs text-blue-300 font-bold uppercase tracking-wider bg-blue-950 px-2.5 py-0.5 rounded-full border border-blue-500/30">🛠️ Personal de Mantenimiento y Servicio</span>
        <p class="text-sm sm:text-base font-semibold text-white mt-2">${servicio.nombre}</p>
        <div class="mt-2">
          <a href="https://wa.me/${servicio.wa}" target="_blank" class="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline font-medium">
            💬 Contactar por WhatsApp
          </a>
        </div>
      `;
    }
  }

  document.addEventListener("DOMContentLoaded", popularOrganigramaArbol);
  window.addEventListener("load", popularOrganigramaArbol);
  setTimeout(popularOrganigramaArbol, 200);
})();
// --- 1. CARRUSEL DE CAMPUS AUTOMÁTICO ---
document.addEventListener("DOMContentLoaded", () => {
  const campusSlides = document.getElementById('campus-slides');
  if (campusSlides) {
    const slides = campusSlides.children;
    let indice = 0;

    setInterval(() => {
      indice = (indice + 1) % slides.length;
      // Desplaza el carrusel horizontalmente de forma automática
      campusSlides.style.transform = `translateX(-${indice * 100}%)`;
    }, 4000); // Cambia de foto cada 4 segundos
  }

  // --- 2. ACCESOS RÁPIDOS AUTOMÁTICOS (Desplazamiento del Track) ---
  const track = document.getElementById('track');
  const btnNext = document.getElementById('next');
  
  if (track && btnNext) {
    setInterval(() => {
      // Si llega al final, regresa al inicio; si no, avanza
      if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 10) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        track.scrollBy({ left: 250, behavior: 'smooth' }); // Mueve 250px a la derecha
      }
    }, 3500); // Se mueve cada 3.5 segundos
  }
});
function mostrarPortal(tipo) {
  const seccionNotas = document.getElementById('seccion-notas');
  const seccionUbicacion = document.getElementById('seccion-ubicacion');
  const btnNotas = document.getElementById('btn-tab-notas');
  const btnUbicacion = document.getElementById('btn-tab-ubicacion');

  const activo = "px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-400 transition";
  const inactivo = "px-4 py-2 rounded-xl bg-slate-900/60 text-slate-300 font-semibold border border-slate-700 transition";

  if (tipo === 'notas') {
    seccionNotas.classList.remove('hidden');
    seccionUbicacion.classList.add('hidden');
    btnNotas.className = activo;
    btnUbicacion.className = inactivo;
  } else {
    seccionUbicacion.classList.remove('hidden');
    seccionNotas.classList.add('hidden');
    btnUbicacion.className = activo;
    btnNotas.className = inactivo;
  }
}
function mostrarPortal(tipo) {
  const seccionNotas = document.getElementById('seccion-notas');
  const seccionUbicacion = document.getElementById('seccion-ubicacion');
  const btnNotas = document.getElementById('btn-tab-notas');
  const btnUbicacion = document.getElementById('btn-tab-ubicacion');

  const claseActiva = "px-4 py-2 rounded-xl bg-cyan-500/25 text-cyan-300 font-semibold border border-cyan-400 transition";
  const claseInactiva = "px-4 py-2 rounded-xl bg-slate-900/60 text-slate-300 font-semibold border border-slate-700 transition";

  if (tipo === 'notas') {
    seccionNotas.classList.remove('hidden');
    seccionUbicacion.classList.add('hidden');
    btnNotas.className = claseActiva;
    btnUbicacion.className = claseInactiva;
  } else {
    seccionUbicacion.classList.remove('hidden');
    seccionNotas.classList.add('hidden');
    btnUbicacion.className = claseActiva;
    btnNotas.className = claseInactiva;
  }
}