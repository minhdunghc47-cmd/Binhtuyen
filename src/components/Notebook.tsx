/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BookOpen, Link, Save, HelpCircle, AlertCircle } from 'lucide-react';

export default function Notebook() {
  const [notebookUrl, setNotebookUrl] = useState<string>('');
  const [inputUrl, setInputUrl] = useState<string>('');
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    const savedUrl = localStorage.getItem('pccc_notebooklm_url');
    if (savedUrl) {
      setNotebookUrl(savedUrl);
      setInputUrl(savedUrl);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    let url = inputUrl.trim();
    if (url && !/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    
    localStorage.setItem('pccc_notebooklm_url', url);
    setNotebookUrl(url);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
      {/* Header Banner */}
      <div className="bg-[#0e1424] border border-slate-900 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0 select-none">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-400">
            <BookOpen className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-bold text-slate-100 uppercase tracking-wide">
              Sổ Tay Nghiệp Vụ & Tài Liệu NotebookLM
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Đồng bộ dữ liệu tài liệu huấn luyện, thông tư quy chuẩn PCCC từ Google NotebookLM.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <HelpCircle className="h-4 w-4 text-purple-400" />
            <span>Hướng dẫn liên kết</span>
          </button>
        </div>
      </div>

      {/* Guide Section */}
      {showGuide && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 text-xs text-slate-350 space-y-3 flex-shrink-0">
          <h4 className="font-bold text-slate-100 flex items-center gap-1">
            <HelpCircle className="h-4 w-4 text-purple-400" />
            Cách liên kết NotebookLM của đồng chí vào ứng dụng này:
          </h4>
          <ol className="list-decimal pl-5 space-y-1.5 leading-relaxed">
            <li>Truy cập vào <a href="https://notebooklm.google.com/" target="_blank" rel="noreferrer" className="text-purple-400 hover:underline">Google NotebookLM</a> và mở Notebook chứa tài liệu PCCC của đồng chí.</li>
            <li>Nhấn vào biểu tượng <b>Chia sẻ (Share)</b> ở góc trên bên phải trang web NotebookLM.</li>
            <li>Bật chế độ chia sẻ liên kết (đảm bảo quyền truy cập ở chế độ Người xem hoặc Công khai) và <b>Sao chép liên kết (Copy Link)</b>.</li>
            <li>Dán liên kết vừa sao chép vào hộp nhập liệu cấu hình bên dưới và nhấn <b>Lưu liên kết</b>.</li>
          </ol>
          <div className="bg-amber-950/20 border border-amber-900/30 p-2.5 rounded text-[11px] text-amber-400 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span><b>Lưu ý bảo mật:</b> Link NotebookLM chỉ được lưu trữ cục bộ trong trình duyệt của thiết bị này thông qua LocalStorage, không được gửi đi bất kỳ máy chủ bên thứ ba nào khác.</span>
          </div>
        </div>
      )}

      {/* URL Config Form (Show always or when empty) */}
      {(!notebookUrl || showGuide) && (
        <form onSubmit={handleSave} className="bg-slate-900/40 border border-slate-850 rounded-xl p-4 flex-shrink-0">
          <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide flex items-center gap-1.5">
            <Link className="h-3.5 w-3.5 text-purple-400" />
            Liên kết NotebookLM của đồng chí
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:border-purple-500 focus:outline-none placeholder-slate-600 font-mono"
              placeholder="https://notebooklm.google.com/notebook/..."
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-purple-700 hover:bg-purple-650 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition-colors flex-shrink-0"
            >
              <Save className="h-4 w-4" />
              <span>{isSaved ? 'Đã lưu ✓' : 'Lưu liên kết'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Main Content Workspace Frame */}
      <div className="flex-1 min-h-[400px] bg-slate-950/80 border border-slate-900 rounded-xl overflow-hidden relative">
        {notebookUrl ? (
          <iframe
            src={notebookUrl}
            title="NotebookLM Workspace"
            className="w-full h-full border-none"
            allow="clipboard-read; clipboard-write; camera; microphone"
          ></iframe>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center select-none space-y-4">
            <div className="h-16 w-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-500 shadow-inner">
              <BookOpen className="h-8 w-8" />
            </div>
            <div className="max-w-md">
              <h3 className="text-slate-350 font-bold mb-1">Chưa liên kết Sổ tay nghiệp vụ</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Đồng chí chưa liên kết sổ tay tài liệu từ Google NotebookLM. Vui lòng bấm vào nút <b>"Hướng dẫn liên kết"</b> ở góc trên để liên kết và sử dụng tài liệu PCCC của đồng chí.
              </p>
            </div>
            <button
              onClick={() => setShowGuide(true)}
              className="px-4 py-2 bg-purple-950/50 border border-purple-900/60 hover:bg-purple-900/50 text-purple-400 hover:text-purple-300 rounded-lg text-xs font-bold transition"
            >
              Bắt đầu thiết lập
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
