const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { User } = require('../models/Users'); // User 모델을 가져옴

// 회원가입 이메일 인증 전송
exports.sendEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email.endsWith('@codexbridge.com')) {
      return res.status(400).json({ result: false, message: "이메일은 '@codexbridge.com' 만 사용할 수 있습니다." });
    }

    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ result: false, message: "이미 가입된 이메일이 있습니다." });
    }

    // 이메일에 포함할 인증 번호 생성
    const verificationCode = Math.floor(100000 + Math.random() * 900000);


    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: '슬코생 이메일 인증 🥳',
      html:`
        <h1>회원가입을 완료하려면 다음 인증코드를 입력하세요</h1>
        <div>
          <h2>인증번호</h2>
          <div style="padding:20px; border:1px solid #c8c8c8; background-color:#fff; color:#333 font-size: 20px;">
            ${verificationCode}
          </div>
        </div>
       `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ result: false, message: '이메일 전송 중 오류가 발생했습니다.' });
      }
      req.session.verificationCode = verificationCode;
      res.status(201).json({ result: true, verificationCode: verificationCode, message: '이메일을 성공적으로 전송했습니다.' });
    });

  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ result: false, message: 'Error registering user' });
  }
};
// 회원가입 이메일 인증 번호 체크
exports.emailAuthentication = async (req, res) => {
  const { verificationCode } = req.body;

  if (verificationCode == req.session.verificationCode) {
    // 인증 성공
    res.status(200).json({ result: true, message: '이메일 인증이 완료되었습니다.' });
  } else {
    // 인증 실패
    res.status(400).json({ result: false, message: '인증번호가 올바르지 않습니다.' });
  }

};
// 회원가입
exports.signUp = async (req, res) => {
  const { email, email_session, name, password } = req.body;

  try {
    // 이메일 인증 여부 확인
    if (email_session != req.session.verificationCode) {
      // 인증 실패
      res.status(400).json({ result: false, message: '이메일 인증이 필요합니다.' });
      return;
    };
    // 비밀번호 해시
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      name,
      permission: 'user',
      password: hashedPassword,
    });

    await newUser.save();

    // 저장된 사용자 확인
    res.status(200).json({ message: '회원가입이 성공적으로 완료되었습니다.' });
  } catch (error) {
    res.status(500).json({ message: '회원가입 중 오류가 발생했습니다.' });
  }
}
// 로그인
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ result: false, message: '사용자를 찾을 수 없습니다.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ result: false, message: '비밀번호가 잘못 입력되었습니다.' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' }); // 15분 유효기간
    const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' }); // 7일 유효기간

    user.token = token;
    user.refreshToken = refreshToken;

    await user.save();

    req.session.token = token;

    res.status(200).json({ result: true, message: '로그인 성공', accessToken: token, refreshToken });
  } catch (error) {
    res.status(500).json({ result: false, message: '로그인 중 오류가 발생했습니다.' });
  }
}
