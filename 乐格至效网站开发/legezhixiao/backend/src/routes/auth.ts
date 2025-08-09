import express from 'express';
import { AuthController } from '../controllers/authController';

const router = express.Router();
const authController = new AuthController();

// 用户注册
router.post('/register', authController.register);

// 用户登录
router.post('/login', authController.login);

// 用户登出
router.post('/logout', authController.logout);

// 刷新令牌
router.post('/refresh', authController.refreshToken);

// 忘记密码
router.post('/forgot-password', authController.forgotPassword);

// 重置密码
router.post('/reset-password/:token', authController.resetPassword);

// 验证邮箱
router.get('/verify-email/:token', authController.verifyEmail);

// 验证令牌
router.get('/verify-token', authController.verifyToken as any);

export default router;
