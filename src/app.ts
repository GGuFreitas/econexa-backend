import express from 'express'
import cors from 'cors'
import getAllRoutes from '@config/routes'

const app = express()

app.use(cors())
app.use(express.json())

const routes = getAllRoutes()

routes.forEach((route) => {
  import(route.file).then((module) => {
    app.use(`/api${route.path}`, module.default)
  })
})

export default app