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
const port = process.env.PORT;
const jwt = require('jsonwebtoken');
// const port = 3000;

const userController = require("./controller/userController");
const signController = require("./controller/signController.js");
const expressLayouts = require('express-ejs-layouts');
const { TargetWorks } = require("./models/Users.js");
const { LoggerLevel } = require("mongodb");
const bodyParser = require('body-parser');

app.use(cors());
app.use(express.static("public"));
app.use(expressLayouts);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));
// 세션 설정
app.use(session({
   secret: process.env.SESSION_SECRET,
   resave: false,
   saveUninitialized: true,
   cookie: { secure: false } // HTTPS 사용 시 true로 설정
 }));
 
 // 로그인 확인 미들웨어
 function checkAuth(req, res, next) {
  console.log(req.session,'??')
   if (!req.session.user) {
     return res.redirect('login');
   }
   next();
 }

// const options = { // letsencrypt로 받은 인증서 경로를 입력
//    ca: fs.readFileSync('/etc/letsencrypt/live/life.codexbridge.co.kr/fullchain.pem'),
//    key: fs.readFileSync('/etc/letsencrypt/live/life.codexbridge.co.kr/privkey.pem'),
//    cert: fs.readFileSync('/etc/letsencrypt/live/life.codexbridge.co.kr/cert.pem')
// };

// http.createServer(app).listen(port);
// https.createServer(options, app).listen(443);
/**
 * !정적파일 로드
 * @root 경로에 express 가상 경로가 붙어 정적 파일 경우 경로 설정 해줘야함
 * */ 
app.use('/css', express.static(__dirname + '/css'));
app.use('/assets/', express.static(__dirname + '/assets/'));
app.use('/public/', express.static(__dirname + '/public/'));
app.use('/', express.static(__dirname + '/'));

app.set('layout', 'partials/layout');
// app.set('views', path.join(__dirname, 'views'));
app.set("view engine", "ejs");

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

const router = require('./routes/router');

  // 라우터 설정을 사용
app.use('/', router);
app.get("/", userController.authenticateSession, userController.mainPage); 
app.get('/verify*', signController.verifyEmail);
app.get("/login", async (req, res) => {
  res.render('login');
});
app.get('/firebase-messaging-sw.js', (req, res) => {
   console.log(res,'res')
   res.sendFile(path.join(__dirname + '/firebase-messaging-sw.js'));
});

app.put("/api/checked/:id", async (req, res) => {
   try {
      const { params, body } = req;
      const target = await TargetWorks.findOne(params);
      
      if (target) {
         target.checked = !target.checked;

         await target.save();

         res
         .status(200)
         .json({message: '변경되었습니다.', result: true, data: target});
      } else {
         res
         .status(404)
         .send({message: '404!!', result: false});
      };

   } catch ( err ) {
      console.log(err)
   }
});

app.listen(port, () => {
  console.log(`Server is running on  ${port}`);
});