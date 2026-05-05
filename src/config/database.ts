import mysql from 'mysql2/promise'

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
})

export const initDatabase = async (): Promise<void> => {
  await db.query(
    `CREATE TABLE IF NOT EXISTS REFRESH_TOKENS (
      ID INT AUTO_INCREMENT PRIMARY KEY,
      USER_ID INT NOT NULL,
      TOKEN VARCHAR(500) NOT NULL,
      EXPIRA_EM DATETIME NOT NULL,
      CRIADO_EM DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_refresh_token (TOKEN)
    ) ENGINE=InnoDB;`
  )
}

export default db
