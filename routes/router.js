const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
// model
const { User, UserOrder, EveryWorks, TargetWorks } = require('../models/Users');
// middleWare
const authenticateToken = require('../middlewares/authenticateToken');
// controller
const signController = require('../controller/signController');
const userController = require('../controller/userController');

/**************************** page ******************************/
// 메인
router.get('/', authenticateToken, async (req, res) => {
   const token = req.user.token;

   if (token) {
      // 로그인 유저 정보
      const user = await User.findOne({ token });
      // 당번 리스트
      let orderList = await UserOrder.find({});
      // order 값을 기준으로 오름차순 정렬
      orderList.sort((a, b) => a.order - b.order);
      // 정렬된 리스트에 대해 순번을 새로 할당
      let updatedOrderList = orderList.map((user, index) => {
        return { ...user._doc, order: index + 1 }; // 1번부터 순서대로 할당
      });
      // 로그인한 유저를 제외한 나머지 당번 리스트
      let remainingOrderList = [];
      const thisCheckOrder = await UserOrder.find({ email: req.user.email });

      if(thisCheckOrder.length) {
         remainingOrderList = await UserOrder.find({ email: { $ne: req.user.email } });
      };

      // 모두의 일 
      const everyWorks = await EveryWorks.find({});
      // 당번의 일
      const targetWorks = await TargetWorks.find({});
     // 토큰이 존재하면 홈페이지로 이동
     res.render('index', {
         email: user.email,
         name: user.name,
         permission: user.permission,
         orderList: updatedOrderList,
         remainingOrderList,
         everyWorks,
         targetWorks,
         layout: 'partials/layout'
      });
   } else {
      // 토큰이 없으면 로그인 페이지로 이동
      res.redirect('/login');
   }
});
// 로그아웃
router.get('/logout', async (req, res) => {
   req.session.destroy((err) => {
      if (err) {
         console.error('세션을 파기하는 동안 오류가 발생했습니다:', err);
         return res.status(500).json({ error: '로그아웃 중 오류가 발생했습니다.' });
      }
      // 로그아웃 성공 시 홈 페이지나 다른 페이지로 리다이렉트할 수 있음
      res.redirect('login'); // 홈 페이지로 리다이렉트
   });
});
// 회원가입
router.get('/signUp', async (req, res) => {
   res.render('sign_up', { layout: 'partials/sign_layout' });
});
// 로그인
router.get("/login", async (req, res) => {
   res.render('login', { layout: 'partials/sign_layout' });
});
/**************************** API ********************************/
// 회원가입 인증 메일 전송
router.post('/api/sendEmail', upload.none(), signController.sendEmail);
// 회원가입 이메일 인증 번호 체크
router.post('/api/emailAuthentication', upload.none(), signController.emailAuthentication);
// 회원가입
router.post('/api/signUp', upload.none(), signController.signUp);
// 로그인
router.post('/api/login', upload.none(), signController.login);

// 당번에 추가할 유저 목록 가져오기
router.get('/api/getOrderList', authenticateToken, userController.getOrderList);
// 당번 추가
router.post('/api/addToOrderList', authenticateToken, userController.addToOrderList);
// 관리자 당번 순서 변경 (터치 이벤트)
router.post('/api/adminChangeOrderList', authenticateToken, upload.none(), userController.adminChangeOrderList);
// 관리자 당번 제거
router.delete('/api/deleteOrder', authenticateToken, userController.deleteOrder);

// 당번 변경 요청 보내기
router.post('/api/requestOrderChange', authenticateToken, userController.requestOrderChange);
// 당번 변경 요청 거절 및 수락
router.post('/api/responseOrderChange', authenticateToken, userController.responseOrderChange);
// 당번 변경 알림 수신 가져오기
router.post('/api/orderChangeNotifications', authenticateToken, userController.orderChangeNotifications);

module.exports = router;