// Variables globales
let capturasIndividuales = [];
let articulosConsolidados = {};
let reporteActual = null;
let hayCambiosNoGuardados = false;

// Función para generar clave única
function generarClaveUnica(codigo, almacenOrigen, almacenDestino) {
  return `${codigo}-${almacenOrigen}-${almacenDestino}`;
}

// Inicialización de eventos
document.addEventListener('DOMContentLoaded', function() {
  // Botones principales
  document.getElementById('btnNuevoReporte').addEventListener('click', mostrarNuevoReporte);
  document.getElementById('btnMisReportes').addEventListener('click', mostrarMisReportes);
  document.getElementById('btnGuardarReporte').addEventListener('click', guardarReporte);
  
  // Campos del formulario
  const codigoInput = document.getElementById('codigo');
  const almacenOrigenInput = document.getElementById('almacen-origen');
  const almacenDestinoInput = document.getElementById('almacen-destino');
  
  // Eventos para código
  codigoInput.addEventListener('input', function() {
    validarCampo(this, 'codigo');
  });
  codigoInput.addEventListener('paste', function(e) {
    setTimeout(() => validarCampo(this, 'codigo', false, true), 50);
  });
  
  // Eventos para almacén origen
  almacenOrigenInput.addEventListener('input', function() {
    validarCampo(this, 'almacen-origen');
  });
  almacenOrigenInput.addEventListener('paste', function(e) {
    setTimeout(() => validarCampo(this, 'almacen-origen'), 50);
  });
  
  // Eventos para almacén destino
  almacenDestinoInput.addEventListener('input', function() {
    validarCampo(this, 'almacen-destino');
  });
  almacenDestinoInput.addEventListener('paste', function(e) {
    setTimeout(() => validarCampo(this, 'almacen-destino'), 50);
  });
  
  // Eventos de teclado
  codigoInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') validarCampo(this, 'codigo', true);
  });
  
  almacenOrigenInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') validarCampo(this, 'almacen-origen', true);
  });
  
  almacenDestinoInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') validarCampo(this, 'almacen-destino', true);
  });
  
  document.getElementById('cantidad').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') agregarArticulo();
  });
});

// Función para verificar cambios antes de navegar
function verificarCambiosAntesDeNavegar() {
  if (hayCambiosNoGuardados && capturasIndividuales.length > 0) {
    return confirm('⚠️ Tienes datos no guardados. Si cambias de pantalla se perderán. ¿Estás seguro?');
  }
  return true;
}

// Función para validar campos
function validarCampo(input, tipo, moverFoco = false, forzarValidacion = false) {
  const valor = input.value.trim().replace(/[\n\t\r]/g, '');
  input.value = valor;
  
  if (!valor) {
    mostrarError(tipo, '');
    return false;
  }

  if ((tipo === 'codigo' && valor.length < 3) || 
      ((tipo === 'almacen-origen' || tipo === 'almacen-destino') && valor.length < 2)) {
    mostrarError(tipo, '❌ Valor demasiado corto');
    return false;
  }

  const endpoint = tipo === 'codigo' ? 'validar_articulo.php' : 'validar_almacen.php';
  
  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tipo === 'codigo' ? { codigo: valor } : { almacen: valor })
  })
  .then(response => {
    if (!response.ok) throw new Error('Error en la respuesta');
    return response.json();
  })
  .then(data => {
    if (data.error) {
      mostrarError(tipo, `❌ ${data.error}`);
    } else {
      mostrarError(tipo, '✓ Válido', true);
      if (tipo === 'codigo') {
        document.getElementById('descripcion').value = data.descripcion || '';
      }
      if (moverFoco) moverFocoSiguiente(tipo);
    }
  })
  .catch(error => {
    console.error('Error:', error);
    mostrarError(tipo, '❌ Error de conexión');
  });
}

// Función para mostrar errores
function mostrarError(tipo, mensaje, esExito = false) {
  const errorElement = document.getElementById(`error-${tipo}`);
  if (errorElement) {
    errorElement.textContent = mensaje;
    errorElement.style.color = esExito ? '#2ecc71' : '#e74c3c';
  }
}

// Función para mover foco
function moverFocoSiguiente(tipo) {
  const campos = ['codigo', 'almacen-origen', 'almacen-destino', 'cantidad'];
  const indexActual = campos.indexOf(tipo);
  if (indexActual < campos.length - 1) {
    document.getElementById(campos[indexActual + 1]).focus();
  }
}

// Función para agregar artículo
function agregarArticulo() {
  const codigo = document.getElementById('codigo').value.trim();
  const almacenOrigen = document.getElementById('almacen-origen').value.trim();
  const almacenDestino = document.getElementById('almacen-destino').value.trim();
  const cantidad = parseInt(document.getElementById('cantidad').value) || 1;
  const descripcion = document.getElementById('descripcion').value;

  const errores = [
    document.getElementById('error-codigo'),
    document.getElementById('error-almacen-origen'),
    document.getElementById('error-almacen-destino')
  ].some(e => e.textContent.includes('❌'));

  if (!codigo || !almacenOrigen || !almacenDestino || errores) {
    alert('Complete todos los campos correctamente');
    return;
  }

  const captura = {
    id: Date.now(),
    codigo,
    descripcion,
    almacenOrigen,
    almacenDestino,
    cantidad,
    fecha: new Date().toISOString()
  };

  capturasIndividuales.unshift(captura);

  const claveUnica = generarClaveUnica(codigo, almacenOrigen, almacenDestino);

  if (articulosConsolidados[claveUnica]) {
    articulosConsolidados[claveUnica].cantidad += cantidad;
  } else {
    articulosConsolidados[claveUnica] = {
      codigo,
      descripcion,
      almacenOrigen,
      almacenDestino,
      cantidad
    };
  }

  actualizarTablas();
  limpiarCampos();
  hayCambiosNoGuardados = true;
}

// Función para actualizar tablas
function actualizarTablas() {
  actualizarTablaIndividual();
  actualizarTablaConsolidada();
}

function actualizarTablaIndividual() {
  const tbody = document.getElementById('cuerpo-tabla-individual');
  tbody.innerHTML = '';

  capturasIndividuales.forEach(captura => {
    const row = document.createElement('tr');
    row.dataset.id = captura.id;
    
    row.innerHTML = `
      <td>${captura.codigo}</td>
      <td>${captura.descripcion}</td>
      <td>${captura.almacenOrigen}</td>
      <td>${captura.almacenDestino}</td>
      <td>${captura.cantidad}</td>
      <td><button class="btn-eliminar-captura" data-id="${captura.id}">✖</button></td>
    `;
    
    tbody.appendChild(row);
  });

  document.querySelectorAll('.btn-eliminar-captura').forEach(btn => {
    btn.addEventListener('click', function() {
      eliminarCaptura(this.dataset.id);
    });
  });
}

function actualizarTablaConsolidada() {
  const tbody = document.getElementById('cuerpo-tabla-consolidada');
  tbody.innerHTML = '';

  Object.keys(articulosConsolidados).forEach(clave => {
    const articulo = articulosConsolidados[clave];
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${articulo.codigo}</td>
      <td>${articulo.descripcion}</td>
      <td>${articulo.almacenOrigen}</td>
      <td></td>
      <td>${articulo.almacenDestino}</td>
      <td></td>
      <td></td>
      <td>${articulo.cantidad}</td>
    `;
    
    tbody.appendChild(row);
  });
}

function eliminarCaptura(id) {
  const index = capturasIndividuales.findIndex(c => c.id == id);
  if (index === -1) return;

  const captura = capturasIndividuales[index];
  const claveUnica = generarClaveUnica(captura.codigo, captura.almacenOrigen, captura.almacenDestino);
  
  if (articulosConsolidados[claveUnica]) {
    articulosConsolidados[claveUnica].cantidad -= captura.cantidad;
    
    if (articulosConsolidados[claveUnica].cantidad <= 0) {
      delete articulosConsolidados[claveUnica];
    }
  }

  capturasIndividuales.splice(index, 1);
  actualizarTablas();
  hayCambiosNoGuardados = true;
}

function limpiarCampos() {
  document.getElementById('codigo').value = '';
  document.getElementById('descripcion').value = '';
  document.getElementById('almacen-origen').value = '';
  document.getElementById('almacen-destino').value = '';
  document.getElementById('cantidad').value = '1'; // Asegurar que vuelva a 1
  document.getElementById('error-codigo').textContent = '';
  document.getElementById('error-almacen-origen').textContent = '';
  document.getElementById('error-almacen-destino').textContent = '';
  document.getElementById('codigo').focus();
}

function mostrarPantalla(id) {
  document.querySelectorAll('.pantalla').forEach(p => p.style.display = 'none');
  document.getElementById(id).style.display = 'block';
}

function mostrarNuevoReporte() {
  if (!verificarCambiosAntesDeNavegar()) return;
  
  capturasIndividuales = [];
  articulosConsolidados = {};
  reporteActual = null;
  hayCambiosNoGuardados = false;
  document.getElementById('nombre-reporte').value = '';
  document.getElementById('cuerpo-tabla-individual').innerHTML = '';
  document.getElementById('cuerpo-tabla-consolidada').innerHTML = '';
  limpiarCampos();
  document.getElementById('cantidad').value = '1';
  mostrarPantalla('nuevo-reporte');
}

function mostrarMisReportes() {
  if (!verificarCambiosAntesDeNavegar()) return;
  
  mostrarPantalla('mis-reportes');
  document.getElementById('lista-reportes').innerHTML = '<p>Cargando reportes...</p>';
  cargarReportes();
}

function guardarReporte() {
  const nombre = document.getElementById('nombre-reporte').value.trim();
  
  if (!nombre) {
    alert('Ingrese un nombre para el reporte');
    return;
  }

  if (Object.keys(articulosConsolidados).length === 0) {
    alert('No hay artículos para guardar');
    return;
  }

  const datos = {
    nombre,
    articulos: articulosConsolidados,
    capturasIndividuales,
    fecha: new Date().toISOString()
  };

  fetch('guardar_reporte.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  })
  .then(response => {
    if (!response.ok) return response.json().then(err => { throw err; });
    return response.json();
  })
  .then(data => {
    if (data.success) {
      alert('Reporte guardado exitosamente');
      exportarAExcel(nombre, articulosConsolidados);
      hayCambiosNoGuardados = false;
      mostrarPantalla('inicio');
    } else {
      throw new Error(data.error || 'Error desconocido');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Error al guardar: ' + error.message);
  });
}

function exportarAExcel(nombre, articulos = articulosConsolidados) {
  const encabezados = [
    "Código", 
    "Descripción",
    "Almacén Origen",
    "Ubicación Origen",
    "Almacén Destino",
    "Ubicación Destino",
    "First to Bin",
    "Cantidad"
  ].join(",") + "\n";

  let csvContent = "\uFEFF";
  csvContent += encabezados;
  
  Object.keys(articulos).forEach(clave => {
    const art = articulos[clave];
    csvContent += `"${art.codigo}","","${art.almacenOrigen}","","${art.almacenDestino}","","","${art.cantidad}"\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `Reporte_${nombre}_${new Date().toISOString().slice(0,10)}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function cargarReportes() {
  fetch('obtener_reportes.php')
    .then(response => {
      if (!response.ok) throw new Error('Error al cargar reportes');
      return response.json();
    })
    .then(data => {
      const lista = document.getElementById('lista-reportes');
      lista.innerHTML = '';

      if (!data || data.length === 0) {
        lista.innerHTML = '<p>No hay reportes guardados</p>';
        return;
      }

      data.forEach(reporte => {
        const item = document.createElement('div');
        item.className = 'reporte-item';
        
        let articulosReporte = {};
        try {
          const datos = typeof reporte.datos === 'string' ? JSON.parse(reporte.datos) : reporte;
          articulosReporte = datos.articulos || {};
        } catch (e) {
          console.error("Error al parsear:", e);
        }

        item.innerHTML = `
          <h3>${reporte.nombre}</h3>
          <p>${formatFecha(reporte.fecha_creacion)}</p>
          <p>Artículos: ${Object.keys(articulosReporte).length}</p>
          <div class="acciones-reporte">
            <button class="btn-ver" data-reporte='${JSON.stringify(reporte).replace(/'/g, "\\'")}'>Ver</button>
            <button class="btn-exportar" data-reporte='${JSON.stringify(reporte).replace(/'/g, "\\'")}'>Exportar</button>
            <button class="btn-eliminar" data-id="${reporte.id}">Eliminar</button>
          </div>
        `;
        
        lista.appendChild(item);
      });

      asignarEventosReportes();
    })
    .catch(error => {
      console.error("Error:", error);
      document.getElementById('lista-reportes').innerHTML = `
        <p class="error">Error al cargar reportes: ${error.message}</p>
      `;
    });
}

function asignarEventosReportes() {
  document.querySelectorAll('.btn-ver').forEach(btn => {
    btn.addEventListener('click', function() {
      const reporte = JSON.parse(this.getAttribute('data-reporte'));
      mostrarDetalleReporte(reporte);
    });
  });

  document.querySelectorAll('.btn-exportar').forEach(btn => {
    btn.addEventListener('click', function() {
      const reporte = JSON.parse(this.getAttribute('data-reporte'));
      exportarReporte(reporte);
    });
  });

  document.querySelectorAll('.btn-eliminar').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = this.getAttribute('data-id');
      eliminarReporte(id, this.closest('.reporte-item'));
    });
  });
}

function mostrarDetalleReporte(reporte) {
  document.getElementById('nombre-reporte-detalle').textContent = reporte.nombre;
  const contenido = document.getElementById('contenido-reporte');
  contenido.innerHTML = '<p>Cargando detalles...</p>';

  let articulosMostrar = {};
  try {
    const datos = typeof reporte.datos === 'string' ? JSON.parse(reporte.datos) : reporte;
    articulosMostrar = datos.articulos || {};
  } catch (e) {
    console.error("Error al parsear:", e);
    contenido.innerHTML = '<p class="error">Error al cargar detalles</p>';
    return;
  }

  const table = document.createElement('table');
  table.className = 'tabla-detalle';
  table.innerHTML = `
    <thead>
      <tr>
        <th>Número de Artículo</th>
        <th>Descripción</th>
        <th>Almacén Origen</th>
        <th>Ubicaciones</th>
        <th>Almacén Destino</th>
        <th>Ubicaciones</th>
        <th>First to Bin</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector('tbody');

  if (Object.keys(articulosMostrar).length === 0) {
    tbody.innerHTML = '<tr><td colspan="8">No hay artículos en este reporte</td></tr>';
  } else {
    Object.keys(articulosMostrar).forEach(clave => {
      const articulo = articulosMostrar[clave];
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${articulo.codigo}</td>
        <td>${articulo.descripcion}</td>
        <td>${articulo.almacenOrigen}</td>
        <td></td>
        <td>${articulo.almacenDestino}</td>
        <td></td>
        <td></td>
        <td>${articulo.cantidad}</td>
      `;
      tbody.appendChild(row);
    });
  }

  const acciones = document.createElement('div');
  acciones.className = 'acciones-detalle';
  acciones.innerHTML = `
    <button data-reporte='${JSON.stringify(reporte).replace(/'/g, "\\'")}' class="btn-exportar-detalle">Exportar a Excel</button>
    <button data-id="${reporte.id}" class="btn-eliminar-detalle">Eliminar Reporte</button>
    <button class="btn-cerrar-detalle">Cerrar</button>
  `;

  contenido.innerHTML = '';
  contenido.appendChild(table);
  contenido.appendChild(acciones);
  
  contenido.querySelector('.btn-exportar-detalle').addEventListener('click', function() {
    const reporte = JSON.parse(this.getAttribute('data-reporte'));
    exportarReporte(reporte);
  });
  
  contenido.querySelector('.btn-eliminar-detalle').addEventListener('click', function() {
    const id = this.getAttribute('data-id');
    eliminarReporte(id, null, true);
  });
  
  contenido.querySelector('.btn-cerrar-detalle').addEventListener('click', cerrarDetalle);
  
  document.getElementById('lista-reportes').style.display = 'none';
  document.getElementById('detalle-reporte').style.display = 'block';
}

function exportarReporte(reporte) {
  let articulosExportar = {};
  try {
    const datos = typeof reporte.datos === 'string' ? JSON.parse(reporte.datos) : reporte;
    articulosExportar = datos.articulos || {};
  } catch (e) {
    console.error("Error al parsear:", e);
    alert('Error al exportar el reporte');
    return;
  }
  exportarAExcel(reporte.nombre, articulosExportar);
}

function eliminarReporte(id, elemento, enDetalle = false) {
  if (!confirm('¿Estás seguro de eliminar este reporte?')) return;

  fetch('eliminar_reporte.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  })
  .then(response => {
    if (!response.ok) throw new Error('Error en el servidor');
    return response.json();
  })
  .then(data => {
    if (data.success) {
      if (enDetalle) {
        alert('Reporte eliminado');
        cerrarDetalle();
        cargarReportes();
      } else {
        elemento.remove();
      }
    } else {
      throw new Error(data.error || 'Error al eliminar');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Error al eliminar reporte: ' + error.message);
  });
}

function cerrarDetalle() {
  document.getElementById('detalle-reporte').style.display = 'none';
  document.getElementById('lista-reportes').style.display = 'grid';
}

function formatFecha(fechaStr) {
  if (!fechaStr) return 'Fecha no disponible';
  const fecha = new Date(fechaStr);
  return fecha.toLocaleDateString() + ' ' + fecha.toLocaleTimeString();
}

// Proteger contra cierre de pestaña/ventana
window.addEventListener('beforeunload', function(e) {
  if (hayCambiosNoGuardados && capturasIndividuales.length > 0) {
    e.preventDefault();
    e.returnValue = 'Tienes datos no guardados. ¿Estás seguro de salir?';
    return e.returnValue;
  }
});

// 1. Reemplazar la función guardarReporte original por esta versión mejorada
function guardarReporte() {
  const nombre = document.getElementById('nombre-reporte').value.trim();
  
  if (!nombre) {
    alert('Ingrese un nombre para el reporte');
    return;
  }

  if (Object.keys(articulosConsolidados).length === 0) {
    alert('No hay artículos para guardar');
    return;
  }

  // Mostrar confirmación antes de guardar
  Swal.fire({
    title: '¿Guardar reporte definitivamente?',
    html: `<div style="text-align:left;">
             <p>⚠️ <strong>Atención:</strong></p>
             <ul>
               <li>No podrás añadir más artículos después de guardar</li>
               <li>No se permitirán modificaciones</li>
             </ul>
           </div>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sí, guardar definitivamente',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      guardarReporteFinal(nombre); // Llamar a la función de guardado real
    }
  });
}

// 2. Nueva función para el guardado final (contiene tu lógica original)
function guardarReporteFinal(nombre) {
  const datos = {
    nombre,
    articulos: articulosConsolidados,
    capturasIndividuales,
    fecha: new Date().toISOString()
  };

  fetch('guardar_reporte.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  })
  .then(response => {
    if (!response.ok) return response.json().then(err => { throw err; });
    return response.json();
  })
  .then(data => {
    if (data.success) {
      // Mostrar confirmación de éxito
      Swal.fire({
        title: '✅ Reporte guardado',
        text: 'Este reporte ya no aceptará modificaciones',
        icon: 'success',
        confirmButtonText: 'Entendido'
      }).then(() => {
        // Bloquear interfaz
        document.getElementById('codigo').disabled = true;
        document.getElementById('btnGuardarReporte').disabled = true;
        document.getElementById('btnGuardarReporte').classList.add('disabled');
        
        // Resto de tu lógica original
        exportarAExcel(nombre, articulosConsolidados);
        hayCambiosNoGuardados = false;
        mostrarPantalla('inicio');
      });
    } else {
      throw new Error(data.error || 'Error desconocido');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    Swal.fire('Error', 'Ocurrió un error al guardar: ' + error.message, 'error');
  });
}