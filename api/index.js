import express from "express";
import logger from 'morgan';
import dotenv from 'dotenv';
import { createClient } from '@libsql/client';
// import req from "express/lib/request";
import { Server } from "socket.io";
import { createServer } from "node:http";
import cors from 'cors';
dotenv.config()

const port = process.env.PORT ?? 3000

const app = express()
const server = createServer(app)
app.use(express.static('components'));
app.use(cors);
const io = new Server(server, {
    connectionStateRecovery: {}
})

const db = createClient({
    url: process.env.URL,
    authToken: process.env.DB_TOKEN
});

await db.execute(`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT, 
        user TEXT
        )
        `);

io.on("connection", async (socket) => {
    console.log('a user has connected');

    socket.on("disconnect", () => {
        console.log("an user has disconnected");
    })

    socket.on("chat message", async (msg) => {
        let result
        const username = socket.handshake.auth.username ?? 'anonymous'
        console.log({ username });
        try {
            result = await db.execute({
                sql: 'INSERT INTO messages (content, user) VALUES (:msg , :username)',
                args: { msg, username }
            })
        } catch (e) {
            console.error(e);
            return
        }
        io.emit("chat message", msg, result.lastInsertRowid.toString(), username);
    })

    // recuperar los mensajes sin conexion
    if (!socket.recovered) {
        try {
            const result = await db.execute({
                sql: 'SELECT id, content, user FROM messages WHERE id > ?',
                args: [socket.handshake.auth.serverOffset ?? 0]
            });

            result.rows.forEach(row => {
                socket.emit('chat message', row.content, row.id.toString(), row.user)
            });
        } catch (e) {
            console.error(e);
        }
    }

})
app.use(logger('dev'))

app.get('/', (req, res) => {
    res.sendFile(process.cwd() + '/components/index.html')
    // res.sendFile(path.join(__dirname, '../components/index.html'))
})


server.listen(port, () => {
    console.log(`Server running on port ${port}`);
})

