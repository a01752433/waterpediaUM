# waterpedia UM

Prototipo para ver la calidad del agua de Tasik Varsiti y el humedal UM Green Belt, en Universiti Malaya. El mapa, las estaciones, las muestras y los reportes usan datos de muestra (septiembre 2025 a noviembre 2026). Nada de lo que pulses se guarda en un servidor: si cierras el navegador, los cambios de pantalla no quedan registrados en internet.

Esta guía es para abrir el proyecto y trabajar en él aunque no hayas programado antes.

## 1. Instala dos programas

Hazlo una sola vez en la computadora.

1. **Git**, para bajar el proyecto y guardar tu trabajo en una rama. Descárgalo en [https://git-scm.com/download/win](https://git-scm.com/download/win). En el instalador puedes dejar todas las opciones como vienen y pulsar Next hasta el final.
2. **Node.js**, el programa que enciende la página en tu computadora. Entra a [https://nodejs.org](https://nodejs.org) y descarga el botón que dice **LTS** (la versión recomendada). Instálalo con las opciones que vienen marcadas.

Cuando terminen los dos instaladores, cierra cualquier ventana de terminal o de Cursor que ya estuviera abierta y ábrelos de nuevo. Si no lo haces, la computadora a veces sigue sin ver los programas nuevos.

### Comprueba que sí se instalaron

1. Pulsa la tecla Windows, escribe `PowerShell` y ábrelo.
2. Escribe esto y pulsa Enter:

```powershell
git --version
```

3. Luego escribe esto y pulsa Enter:

```powershell
node --version
```

En los dos casos debe aparecer un número de versión, por ejemplo `git version 2.45.0` o `v22.14.0`. Si PowerShell dice que no reconoce `git` o `node`, cierra esa ventana, ábrela otra vez y repite los dos comandos. Si sigue fallando, vuelve a ejecutar el instalador.

## 2. Baja el proyecto

En la misma ventana de PowerShell, ve a la carpeta donde quieres guardarlo. Por ejemplo, el Escritorio:

```powershell
cd $env:USERPROFILE\Desktop
```

`cd` significa “entra a esta carpeta”. Luego copia el proyecto desde GitHub:

```powershell
git clone https://github.com/a01752433/waterpediaUM.git
```

Eso crea una carpeta llamada `waterpediaUM`. Entra en ella:

```powershell
cd waterpediaUM
```

Ábrela en Cursor: menú **File → Open Folder** y elige esa carpeta `waterpediaUM`.

## 3. Enciende la página

Estos comandos se escriben en la terminal de Cursor. Ábrela con **Terminal → New Terminal**. Tiene que decir que estás dentro de `waterpediaUM`. Si no, escribe `cd` y la ruta de la carpeta.

La primera vez, instala lo que el proyecto necesita. Tarda un poco y solo hace falta repetirlo si alguien agrega una herramienta nueva:

```powershell
npm install
```

Después, enciende la página:

```powershell
npm run dev
```

En la terminal aparece una línea como esta:

```text
Local:   http://localhost:5173/
```

Copia esa dirección, pégala en Chrome o Edge y pulsa Enter. `localhost` significa “esta misma computadora”. No hace falta internet para ver la página una vez que ya corriste `npm install`.

Si en vez de 5173 dice que el puerto está ocupado y muestra otro número, por ejemplo `http://localhost:5174/`, abre ese. Es la misma página.

Para apagarla, haz clic en la terminal y pulsa `Ctrl+C`. Confirma con `S` o Enter si te lo pregunta. La página deja de cargar hasta que vuelvas a escribir `npm run dev`.

Cada vez que quieras trabajar, abre la carpeta en Cursor y solo repite `npm run dev`. No hace falta clonar ni instalar de nuevo.

## 4. Qué hay en la página

| Dónde | Qué ves |
| --- | --- |
| `/` | El mapa del lago, las estaciones y los filtros |
| Perfil | Pulsa el recuadro de **Firdaus** arriba a la derecha. Ahí están las muestras por mes y el mapa de ese mes |
| `/upload` | Subir una hoja de campo y revisar la calidad del dato. Desde el mapa, el botón **Upload samples** |
| `/compare` | Comparar varias estaciones |
| `/archive` | La tabla histórica, la cita y un ejemplo para exportar |

La dirección completa se arma pegando la ruta al final. Si tu terminal dice `http://localhost:5173/`, el archivo está en `http://localhost:5173/archive`.

## 5. Cómo se trabaja en ramas

Piensa en el proyecto como un documento compartido.

- **`main`** es la copia de todos. No escribas ahí tu cambio del día.
- Una **rama** es tu copia aparte. Puedes probar cosas sin pisar lo que ya está en `main` ni lo que está haciendo otra persona.

El nombre de una rama conviene que diga quién eres y qué haces, en minúsculas y con guiones. Ejemplo: `ana/ajustar-mapa`.

### Ponte al día antes de empezar

```powershell
git checkout main
git pull
```

`checkout main` te coloca en la copia compartida. `pull` baja lo último que ya se unió en GitHub.

### Crea tu rama

```powershell
git checkout -b ana/ajustar-mapa
```

Cambia `ana/ajustar-mapa` por tu nombre y el cambio. A partir de aquí, lo que edites queda en esa rama, no en `main`.

Para ver en qué rama estás:

```powershell
git status
```

La primera línea dice `On branch` y el nombre.

### Guarda el cambio y súbelo

Cuando la página se vea como quieres:

```powershell
git status
git add .
git commit -m "Ajustar el mapa del lago"
git push -u origin ana/ajustar-mapa
```

Qué hace cada uno:

- `git status` lista los archivos que cambiaste. Revísalo antes de seguir.
- `git add .` prepara esos archivos. El punto significa “esta carpeta”.
- `git commit -m "..."` guarda una foto de ese momento en tu computadora. El texto entre comillas es el título del cambio. Escríbelo en una frase corta.
- `git push -u origin ana/ajustar-mapa` sube esa rama a GitHub. El `-u` solo hace falta la primera vez en esa rama. Después basta con `git push`.

En el `push`, el nombre después de `origin` tiene que ser el mismo que usaste en `git checkout -b`.

### Pide que lo unan a `main`

Al terminar el `push`, GitHub a veces imprime un enlace para abrir un **Pull Request**. Ábrelo. Si no aparece, entra al repositorio en el navegador: [https://github.com/a01752433/waterpediaUM](https://github.com/a01752433/waterpediaUM). Arriba sale un aviso para comparar tu rama. Crea el Pull Request hacia `main` y escribe en pocas líneas qué cambiaste y cómo lo probaste (por ejemplo: “abrí el mapa y el perfil”).

Otra persona revisa ese pedido y lo une a `main`. Tú no unas tu propia rama si el equipo acordó que alguien más la revise.

### Cambia de rama

Para volver a la tuya, o para ver la de otra persona:

```powershell
git checkout ana/ajustar-mapa
```

Si esa rama solo existe en GitHub y no en tu computadora:

```powershell
git fetch
git checkout ana/ajustar-mapa
```

`fetch` mira qué ramas hay en GitHub sin modificar tus archivos.

### Trae a tu rama lo nuevo de `main`

Si `main` avanzó mientras tú seguías en tu rama:

```powershell
git checkout main
git pull
git checkout ana/ajustar-mapa
git merge main
```

Eso copia en tu rama lo que ya está aceptado en `main`. Si Git habla de un **conflict**, no borres archivos al azar: avisa a quien te está ayudando y enséñale el mensaje.

## 6. Tres cosas que no hay que hacer

- No hagas los cambios del día directo en `main`. Crea una rama.
- No subas contraseñas ni archivos llamados `.env`. Este prototipo no los necesita.
- No uses `git push --force`. Puede borrar el trabajo de otra persona en GitHub.
