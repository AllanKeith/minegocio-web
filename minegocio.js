// ══════════════════════════════════════════════
// MINEGOCIO — Lógica principal
// Archivo: minegocio.js
// ══════════════════════════════════════════════


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

// Productos de ejemplo si no hay ninguno guardado
if (productos.length === 0) {
  productos = [
    { id: 1, nombre: 'Calcetines lana',  precio: 2500, stock: 15 },
    { id: 2, nombre: 'Guantes invierno', precio: 3900, stock: 3  },
    { id: 3, nombre: 'Bufanda polar',    precio: 4200, stock: 8  },
    { id: 4, nombre: 'Gorro lana',       precio: 3100, stock: 2  },
  ];
  guardarDatos('mn_productos', productos);
}


// ══════════════════════════════
// NAVEGACIÓN ENTRE VISTAS
// ══════════════════════════════
var titulosVistas = {
  inicio:     ['Inicio',           'Resumen de tu negocio'],
  inventario: ['Inventario',       'Administra tus productos'],
  venta:      ['Registrar venta',  'Selecciona el producto vendido'],
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
      return '<div class="item-lista">' +
               '<div><div class="item-nombre">' + v.nombre + ' x' + v.cantidad + '</div>' +
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
  if (!confirm('¿Seguro que deseas eliminar este producto?')) return;
  productos = productos.filter(function (p) { return p.id !== id; });
  guardarDatos('mn_productos', productos);
  mostrarInventario();
  mostrarNotificacion('Producto eliminado');
}


// ══════════════════════════════
// VISTA: VENTA
// ══════════════════════════════
var productoSeleccionado = null;
var cantidadVenta        = 1;

function mostrarVenta() {
  productoSeleccionado = null;
  cantidadVenta        = 1;
  document.getElementById('cant-num').textContent = '1';
  document.getElementById('card-cantidad').style.display = 'none';

  var contenedor   = document.getElementById('selector-productos');
  var disponibles  = productos.filter(function (p) { return p.stock > 0; });

  if (disponibles.length === 0) {
    contenedor.innerHTML =
      '<div class="estado-vacio">' +
        '<div class="estado-vacio-icono">📦</div>' +
        '<div class="estado-vacio-texto">Sin productos con stock</div>' +
        '<div class="estado-vacio-detalle">Ve a "Inventario" y agrega productos primero</div>' +
      '</div>';
    return;
  }

  contenedor.innerHTML = disponibles.map(function (p) {
    return '<div class="selector-producto" id="sel-' + p.id + '" onclick="seleccionarProducto(' + p.id + ')">' +
             '<div>' +
               '<div style="font-size:15px;font-weight:700;">' + p.nombre + '</div>' +
               '<div style="font-size:12px;color:var(--texto-suave);">Stock: ' + p.stock + ' | $' + p.precio.toLocaleString('es-CL') + ' c/u</div>' +
             '</div>' +
             '<div style="font-size:20px;color:var(--verde);">›</div>' +
           '</div>';
  }).join('');
}

function seleccionarProducto(id) {
  productoSeleccionado = productos.find(function (p) { return p.id === id; });
  cantidadVenta = 1;
  document.querySelectorAll('.selector-producto').forEach(function (el) { el.classList.remove('seleccionado'); });
  var elementoSel = document.getElementById('sel-' + id);
  if (elementoSel) elementoSel.classList.add('seleccionado');
  document.getElementById('card-cantidad').style.display = 'block';
  document.getElementById('info-prod-sel').textContent = '🛍️ ' + productoSeleccionado.nombre;
  document.getElementById('cant-num').textContent = '1';
  actualizarTotalVenta();
}

function cambiarCantidad(delta) {
  var maximo = productoSeleccionado ? productoSeleccionado.stock : 99;
  cantidadVenta = Math.max(1, Math.min(maximo, cantidadVenta + delta));
  document.getElementById('cant-num').textContent = cantidadVenta;
  actualizarTotalVenta();
}

function actualizarTotalVenta() {
  if (!productoSeleccionado) return;
  var total = productoSeleccionado.precio * cantidadVenta;
  document.getElementById('total-venta').textContent = 'Total: $' + total.toLocaleString('es-CL');
}

function confirmarVenta() {
  if (!productoSeleccionado) return;
  var nuevaVenta = {
    id:       Date.now(),
    nombre:   productoSeleccionado.nombre,
    cantidad: cantidadVenta,
    precio:   productoSeleccionado.precio,
    total:    productoSeleccionado.precio * cantidadVenta,
    fecha:    new Date().toISOString(),
    prodId:   productoSeleccionado.id
  };
  ventas.push(nuevaVenta);
  guardarDatos('mn_ventas', ventas);

  productos = productos.map(function (p) {
    return p.id === productoSeleccionado.id
      ? { id: p.id, nombre: p.nombre, precio: p.precio, stock: p.stock - cantidadVenta }
      : p;
  });
  guardarDatos('mn_productos', productos);

  mostrarNotificacion('✅ Venta registrada — $' + nuevaVenta.total.toLocaleString('es-CL'));
  irVista('inicio');
}

function cancelarSeleccion() {
  productoSeleccionado = null;
  document.getElementById('card-cantidad').style.display = 'none';
  document.querySelectorAll('.selector-producto').forEach(function (el) { el.classList.remove('seleccionado'); });
}


// ══════════════════════════════
// VISTA: REPORTES
// ══════════════════════════════
function mostrarReportes() {
  var totalVendido = ventas.reduce(function (acc, v) { return acc + v.total; }, 0);
  document.getElementById('rep-total').textContent      = '$' + totalVendido.toLocaleString('es-CL');
  document.getElementById('rep-num-ventas').textContent = ventas.length + ' ventas';

  // Conteo por producto
  var conteo = {};
  ventas.forEach(function (v) {
    if (!conteo[v.nombre]) conteo[v.nombre] = { cantidad: 0, total: 0 };
    conteo[v.nombre].cantidad += v.cantidad;
    conteo[v.nombre].total    += v.total;
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

    // Recomendaciones de stock
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

  // Lista de todas las ventas
  var listaVentas = document.getElementById('rep-ventas-lista');
  if (ventas.length === 0) {
    listaVentas.innerHTML = '<div class="estado-vacio"><div class="estado-vacio-detalle">Sin ventas registradas</div></div>';
  } else {
    listaVentas.innerHTML = ventas.slice().reverse().map(function (v) {
      return '<div class="item-lista">' +
               '<div><div class="item-nombre">' + v.nombre + ' x' + v.cantidad + '</div>' +
               '<div class="item-subtitulo">' + formatearFecha(v.fecha) + '</div></div>' +
               '<div class="item-precio">$' + v.total.toLocaleString('es-CL') + '</div>' +
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
// INICIO DE LA APLICACIÓN
// ══════════════════════════════
mostrarInicio();
