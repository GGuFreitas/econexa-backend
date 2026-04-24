import 'dotenv/config'
import http from 'http'
import app, { registerRoutes } from './app'
import { initSocket } from './socket'

const PORT = process.env.PORT || 5000

const server = http.createServer(app)
initSocket(server)

registerRoutes().then(() => {
  server.listen(PORT, () => {
    console.log(`Servidor rodando em: http://localhost:${PORT}`)
  })
})
