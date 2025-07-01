const express = require("express"); //Framework để tạo server và định nghĩa routes
const passport = require("passport");
const jwt = require("jsonwebtoken"); //Thư viện để tạo và xác minh JWT, dùng để cấp token xác thực cho client
const User = require("../models/User");
const router = express.Router(); //để định nghĩa các tuyến đường.

router.get(
  //Khởi tạo quy trình xác thực Google OAuth.http://localhost:5000/api/auth/google
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"], //Yêu cầu Google cung cấp thông tin hồ sơ (tên, ID) và email của người dùng.
    prompt: "select_account", // Buộc người dùng chọn tài khoản Google mỗi lần đăng nhập, thay vì tự động sử dụng tài khoản đã đăng nhập trước đó.
  })
);

router.get(
  //Xử lý callback từ Google sau khi người dùng xác thực thành công hoặc thất bại.
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  async (req, res) => {
    //Kiểm tra vai trò người dùng
    const user = req.user;
    console.log("Google callback - User from DB:", user); // Debug
    if (user.role === null) {
      //chưa chọn role chuyển đến select role
      console.log(
        "Google callback - Role is null, redirecting to /select-role"
      ); // Debug
      return res.redirect(
        `http://localhost:3000/select-role?googleId=${user.googleId}`
      );
    }
    const token = jwt.sign(
      // đã có role
      { id: user._id, role: user.role },
      process.env.JWT_SECRET, //JWT là một "tấm thẻ xác nhận" người dùng đã đăng nhập
      { expiresIn: "3h" } //khi token hết hạn, bạn không thể gửi yêu cầu có xác thực đến server được nữa, hoặc nếu có gửi thì server sẽ từ chối và trả về lỗi.
    );
    console.log("Google callback - Redirecting to dashboard with:", {
      token,
      role: user.role,
    }); // Debug
    res.redirect(
      //Chuyển hướng đến trang /dashboard trên client (http://localhost:3000/dashboard) với query parameters token (JWT) và role.
      `http://localhost:3000/dashboard?token=${token}&role=${user.role}` //qua app.js xét role
    );
  }
);



router.post("/set-role", async (req, res) => {
  const { googleId, role } = req.body;
  try {
    const user = await User.findOneAndUpdate(
      { googleId },
      { role },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    res.status(200).json({ role: user.role });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;