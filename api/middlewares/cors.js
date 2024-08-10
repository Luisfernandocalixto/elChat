import cors from 'cors';

const ACCEPTED_ORIGINS = [
    process.env.HOST,
    process.env.HOST1,
    process.env.HOST2,
    process.env.HOST3,
    process.env.HOST4,
    process.env.HOST5,
    process.env.HOST6,
    process.env.HOST7,
]


export const corsMiddleware = ({ acceptedOrigins = ACCEPTED_ORIGINS } = {}) => cors({
    origin: (origin, callback) => {
        if (acceptedOrigins.includes(origin)) {
            return callback(null, true)
        }
        if (!origin) {
            return callback(null, true)
        }

        return callback(new Error('Not allowed by CORS'))
    },
})