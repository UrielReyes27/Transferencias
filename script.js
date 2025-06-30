let articulos = {};
let reporteActual = null;
let ultimoCodigoValidado = '';
let ultimoAlmacenValidado = '';

// Inicialización de eventos
document.addEventListener('DOMContentLoaded', function() {
  // Botones principales
  document.getElementById('btnNuevoReporte').addEventListener('click', mostrarNuevoReporte);
  document.getElementById('btnMisReportes').addEventListener('click', mostrarMisReportes);
  document.getElementById('btnGuardarReporte').addEventListener('click', guardarReporte);
  
  // Campo de código
  const codigoInput = document.getElementById('codigo');
  codigoInput.addEventListener('input', manejarEntradaCodigo);
  codigoInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      manejarEntradaCodigo();
    }
  });
  
  // Campo de almacén destino
  const almacenInput = document.getElementById('almacen-destino');
  almacenInput.addEventListener('input', manejarEntradaAlmacen);
  almacenInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      document.getElementById('cantidad').focus();
    }
  });
  
  // Campo de cantidad
  document.getElementById('cantidad').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      agregarArticulo();
    }
  });
});

// Función para manejar entrada de código
function manejarEntradaCodigo() {
  const codigo = this.value.trim();
  const esEscaneo = codigo.length > 0 && (this.value.includes('\n') || this.value.includes('\t'));
  
  if (esEscaneo) {
    this.value = codigo.replace(/[\n\t]/g, '').trim();
  }
  
  setTimeout(() => {
    const codigoActual = this.value.trim();
    if (codigoActual && codigoActual !== ultimoCodigoValidado) {
      validarCodigoEnTiempoReal(codigoActual, esEscaneo);
      ultimoCodigoValidado = codigoActual;
    }
  }, esEscaneo ? 0 : 300);
}

// Función para manejar entrada de almacén
function manejarEntradaAlmacen() {
  const almacen = this.value.trim();
  const esEscaneo = almacen.length > 0 && (this.value.includes('\n') || this.value.includes('\t'));
  
  if (esEscaneo) {
    this.value = almacen.replace(/[\n\t]/g, '').trim();
  }
  
  setTimeout(() => {
    const almacenActual = this.value.trim();
    if (almacenActual && almacenActual !== ultimoAlmacenValidado) {
      validarAlmacenEnTiempoReal(almacenActual, esEscaneo);
      ultimoAlmacenValidado = almacenActual;
    }
  }, esEscaneo ? 0 : 300);
}

// Función mejorada para validar código
function validarCodigoEnTiempoReal(codigo, moverFoco = false) {
  const errorElement = document.getElementById('error-codigo');
  const descripcionElement = document.getElementById('descripcion');
  
  if (!codigo) {
    errorElement.textContent = '';
    descripcionElement.value = '';
    return;
  }

  fetch('validar_articulo.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo })
  })
  .then(response => {
    if (!response.ok) throw new Error('Error en la validación');
    return response.json();
  })
  .then(data => {
    if (data.error) {
      // Mensajes más específicos
      if (data.error === 'Artículo no existe') {
        errorElement.textContent = '❌ Código NO EXISTE en el sistema';
      } else if (data.error === 'Artículo inactivo') {
        errorElement.textContent = '❌ Producto INACTIVO (no se puede usar)';
      } else {
        errorElement.textContent = '❌ ' + data.error;
      }
      errorElement.style.color = '#e74c3c';
      descripcionElement.value = '';
    } else {
      errorElement.textContent = '✓ Producto VÁLIDO y DISPONIBLE';
      errorElement.style.color = '#2ecc71';
      descripcionElement.value = data.descripcion;
      
      if (moverFoco) {
        document.getElementById('almacen-destino').focus();
      }
    }
  })
  .catch(error => {
    console.error('Error:', error);
    errorElement.textContent = '❌ Error al conectar con el servidor';
    errorElement.style.color = '#e74c3c';
    descripcionElement.value = '';
  });
}

// Función mejorada para validar almacén
// ... (todo el código anterior se mantiene igual hasta la función validarAlmacenEnTiempoReal)

function validarAlmacenEnTiempoReal(almacen, moverFoco = false) {
  // Asegurarnos que el elemento de error existe
  let errorAlmacenElement = document.getElementById('error-almacen');
  if (!errorAlmacenElement) {
    errorAlmacenElement = document.createElement('span');
    errorAlmacenElement.id = 'error-almacen';
    errorAlmacenElement.className = 'error';
    document.getElementById('almacen-destino').insertAdjacentElement('afterend', errorAlmacenElement);
  }

  if (!almacen) {
    errorAlmacenElement.textContent = '';
    return;
  }

  fetch('validar_almacen.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ almacen })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Error en la respuesta del servidor');
    }
    return response.json();
  })
  .then(data => {
    if (data.error) {
      // Mensajes específicos para cada tipo de error
      if (data.error.includes('no existe')) {
        errorAlmacenElement.textContent = '❌ Almacén NO REGISTRADO en el sistema';
      } else if (data.error.includes('inactivo')) {
        errorAlmacenElement.textContent = '❌ Almacén INACTIVO (no disponible)';
      } else {
        errorAlmacenElement.textContent = '❌ ' + data.error;
      }
      errorAlmacenElement.style.color = '#e74c3c';
    } else {
      errorAlmacenElement.textContent = '✓ Almacén VALIDADO correctamente';
      errorAlmacenElement.style.color = '#2ecc71';
      
      if (moverFoco) {
        document.getElementById('cantidad').focus();
      }
    }
  })
  .catch(error => {
    console.error('Error en la validación:', error);
    errorAlmacenElement.textContent = '⚠️ Error al conectar con el servidor. Revise su conexión.';
    errorAlmacenElement.style.color = '#f39c12'; // Color amarillo/naranja para advertencia
  });
}

// ... (el resto del código se mantiene igual)

function mostrarPantalla(id) {
  document.querySelectorAll('.pantalla').forEach(p => p.style.display = 'none');
  document.getElementById(id).style.display = 'block';
}

function mostrarNuevoReporte() {
  articulos = {};
  reporteActual = null;
  document.getElementById('nombre-reporte').value = '';
  document.getElementById('cuerpo-tabla').innerHTML = '';
  document.getElementById('error-codigo').textContent = '';
  document.getElementById('error-almacen')?.remove();
  document.getElementById('codigo').value = '';
  document.getElementById('descripcion').value = '';
  document.getElementById('almacen-destino').value = '';
  document.getElementById('cantidad').value = '1';
  mostrarPantalla('nuevo-reporte');
  document.getElementById('codigo').focus();
}

function mostrarMisReportes() {
  mostrarPantalla('mis-reportes');
  document.getElementById('lista-reportes').innerHTML = '<p>Cargando reportes...</p>';
  cargarReportes();
}

function agregarArticulo() {
  const codigo = document.getElementById('codigo').value.trim();
  const almacenDestino = document.getElementById('almacen-destino').value.trim();
  const cantidad = parseInt(document.getElementById('cantidad').value) || 1;
  const errorCodigoElement = document.getElementById('error-codigo');
  const errorAlmacenElement = document.getElementById('error-almacen');
  const descripcion = document.getElementById('descripcion').value;

  // Validar código
  if (!codigo) {
    errorCodigoElement.textContent = '❌ Ingrese un código válido';
    errorCodigoElement.style.color = '#e74c3c';
    document.getElementById('codigo').focus();
    return;
  }

  if (errorCodigoElement.textContent.includes('❌')) {
    errorCodigoElement.textContent = '❌ Corrija el código antes de agregar';
    errorCodigoElement.style.color = '#e74c3c';
    document.getElementById('codigo').focus();
    return;
  }

  // Validar almacén
  if (!almacenDestino) {
    if (!errorAlmacenElement) {
      const almacenInput = document.getElementById('almacen-destino');
      const newErrorElement = document.createElement('span');
      newErrorElement.id = 'error-almacen';
      newErrorElement.className = 'error';
      newErrorElement.textContent = '❌ Ingrese un almacén válido';
      newErrorElement.style.color = '#e74c3c';
      almacenInput.insertAdjacentElement('afterend', newErrorElement);
    } else {
      errorAlmacenElement.textContent = '❌ Ingrese un almacén válido';
      errorAlmacenElement.style.color = '#e74c3c';
    }
    document.getElementById('almacen-destino').focus();
    return;
  }

  if (errorAlmacenElement?.textContent.includes('❌')) {
    errorAlmacenElement.textContent = '❌ Corrija el almacén antes de agregar';
    errorAlmacenElement.style.color = '#e74c3c';
    document.getElementById('almacen-destino').focus();
    return;
  }

  // Agregar artículo
  if (articulos[codigo]) {
    articulos[codigo].cantidad += cantidad;
  } else {
    articulos[codigo] = {
      descripcion: descripcion,
      almacenDestino: almacenDestino,
      cantidad: cantidad
    };
  }

  actualizarTabla();
  
  // Limpiar campos
  document.getElementById('codigo').value = '';
  document.getElementById('descripcion').value = '';
  document.getElementById('almacen-destino').value = '';
  document.getElementById('error-codigo').textContent = '';
  document.getElementById('error-almacen')?.remove();
  document.getElementById('codigo').focus();
}

function actualizarTabla() {
  const tbody = document.getElementById('cuerpo-tabla');
  tbody.innerHTML = '';

  Object.keys(articulos).forEach(codigo => {
    const articulo = articulos[codigo];
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${codigo}</td>
      <td>${articulo.descripcion}</td>
      <td></td>
      <td></td>
      <td>${articulo.almacenDestino}</td>
      <td></td>
      <td></td>
      <td>${articulo.cantidad}</td>
    `;
    
    tbody.appendChild(row);
  });
}

function guardarReporte() {
  const nombre = document.getElementById('nombre-reporte').value.trim();
  
  if (!nombre) {
    alert('Por favor ingrese un nombre para el reporte');
    return;
  }

  if (Object.keys(articulos).length === 0) {
    alert('No hay artículos para guardar');
    return;
  }

  const datos = {
    nombre,
    articulos,
    fecha: new Date().toISOString()
  };

  fetch('guardar_reporte.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(err => { throw err; });
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      alert('Reporte guardado exitosamente con ID: ' + (data.id || ''));
      exportarAExcel(nombre, articulos);
      mostrarPantalla('inicio');
    } else {
      throw new Error(data.error || 'Error desconocido');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    let errorMsg = 'Error al guardar el reporte: ';
    
    if (error.error) {
      errorMsg += error.error;
      if (error.detalle) errorMsg += " (" + error.detalle + ")";
      if (error.sql_error) errorMsg += " [Error SQL: " + error.sql_error + "]";
    } else {
      errorMsg += error.message;
    }
    
    alert(errorMsg);
  });
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
        <th>Almacén</th>
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
    Object.keys(articulosMostrar).forEach(codigo => {
      const articulo = articulosMostrar[codigo];
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${codigo}</td>
        <td>${articulo.descripcion}</td>
        <td></td>
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

function cerrarDetalle() {
  document.getElementById('detalle-reporte').style.display = 'none';
  document.getElementById('lista-reportes').style.display = 'grid';
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

function exportarAExcel(nombre, articulos) {
  function toLatin1(str) {
    return unescape(encodeURIComponent(str));
  }

  let csvContent = "Número de Artículo,Descripción,Almacén,Ubicaciones,Almacén Destino,Ubicaciones,First to Bin,Total\n";
  
  Object.keys(articulos).forEach(codigo => {
    const art = articulos[codigo];
    csvContent += `"${codigo}","${art.descripcion}",,"","${art.almacenDestino}",,,"${art.cantidad}"\n`;
  });

  const blob = new Blob([toLatin1(csvContent)], { type: 'text/csv;charset=iso-8859-1;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `Reporte_${nombre}_${new Date().toISOString().slice(0,10)}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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

function formatFecha(fechaStr) {
  if (!fechaStr) return 'Fecha no disponible';
  const fecha = new Date(fechaStr);
  return fecha.toLocaleDateString() + ' ' + fecha.toLocaleTimeString();
}