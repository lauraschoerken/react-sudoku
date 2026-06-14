# react-sudoku

Frontend React + Vite + TypeScript para jugar Sudoku consumiendo el backend `java-sudoku`.

## Funcionalidades

- Juego principal con tableros 2x2, 3x3 y 4x4.
- Dificultades conectadas con la API: `EASY`, `MEDIUM`, `HARD`, `EXPERT`.
- Creacion y recuperacion de partidas desde backend.
- Validacion de jugadas, errores, pistas, notas, pausa, reanudacion y finalizacion.
- Soporte de usuario con login/registro y JWT persistido en `localStorage`.
- Dashboard autenticado con estadisticas, calendario y partidas recientes.
- Sudoku diario compartido por fecha.
- Packs imprimibles con soluciones opcionales usando `window.print()`.
- Fallback local para mantener la UI jugable si el backend no esta disponible.

## Configuracion

La API se configura con `VITE_API_BASE_URL`.

Ejemplo:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

## Scripts

```bash
npm.cmd install
npm.cmd run dev
npm.cmd run build
npm.cmd run test
```

Para desarrollo completo, levanta antes el backend:

```bash
cd ../java-sudoku
mvn.cmd spring-boot:run
```
