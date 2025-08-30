import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full bg-gray-100 py-4 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <span>© 2025·大海团队·by 迪奥</span>
          <span className="hidden sm:inline">|</span>
          <a href="https://t.me/dh114514" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
            导航反馈联系
          </a>
          <span className="hidden sm:inline">|</span>
          <a href="https://t.me/dahai85" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
            合作联系
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;