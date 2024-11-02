module.exports = {
    server: {
        port: process.env.PORT || 8080,
        host: '0.0.0.0'
    },
    database: {
        url: process.env.DATABASE_URL,
        options: {
            ssl: true,
            retryWrites: true
        }
    },
    logging: {
        level: 'info',
        file: 'logs/production.log'
    }
};