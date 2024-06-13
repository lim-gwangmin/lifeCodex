const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 회원정보 스키마
const userSchema = new Schema({
   email: { type: String, required: true, unique: true },
   name: { type: String, required: true },
   password: { type: String, required: true },
   permission: { type: String, required: true,},
   token: { type: String },
   refreshToken: { type: String },
});
// 당번 순서 스키마
const UserOrderSchema = new Schema({
   email: { type: String, required: true, unique: true },
   name: { type: String, required: true },
   order: { type: Number, required: true, unique: false },
   target: { type:Boolean, required: true, unique: false },
   nextTarget: { type:Boolean, required: true, unique: false }
});
// 모두의 일 스키마
const EveryWorksSchema = new Schema({
   id: Number, 
   content: String,
   highlight: String
});
// 당번의 일 스키마
const TargetWorksSchema = new Schema({
   id: Number, 
   content: String,
   highlight: String,
   checked: Boolean
});
//당번 순서 변경 요청 스키마 
const NotificationSchema = new mongoose.Schema({
   email: { type: String, required: true },
   message: { type: String, required: true },
   requestEmail: { type: String, required: true },
   status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }, // 알림의 상태를 추적
   createdAt: { type: Date, default: Date.now, expires: '2d' } // 7일 후에 자동 삭제
});

// TTL 인덱스 설정
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 0 });

const User = mongoose.model('User', userSchema);
const UserOrder = mongoose.model('order' , UserOrderSchema);
const EveryWorks = mongoose.model("everyWorks", EveryWorksSchema);
const TargetWorks = mongoose.model("TargetWorks", TargetWorksSchema);
const Notification = mongoose.model('Notification', NotificationSchema);


module.exports = {  User, UserOrder, EveryWorks, TargetWorks, Notification };