(function () {
  const API_URL = "https://script.google.com/macros/s/AKfycbyRHwq3oPelAhD3Qtzr7w5ReGhd1eAYLzINZG89z4tVYEMpLONj-NvwicAGs_QZ9BmOPg/exec";

  // Convierte cualquier enlace de Google Drive en un enlace que SÍ funciona como imagen.
  // Acepta: .../file/d/ID/view?usp=...   .../open?id=ID   .../uc?id=ID   o un enlace que ya sea de imagen.
  function fotoDrive(url) {
    url = String(url || '').trim();
    if (!url) return '';
    let id = '';
    let m = url.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
    if (m) id = m[1];
    if (!id) {
      m = url.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
      if (m) id = m[1];
    }
    if (id) return 'https://drive.google.com/thumbnail?id=' + id + '&sz=w600';
    return url; // si no es de Drive, se deja igual
  }

  // 1. Datos iniciales para que la página NUNCA se vea vacía al abrir
  window.HONOR_DATA = window.HONOR_DATA || [
    { grado: "1.º", puesto: 1, nombre: "Steisy Isabel Atachagua", promedio: "17.5", foto: "" },
    { grado: "1.º", puesto: 2, nombre: "SARAI", promedio: "AD", foto: "" },
    { grado: "5.º", puesto: 1, nombre: "ABIGAIL", promedio: "AD", foto: "" }
  ];

  window.BRIGADIERES = window.BRIGADIERES || [
    { nombre: "BIANCA", cargo: "Brigadier General", foto: "" }
  ];

  // Función para redibujar los cuadros en pantalla
  const refrescarPantalla = () => {
    if (typeof cuadroHonor === 'function') {
      cuadroHonor();
    } else {
      const activo = document.querySelector('#filtros-honor button.active') || document.querySelector('#filtros-honor button');
      if (activo) activo.click();
    }
  };

  // Dibujar inmediatamente con lo que hay
  refrescarPantalla();

  // 2. Traer los datos nuevos de Google Sheets automáticamente en segundo plano
  fetch(API_URL + '?tipo=honor&_=' + Date.now())
    .then(r => r.json())
    .then(d => {
      const items = (d.items || []).filter(i => i.nombre);
      if (!items.length) return;
      const esBrig = i => String(i.tipo || '').toLowerCase().indexOf('brig') === 0;

      const honor = items.filter(i => !esBrig(i)).map(i => ({
        grado: i.grado ? i.grado + (String(i.grado).endsWith('º') ? '' : '.º') : '1.º',
        puesto: parseInt(i.puesto, 10) || 1,
        nombre: i.nombre,
        promedio: i.promedio || '-',
        foto: fotoDrive(i.foto)
      }));

      const brig = items.filter(esBrig).map(i => ({
        nombre: i.nombre,
        cargo: i.cargo || 'Brigadier',
        foto: fotoDrive(i.foto)
      }));

      if (honor.length) {
        window.HONOR_DATA.length = 0;
        window.HONOR_DATA.push(...honor);
      }
      if (brig.length) {
        window.BRIGADIERES.length = 0;
        window.BRIGADIERES.push(...brig);
      }

      // Actualizar la pantalla con los datos frescos del Sheets
      refrescarPantalla();
    })
    .catch(err => console.log("Usando datos locales:", err));
})();
