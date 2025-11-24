'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [message, setMessage] = useState<string>('กำลังเชื่อมต่อ...');

  useEffect(() => {
    fetch('http://localhost:8080/api/hello') 
      .then((res) => {
        if (!res.ok) throw new Error('Network error');
        return res.text();
      })
      .then((data) => setMessage(data))
      .catch((err) => {
        console.error(err);
        setMessage('เชื่อมต่อ Backend ไม่ได้ (เปิด Server หรือยัง?)');
      });
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full">
        <h1 className="text-2xl font-bold text-blue-600 mb-4">
          Next.js + Spring Boot
        </h1>
        
        <div className="text-left bg-slate-50 p-4 rounded border border-slate-200">
          <p className="text-xs text-gray-500 mb-1">Status</p>
          <p className="text-lg font-mono text-green-700">
            {message}
          </p>
        </div>

      </div>
    </div>
  );
}