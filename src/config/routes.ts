import { readdirSync, statSync } from 'fs'
import { join } from 'path'

const routes: any[] = []

const getAllRoutes = (dirPath = join(__dirname, '../routes')): any[] => {
  const files = readdirSync(dirPath)

  files.forEach((file) => {
    const fullPath = join(dirPath, file)

    if (statSync(fullPath).isDirectory()) {
      return getAllRoutes(fullPath)
    }
    routes.push({
      path: '/' + dirPath.split('routes')[1],
      file: fullPath
    })
  })

  return routes
}

export default getAllRoutes