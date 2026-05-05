import 'dotenv/config'
import http from 'http'
import app, { registerRoutes } from './app'
import { initSocket } from './socket'
import { initDatabase } from './config/database'

const PORT = process.env.PORT || 5000

const server = http.createServer(app)
initSocket(server)

initDatabase()
  .then(() => registerRoutes())
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Servidor rodando em: http://localhost:${PORT}`)
    })
  })
  .catch((error) => {
    console.error('Erro ao inicializar o banco de dados:', error)
    process.exit(1)
  })
