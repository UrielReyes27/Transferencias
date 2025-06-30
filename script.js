let articulos = {};
let reporteActual = null;

// Inicialización de eventos
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('btnNuevoReporte').addEventListener('click', mostrarNuevoReporte);
  document.getElementById('btnMisReportes').addEventListener('click', mostrarMisReportes);
  document.getElementById('btnGuardarReporte').addEventListener('click', guardarReporte);
});

// Funciones de navegación
function mostrarPantalla(id) {
  document.querySelectorAll('.pantalla').forEach(p => p.style.display = 'none');
  document.getElementById(id).style.display = 'block';
}

function mostrarNuevoReporte() {
  articulos = {};
  reporteActual = null;
  document.getElementById('nombre-reporte').value = '';
  document.getElementById('cuerpo-tabla').innerHTML = '';
  mostrarPantalla('nuevo-reporte');
  document.getElementById('codigo').focus();
}

function mostrarMisReportes() {
  mostrarPantalla('mis-reportes');
  document.getElementById('lista-reportes').innerHTML = '<p>Cargando reportes...</p>';
  cargarReportes();
}

// Funciones para nuevo reporte
function agregarArticulo() {
  const codigo = document.getElementById('codigo').value.trim();
  const almacenDestino = document.getElementById('almacen-destino').value.trim();
  const cantidad = parseInt(document.getElementById('cantidad').value) || 1;

  if (!codigo) {
    document.getElementById('error-codigo').textContent = 'Ingrese un código válido';
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
      document.getElementById('error-codigo').textContent = data.error;
      return;
    }

    document.getElementById('error-codigo').textContent = '';
    document.getElementById('descripcion').value = data.descripcion;

    // Actualizar o agregar artículo
    if (articulos[codigo]) {
      articulos[codigo].cantidad += cantidad;
    } else {
      articulos[codigo] = {
        descripcion: data.descripcion,
        almacenDestino,
        cantidad
      };
    }

    actualizarTabla();
    document.getElementById('codigo').value = '';
    document.getElementById('codigo').focus();
  })
  .catch(error => {
    console.error('Error:', error);
    document.getElementById('error-codigo').textContent = 'Error al validar el artículo';
  });
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
  console.log('Función guardarReporte ejecutada');
  
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

  console.log('Datos a enviar:', datos);

  fetch('guardar_reporte.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  })
  .then(response => {
    console.log('Respuesta recibida, status:', response.status);
    if (!response.ok) {
      return response.json().then(err => { throw err; });
    }
    return response.json();
  })
  .then(data => {
    console.log('Datos de respuesta:', data);
    if (data.success) {
      alert('Reporte guardado exitosamente con ID: ' + (data.id || ''));
      exportarAExcel(nombre, articulos);
      mostrarPantalla('inicio');
    } else {
      throw new Error(data.error || 'Error desconocido');
    }
  })
  .catch(error => {
    console.error('Error completo:', error);
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

// Funciones para mis reportes
function cargarReportes() {
  fetch('obtener_reportes.php')
    .then(response => {
      if (!response.ok) throw new Error('Error al cargar reportes');
      return response.json();
    })
    .then(data => {
      console.log("Reportes recibidos:", data);
      const lista = document.getElementById('lista-reportes');
      lista.innerHTML = '';

      if (!data || data.length === 0) {
        lista.innerHTML = '<p>No hay reportes guardados</p>';
        return;
      }

      data.forEach(reporte => {
        const item = document.createElement('div');
        item.className = 'reporte-item';
        
        // Parsear datos del reporte
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

      // Asignar eventos después de crear los elementos
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
  // Evento para botones Ver
  document.querySelectorAll('.btn-ver').forEach(btn => {
    btn.addEventListener('click', function() {
      const reporte = JSON.parse(this.getAttribute('data-reporte'));
      mostrarDetalleReporte(reporte);
    });
  });

  // Evento para botones Exportar
  document.querySelectorAll('.btn-exportar').forEach(btn => {
    btn.addEventListener('click', function() {
      const reporte = JSON.parse(this.getAttribute('data-reporte'));
      exportarReporte(reporte);
    });
  });

  // Evento para botones Eliminar
  document.querySelectorAll('.btn-eliminar').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = this.getAttribute('data-id');
      eliminarReporte(id, this.closest('.reporte-item'));
    });
  });
}

function mostrarDetalleReporte(reporte) {
  console.log("Mostrando reporte:", reporte);
  document.getElementById('nombre-reporte-detalle').textContent = reporte.nombre;
  const contenido = document.getElementById('contenido-reporte');
  contenido.innerHTML = '<p>Cargando detalles...</p>';

  // Procesar datos del reporte
  let articulosMostrar = {};
  try {
    const datos = typeof reporte.datos === 'string' ? JSON.parse(reporte.datos) : reporte;
    articulosMostrar = datos.articulos || {};
  } catch (e) {
    console.error("Error al parsear:", e);
    contenido.innerHTML = '<p class="error">Error al cargar detalles</p>';
    return;
  }

  // Crear tabla
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

  // Botones de acción
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
  
  // Asignar eventos a los nuevos botones
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
  // Crear hoja de trabajo
  const ws = XLSX.utils.json_to_sheet(
    Object.keys(articulos).map(codigo => ({
      "Número de Artículo": codigo,
      "Descripción": articulos[codigo].descripcion,
      "Almacén": "",
      "Ubicaciones": "",
      "Almacén Destino": articulos[codigo].almacenDestino,
      "Ubicaciones": "",
      "First to Bin": "",
      "Total": articulos[codigo].cantidad
    }))
  );
  
  // Crear libro de trabajo
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Reporte");
  
  // Exportar
  XLSX.writeFile(wb, `Reporte_${nombre}_${new Date().toISOString().slice(0,10)}.xlsx`);
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

// Función auxiliar s
function formatFecha(fechaStr) {
  if (!fechaStr) return 'Fecha no disponible';
  const fecha = new Date(fechaStr);
  return fecha.toLocaleDateString() + ' ' + fecha.toLocaleTimeString();
}