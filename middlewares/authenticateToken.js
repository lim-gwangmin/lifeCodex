const jwt = require('jsonwebtoken');
const { User } = require('../models/Users');


const mongoose = require('mongoose'); // mongoose를 사용하여 ObjectId를 처리


const authenticateToken = async (req, res, next) => {
  const token = req.session.token;

  if (!token) {
    console.log('세션이 토큰값이 없음 로그인 필요')
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = mongoose.Types.ObjectId(decoded.userId);
    const user = await User.findById(userId);

    if (!user) {
      res.redirect('login');
    }

    req.user = user; // 사용자 정보를 요청 객체에 추가
    next(); // 다음 미들웨어 또는 라우트 핸들러로 이동
  } catch (err) {
    res.redirect('login');
  }
};

module.exports = authenticateToken;
