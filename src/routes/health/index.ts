import { Router } from 'express'

const router = Router()

router.get('/', (req, res) => {
  return res.json({
    status: 'ok',
    message: 'API funcionando',
    time: new Date()
  })
})

export default router