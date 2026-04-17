import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'

let io: Server

// 👇 guarda usuários online
const onlineUsers = new Map<number, string>()

export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: '*'
    }
  })

  // 🔐 middleware de autenticação
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token

      if (!token) return next(new Error('Token não informado'))

      const payload: any = jwt.verify(token, process.env.SECRET_KEY as string)

      socket.data.user = payload.usuario

      return next()
    } catch (err) {
      return next(new Error('Token inválido'))
    }
  })

  // 🔥 conexão
  io.on('connection', (socket) => {
    const user = socket.data.user

    console.log(`🟢 Usuário conectado: ${user.ID}`)

    // salva usuário online
    onlineUsers.set(user.ID, socket.id)

    // envia lista atualizada
    io.emit('users_online', Array.from(onlineUsers.keys()))

    // 🔔 exemplo: escutar evento
    socket.on('ping', () => {
      socket.emit('pong')
    })

    // ❌ desconexão
    socket.on('disconnect', () => {
      console.log(`🔴 Usuário desconectado: ${user.ID}`)

      onlineUsers.delete(user.ID)

      io.emit('users_online', Array.from(onlineUsers.keys()))
    })
  })
}

export const getIO = () => {
  if (!io) {
    throw new Error('Socket não inicializado')
  }
  return io
}