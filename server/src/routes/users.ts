// make a router
import { Router } from 'express'
import { prisma } from '../prisma'
const router = Router()

router.get('/', async (req, res) => {
  const users = await prisma.users.findMany({ select: { name: true } })
  res.json(users)
})
export default router
