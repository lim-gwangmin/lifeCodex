const { User, UserOrder, Notification } = require('../models/Users');
const schedule = require('node-schedule');
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json'); // Path to your service account key JSON file

let Count = 1;
const changeOrder = async () => {
  try {
    // orderList에서 order 값과 Count 값이 일치하는 데이터 가져오기
    const targetUser = await UserOrder.findOne({ order: Count });
    if (targetUser) {
       // order 값과 일치하는 데이터의 target을 true로 설정
      targetUser.target = true;
      await targetUser.save();
    }

    // order 값과 일치하지 않는 데이터의 target을 false로 설정
    await UserOrder.updateMany({ order: { $ne: Count } }, { $set: { target: false } });

    // Count 변수 1 증가
    Count++;

    // totalCount 구하기 (orderList 데이터 수)
    const totalCount = await UserOrder.countDocuments({});

    // Count가 totalCount를 초과하면 Count를 1로 초기화
    if (Count > totalCount) {
      Count = 1;
    }
    const nextTargetUser = await UserOrder.findOne({ order: Count });


    if (nextTargetUser) {
      nextTargetUser.nextTarget = true;
      await nextTargetUser.save();
    }

    await UserOrder.updateMany({ order: { $ne: Count } }, { $set: { nextTarget: false } });

  } catch (err) {
    console.error('오류 발생:', err);
  }
};
const weeklyTarget = schedule.scheduleJob({ dayOfWeek: 1, hour: 0, minute: 0 }, changeOrder );

// 당번에 추가할 유저 목록 가져오기
exports.getOrderList = async (req, res) => {
  try {
    const orderListUsers = await UserOrder.find({}, 'email');
    const orderListUserEamils = orderListUsers.map(order => order.email);
    const usersNotInOrderList = await User.aggregate([
      { $match: { email: { $nin: orderListUserEamils } } },
      { $project: { _id:0, email: 1, name: 1 } } 
    ]);

    res.status(200).json(usersNotInOrderList);
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

// [관리자] 당번 추가하기
exports.addToOrderList = async (req, res) => {
    const { check_order_list } = req.body;

    try {
      let checkOrderArray = [];

      if (Array.isArray(check_order_list)) {
        checkOrderArray = check_order_list;
      } else {
        checkOrderArray.push(check_order_list);
      }

      // 배열을 순회하면서 처리
      for (let i = 0; i < checkOrderArray.length; i++) {
        const userEmail = checkOrderArray[i];
        const user = await User.findOne({ email: userEmail });

        // User 테이블에서 해당 이메일을 갖고 있는 유저 정보를 찾음
        if (user) {
          const newUserOrder = new UserOrder({
            email: user.email,
            name: user.name,
            order: String((await UserOrder.countDocuments()) + 1), // UserOrder 데이터 갯수보다 하나 더 많은 order 값 설정
            target:false,
            nextTarget: false,
          });
          await newUserOrder.save(); // UserOrder 데이터에 추가
        }

      }

      res.redirect('/');
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
}
// [관리자] 당번 순서 변경하기 (터치 이벤트)
exports.adminChangeOrderList = async (req, res) =>{
  const { order } = req.body;

  try {
    for (let i = 0; i < order.length; i++) {
      const userEmail = order[i];
      // order 필드에 카운터 값을 할당하고 카운터를 증가시킵니다.
      // 사용자의 이메일을 기준으로 찾아서 order 값을 업데이트합니다.
      const user = await UserOrder.findOneAndUpdate({ email: userEmail }, { order: i + 1 });
      if (!user) {
        console.error('이메일을 찾을 수 없습니다.', userEmail);
        // 사용자를 찾을 수 없는 경우 에러 처리
        res.status(404).json({ success: false, error: '이메일을 찾을 수 없습니다. ' + userEmail });
        return;
      }

      await changeOrder();
    }

    res.status(200).json({ success: true, error: '순서 변경에 성공했습니다.' });
  } catch (error) {
    console.error('Error saving order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
// [관리자] 당번 제거
exports.deleteOrder = async (req, res) => {
  const { email } = req.body;

  try {
      const result = await UserOrder.deleteOne({ email });

      await changeOrder();
      if (result.deletedCount === 1) {
          res.json({ success: true });
      } else {
          res.status(404).json({ success: false, error: 'User not found' });
      }
  } catch (error) {
      console.error('Error deleting order:', error);
      res.status(500).json({ success: false, error: error.message });
  }
};
// 당번 변경 요청 보내기
exports.requestOrderChange = async (req, res) => {
  const { requesterEmail, targetEmail } = req.body;

  try {
    const requester =  await UserOrder.findOne({ email: requesterEmail });

    const notification = new Notification({
        email: targetEmail,
        message: `${requester.name}님이 당번 순서 변경을 요청했습니다.`,
        requestEmail: requesterEmail
      });
    await notification.save();
    await changeOrder();
    res.status(200).json({ success: true, message: '교환 요청을 보냈습니다.' });
  } catch (error) {
      console.error('Error requesting exchange:', error);
      res.status(500).json({ success: false, error: error.message });
  }
}
// 당번 변경 요청 거절 및 수락
exports.responseOrderChange = async (req, res) => {
  const { targetEmail, requesterEmail, action, createdAt } = req.body; // action이 'accept' 또는 'reject'일 수 있습니다.

  try {
    if (action === 'accept') {
        // 교환 처리
        const targetUser = await UserOrder.findOne({ email: targetEmail });
        const requesterUser = await UserOrder.findOne({ email: requesterEmail });

        if (!targetUser || !requesterUser) {
            return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
        }

        // order 값 교환
        const tempOrder = targetUser.order;
        targetUser.order = requesterUser.order;
        requesterUser.order = tempOrder;

        await targetUser.save();
        await requesterUser.save();

        // 수락 알림 업데이트
        await Notification.updateMany(
            { email: targetEmail, requestEmail: requesterEmail, status: 'pending', createdAt: { $eq: createdAt } },
            { $set: { status: 'accepted' } }
        );

        // 거부 알림 업데이트
        await Notification.updateMany(
            { email: targetEmail, status: 'pending' },
            { $set: { status: 'rejected' } }
        );

        res.status(200).json({ success: true, message: '교환 요청을 수락했습니다.' });
    } else if (action === 'reject') {
        // 거부 알림 업데이트
        await Notification.updateMany(
            { email: targetEmail, requestEmail: requesterEmail, status: 'pending' },
            { $set: { status: 'rejected' } }
        );

        res.status(200).json({ success: true, message: '교환 요청을 거부했습니다.' });
    } else {
        res.status(400).json({ success: false, message: '유효하지 않은 작업입니다.' });
    }
    await changeOrder();
  } catch (error) {
      console.error('Error responding to exchange:', error);
      res.status(500).json({ success: false, error: error.message });
  }
}
// 당번 변경 알림 수신
exports.orderChangeNotifications = async (req, res) => {
  const { userEmail } = req.body;
  try {
    const notifications = await Notification.find({ email: userEmail }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}