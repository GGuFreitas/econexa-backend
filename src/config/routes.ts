import { readdirSync, statSync } from 'fs'
import { join, sep } from 'path'

interface RouteEntry {
  path: string
  file: string
}

const collectRoutes = (dirPath: string, rootPath: string): RouteEntry[] => {
  const entries: RouteEntry[] = []
  const files = readdirSync(dirPath)

  for (const file of files) {
    const fullPath = join(dirPath, file)

    if (statSync(fullPath).isDirectory()) {
      entries.push(...collectRoutes(fullPath, rootPath))
    } else {
      const relative = dirPath.replace(rootPath, '').split(sep).join('/')
      entries.push({ path: relative || '/', file: fullPath })
    }
  }

  return entries
}

const getAllRoutes = (): RouteEntry[] => {
  const routesRoot = join(__dirname, '../routes')
  return collectRoutes(routesRoot, routesRoot)
}

export default getAllRoutes
