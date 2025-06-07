import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.svg';
import './CSS/Logo.css';

const Logo = ({ size = 'medium', withText = true, linkTo = '/' }) => {
  const sizeClass = `logo-${size}`;

  return (
    <div className={`app-logo ${sizeClass}`}>
      <Link to={linkTo}>
        <img src={logo} alt="QuizApp Logo" />
        {withText && <span>QuizApp</span>}
      </Link>
    </div>
  );
};

export default Logo;
