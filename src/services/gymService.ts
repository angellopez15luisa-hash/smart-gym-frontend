import planesJson from '@/data/planes.json'
import sociosJson from '@/data/socios.json'
import productosJson from '@/data/productos.json'
import movimientosJson from '@/data/movimientos.json'
import asistenciasJson from '@/data/asistencias.json'
import type { Plan, Socio, Producto, Movimiento, Asistencia } from '@/types/gym.types'

export const gymService = {
  async getInitialData() {
    // TODO: Reemplazar por llamadas Promise.all([api.get('/planes'), api.get('/socios'), ...])
    return {
      planes: structuredClone(planesJson) as Plan[],
      socios: structuredClone(sociosJson) as Socio[],
      productos: structuredClone(productosJson) as Producto[],
      movimientos: structuredClone(movimientosJson) as Movimiento[],
      asistencias: structuredClone(asistenciasJson) as Asistencia[]
    }
  }
}
