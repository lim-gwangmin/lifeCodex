require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const http = require("http");
const path = require("path");
const https = require("https");
const fs = require("fs");
const app = express();
const cors = require('cors');
const port = process.env.PORT || 3000;
const expressLayouts = require('express-ejs-layouts');
const { LoggerLevel } = require("mongodb");
const bodyParser = require('body-parser');

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));
// 세션 설정
app.use(session({
   secret: process.env.SESSION_SECRET,
   resave: false,
   saveUninitialized: true,
   cookie: { secure: false } // HTTPS 사용 시 true로 설정
 }));

// const options = { // letsencrypt로 받은 인증서 경로를 입력
//    ca: fs.readFileSync('/etc/letsencrypt/live/life.codexbridge.co.kr/fullchain.pem'),
//    key: fs.readFileSync('/etc/letsencrypt/live/life.codexbridge.co.kr/privkey.pem'),
//    cert: fs.readFileSync('/etc/letsencrypt/live/life.codexbridge.co.kr/cert.pem')
// };

http.createServer(app).listen(port);
// https.createServer(options, app).listen(443);
/**
 * !정적파일 로드
 * @root 경로에 express 가상 경로가 붙어 정적 파일 경우 경로 설정 해줘야함
 * */ 
app.use('/css', express.static(__dirname + '/css'));
app.use('/assets/', express.static(__dirname + '/assets/'));
app.use('/public/', express.static(__dirname + '/public/'));
app.use('/', express.static(__dirname + '/'));

// app.set('layout', 'partials/layout');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);

mongoose.set('strictQuery', false);
mongoose
  .connect(process.env.MONGO_DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "Cluster0",
  })
  .then(() => {
    console.log("we connected mongo");
  })
  .catch((err) => {
    console.log(err);
  });

// MongoDB Change Streams 설정
const db = mongoose.connection;
db.once('open', () => {
    const notificationCollection = db.collection('notifications');

    const changeStream = notificationCollection.watch();

    changeStream.on('change', (change) => {
        if (change.operationType === 'update') {
            const updatedDocument = change.updateDescription.updatedFields;

            if (updatedDocument.status === 'accepted') {
                console.log('교환 요청이 수락되었습니다.');
            } else if (updatedDocument.status === 'rejected') {
                console.log('교환 요청이 거부되었습니다.');
            }
        }
    });
});

const router = require('./routes/router');
app.use('/', router);

app.get('/firebase-messaging-sw.js', (req, res) => {
   console.log(res,'res')
   res.sendFile(path.join(__dirname + '/firebase-messaging-sw.js'));
});

app.listen( port, () => {

  console.log(`Server is running on  ${port}`);
});