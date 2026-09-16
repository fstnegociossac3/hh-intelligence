# MANUAL DE USUARIO

## Sistema H&H Intelligence

### Revisión inteligente de expedientes técnicos

---

**Empresa:** H&H — Ingeniería e Inteligencia Aplicada

**Versión del documento:** 1.0

**Fecha:** Septiembre 2026

**Aplicación:** H&H Intelligence (Prototipo funcional)

---

<br>

# Índice de contenido

1. [Introducción](#1-introduccion)
2. [Requisitos del sistema](#2-requisitos-del-sistema)
3. [Acceso al sistema (inicio de sesión)](#3-acceso-al-sistema-inicio-de-sesion)
4. [Roles y permisos](#4-roles-y-permisos)
5. [Estructura general de la interfaz](#5-estructura-general-de-la-interfaz)
6. [Módulo Dashboard](#6-modulo-dashboard)
7. [Módulo Proyectos](#7-modulo-proyectos)
8. [Detalle de un proyecto](#8-detalle-de-un-proyecto)
9. [Módulo Análisis](#9-modulo-analisis)
10. [Módulo Observaciones](#10-modulo-observaciones)
11. [Módulo Comparador](#11-modulo-comparador)
12. [Módulo Reportes](#12-modulo-reportes)
13. [Módulo Usuarios](#13-modulo-usuarios)
14. [Módulo Configuración](#14-modulo-configuracion)
15. [Mi Perfil](#15-mi-perfil)
16. [Importación y exportación de datos](#16-importacion-y-exportacion-de-datos)
17. [Glosario de términos](#17-glosario-de-terminos)
18. [Preguntas frecuentes](#18-preguntas-frecuentes)

---

<br>

# 1. Introducción

H&H Intelligence es una plataforma web que aplica inteligencia artificial para la revisión automática de **expedientes técnicos de obras públicas**. Permite auditar planos, documentos y normativa técnica cruzando la información entre sus fuentes para detectar **inconsistencias**, genera **observaciones** clasificadas por criticidad y produce **reportes** e **informes** descargables en PDF.

El sistema concentra todo el ciclo de revisión documental:

- **Cargar** documentos de un expediente.
- **Analizar** automáticamente los documentos contra reglas de consistencia.
- **Identificar** hallazgos e inconsistencias.
- **Gestionar** observaciones con responsables y estados de resolución.
- **Comparar** documentos en paralelo.
- **Generar** reportes e informes ejecutivos.

> **Nota:** Esta versión es un **prototipo funcional**. Los datos se guardan en el equipo del usuario (en el navegador) y se restablecen al borrar los datos de navegación. Toda la información mostrada es de demostración.

---

<br>

# 2. Requisitos del sistema

| Requisito | Detalle |
| --- | --- |
| **Navegador** | Google Chrome, Microsoft Edge, Firefox o Safari (versión reciente). |
| **Conexión a internet** | No es estrictamente necesaria. |
| **Acceso** | La dirección (URL) de la aplicación es proporcionada por el administrador del sistema o el responsable técnico. |
| **Formatos de documento aceptados** | PDF (`.pdf`), Excel (`.xlsx`, `.xls`), Word (`.docx`), imágenes (`.jpg`, `.jpeg`, `.png`). |
| **Tamaño máximo por archivo** | 20 MB. |
| **Resolución recomendada** | La interfaz es adaptable (responsive), pero se recomienda una pantalla de 1280 px o superior para aprovechar las vistas de tabla. |

Para ingresar, abra en el navegador la dirección de acceso que le hayan proporcionado y siga los pasos de la sección siguiente.

---

<br>

# 3. Acceso al sistema (Inicio de sesión)

Al abrir la aplicación se muestra la **pantalla de inicio de sesión**. En el lado izquierdo se presenta un panel informativo con las capacidades del sistema (planos técnicos, documentos, conexiones e inteligencia).

### Pasos para ingresar

1. Escriba su **correo electrónico** en el campo *Correo electrónico*.
   - El correo debe tener un formato válido (ej.: `usuario@hhi.pe`).
2. Escriba su **contraseña** en el campo *Contraseña*.
   - Mínimo 6 caracteres.
   - Use el ícono del **ojo** (mostrar/ocultar) para verificar la contraseña escrita.
3. Active la casilla **"Recordarme en este equipo"** si desea que la sesión permanezca guardada en el navegador.
4. Presione el botón **Ingresar**.
   - Al validarse las credenciales aparecerá el mensaje de bienvenida y será redirigido a la página de inicio.
   - Si las credenciales son incorrectas, se mostrará el mensaje *"Credenciales incorrectas"*.

> Si la sesión ya está activa, el sistema lo redirigirá automáticamente a la página de inicio sin pedir credenciales.

### Credenciales de demostración

El prototipo incluye accesos de prueba. La **contraseña demo es: `123456`**.

En la propia pantalla de inicio puede presionar el correo del rol deseado para autocompletar las credenciales:

| Rol | Correo |
| --- | --- |
| Administrador | `admin@hh.com` |
| Analista | `analista@hh.com` |
| Consulta | `consulta@hh.com` |

También puede ingresar con usuarios de ejemplo registrados en el sistema (contraseña `123456`), por ejemplo:

| Nombre | Correo | Rol |
| --- | --- | --- |
| Andrea Quispe | `andrea.quispe@hhi.pe` | Administrador |
| Carlos Mendoza | `carlos.mendoza@hhi.pe` | Analista |
| Lucía Fernández | `lucia.fernandez@hhi.pe` | Revisor |
| María Torres | `maria.torres@hhi.pe` | Consulta |

> **Nota:** El enlace "¿Olvidó su contraseña?" es demostrativo y no envía correos reales.

### Cerrar sesión

Para salir de la plataforma:

1. Ubique en la **barra lateral** (izquierda) su nombre y correo.
2. Presione el botón **Cerrar sesión** (ícono de salida).

Alternativamente, en el **encabezado superior**: haga clic sobre su avatar, luego en el menú desplegable seleccione **Cerrar sesión**.

---

<br>

# 4. Roles y permisos

El acceso a los módulos depende del **rol** asignado al usuario.

| Módulo | Administrador | Analista | Revisor | Consulta |
| --- | :-: | :-: | :-: | :-: |
| Dashboard | ✔ | ✔ | ✔ | ✔ |
| Proyectos | ✔ | ✔ | ✔ | ✔ |
| Análisis | ✔ | ✔ | ✔ | ✔ |
| Observaciones | ✔ | ✔ | ✔ | ✔ |
| Comparador | ✔ | — | — | ✔ |
| Reportes | ✔ | ✔ | ✔ | ✔ |
| Usuarios | ✔ | — | — | — |
| Configuración | ✔ | — | — | — |
| Perfil | ✔ | ✔ | ✔ | ✔ |

- **Administrador:** acceso total. Puede gestionar proyectos, usuarios, configuración, ejecutar análisis y resolver observaciones.
- **Analista:** puede crear y editar proyectos, cargar documentos, ejecutar análisis y gestionar observaciones. No accede al comparador, usuarios ni configuración.
- **Revisor:** puede revisar proyectos, análisis, observaciones y reportes (los roles de lectura no pueden editar).
- **Consulta:** acceso de visualización; puede consultar proyectos, análisis, observaciones, comparador y reportes.

Además, la limpieza general del sistema **no permite editar** a los roles de solo lectura (`consulta` y `revisor`).

---

<br>

# 5. Estructura general de la interfaz

Una vez dentro, la aplicación se organiza en tres zonas principales:

### 5.1 Barra lateral (menú de módulos)

- Muestra el **logo** y el nombre del sistema (**H&H Intelligence**).
- Contiene los accesos a los módulos disponibles según el rol:
  - Dashboard
  - Proyectos
  - Análisis
  - Observaciones
  - Comparador
  - Reportes
  - Usuarios
  - Configuración
- En la parte inferior se muestra el **usuario en sesión** (nombre, correo y rol) y el botón **Cerrar sesión**.
- Puede **contraer** el menú con el botón "Contraer" para ganar espacio; al contratarse, los íconos muestran su nombre al pasar el cursor (tooltip).
- En dispositivos móviles el menú se abre desde el ícono de **menú (☰)** en el encabezado.

### 5.2 Encabezado superior

- **Ruta de navegación:** indica la ubicación actual (ej.: *Inicio › Proyectos*).
- **Buscador global:** permite buscar proyectos, observaciones y otros registros.
- **Campana de notificaciones:** muestra alertas del sistema (análisis terminados, nuevas observaciones, reportes generados). El número en rojo indica notificaciones sin leer. Puede pulsar **"Marcar todas"** para leerlas todas; al hacer clic en una notificación se navega al registro relacionado.
- **Botón de ayuda (?)**: demostrativo.
- **Menú de usuario:** avatar con su nombre; al hacer clic se despliega: *Perfil*, *Ajustes* y *Cerrar sesión*.

### 5.3 Contenido principal

- Zona donde se muestra el módulo activo.
- Muestra **tarjetas de indicadores (KPIs)** en la parte superior de cada módulo y **tablas** con paginación, ordenamiento y filtros.
- Cada tabla permite: **ordenar** por columna (clic en el encabezado), **buscar** texto y **configurar filas por página**.

---

<br>

# 6. Módulo Dashboard

**Función:** vista general del sistema, permite monitorear el estado de todos los expedientes.

Al ingresar se muestran seis indicadores (KPIs):

| Indicador | Descripción |
| --- | --- |
| Proyectos activos | Expedientes en seguimiento (no marcados como revisados). |
| Expedientes analizados | Proyectos procesados por la IA. |
| Documentos procesados | Total de documentos analizados. |
| Observaciones abiertas | Observaciones pendientes de resolución. |
| Inconsistencias críticas | Hallazgos que requieren atención inmediata. |
| Coherencia promedio | Porcentaje de consistencia entre documentos. |

Además contiene:

- **Puntaje de coherencia:** anillo que resume el índice de coherencia y su desglose por regla (Presupuesto vs. Metrado, Metrado vs. Plano, Partida vs. Especificación, Partida vs. Cronograma).
- **Proyectos que requieren atención:** tabla de expedientes con observaciones pendientes. Al hacer clic en una fila se abre el proyecto.
- **Observaciones recientes:** lista de los últimos hallazgos detectados. Al hacer clic se abre el detalle de la observación.
- **Actividad reciente:** línea de tiempo con eventos (proyecto creado, documento cargado, análisis ejecutado, observación resuelta, etc.).
- **Alertas:** avisos prioritarios generados automáticamente, por ejemplo:
  - *Inconsistencia crítica* (rojo).
  - *Observación vencida* (más de 5 días sin actualización).
  - *Documento con error*.
  - *Expediente pendiente de revisión*.
  
  Cada alerta tiene un botón de acción ("Ver proyecto", "Ver observación", "Revisar documento"). Puede **descartar** una alerta con el ícono **X**; para recuperarlas, use **"Restaurar N descartada(s)"**.

---

<br>

# 7. Módulo Proyectos

**Función:** administrar los expedientes técnicos.

### 7.1 Indicadores

| Indicador | Descripción |
| --- | --- |
| Total de proyectos | Expedientes registrados en el sistema. |
| En análisis | En proceso de revisión. |
| Con observaciones | Requieren correcciones. |
| Revisados | Expedientes conformes. |

### 7.2 Buscar y filtrar

- **Búsqueda:** escriba palabras que coincidan con el código, nombre o entidad del proyecto.
- **Filtro por estado:** Borrador, Documentación cargada, En análisis, Observado, Revisado (o *Todos*).
- **Filtro por tipo de obra:** Infraestructura, Transportes, Saneamiento, Salud, Educación, Energía (o *Todos*).

### 7.3 Columnas de la tabla

Código · Proyecto (nombre y entidad) · Entidad pública · Tipo de obra · Ubicación · Responsable · Avance (barra de progreso %) · Observaciones (cantidad) · Estado · Última actualización · Acciones.

### 7.4 Estados de un proyecto

| Estado | Significado |
| --- | --- |
| **Borrador** | Expediente en elaboración inicial. |
| **Documentación cargada** | Documentos cargados en el expediente. |
| **En análisis** | Revisión inteligente en curso. |
| **Observado** | Se detectaron observaciones que requieren revisión técnica. |
| **Revisado** | Expediente revisado y conformado. |

### 7.5 Acciones sobre un proyecto

Cada fila tiene un menú de acciones (ícono de tres puntos **⋯**):

| Acción | Descripción |
| --- | --- |
| **Ver detalle** | Abre la ficha completa del proyecto. |
| **Editar** | Abre el formulario de edición (requiere permiso de edición). |
| **Duplicar** | Crea una copia (requiere permiso de edición). |
| **Eliminar** | Elimina permanentemente el expediente (requiere permiso de edición). |

**Botones superiores:**

| Botón | Descripción |
| --- | --- |
| **Exportar** | Descarga todos los expedientes en un archivo PDF. |
| **Plantilla** | Descarga un archivo JSON de ejemplo con la estructura esperada para importar. |
| **Importar** | Permite cargar proyectos y observaciones desde un archivo JSON. |
| **Nuevo proyecto** | Registra un nuevo expediente (paso a paso). |

### 7.6 Crear un proyecto

1. Presione **"Nuevo proyecto"**.
2. Complete los formularios por pasos:
   - **Información general:** nombre (mín. 5 caracteres), código, entidad pública, tipo de obra, departamento, provincia, distrito y descripción.
   - **Equipo:** jefe de proyecto, especialistas y revisor.
   - **Programación:** fecha de inicio, fecha de entrega y estado inicial.
   - **Confirmación:** revise los datos y guarde.
3. Presione **Guardar**. Se mostrará el mensaje *"Proyecto creado correctamente"*.

> Los filtros de departamento, provincia y distrito son secuenciales: primero seleccione departamento, luego provincia y después distrito.

### 7.7 Importar proyectos (JSON)

1. Presione **"Plantilla"** para descargar el archivo de ejemplo (`.json`).
2. Complete la plantilla con la estructura indicada (arreglo de `proyectos` y opcionalmente `observaciones`).
3. Presione **"Importar"** y seleccione el archivo.
4. Los registros válidos se guardan y, si hay errores de validación, se muestra una ventana con el detalle **campo por campo** de los registros rechazados.
5. Puede volver a descargar la plantilla desde esa ventana para corregir los datos.

---

<br>

# 8. Detalle de un proyecto

**Acceso:** desde el listado de proyectos, haga clic en el nombre del proyecto o use **Ver detalle**.

### 8.1 Cabecera del expediente

- Nombre del proyecto y su **estado**.
- Datos generales: código, entidad, tipo de obra, ubicación, responsable, avance, fecha de creación y fecha de actualización.

**Botones de acción:**

| Botón | Descripción |
| --- | --- |
| Editar | Modifica los datos del expediente. |
| Cargar documentos | Abre el panel para subir archivos al expediente. |
| Ejecutar análisis | Ejecuta el análisis inteligente del expediente. |
| Más opciones (⋯) | Exportar (PDF), Duplicar, Eliminar. |

### 8.2 Pestañas del expediente

#### Pestaña Resumen

- **Indicadores:** documentos cargados, documentos procesados, observaciones, inconsistencias críticas e índice de coherencia.
- **Etapa del expediente:** flujo visual de las etapas (Borrador → Documentación → En análisis → Observado → Revisado) con su porcentaje de avance.
- **Coherencia del expediente:** índice de consistencia con desglose por regla.
- **Información general:** nombre, entidad, tipo de obra, sector, ubicación, responsable, código y estado.
- **Equipo asignado:** lista de integrantes con su rol y especialidad. Botón **"Gestionar equipo"** para:
  - Cambiar el rol o la especialidad de un integrante.
  - Quitar un integrante (ícono de papelera).
  - Agregar un nuevo integrante (seleccionar integrante, rol, especialidad y pulsar **Agregar al equipo**).
- **Actividad reciente:** últimos eventos del expediente.
- **Progreso:** avance general, documentos procesados e índice de coherencia.

#### Pestaña Documentos

- **Indicadores:** total de documentos, procesados, pendientes y con error.
- **Categorías de documentos:** tarjetas por tipo (Planos, Metrados, Presupuesto, Especificaciones técnicas, Cronograma, Términos de referencia, Otros) con cantidad de archivos, procesados y % de avance.
- **Documentos del expediente:** tabla de archivos cargados con su estado de procesamiento IA (Procesado, Pendiente, Con error).

#### Pestaña Análisis

- Muestra el flujo de **procesamiento documental** y los módulos de resultados:
  - Datos normalizados.
  - Relaciones documentales.
  - Grafo de relaciones (red de documentos y hallazgos).
  - Presupuesto vs. Metrado.
  - Metrado vs. Plano.
  - Partida vs. Especificación.
  - Partida vs. Cronograma.
  - Resultados del análisis.
- Si el análisis está en ejecución se muestra la **barra de progreso** con sus pasos (ver módulo Análisis) y al final un mensaje de confirmación.

#### Pestaña Observaciones

- Lista las observaciones del expediente con su criticidad y estado.
- Permite abrir el detalle de cada observación y gestionarla.

#### Pestaña Historial

- Línea de tiempo con todas las acciones registradas en el expediente (creación, ediciones, cargas de documentos, análisis, observaciones, reportes).

### 8.3 Cargar documentos

1. Presione el botón **"Cargar documentos"**.
2. Arrastre los archivos al área señalada o haga clic para seleccionarlos (formatos admitidos indicados en la sección 2; máximo 20 MB por archivo).
3. Para cada archivo indique:
   - **Categoría** (Planos, Metrados, Presupuesto, Especificaciones técnicas, Cronograma, Términos de referencia, Otros).
   - **Especialidad** (Estructuras, Costos y Presupuestos, Eléctricas, Arquitectura, Sanitaria, Hidráulica, Ambiental, Vías y Transporte, etc.).
   - **Versión** (ej.: v1, v2).
   - **Descripción** (opcional).
4. Presione **Subir**. Los archivos pasan por los estados: Pendiente → Subiendo → Procesando IA → Procesado (o Error).

---

<br>

# 9. Módulo Análisis

**Función:** ejecutar y consultar las revisiones inteligentes de los expedientes.

### 9.1 Ejecutar un análisis general

1. Presione **"Ejecutar análisis general"** (visible solo para usuarios con permiso de edición).
2. El sistema mostrará una ventana con el **avance del procesamiento** por expediente (proyectos → documentos → observaciones).
3. El proceso puede **cancelarse** en cualquier momento (no se guardan cambios).
4. Al finalizar se muestra un resumen: número de expedientes, documentos analizados y observaciones detectadas. Se crea una **notificación**.

> También puede ejecutar el análisis de un **expediente individual** desde el detalle del proyecto (botón *Ejecutar análisis* en la pestaña Análisis).

### 9.2 Resultados de un análisis

Cada expediente recibe un **resultado** y un **puntaje (0-100%)**:

| Resultado | Significado |
| --- | --- |
| **Conforme** | Sin observaciones, cumple las reglas. |
| **Observado** | Presenta observaciones que requieren revisión. |
| **Crítico** | Presenta inconsistencias críticas o puntaje menor a 60. |
| **Pendiente** | Aún no ha sido analizado. |

### 9.3 Listado de análisis

- **Indicadores:** total analizados, conformes, observados, críticos; además de pendientes, total de observaciones e inconsistencias críticas.
- **Búsqueda y filtro:** búsqueda por código o proyecto; filtro por resultado (Conforme / Observado / Crítico / Pendiente).
- **Columnas:** Código · Proyecto · Fecha de análisis · Resultado · Puntaje · Docs analizados · Observaciones · Inconsistencias · Responsable · Acciones (**Ver** abre el expediente).

---

<br>

# 10. Módulo Observaciones

**Función:** registrar, asignar y resolver los hallazgos detectados por el análisis.

### 10.1 Indicadores

Total de observaciones · Críticas · Altas · Medias · Resueltas (con % de avance).

### 10.2 Buscar y filtrar

- **Búsqueda:** por código, partida o regla.
- **Filtros:** por Proyecto, Criticidad (Crítica / Alta / Media / Baja), Responsable y Estado.

### 10.3 Columnas de la tabla

Código · Proyecto · Partida · Tipo de inconsistencia · Regla · Criticidad · Responsable · Estado · Fecha · Acciones.

Para **ver el detalle**, haga clic en cualquier fila o use la acción "Ver detalle".

### 10.4 Criticidad y estado de una observación

| Criticidad | Significado |
| --- | --- |
| **Crítica** | Requiere atención inmediata. |
| **Alta** | Prioridad de resolución. |
| **Media** | Control y seguimiento. |
| **Baja** | Menor impacto. |

| Estado | Significado |
| --- | --- |
| **Nueva** | Detectada por la IA, sin asignar. |
| **Asignada** | Ya tiene responsable técnico. |
| **En revisión** | El responsable analiza documentos A y B. |
| **Justificada** | Se registró justificación / corrección. |
| **Resuelta** | Información conciliada y cerrada. |

### 10.5 Asignar responsable

1. En la fila de la observación, abra el menú de acciones (**⋯**).
2. Seleccione **"Asignar responsable"**.
3. Elija el responsable en la lista y presione **Asignar**.
   - Si la observación estaba en estado *Nueva*, pasa automáticamente a *Asignada*.

### 10.6 Detalle de una observación

El panel lateral de detalle ofrece:

- Datos generales: proyecto, fecha, responsable y regla de revisión; criticidad y estado.
- **Descripción del hallazgo** con la partida involucrada.
- **Documento A y Documento B** comparados (con la regla aplicada).
- **Valores comparados** y diferencia detectada.
- **Evidencia relacionada**.
- **Recomendación simulada de IA** según el estado.
- **Reanálisis:** botón "*Reanalizar*" que reprocesa el documento corregido y genera una nueva versión de comparación. Muestra el avance por pasos y el resultado final:
  - *Observación resuelta* / *Inconsistencia continúa* / *Requiere revisión manual*.
- **Comentarios:** escriba y envíe comentarios a la observación.
- **Asignar especialista / Cambiar responsable.**
- **Cambiar criticidad / Cambiar estado.**
- **Acciones rápidas:**
  - **Justificar:** marca la observación como justificada.
  - **Resolver:** marca la observación como resuelta.
  - **Reabrir:** devuelve una observación resuelta a *En revisión*.
- **Timeline:** línea de tiempo de todos los eventos de la observación.
- **Historial de versiones:** versiones de los reanálisis con fecha, responsable y resultado.

---

<br>

# 11. Módulo Comparador

**Función:** comparar dos documentos de un expediente en paralelo para visualizar sus diferencias.

### 11.1 Configurar una comparación

1. Seleccione el **Proyecto** a comparar.
2. Seleccione el **Documento A** (fuente izquierda).
3. Seleccione el **Documento B** (fuente derecha).
4. El sistema reconoce automáticamente las **combinaciones válidas**:

| Regla | Documento A | Documento B |
| --- | --- | --- |
| Presupuesto vs. Metrado | Presupuesto General | Planilla de Metrados |
| Metrado vs. Plano | Planilla de Metrados | Planos del Proyecto |
| Partida vs. Especificación | Presupuesto General | Especificaciones Técnicas |
| Partida vs. Cronograma | Presupuesto General | Cronograma de Ejecución |

> Solo se listan los documentos presentes en el expediente. Si selecciona una combinación no soportada, se mostrará un aviso.

### 11.2 Visualización

- **Panel comparativo:** muestra la partida seleccionada en el **Documento A** (izquierda) y el **Documento B** (derecha) con los campos comparados resaltados:
  - **Coincide** (verde): valores consistentes.
  - **Diferencia** (ámbar): valores que no coinciden.
  - **Faltante** (gris): información ausente en una fuente.
- El panel se sincroniza con la lista de diferencias: presione una fila para ver su comparación.

### 11.3 Lista de diferencias

- Tabla de **Diferencias detectadas** con: Código · Partida · Campo · Valor A · Valor B · Diferencia · Criticidad.
- **Filtro por criticidad:** Todas / Crítica / Alta / Media / Baja.
- **Navegación rápida:** botones ‹ › para saltar entre diferencias una a una.
- **Búsqueda por partida** para localizar registros específicos.

---

<br>

# 12. Módulo Reportes

**Función:** generar, visualizar, descargar e imprimir informes del sistema.

### 12.1 Tipos de reporte

| Tipo | Contenido |
| --- | --- |
| **Reporte general del expediente** | Informe ejecutivo completo. |
| **Reporte de inconsistencias** | Matriz de inconsistencias detectadas. |
| **Reporte de observaciones** | Consolidado de observaciones. |
| **Reporte de coherencia** | Índice y detalle de coherencia documental. |
| **Reporte de trazabilidad** | Trazabilidad de versiones de los documentos. |

### 12.2 Listado de reportes

- **Indicadores:** total de reportes, generados (%), pendientes y tipos disponibles.
- **Búsqueda** por nombre o responsable.
- **Filtros:** por Proyecto, por Tipo y por Fecha (hoy, última semana, último mes).
- **Columnas:** Nombre · Proyecto · Tipo · Fecha · Responsable · Estado (Pendiente / Generado) · Acciones.

### 12.3 Acciones por reporte (menú ⋯)

| Acción | Descripción |
| --- | --- |
| **Ver** | Abre la vista previa del reporte. |
| **Generar** | Genera y descarga el PDF (requiere permiso de edición). El reporte pasa a estado *Generado*. |
| **Descargar PDF** | Descarga el informe ya configurado. |
| **Imprimir** | Abre la vista de impresión del navegador. |

Cada reporte incluye: resumen, puntaje, documentos, coherencia, observaciones (hasta 12) y **recomendaciones** según el tipo.

---

<br>

# 13. Módulo Usuarios

**Función:** administrar las cuentas de acceso (solo Administrador).

### 13.1 Indicadores

Total de usuarios · Activos · Inactivos · Administradores.

### 13.2 Buscar y filtrar

- **Búsqueda** por nombre, correo o especialidad.
- **Filtros:** por rol (Administrador / Revisor / Analista / Consulta) y por estado (Activo / Inactivo).

### 13.3 Columnas de la tabla

Usuario (avatar, nombres y especialidad) · Correo · Rol · Especialidad · Proyectos asignados · Estado · Último acceso · Acciones.

### 13.4 Acciones por usuario (menú ⋯)

| Acción | Descripción |
| --- | --- |
| **Ver** | Muestra los datos completos de la cuenta. |
| **Editar** | Modifica los datos del usuario. |
| **Activar / Desactivar** | Habilita o bloquea el acceso. |
| **Eliminar** | Elimina la cuenta (no se puede deshacer). |

### 13.5 Crear un usuario

1. Presione **"Nuevo usuario"**.
2. Complete el formulario: nombres, apellidos, correo, contraseña (mín. 6 caracteres), rol, especialidad y estado.
3. Presione **"Crear usuario"**.
   - El sistema evita duplicar correos; si el correo ya existe, muestra el aviso *"Correo en uso"*.
   - Al editar, deje la contraseña **en blanco** para conservar la actual.

### 13.6 Roles y permisos del sistema

Al final de la página se muestra la sección **"Roles y permisos"** con una matriz editable de permisos por rol y por módulo (ver, crear, editar, ejecutar análisis, resolver observaciones, generar reportes, administrar usuarios). Puede modificar los permisos y **guardarlos**.

---

<br>

# 14. Módulo Configuración

**Función:** ajustar preferencias personales de la interfaz.

### 14.1 Apariencia

- **Tema:** Claro / Oscuro / Del sistema (la opción *Del sistema* sigue la configuración del navegador).
- **Densidad de interfaz:** Compacta / Cómoda (controla el espacio entre elementos).

### 14.2 Notificaciones

- Activa o desactiva cada tipo de notificación:
  - Nuevas observaciones.
  - Observaciones críticas.
  - Asignaciones.
  - Reanálisis completados.
  - Reportes generados.
- Se muestra el contador de notificaciones activas (ej.: *3 de 5 activas*).

### 14.3 Preferencias

- **Página inicial:** página mostrada al iniciar sesión (Dashboard, Proyectos, Analisis, Observaciones o Reportes).
- **Cantidad de filas por tabla:** 5 / 10 / 20 / 50.
- **Formato de fecha:** Día MMM Año (es-PE), DD/MM/AAAA o AAAA-MM-DD (con ejemplo en vivo).
- **Mostrar ayudas contextuales:** activa/desactiva consejos de ayuda.

> Todos los cambios se aplican y guardan automáticamente en el navegador.

---

<br>

# 15. Mi Perfil

**Función:** ver y actualizar los datos personales y de acceso.

### 15.1 Datos personales

- Muestra avatar con las iniciales, nombre y correo.
- Permite modificar el **nombre completo** y el **correo electrónico** y pulsar **Guardar cambios**. Los datos se actualizan al instante en la barra lateral y el encabezado.

### 15.2 Rol y permisos

- **Rol actual** y etiqueta de modalidad: *Solo lectura* (revisor/consulta) o *Escritura activa*.
- **Módulos disponibles** para su rol (etiquetas).

### 15.3 Cambiar de rol (demo)

- Lista de usuarios de demostración. Al hacer clic en uno, la sesión simula ese rol (útil para probar la interfaz de cada rol sin cerrar sesión).

---

<br>

# 16. Importación y exportación de datos

### 16.1 Exportar proyectos (PDF)

Desde el módulo **Proyectos**, botón **"Exportar"**: descarga un archivo PDF con el listado de expedientes y sus observaciones.

### 16.2 Exportar un expediente (PDF)

Desde el **detalle del proyecto** → menú **"Más opciones"** → **"Exportar"**: genera un PDF del expediente (actividad, categorías de documentos, equipo y observaciones).

### 16.3 Importar proyectos (JSON)

Desde el módulo **Proyectos**, botones **"Plantilla"** e **"Importar"** (ver sección 7.7). El archivo JSON debe contener una estructura de `proyectos` y opcionalmente `observaciones`.

### 16.4 Reportes (PDF e impresión)

Desde el módulo **Reportes**: generar, descargar PDF o imprimir (ver sección 12.3).

---

<br>

# 17. Glosario de términos

| Término | Definición |
| --- | --- |
| **Expediente técnico** | Conjunto de documentos técnicos de una obra (planos, metrados, presupuesto, especificaciones, cronograma). |
| **Metrado** | Cálculo de las cantidades de obra de cada partida. |
| **Partida** | Unidad de trabajo de una obra (ej.: concreto simple, acero de refuerzo). |
| **Inconsistencia** | Diferencia detectada entre dos fuentes documentales. |
| **Observación** | Registro formal de un hallazgo que requiere acción o conciliación. |
| **Criticidad** | Nivel de impacto de un hallazgo: baja, media, alta, crítica. |
| **Regla de revisión** | Comparación automatizada entre documentos (Presupuesto vs. Metrado, etc.). |
| **Coherencia** | Índice (0-100%) de consistencia entre los documentos de un expediente. |
| **Reanálisis** | Reprocesamiento de un documento corregido para generar una nueva versión de comparación. |
| **KPI / Indicador** | Tarjeta con una métrica resumida del módulo. |

---

<br>

# 18. Preguntas frecuentes

**¿El sistema guarda los datos de forma segura?**
Es un prototipo: los datos se guardan únicamente en el navegador del equipo y se pierden si se borran los datos de navegación. No se conecta a una base de datos externa.

**¿Puedo recuperar mi contraseña?**
El enlace "¿Olvidó su contraseña?" es demostrativo. En el prototipo las contraseñas están predefinidas (demo: `123456`).

**¿Cómo sé qué rol tengo?**
Revise la barra lateral (su rol aparece bajo su nombre y correo) o la sección **Perfil → Rol y permisos**.

**¿Por qué no veo el módulo Usuarios ni Configuración?**
Esos módulos están restringidos al rol **Administrador**.

**¿Por qué no me aparece el botón "Editar" o "Nuevo proyecto"?**
Los roles de solo lectura (Revisor y Consulta) no pueden editar. Consulte con un administrador.

**¿Qué pasa si descarto una alerta del Dashboard?**
Solo se oculta; puede restaurarla desde el botón "Restaurar N descartada(s)".

**¿Los documentos subidos se procesan real?**
En el prototipo el procesamiento y la detección de inconsistencias están **simulados**; los archivos no se suben a un servidor ni se analizan realmente.

**¿Cómo genero el PDF de un proyecto?**
Desde el detalle del proyecto → menú "Más opciones" → **Exportar**. También puede exportar el listado completo desde Proyectos → **Exportar**.

**¿Cuántos reanálisis puedo hacer por observación?**
No hay límite; cada reanálisis crea una nueva versión en el historial de la observación.

---

<br>

*Fin del manual de usuario.*