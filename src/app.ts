import express from 'express'
import cors from 'cors'
import { join } from 'path'
import getAllRoutes from '@config/routes'

const app = express()

app.use(cors())
app.use(express.json())

const registerRoutes = async (): Promise<void> => {
  const routes = getAllRoutes()

  for (const route of routes) {
    const mod = await import(join(route.file))
    app.use(`/api${route.path}`, mod.default)
  }
}

export { registerRoutes }
export default app
