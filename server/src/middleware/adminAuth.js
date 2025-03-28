const adminAuth = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '인증이 필요합니다.' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '관리자 권한이 필요합니다.' });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: '권한 검증에 실패했습니다.' });
  }
};

module.exports = adminAuth; 