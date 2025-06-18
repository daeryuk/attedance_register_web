module.exports = {
    database: {
        host: 'localhost',
        user: 'root',
        password: 'Kdrkdr8100!',
        database: 'attendance_db'
    },
    session: {
        secret: 'your_session_secret_key_here',
        resave: false,
        saveUninitialized: false,
        cookie: { 
            secure: false, // HTTPS 사용 시 true로 변경
            maxAge: 24 * 60 * 60 * 1000 // 24시간
        }
    },
    port: 3000
}; 