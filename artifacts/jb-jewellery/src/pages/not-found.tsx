import React from 'react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4 bg-gray-50">
      <div className="bg-primary/10 p-6 rounded-full mb-6">
        <span className="text-5xl font-black text-black">404</span>
      </div>
      <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
      <p className="text-gray-500 mb-8 max-w-md">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link 
        href="/" 
        className="bg-primary text-black font-bold px-8 py-3 rounded-full hover:bg-yellow-400 hover:shadow-lg transition-all"
      >
        Back to Home
      </Link>
    </div>
  );
}
