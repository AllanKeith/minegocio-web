// ══════════════════════════════════════════════
// MINEGOCIO — Lógica principal
// ══════════════════════════════════════════════


// ══════════════════════════════
// MODO SIN INTERNET (Service Worker + instalación)
// ══════════════════════════════
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function (err) {
      console.warn('No se pudo registrar el service worker:', err);
    });
  });
}

// Capturar el evento que Chrome/Android dispara cuando la app cumple los
// requisitos para instalarse, así podemos mostrar nuestro propio botón.
var eventoInstalacion = null;
window.addEventListener('beforeinstallprompt', function (e) {
  e.preventDefault();
  eventoInstalacion = e;
});

window.addEventListener('appinstalled', function () {
  eventoInstalacion = null;
  mostrarNotificacion('✅ App instalada — ya puedes usarla sin internet');
});

function instalarApp() {
  if (eventoInstalacion) {
    eventoInstalacion.prompt();
    eventoInstalacion.userChoice.then(function () { eventoInstalacion = null; });
    return;
  }
  // El navegador no ofrece instalación automática (iPhone, escritorio, etc.)
  var esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (esIOS) {
    alert('Para instalarla en iPhone/iPad:\n\n1. Toca el botón Compartir (cuadrito con flecha hacia arriba) en Safari.\n2. Elige "Agregar a pantalla de inicio".\n3. Listo: te queda como una app que funciona sin internet.');
  } else {
    alert('Para instalarla:\n\nBusca en el menú del navegador (⋮ o ⋯) la opción "Instalar app" o "Agregar a pantalla de inicio".\n\nSi ya la instalaste antes, búscala en la pantalla de inicio de tu teléfono.');
  }
}


// ══════════════════════════════
// ALMACENAMIENTO LOCAL
// ══════════════════════════════
function obtenerDatos(clave, porDefecto) {
  try { return JSON.parse(localStorage.getItem(clave)) || porDefecto; }
  catch (e) { return porDefecto; }
}

function guardarDatos(clave, valor) {
  localStorage.setItem(clave, JSON.stringify(valor));
}


// ══════════════════════════════
// VARIABLES GLOBALES
// ══════════════════════════════
var productos  = obtenerDatos('mn_productos', []);
var ventas     = obtenerDatos('mn_ventas', []);
var editandoId = null;

// Productos de ejemplo solo si es la primera vez que se abre la app
var appInicializada = localStorage.getItem('mn_inicializada');
if (!appInicializada) {
  if (productos.length === 0) {
    productos = [
      { id: 1, nombre: 'Calcetines lana',  precio: 2500, stock: 15 },
      { id: 2, nombre: 'Guantes invierno', precio: 3900, stock: 3  },
      { id: 3, nombre: 'Bufanda polar',    precio: 4200, stock: 8  },
      { id: 4, nombre: 'Gorro lana',       precio: 3100, stock: 2  },
    ];
    guardarDatos('mn_productos', productos);
  }
  localStorage.setItem('mn_inicializada', '1');
}


// ══════════════════════════════
// NAVEGACIÓN ENTRE VISTAS
// ══════════════════════════════
var titulosVistas = {
  inicio:     ['Inicio',           'Resumen de tu negocio'],
  inventario: ['Inventario',       'Administra tus productos'],
  venta:      ['Registrar venta',  'Arma tu boleta y confirma la venta'],
  reportes:   ['Reportes',         'Lo más vendido y estadísticas']
};

function irVista(id) {
  document.querySelectorAll('.vista').forEach(function (v) { v.classList.remove('activa'); });
  document.querySelectorAll('.boton-nav').forEach(function (n) { n.classList.remove('activo'); });

  document.getElementById('vista-' + id).classList.add('activa');
  document.getElementById('nav-' + id).classList.add('activo');
  document.getElementById('topbar-titulo').textContent   = titulosVistas[id][0];
  document.getElementById('topbar-subtitulo').textContent = titulosVistas[id][1];
  window.scrollTo(0, 0);

  if (id === 'inicio')     mostrarInicio();
  if (id === 'inventario') mostrarInventario();
  if (id === 'venta')      mostrarVenta();
  if (id === 'reportes')   mostrarReportes();
}


// ══════════════════════════════
// FECHA EN BARRA SUPERIOR
// ══════════════════════════════
(function () {
  var d = new Date();
  var dias   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  var meses  = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  document.getElementById('fecha-hoy').textContent =
    dias[d.getDay()] + ', ' + d.getDate() + ' de ' + meses[d.getMonth()] + ' ' + d.getFullYear();
})();


// ══════════════════════════════
// UTILIDAD: FORMATEAR FECHA
// ══════════════════════════════
function formatearFecha(marcaTiempo) {
  var d = new Date(marcaTiempo);
  return d.toLocaleDateString('es-CL') + ' ' + d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}


// ══════════════════════════════
// VISTA: INICIO
// ══════════════════════════════
function mostrarInicio() {
  var hoy        = new Date().toDateString();
  var ventasHoy  = ventas.filter(function (v) { return new Date(v.fecha).toDateString() === hoy; });
  var totalHoy   = ventasHoy.reduce(function (acc, v) { return acc + v.total; }, 0);
  var totalHist  = ventas.reduce(function (acc, v) { return acc + v.total; }, 0);
  var cantBajos  = productos.filter(function (p) { return p.stock <= 3; }).length;

  document.getElementById('stat-total').textContent         = '$' + totalHoy.toLocaleString('es-CL');
  document.getElementById('stat-cant').textContent          = ventasHoy.length + (ventasHoy.length === 1 ? ' venta' : ' ventas');
  document.getElementById('stat-prods').textContent         = productos.length;
  document.getElementById('stat-bajo').textContent          = cantBajos > 0 ? cantBajos + ' con stock bajo ⚠️' : '✅ Todo en orden';
  document.getElementById('stat-historico').textContent     = '$' + totalHist.toLocaleString('es-CL');
  document.getElementById('stat-ventas-total').textContent  = ventas.length + ' ventas totales';
  document.getElementById('pista-inventario').textContent   = productos.length + ' productos';

  var contenedor = document.getElementById('ultimas-ventas');
  var recientes  = ventas.slice().reverse().slice(0, 5);

  if (recientes.length === 0) {
    contenedor.innerHTML =
      '<div class="estado-vacio">' +
        '<div class="estado-vacio-icono">🛍️</div>' +
        '<div class="estado-vacio-texto">Sin ventas aún</div>' +
        '<div class="estado-vacio-detalle">Toca "Registrar venta" para comenzar</div>' +
      '</div>';
  } else {
    contenedor.innerHTML = recientes.map(function (v) {
      var resumen = v.items
        ? v.items.map(function(i){ return i.nombre + ' x' + i.cantidad; }).join(', ')
        : (v.nombre + ' x' + v.cantidad);
      return '<div class="item-lista">' +
               '<div><div class="item-nombre">' + resumen + '</div>' +
               '<div class="item-subtitulo">' + formatearFecha(v.fecha) + '</div></div>' +
               '<div class="item-precio">$' + v.total.toLocaleString('es-CL') + '</div>' +
             '</div>';
    }).join('');
  }
}


// ══════════════════════════════
// VISTA: INVENTARIO
// ══════════════════════════════
function mostrarInventario() {
  document.getElementById('inv-contador').textContent =
    productos.length + ' producto' + (productos.length !== 1 ? 's' : '');

  var cuerpoTabla = document.getElementById('tabla-productos');

  if (productos.length === 0) {
    cuerpoTabla.innerHTML =
      '<tr><td colspan="5"><div class="estado-vacio">' +
        '<div class="estado-vacio-icono">📦</div>' +
        '<div class="estado-vacio-texto">Sin productos</div>' +
        '<div class="estado-vacio-detalle">Agrega tu primer producto arriba</div>' +
      '</div></td></tr>';
    return;
  }

  cuerpoTabla.innerHTML = productos.map(function (p) {
    var claseEtiqueta  = p.stock === 0 ? 'etiqueta-sin'  : p.stock <= 3 ? 'etiqueta-bajo'  : 'etiqueta-ok';
    var textoEtiqueta  = p.stock === 0 ? 'Sin stock'      : p.stock <= 3 ? '⚠️ Poco stock'  : '✅ OK';
    return '<tr>' +
      '<td><strong>' + p.nombre + '</strong></td>' +
      '<td>$' + p.precio.toLocaleString('es-CL') + '</td>' +
      '<td>' + p.stock + ' ud.</td>' +
      '<td><span class="item-etiqueta ' + claseEtiqueta + '">' + textoEtiqueta + '</span></td>' +
      '<td><div class="item-acciones">' +
        '<button class="boton-pequeño editar"   onclick="editarProducto(' + p.id + ')">✏️ Editar</button>' +
        '<button class="boton-pequeño eliminar" onclick="eliminarProducto(' + p.id + ')">🗑️ Eliminar</button>' +
      '</div></td>' +
    '</tr>';
  }).join('');
}

function guardarProducto() {
  var nombre = document.getElementById('inp-nombre').value.trim();
  var precio = parseInt(document.getElementById('inp-precio').value);
  var stock  = parseInt(document.getElementById('inp-stock').value);
  var error  = document.getElementById('inv-error');
  var exito  = document.getElementById('inv-exito');
  error.style.display = 'none';
  exito.style.display = 'none';

  if (!nombre)                { error.textContent = 'Escribe el nombre del producto.'; error.style.display = 'block'; return; }
  if (!precio || precio <= 0) { error.textContent = 'Escribe un precio válido.';       error.style.display = 'block'; return; }
  if (isNaN(stock) || stock < 0) { error.textContent = 'Escribe el stock (puede ser 0).'; error.style.display = 'block'; return; }

  if (editandoId) {
    productos = productos.map(function (p) {
      return p.id === editandoId ? { id: p.id, nombre: nombre, precio: precio, stock: stock } : p;
    });
    exito.textContent = '✅ Producto actualizado correctamente.';
    mostrarNotificacion('Producto actualizado ✅');
  } else {
    productos.push({ id: Date.now(), nombre: nombre, precio: precio, stock: stock });
    exito.textContent = '✅ Producto agregado correctamente.';
    mostrarNotificacion('Producto agregado ✅');
  }

  guardarDatos('mn_productos', productos);
  exito.style.display = 'block';
  cancelarEdicion();
  mostrarInventario();
}

function editarProducto(id) {
  var p = productos.find(function (x) { return x.id === id; });
  if (!p) return;
  editandoId = id;
  document.getElementById('inp-nombre').value = p.nombre;
  document.getElementById('inp-precio').value = p.precio;
  document.getElementById('inp-stock').value  = p.stock;
  document.getElementById('form-inv-titulo').textContent = '✏️ Editar producto';
  document.getElementById('btn-cancelar-edit').style.display = 'inline-block';
  document.getElementById('inp-nombre').focus();
  window.scrollTo(0, 0);
}

function cancelarEdicion() {
  editandoId = null;
  document.getElementById('inp-nombre').value = '';
  document.getElementById('inp-precio').value = '';
  document.getElementById('inp-stock').value  = '';
  document.getElementById('form-inv-titulo').textContent = '➕ Agregar producto';
  document.getElementById('btn-cancelar-edit').style.display = 'none';
}

function eliminarProducto(id) {
  if (!confirm('¿Seguro que deseas eliminar este producto?\nTambién se borrarán sus ventas del historial.')) return;
  var productoEliminado = productos.find(function (p) { return p.id === id; });
  productos = productos.filter(function (p) { return p.id !== id; });
  guardarDatos('mn_productos', productos);
  if (productoEliminado) {
    // Borrar ventas que sean solo de ese producto (sin items) O limpiar ese ítem de ventas multi-producto
    ventas = ventas.filter(function (v) {
      if (v.items) {
        v.items = v.items.filter(function(i){ return i.prodId !== productoEliminado.id; });
        if (v.items.length === 0) return false;
        v.total = v.items.reduce(function(acc,i){ return acc + i.subtotal; }, 0);
        return true;
      }
      return v.prodId !== productoEliminado.id && v.nombre !== productoEliminado.nombre;
    });
    guardarDatos('mn_ventas', ventas);
  }
  mostrarInventario();
  mostrarNotificacion('Producto eliminado');
}


// ══════════════════════════════
// VISTA: VENTA (CARRITO)
// ══════════════════════════════
var carrito = []; // [{ prodId, nombre, precio, cantidad, subtotal }]

function mostrarVenta() {
  carrito = [];
  renderizarVista();
}

function renderizarVista() {
  var disponibles = productos.filter(function (p) { return p.stock > 0; });

  // Selector de productos
  var contenedor = document.getElementById('selector-productos');
  if (disponibles.length === 0) {
    contenedor.innerHTML =
      '<div class="estado-vacio">' +
        '<div class="estado-vacio-icono">📦</div>' +
        '<div class="estado-vacio-texto">Sin productos con stock</div>' +
        '<div class="estado-vacio-detalle">Ve a "Inventario" y agrega productos primero</div>' +
      '</div>';
  } else {
    contenedor.innerHTML = disponibles.map(function (p) {
      var enCarrito = carrito.find(function(c){ return c.prodId === p.id; });
      var stockDisp = p.stock - (enCarrito ? enCarrito.cantidad : 0);
      return '<div class="selector-producto" onclick="agregarAlCarrito(' + p.id + ')" style="' + (stockDisp === 0 ? 'opacity:.5;pointer-events:none;' : '') + '">' +
               '<div>' +
                 '<div style="font-size:15px;font-weight:700;">' + p.nombre + '</div>' +
                 '<div style="font-size:12px;color:var(--texto-suave);">Stock: ' + stockDisp + ' | $' + p.precio.toLocaleString('es-CL') + ' c/u</div>' +
               '</div>' +
               '<div style="font-size:20px;color:var(--verde);">+</div>' +
             '</div>';
    }).join('');
  }

  // Carrito
  var carritoEl = document.getElementById('carrito-items');
  var totalEl   = document.getElementById('carrito-total');
  var btnConf   = document.getElementById('btn-confirmar-venta');
  var cardCarrito = document.getElementById('card-carrito');

  if (carrito.length === 0) {
    cardCarrito.style.display = 'none';
  } else {
    cardCarrito.style.display = 'block';
    carritoEl.innerHTML = carrito.map(function(item, idx) {
      return '<div class="item-lista" style="align-items:center;">' +
        '<div style="flex:1;">' +
          '<div class="item-nombre">' + item.nombre + '</div>' +
          '<div class="item-subtitulo">$' + item.precio.toLocaleString('es-CL') + ' c/u</div>' +
        '</div>' +
        '<div class="fila-cantidad" style="margin:0 12px;">' +
          '<button class="boton-cantidad" style="width:28px;height:28px;font-size:16px;" onclick="cambiarCantCarrito(' + idx + ',-1)">−</button>' +
          '<div class="numero-cantidad" style="width:32px;font-size:16px;">' + item.cantidad + '</div>' +
          '<button class="boton-cantidad" style="width:28px;height:28px;font-size:16px;" onclick="cambiarCantCarrito(' + idx + ',1)">+</button>' +
        '</div>' +
        '<div class="item-precio" style="min-width:70px;text-align:right;">$' + item.subtotal.toLocaleString('es-CL') + '</div>' +
        '<button onclick="quitarDelCarrito(' + idx + ')" style="background:none;border:none;color:#ef4444;font-size:18px;cursor:pointer;margin-left:8px;">✕</button>' +
      '</div>';
    }).join('');

    var total = carrito.reduce(function(acc,i){ return acc + i.subtotal; }, 0);
    totalEl.textContent = 'Total: $' + total.toLocaleString('es-CL');
  }
}

function agregarAlCarrito(prodId) {
  var prod = productos.find(function(p){ return p.id === prodId; });
  if (!prod) return;
  var enCarrito = carrito.find(function(c){ return c.prodId === prodId; });
  var stockDisp = prod.stock - (enCarrito ? enCarrito.cantidad : 0);
  if (stockDisp <= 0) { mostrarNotificacion('Sin stock disponible'); return; }

  if (enCarrito) {
    enCarrito.cantidad++;
    enCarrito.subtotal = enCarrito.precio * enCarrito.cantidad;
  } else {
    carrito.push({ prodId: prod.id, nombre: prod.nombre, precio: prod.precio, cantidad: 1, subtotal: prod.precio });
  }
  renderizarVista();
}

function cambiarCantCarrito(idx, delta) {
  var item = carrito[idx];
  var prod = productos.find(function(p){ return p.id === item.prodId; });
  var nuevaCant = item.cantidad + delta;
  if (nuevaCant < 1) { quitarDelCarrito(idx); return; }
  if (nuevaCant > prod.stock) { mostrarNotificacion('No hay más stock'); return; }
  item.cantidad = nuevaCant;
  item.subtotal = item.precio * nuevaCant;
  renderizarVista();
}

function quitarDelCarrito(idx) {
  carrito.splice(idx, 1);
  renderizarVista();
}

function confirmarVenta() {
  if (carrito.length === 0) return;
  var total = carrito.reduce(function(acc,i){ return acc + i.subtotal; }, 0);
  var nuevaVenta = {
    id:       Date.now(),
    fecha:    new Date().toISOString(),
    items:    carrito.map(function(i){ return { prodId: i.prodId, nombre: i.nombre, precio: i.precio, cantidad: i.cantidad, subtotal: i.subtotal }; }),
    total:    total
  };

  // Actualizar stock
  carrito.forEach(function(item) {
    productos = productos.map(function(p) {
      return p.id === item.prodId
        ? { id: p.id, nombre: p.nombre, precio: p.precio, stock: p.stock - item.cantidad }
        : p;
    });
  });

  ventas.push(nuevaVenta);
  guardarDatos('mn_ventas', ventas);
  guardarDatos('mn_productos', productos);

  // Guardar la última venta para la boleta
  localStorage.setItem('mn_ultima_venta', JSON.stringify(nuevaVenta));

  mostrarNotificacion('✅ Venta registrada — $' + total.toLocaleString('es-CL'));

  // Preguntar si quiere generar boleta
  if (confirm('✅ Venta registrada por $' + total.toLocaleString('es-CL') + '\n\n¿Deseas generar la boleta PDF?')) {
    generarBoletaPDF(nuevaVenta);
  }

  carrito = [];
  irVista('inicio');
}


// ══════════════════════════════
// BOLETA PDF
// ══════════════════════════════
function generarBoletaPDF(venta) {
  // Cargar jsPDF localmente si por algún motivo no está disponible aún
  if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
    var script = document.createElement('script');
    script.src = 'jspdf.umd.min.js';
    script.onload = function() { _generarPDF(venta); };
    document.head.appendChild(script);
  } else {
    _generarPDF(venta);
  }
}

function _generarPDF(venta) {
  var jsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
  var doc = new jsPDF({ unit: 'mm', format: 'a5' });

  var verde  = [22, 163, 74];
  var negro  = [30, 30, 30];
  var gris   = [120, 120, 120];
  var lineaY = 0;

  function avanzar(mm) { lineaY += mm; }

  // Encabezado
  doc.setFillColor(verde[0], verde[1], verde[2]);
  doc.rect(0, 0, 148, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('MiNegocio', 12, 14);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Boleta de venta', 12, 21);

  lineaY = 36;

  // Número y fecha
  doc.setTextColor(gris[0], gris[1], gris[2]);
  doc.setFontSize(8);
  doc.text('N° ' + venta.id, 12, lineaY);
  doc.text(formatearFecha(venta.fecha), 148 - 12, lineaY, { align: 'right' });

  avanzar(6);
  doc.setDrawColor(220, 220, 220);
  doc.line(12, lineaY, 136, lineaY);
  avanzar(6);

  // Encabezado tabla
  doc.setFillColor(245, 245, 245);
  doc.rect(12, lineaY - 2, 124, 8, 'F');
  doc.setTextColor(negro[0], negro[1], negro[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Producto', 14, lineaY + 4);
  doc.text('Cant.', 85, lineaY + 4, { align: 'right' });
  doc.text('P. Unit.', 110, lineaY + 4, { align: 'right' });
  doc.text('Subtotal', 136, lineaY + 4, { align: 'right' });
  avanzar(12);

  // Ítems
  doc.setFont('helvetica', 'normal');
  venta.items.forEach(function(item) {
    doc.setTextColor(negro[0], negro[1], negro[2]);
    doc.text(item.nombre, 14, lineaY);
    doc.setTextColor(gris[0], gris[1], gris[2]);
    doc.text(String(item.cantidad), 85, lineaY, { align: 'right' });
    doc.text('$' + item.precio.toLocaleString('es-CL'), 110, lineaY, { align: 'right' });
    doc.setTextColor(negro[0], negro[1], negro[2]);
    doc.text('$' + item.subtotal.toLocaleString('es-CL'), 136, lineaY, { align: 'right' });
    avanzar(7);
    doc.setDrawColor(235, 235, 235);
    doc.line(12, lineaY - 2, 136, lineaY - 2);
  });

  avanzar(4);

  // Total
  doc.setFillColor(verde[0], verde[1], verde[2]);
  doc.rect(80, lineaY - 2, 56, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL', 84, lineaY + 5);
  doc.text('$' + venta.total.toLocaleString('es-CL'), 136, lineaY + 5, { align: 'right' });

  avanzar(18);

  // Pie de página
  doc.setTextColor(gris[0], gris[1], gris[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Gracias por su compra — MiNegocio', 148 / 2, lineaY, { align: 'center' });
  avanzar(5);
  doc.setFontSize(7);
  doc.text('Hecho para pequeños negocios · 2026', 148 / 2, lineaY, { align: 'center' });

  doc.save('boleta-' + venta.id + '.pdf');
}

// Botón regenerar boleta desde reportes
function regenerarBoleta(ventaId) {
  var v = ventas.find(function(x){ return x.id === ventaId; });
  if (!v) return;
  generarBoletaPDF(v);
}

// Borrar todo el historial de ventas
function borrarHistorial() {
  if (!confirm('⚠️ ¿Seguro que deseas borrar TODO el historial de ventas?\nEsta acción no se puede deshacer.')) return;
  ventas = [];
  guardarDatos('mn_ventas', ventas);
  mostrarNotificacion('🗑️ Historial borrado');
  mostrarReportes();
}

// Crear boleta en blanco (manual)
function crearBoletaManual() {
  var ventaManual = {
    id:    Date.now(),
    fecha: new Date().toISOString(),
    items: [],
    total: 0
  };
  var continuar = true;
  while (continuar) {
    var nombreProd = prompt('Nombre del producto (deja vacío para terminar):');
    if (!nombreProd || nombreProd.trim() === '') break;
    var precioProd = parseInt(prompt('Precio unitario de "' + nombreProd + '":'));
    var cantProd   = parseInt(prompt('Cantidad:'));
    if (isNaN(precioProd) || isNaN(cantProd) || cantProd < 1 || precioProd < 1) {
      alert('Datos inválidos, ítem no agregado.');
      continue;
    }
    ventaManual.items.push({ nombre: nombreProd.trim(), precio: precioProd, cantidad: cantProd, subtotal: precioProd * cantProd });
    ventaManual.total += precioProd * cantProd;
    continuar = confirm('¿Agregar otro producto a la boleta?');
  }
  if (ventaManual.items.length === 0) { mostrarNotificacion('Boleta cancelada'); return; }
  generarBoletaPDF(ventaManual);
}


// ══════════════════════════════
// VISTA: REPORTES
// ══════════════════════════════
function mostrarReportes() {
  var totalVendido = ventas.reduce(function (acc, v) { return acc + v.total; }, 0);
  document.getElementById('rep-total').textContent      = '$' + totalVendido.toLocaleString('es-CL');
  document.getElementById('rep-num-ventas').textContent = ventas.length + ' ventas';

  // Conteo por producto (soporta tanto ventas antiguas como nuevas con items)
  var conteo = {};
  ventas.forEach(function (v) {
    var items = v.items || [{ nombre: v.nombre, cantidad: v.cantidad, subtotal: v.total }];
    items.forEach(function(i) {
      if (!conteo[i.nombre]) conteo[i.nombre] = { cantidad: 0, total: 0 };
      conteo[i.nombre].cantidad += i.cantidad;
      conteo[i.nombre].total    += i.subtotal;
    });
  });
  var ranking = Object.entries(conteo).sort(function (a, b) { return b[1].cantidad - a[1].cantidad; });

  document.getElementById('rep-top').textContent = ranking.length > 0 ? ranking[0][0] : '—';

  var bajos = productos.filter(function (p) { return p.stock <= 3; });
  document.getElementById('rep-stock-bajo').textContent =
    bajos.length > 0 ? bajos.length + ' producto' + (bajos.length > 1 ? 's' : '') : 'Sin alertas ✅';

  // Barras de ranking
  var contenedorBarras = document.getElementById('rep-barras');
  var maxCantidad      = ranking.length > 0 ? ranking[0][1].cantidad : 1;

  if (ranking.length === 0) {
    contenedorBarras.innerHTML =
      '<div class="estado-vacio">' +
        '<div class="estado-vacio-icono">📊</div>' +
        '<div class="estado-vacio-texto">Sin datos aún</div>' +
        '<div class="estado-vacio-detalle">Registra ventas para ver el reporte</div>' +
      '</div>';
  } else {
    contenedorBarras.innerHTML = ranking.slice(0, 7).map(function (entrada) {
      var nombre     = entrada[0];
      var datos      = entrada[1];
      var porcentaje = Math.round(datos.cantidad / maxCantidad * 100);
      var nombreCorto = nombre.length > 14 ? nombre.slice(0, 14) + '…' : nombre;
      return '<div class="fila-barra">' +
               '<div class="barra-etiqueta">' + nombreCorto + '</div>' +
               '<div class="barra-pista"><div class="barra-relleno" style="width:' + porcentaje + '%"></div></div>' +
               '<div class="barra-valor">' + datos.cantidad + ' ud.</div>' +
             '</div>';
    }).join('');

    // Recomendaciones
    var sinStock  = productos.filter(function (p) { return p.stock === 0; });
    var pocoStock = productos.filter(function (p) { return p.stock > 0 && p.stock <= 3; });
    var mensajeRec = '';
    if (sinStock.length > 0)  mensajeRec += 'Sin stock: <strong>' + sinStock.map(function (p) { return p.nombre; }).join(', ') + '</strong>. ';
    if (pocoStock.length > 0) mensajeRec += 'Poco stock: <strong>' + pocoStock.map(function (p) { return p.nombre; }).join(', ') + '</strong>.';
    if (mensajeRec) {
      contenedorBarras.innerHTML +=
        '<div class="recomendacion">' +
          '<div class="recomendacion-titulo">📢 Recomendación</div>' +
          '<div class="recomendacion-texto">' + mensajeRec + ' Considera reponer pronto.</div>' +
        '</div>';
    }
  }

  // Lista de ventas con botón de boleta
  var listaVentas = document.getElementById('rep-ventas-lista');
  if (ventas.length === 0) {
    listaVentas.innerHTML = '<div class="estado-vacio"><div class="estado-vacio-detalle">Sin ventas registradas</div></div>';
  } else {
    listaVentas.innerHTML = ventas.slice().reverse().map(function (v) {
      var items = v.items || [{ nombre: v.nombre, cantidad: v.cantidad }];
      var resumen = items.map(function(i){ return i.nombre + ' x' + i.cantidad; }).join(', ');
      return '<div class="item-lista" style="flex-wrap:wrap;gap:4px;">' +
               '<div style="flex:1;">' +
                 '<div class="item-nombre">' + resumen + '</div>' +
                 '<div class="item-subtitulo">' + formatearFecha(v.fecha) + '</div>' +
               '</div>' +
               '<div style="display:flex;align-items:center;gap:8px;">' +
                 '<div class="item-precio">$' + v.total.toLocaleString('es-CL') + '</div>' +
                 '<button onclick="regenerarBoleta(' + v.id + ')" style="background:var(--verde);color:#fff;border:none;border-radius:6px;padding:4px 8px;font-size:11px;cursor:pointer;">🧾 PDF</button>' +
               '</div>' +
             '</div>';
    }).join('');
  }
}


// ══════════════════════════════
// NOTIFICACIÓN EMERGENTE
// ══════════════════════════════
function mostrarNotificacion(mensaje) {
  var el = document.getElementById('notificacion');
  el.textContent = mensaje;
  el.classList.add('visible');
  setTimeout(function () { el.classList.remove('visible'); }, 2800);
}


// ══════════════════════════════
// ACTUALIZAR DATOS (botón manual)
// ══════════════════════════════
// Vuelve a leer lo que está REALMENTE guardado en el dispositivo
// (descarta lo que haya quedado en memoria) y repinta la vista
// que esté abierta. Sirve para corregir la pantalla si quedó
// desincronizada por un guardado fallido, otra pestaña abierta, etc.
function actualizarDatos() {
  var icono = document.getElementById('icono-actualizar');
  if (icono) icono.classList.add('girando');

  productos = obtenerDatos('mn_productos', []);
  ventas    = obtenerDatos('mn_ventas', []);

  // Si hay una venta en curso, sacar del carrito productos que ya
  // no existan y ajustar cantidades que ya no calcen con el stock real
  carrito = carrito.filter(function (item) {
    return productos.some(function (p) { return p.id === item.prodId; });
  });
  carrito.forEach(function (item) {
    var prod = productos.find(function (p) { return p.id === item.prodId; });
    if (item.cantidad > prod.stock) {
      item.cantidad = prod.stock;
      item.subtotal = prod.precio * prod.stock;
    }
  });

  var vistaActiva = document.querySelector('.vista.activa');
  var idVista = vistaActiva ? vistaActiva.id.replace('vista-', '') : 'inicio';
  if (idVista === 'inicio')     mostrarInicio();
  if (idVista === 'inventario') mostrarInventario();
  if (idVista === 'venta')      renderizarVista();
  if (idVista === 'reportes')   mostrarReportes();

  setTimeout(function () {
    if (icono) icono.classList.remove('girando');
  }, 600);
  mostrarNotificacion('🔄 Datos actualizados');
}


// ══════════════════════════════
// INICIO DE LA APLICACIÓN
// ══════════════════════════════
mostrarInicio();
