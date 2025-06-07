import React from 'react';
import { Link } from 'react-router-dom';
import '../CSS/HomePage.css';
import Logo from '../Logo';
import HeroIllustration from '../HeroIllustration';

const HomePage = () => {
  return (
    <div className="homepage">
      <header className="homepage-header">
        <div className="container">
          <div className="navbar">            <div className="logo">
            <Logo size="medium" withText={true} />
          </div>
            <nav className="main-nav">
              <ul>
                <li><Link to="/">Trang chủ</Link></li>
                <li><Link to="/features">Tính năng</Link></li>
                <li><Link to="/about">Giới thiệu</Link></li>
                <li><Link to="/contact">Liên hệ</Link></li>
              </ul>
            </nav>
            <div className="auth-buttons">
              <Link to="/login" className="btn login-btn">Đăng nhập</Link>
              <Link to="/register" className="btn register-btn">Đăng ký</Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="container">
            <div className="hero-content">
              <h1>TẠO BÀI THI TRẮC NGHIỆM ONLINE MIỄN PHÍ VÀ DỄ SỬ DỤNG</h1>
              <p>Nền tảng giúp bạn tạo, quản lý và thực hiện các bài kiểm tra trực tuyến một cách nhanh chóng và hiệu quả.</p>              <Link to="/register" className="btn hero-btn">Bắt đầu miễn phí</Link>
            </div>
            <div className="hero-image">
              <HeroIllustration />
            </div>
          </div>
        </section>

        <section className="features-section">
          <div className="container">
            <h2>Các tính năng nổi bật</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-edit"></i>
                </div>
                <h3>Dễ dàng tạo hoặc upload file câu hỏi trắc nghiệm</h3>
                <p>Tạo câu hỏi trắc nghiệm chỉ với vài thao tác đơn giản hoặc upload file có sẵn.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-random"></i>
                </div>
                <h3>Nhiều tùy chọn trộn câu hỏi và tự động chấm bài làm</h3>
                <p>Tự động trộn thứ tự câu hỏi và đáp án, chấm điểm ngay sau khi hoàn thành bài thi.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-database"></i>
                </div>
                <h3>Tạo bài thi lấy ngẫu nhiên từ ngân hàng câu hỏi trắc nghiệm của bạn</h3>
                <p>Xây dựng ngân hàng câu hỏi và tạo các bài kiểm tra đa dạng.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-robot"></i>
                </div>
                <h3>Tích hợp Chat GPT giúp bạn tự động tạo câu hỏi trắc nghiệm</h3>
                <p>Sử dụng AI để tạo các câu hỏi trắc nghiệm phù hợp với nội dung bạn mong muốn.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="container">
            <div className="cta-content">
              <h2>Sẵn sàng để bắt đầu?</h2>
              <p>Đăng ký miễn phí ngay hôm nay và trải nghiệm các tính năng tuyệt vời của chúng tôi!</p>
              <Link to="/register" className="btn cta-btn">Đăng ký miễn phí</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="homepage-footer">
        <div className="container">
          <div className="footer-content">            <div className="footer-logo">
            <Logo size="small" withText={true} />
          </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Sản phẩm</h4>
                <ul>
                  <li><Link to="/features">Tính năng</Link></li>
                  <li><Link to="/pricing">Bảng giá</Link></li>
                  <li><Link to="/faq">Câu hỏi thường gặp</Link></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Về chúng tôi</h4>
                <ul>
                  <li><Link to="/about">Giới thiệu</Link></li>
                  <li><Link to="/contact">Liên hệ</Link></li>
                  <li><Link to="/terms">Điều khoản</Link></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Kết nối</h4>
                <div className="social-links">
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                    <i className="fab fa-facebook-f"></i>
                  </a>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                    <i className="fab fa-twitter"></i>
                  </a>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                    <i className="fab fa-instagram"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="copyright">
            <p>&copy; {new Date().getFullYear()} QuizApp. Tất cả các quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
