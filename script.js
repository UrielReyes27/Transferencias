// Variables globales
let capturasIndividuales = [];
let articulosConsolidados = {};
let reporteActual = null;
let hayCambiosNoGuardados = false;
let validacionEnProgreso = false;

// Función para generar clave única
function generarClaveUnica(codigo, almacenOrigen, almacenDestino) {
  return `${codigo}-${almacenOrigen}-${almacenDestino}`;
}

// Función para reiniciar el estado del sistema
function reiniciarEstadoSistema() {
  capturasIndividuales = [];
  articulosConsolidados = {};
  reporteActual = null;
  hayCambiosNoGuardados = false;
  validacionEnProgreso = false;
  
  document.getElementById('nombre-reporte').value = '';
  document.getElementById('codigo').value = '';
  document.getElementById('descripcion').value = '';
  document.getElementById('almacen-origen').value = '';
  document.getElementById('almacen-destino').value = '';
  document.getElementById('cantidad').value = '1';
  
  document.getElementById('error-codigo').textContent = '';
  document.getElementById('error-almacen-origen').textContent = '';
  document.getElementById('error-almacen-destino').textContent = '';
  
  document.getElementById('cuerpo-tabla-individual').innerHTML = '';
  document.getElementById('cuerpo-tabla-consolidada').innerHTML = '';
  
  document.getElementById('codigo').disabled = false;
  document.getElementById('almacen-origen').disabled = false;
  document.getElementById('almacen-destino').disabled = false;
  document.getElementById('btnGuardarReporte').disabled = false;
  document.getElementById('btnGuardarReporte').classList.remove('disabled');
  
  document.getElementById('codigo').focus();
}

// Función para verificar cambios antes de navegar
async function verificarCambiosAntesDeNavegar() {
  if (!hayCambiosNoGuardados || capturasIndividuales.length === 0) {
    return true;
  }

  const result = await Swal.fire({
    title: '⚠️ ¿Descartar cambios?',
    html: `<div style="text-align:left;">
             <p>Tienes <strong>${capturasIndividuales.length} artículos</strong> sin guardar.</p>
             <p>¿Estás seguro de descartarlos?</p>
           </div>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sí, descartar',
    cancelButtonText: 'Cancelar'
  });

  return result.isConfirmed;
}

// Función para validar campos CON BLOQUEO INMEDIATO Y SELECCIÓN EN ERRORES
async function validarCampo(input, tipo) {
  if (validacionEnProgreso) return false;
  validacionEnProgreso = true;
  
  const valor = input.value.trim().replace(/[\n\t\r]/g, '');
  input.value = valor;
  
  if (!valor) {
    mostrarError(tipo, 'Campo requerido');
    bloquearCamposSiguientes(tipo);
    input.focus();
    input.select(); // Seleccionar texto en error
    validacionEnProgreso = false;
    return false;
  }

  const endpoint = tipo === 'codigo' ? 'validar_articulo.php' : 'validar_almacen.php';
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tipo === 'codigo' ? { codigo: valor } : { almacen: valor })
    });

    if (!response.ok) throw new Error('Error en la respuesta');
    
    const data = await response.json();
    
    if (data.error) {
      mostrarError(tipo, `❌ ${data.error}`);
      bloquearCamposSiguientes(tipo);
      input.focus();
      input.select(); // SELECCIONAR TEXTO cuando hay error
      validacionEnProgreso = false;
      return false;
    } else {
      mostrarError(tipo, '✓ Válido', true);
      if (tipo === 'codigo') {
        document.getElementById('descripcion').value = data.descripcion || '';
      }
      desbloquearCampoSiguiente(tipo);
      validacionEnProgreso = false;
      return true;
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarError(tipo, '❌ Error de conexión');
    bloquearCamposSiguientes(tipo);
    input.focus();
    input.select(); // SELECCIONAR TEXTO cuando hay error de conexión
    validacionEnProgreso = false;
    return false;
  }
}

// Función para bloquear campos siguientes
function bloquearCamposSiguientes(tipoActual) {
  switch(tipoActual) {
    case 'codigo':
      document.getElementById('almacen-origen').disabled = true;
      document.getElementById('almacen-destino').disabled = true;
      document.getElementById('almacen-origen').value = '';
      document.getElementById('almacen-destino').value = '';
      document.getElementById('error-almacen-origen').textContent = '';
      document.getElementById('error-almacen-destino').textContent = '';
      break;
    case 'almacen-origen':
      document.getElementById('almacen-destino').disabled = true;
      document.getElementById('almacen-destino').value = '';
      document.getElementById('error-almacen-destino').textContent = '';
      break;
  }
}

// Función para desbloquear siguiente campo
function desbloquearCampoSiguiente(tipoActual) {
  switch(tipoActual) {
    case 'codigo':
      document.getElementById('almacen-origen').disabled = false;
      // Auto-focus al siguiente campo
      setTimeout(() => {
        document.getElementById('almacen-origen').focus();
      }, 100);
      break;
    case 'almacen-origen':
      document.getElementById('almacen-destino').disabled = false;
      // Auto-focus al siguiente campo
      setTimeout(() => {
        document.getElementById('almacen-destino').focus();
      }, 100);
      break;
    case 'almacen-destino':
      // Auto-focus al campo cantidad
      setTimeout(() => {
        document.getElementById('cantidad').focus();
        document.getElementById('cantidad').select();
      }, 100);
      break;
  }
}

// Función para mostrar errores
function mostrarError(tipo, mensaje, esExito = false) {
  const errorElement = document.getElementById(`error-${tipo}`);
  if (errorElement) {
    errorElement.textContent = mensaje;
    errorElement.style.color = esExito ? '#2ecc71' : '#e74c3c';
  }
}

// Función para agregar artículo (SIMPLIFICADA - ya no valida porque se validó en tiempo real)
async function agregarArticulo() {
  if (validacionEnProgreso) return;
  
  const codigo = document.getElementById('codigo').value.trim();
  const almacenOrigen = document.getElementById('almacen-origen').value.trim();
  const almacenDestino = document.getElementById('almacen-destino').value.trim();
  const cantidad = parseInt(document.getElementById('cantidad').value) || 1;

  // Verificación final (no debería fallar si la validación inmediata funcionó)
  if (!codigo || !almacenOrigen || !almacenDestino) {
    Swal.fire('Error', 'Complete todos los campos requeridos', 'error');
    return;
  }

  const captura = {
    id: Date.now(),
    codigo,
    descripcion: document.getElementById('descripcion').value,
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
      descripcion: document.getElementById('descripcion').value,
      almacenOrigen,
      almacenDestino,
      cantidad
    };
  }

  actualizarTablas();
  limpiarCampos();
  hayCambiosNoGuardados = true;
}

// Funciones para actualizar tablas
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
  document.getElementById('cantidad').value = '1';
  document.getElementById('error-codigo').textContent = '';
  document.getElementById('error-almacen-origen').textContent = '';
  document.getElementById('error-almacen-destino').textContent = '';
  
  // Resetear estado de campos
  document.getElementById('codigo').disabled = false;
  document.getElementById('almacen-origen').disabled = false;
  document.getElementById('almacen-destino').disabled = false;
  
  document.getElementById('codigo').focus();
}

// Funciones de navegación
function mostrarPantalla(id) {
  document.querySelectorAll('.pantalla').forEach(p => p.style.display = 'none');
  document.getElementById(id).style.display = 'block';
}

function mostrarNuevoReporte() {
  reiniciarEstadoSistema();
  mostrarPantalla('nuevo-reporte');
}

function mostrarMisReportes() {
  mostrarPantalla('mis-reportes');
  document.getElementById('lista-reportes').innerHTML = '<p>Cargando reportes...</p>';
  cargarReportes();
}

// Funciones para guardar reportes
function guardarReporte() {
  const nombre = document.getElementById('nombre-reporte').value.trim();
  
  if (!nombre) {
    Swal.fire('Error', 'Ingrese un nombre para el reporte', 'error');
    return;
  }

  if (Object.keys(articulosConsolidados).length === 0) {
    Swal.fire('Error', 'No hay artículos para guardar', 'error');
    return;
  }

  Swal.fire({
    title: '¿Guardar reporte definitivamente?',
    html: `<div style="text-align:left;">
             <p>⚠️ <strong>Atención:</strong></p>
             <ul>
               <li>Este reporte se bloqueará para edición</li>
               <li>Podrás crear nuevos reportes después</li>
             </ul>
           </div>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Guardar y continuar',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      guardarReporteFinal(nombre);
    }
  });
}

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
      Swal.fire({
        title: '✅ Reporte guardado',
        text: `El reporte "${nombre}" ha sido guardado correctamente`,
        icon: 'success'
      }).then(() => {
        reiniciarEstadoSistema();
        mostrarNuevoReporte();
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

// Funciones para reportes
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

function eliminarReporte(id, elemento, enDetalle = false) {
  Swal.fire({
    title: '¿Eliminar reporte?',
    text: "¡Esta acción no se puede deshacer!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sí, eliminar'
  }).then((result) => {
    if (result.isConfirmed) {
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
          Swal.fire('¡Eliminado!', 'El reporte ha sido eliminado.', 'success');
          if (enDetalle) {
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
        Swal.fire('Error', 'No se pudo eliminar: ' + error.message, 'error');
      });
    }
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

// Inicialización de eventos CON VALIDACIÓN MEJORADA PARA ESCÁNERES
document.addEventListener('DOMContentLoaded', function() {
  // Botones principales
  document.getElementById('btnNuevoReporte').addEventListener('click', async function(e) {
    e.preventDefault();
    if (await verificarCambiosAntesDeNavegar()) {
      mostrarNuevoReporte();
    }
  });

  document.getElementById('btnMisReportes').addEventListener('click', async function(e) {
    e.preventDefault();
    if (await verificarCambiosAntesDeNavegar()) {
      mostrarMisReportes();
    }
  });

  document.getElementById('btnGuardarReporte').addEventListener('click', guardarReporte);
  
  // Campos del formulario con validación MEJORADA para escáneres
  const codigoInput = document.getElementById('codigo');
  const almacenOrigenInput = document.getElementById('almacen-origen');
  const almacenDestinoInput = document.getElementById('almacen-destino');
  const cantidadInput = document.getElementById('cantidad');
  
  // CÓDIGO: Validación inmediata con múltiples eventos
  let codigoTimeout;
  
  codigoInput.addEventListener('input', function() {
    // Limpiar timeout anterior
    clearTimeout(codigoTimeout);
    
    // Validar después de 500ms de inactividad (para escáneres rápidos)
    codigoTimeout = setTimeout(async () => {
      if (this.value.trim()) {
        await validarCampo(this, 'codigo');
      }
    }, 500);
  });
  
  codigoInput.addEventListener('blur', async function() {
    clearTimeout(codigoTimeout);
    if (this.value.trim()) {
      await validarCampo(this, 'codigo');
    }
  });
  
  codigoInput.addEventListener('change', async function() {
    clearTimeout(codigoTimeout);
    if (this.value.trim()) {
      await validarCampo(this, 'codigo');
    }
  });
  
  // ALMACÉN ORIGEN: Validación inmediata con múltiples eventos
  let almacenOrigenTimeout;
  
  almacenOrigenInput.addEventListener('input', function() {
    clearTimeout(almacenOrigenTimeout);
    
    almacenOrigenTimeout = setTimeout(async () => {
      if (this.value.trim()) {
        await validarCampo(this, 'almacen-origen');
      }
    }, 500);
  });
  
  almacenOrigenInput.addEventListener('blur', async function() {
    clearTimeout(almacenOrigenTimeout);
    if (this.value.trim()) {
      await validarCampo(this, 'almacen-origen');
    }
  });
  
  almacenOrigenInput.addEventListener('change', async function() {
    clearTimeout(almacenOrigenTimeout);
    if (this.value.trim()) {
      await validarCampo(this, 'almacen-origen');
    }
  });
  
  // ALMACÉN DESTINO: Validación inmediata con múltiples eventos
  let almacenDestinoTimeout;
  
  almacenDestinoInput.addEventListener('input', function() {
    clearTimeout(almacenDestinoTimeout);
    
    almacenDestinoTimeout = setTimeout(async () => {
      if (this.value.trim()) {
        await validarCampo(this, 'almacen-destino');
      }
    }, 500);
  });
  
  almacenDestinoInput.addEventListener('blur', async function() {
    clearTimeout(almacenDestinoTimeout);
    if (this.value.trim()) {
      await validarCampo(this, 'almacen-destino');
    }
  });
  
  almacenDestinoInput.addEventListener('change', async function() {
    clearTimeout(almacenDestinoTimeout);
    if (this.value.trim()) {
      await validarCampo(this, 'almacen-destino');
    }
  });

  // Cantidad: Enter para agregar
  cantidadInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') agregarArticulo();
  });

  // Prevenir TAB si el campo actual no es válido Y SELECCIONAR TEXTO
  codigoInput.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      const errorMsg = document.getElementById('error-codigo').textContent;
      if (errorMsg && !errorMsg.includes('✓')) {
        e.preventDefault();
        this.focus();
        this.select();
      }
    }
    // NUEVO: Validar inmediatamente al presionar Enter
    if (e.key === 'Enter') {
      e.preventDefault();
      validarCampo(this, 'codigo');
    }
  });

 almacenOrigenInput.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      const errorMsg = document.getElementById('error-almacen-origen').textContent;
      if (errorMsg && !errorMsg.includes('✓')) {
        e.preventDefault();
        this.focus();
        this.select();
      }
    }
    // NUEVO: Validar inmediatamente al presionar Enter
    if (e.key === 'Enter') {
      e.preventDefault();
      validarCampo(this, 'almacen-origen');
    }
  });

  almacenDestinoInput.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      const errorMsg = document.getElementById('error-almacen-destino').textContent;
      if (errorMsg && !errorMsg.includes('✓')) {
        e.preventDefault();
        this.focus();
        this.select();
      }
    }
    // NUEVO: Validar inmediatamente al presionar Enter
    if (e.key === 'Enter') {
      e.preventDefault();
      validarCampo(this, 'almacen-destino');
    }
  });

  // Botón agregar artículo
  document.getElementById('btnAgregarArticulo').addEventListener('click', agregarArticulo);

  // Inicializar con primer campo enfocado
  document.getElementById('codigo').focus();
  
  // Mostrar pantalla inicial
  mostrarNuevoReporte();
});

// Función adicional para manejar errores de conexión
function manejarErrorConexion(error) {
  console.error('Error de conexión:', error);
  Swal.fire({
    title: 'Error de Conexión',
    text: 'No se pudo conectar al servidor. Verifique su conexión a internet.',
    icon: 'error',
    confirmButtonText: 'Reintentar'
  });
}

// Función para limpiar caracteres especiales en inputs (útil para escáneres)
function limpiarInput(valor) {
  return valor.replace(/[\n\t\r\f\v]/g, '').trim();
}

// Función para validar formato de código (opcional - agregar según necesidades)
function validarFormatoCodigo(codigo) {
  // Ejemplo: solo alfanumérico y guiones
  const patron = /^[A-Za-z0-9-]+$/;
  return patron.test(codigo);
}

// Función para validar formato de almacén (opcional - agregar según necesidades)
function validarFormatoAlmacen(almacen) {
  // Ejemplo: solo alfanumérico
  const patron = /^[A-Za-z0-9]+$/;
  return patron.test(almacen);
}