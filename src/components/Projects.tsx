/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Project, FundTransaction } from '../types';
import { 
  Wrench, 
  Plus, 
  Trash2, 
  Edit2, 
  CheckSquare, 
  TrendingUp, 
  BadgeCent, 
  Sliders, 
  Coins, 
  MapPin, 
  CalendarClock, 
  CircleDollarSign,
  UserCheck
} from 'lucide-react';
import { MANAGERS, VILLAGES, generateId } from '../data';

interface ProjectsProps {
  projects: Project[];
  onAddProject: (project: Project) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onSettleProfitToQuỹ: (amount: number, desc: string) => void;
}

export default function Projects({
  projects,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onSettleProfitToQuỹ,
}: ProjectsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Form project builder states
  const [editingProjId, setEditingProjId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [assignee, setAssignee] = useState(MANAGERS[0]);
  const [value, setValue] = useState('');
  const [cost, setCost] = useState('');
  const [status, setStatus] = useState<Project['status']>('Khảo sát');
  const [deadline, setDeadline] = useState('');

  // Settle States
  const [settleDestination, setSettleDestination] = useState<'quy_to' | 'khac'>('quy_to');
  const [settlePercentage, setSettlePercentage] = useState<30 | 50 | 100>(30);
  const [settleCustomNotes, setSettleCustomNotes] = useState('');

  const openFormModal = (p: Project | null = null) => {
    setFormError('');
    if (p) {
      setEditingProjId(p.id);
      setName(p.name || '');
      setClient(p.client || '');
      setAssignee(p.assignee || MANAGERS[0]);
      setValue(String(p.value || ''));
      setCost(String(p.cost || ''));
      setStatus(p.status || 'Khảo sát');
      setDeadline(p.deadline || '');
    } else {
      setEditingProjId(null);
      setName('');
      setClient('');
      setAssignee(MANAGERS[0]);
      setValue('');
      setCost('');
      setStatus('Khảo sát');
      setDeadline('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!name.trim()) return setFormError('Hãy nhập tên dự án công trình!');
    const price = Number(value) || 0;
    const spent = Number(cost) || 0;

    const payload: Project = {
      id: editingProjId || generateId(),
      name: name.trim(),
      client: client.trim(),
      assignee,
      value: price,
      cost: spent,
      status,
      deadline,
      createdAt: editingProjId 
        ? (projects.find(x => x.id === editingProjId)?.createdAt || Date.now()) 
        : Date.now()
    };

    if (editingProjId) {
      onUpdateProject(payload);
    } else {
      onAddProject(payload);
    }
    setIsModalOpen(false);
  };

  const handleOpenSettle = (p: Project) => {
    setFormError('');
    setSelectedProject(p);
    setSettleDestination('quy_to');
    setSettlePercentage(30);
    setSettleCustomNotes('');
    setIsSettleModalOpen(true);
  };

  const handleConfirmSettle = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!selectedProject) return;

    const profit = selectedProject.value - selectedProject.cost;
    if (profit <= 0) {
      setFormError('Dự án này lỗ hoặc không có thặng dư lợi nhuận để trích quy.');
      return;
    } else if (settleDestination === 'quy_to') {
      const shareAmount = Math.round((profit * settlePercentage) / 100);
      const logMessage = `Trích nộp ${settlePercentage}% lợi nhuận thi công hệ thống PCCC: ${selectedProject.name}`;
      onSettleProfitToQuỹ(shareAmount, logMessage);
    }

    // Set project completed (Đã kết toán) Status
    onUpdateProject({
      ...selectedProject,
      status: 'Đã kết toán'
    });

    setIsSettleModalOpen(false);
    setSelectedProject(null);
    // Remove alert entirely, or we could add a success state but silent is fine too.
  };

  return (
    <div className="space-y-4">
      {/* Tab Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Wrench className="h-5 w-5 text-indigo-400" />
            Quản Lý Dự Án Lắp Đặt & Thi Công Ngoài
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ghi chép dự án kinh tế ngoài, tư vấn lắp đặt hộc tủ, bình khí, kiểm định vạn năng.
          </p>
        </div>

        <button
          onClick={() => openFormModal()}
          className="self-start sm:self-auto px-4 py-2 bg-indigo-700 hover:bg-indigo-650 text-white rounded-lg text-xs md:text-sm font-bold flex items-center gap-1.5 shadow"
        >
          <Plus className="h-4 w-4" />
          <span>Khai Báo Công Trình</span>
        </button>
      </div>

      {/* Projects Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((p, idx) => {
          const profit = p.value - p.cost;
          
          let stateColor = 'bg-slate-950 text-slate-400 border-slate-800';
          if (p.status === 'Khảo sát') stateColor = 'bg-blue-950/40 text-blue-400 border-blue-900/40';
          else if (p.status === 'Thi công') stateColor = 'bg-orange-950/40 text-orange-400 border-orange-900/40';
          else if (p.status === 'Nghiệm thu') stateColor = 'bg-yellow-950/40 text-yellow-500 border-yellow-904/30';
          else if (p.status === 'Đã kết toán') stateColor = 'bg-emerald-900/10 text-emerald-400 border-emerald-900/20';

          return (
            <div 
              key={`${p.id}-${idx}`} 
              className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between hover:border-slate-750 transition-colors"
            >
              {/* Card Upper */}
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-sm text-slate-100 leading-snug w-2/3">
                    {p.name}
                  </h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${stateColor}`}>
                    {p.status}
                  </span>
                </div>

                <div className="text-xs text-slate-400 space-y-1 pt-1 font-semibold">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-500" />
                    <span>CĐT: {p.client || 'Chưa định danh'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 font-bold">
                    <UserCheck className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-blue-400">Đồng chí phụ trách: {p.assignee}</span>
                  </div>
                </div>

                {/* Economic Figures ledger sheet inside card */}
                <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-850 text-xs mt-3 select-none">
                  <div>
                    <span className="text-[10px] text-slate-500 block">GIÁ THU CĐT</span>
                    <span className="font-bold text-slate-350">{new Intl.NumberFormat('vi-VN').format(p.value)} ₫</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">GIÁ CỐT CHỊ</span>
                    <span className="font-bold text-slate-350">{new Intl.NumberFormat('vi-VN').format(p.cost)} ₫</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">LỢI NHUẬN</span>
                    <span className={`font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {new Intl.NumberFormat('vi-VN').format(profit)} ₫
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Action Drawer Footer */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-850 text-xs">
                <span className="text-slate-400 font-mono text-[10px] flex items-center gap-1">
                  <CalendarClock className="h-3.5 w-3.5 text-slate-500" />
                  Hẹn: {p.deadline ? new Date(p.deadline).toLocaleDateString('vi-VN') : 'Không hạn'}
                </span>

                <div className="flex items-center gap-1.5">
                  {p.status === 'Nghiệm thu' && (
                    <button
                      onClick={() => handleOpenSettle(p)}
                      className="px-2.5 py-1.5 bg-emerald-700/90 hover:bg-emerald-650 text-white font-bold rounded text-[11px] flex items-center gap-1 transition shadow-sm"
                    >
                      <Coins className="h-3.5 w-3.5" />
                      Kết Toán Quỹ
                    </button>
                  )}
                  
                  <button
                    onClick={() => openFormModal(p)}
                    className="p-1.5 text-slate-400 hover:text-blue-400 rounded transition"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (deleteConfirmId === p.id) {
                        onDeleteProject(p.id);
                        setDeleteConfirmId(null);
                      } else {
                        setDeleteConfirmId(p.id);
                        setTimeout(() => setDeleteConfirmId(null), 3000);
                      }
                    }}
                    className={`p-1.5 rounded transition ${
                      deleteConfirmId === p.id
                        ? 'bg-rose-500 text-white hover:bg-rose-600'
                        : 'text-slate-500 hover:text-rose-450'
                    }`}
                  >
                    {deleteConfirmId === p.id ? (
                      <span className="text-[10px] font-bold">Xóa?</span>
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-16 text-slate-500 bg-slate-900/20 border border-dashed border-slate-850 rounded-xl italic">
          Chưa khai báo dự án thi công thiết bị cứu chữa cháy nào.
        </div>
      )}

      {/* DETAILED PROJECT FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 text-slate-300 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3.5 mb-3.5">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <Wrench className="h-4.5 w-4.5 text-indigo-400" />
                {editingProjId ? 'Cập Nhật Dự Án' : 'Khai Báo Công Trình Thi Công Mới'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-350 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-405 mb-1 font-sans">Tên công trình thi công (*)</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-xs md:text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="Ví dụ: Lắp họng tủ PCCC sảnh chính"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-405 mb-1">Chủ đầu tư / Địa chỉ</label>
                  <input
                    type="text"
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs focus:outline-none"
                    placeholder="Chị Hoa Chợ Bình Tuyền..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-405 mb-1">Cán bộ phụ trách chính</label>
                  <select
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs focus:outline-none text-blue-300 font-bold cursor-pointer"
                  >
                    {MANAGERS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-850">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Giá Hợp Đồng (₫)</label>
                  <input
                    type="number"
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs font-mono font-bold text-emerald-400 focus:outline-none"
                    placeholder="25000000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Giá Vốn/Chi Phí Vật Tư (₫)</label>
                  <input
                    type="number"
                    required
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs font-mono font-bold text-rose-400 focus:outline-none"
                    placeholder="18000000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-450 mb-1">Tiến trình</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="Khảo sát">Đang Khảo Sát thiết bị</option>
                    <option value="Thi công">Đang lắp ráp thi công</option>
                    <option value="Nghiệm thu">Đã hoàn tất / Nghiệm thu</option>
                    <option value="Đã kết toán">Đoàn đã kết toán quỹ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-450 mb-1">Dự kiến xong</label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs focus:outline-none text-slate-350"
                  />
                </div>
              </div>

              {formError && (
                <div className="bg-rose-950/40 border border-rose-900 text-rose-400 p-2 rounded text-xs font-semibold text-center">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2 px-4 border border-slate-850 text-xs text-slate-500 hover:text-slate-300"
                >
                  Huỷ bỏ
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-indigo-700 hover:bg-indigo-650 text-white text-xs font-bold shadow"
                >
                  Lưu Ghi Nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROFIT SETTLEMENT CONVERSUION SHEET DIALOG */}
      {isSettleModalOpen && selectedProject && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-850 rounded-xl max-w-sm w-full p-5 text-slate-300 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3 mb-3.5">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <CircleDollarSign className="h-4.5 w-4.5 text-emerald-400" />
                Duyệt Quyết Toán Lợi Nhuận
              </h3>
              <button 
                onClick={() => {
                  setIsSettleModalOpen(false);
                  setSelectedProject(null);
                }}
                className="text-slate-500 hover:text-slate-350 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmSettle} className="space-y-4">
              <div className="bg-emerald-950/20 border border-emerald-900/30 p-3.5 rounded-lg text-center select-none space-y-1">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
                  Tổng thặng dư sau hao hụt vật tư
                </span>
                <span className="text-xl font-extrabold text-emerald-400 block font-mono">
                  {new Intl.NumberFormat('vi-VN').format(selectedProject.value - selectedProject.cost)} ₫
                </span>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400">Điều phối lợi nhuận:</label>
                
                <div className="space-y-2">
                  <label className="flex items-center p-2.5 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      name="settle_dest"
                      value="quy_to"
                      checked={settleDestination === 'quy_to'}
                      onChange={() => setSettleDestination('quy_to')}
                      className="text-emerald-500 h-4 w-4 bg-slate-900 border-slate-700 focus:ring-emerald-500"
                    />
                    <span className="ml-2 font-bold text-xs text-slate-300">
                      Trích nộp nộp nộp vào Quỹ Tổ
                    </span>
                  </label>

                  <label className="flex items-center p-2.5 bg-slate-950 border border-slate-805 rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      name="settle_dest"
                      value="khac"
                      checked={settleDestination === 'khac'}
                      onChange={() => setSettleDestination('khac')}
                      className="text-slate-600 h-4 w-4 bg-slate-900 border-slate-700 focus:ring-slate-500"
                    />
                    <span className="ml-2 font-semibold text-xs text-slate-400">
                      Chia ngoài hoặc giải ngân khác
                    </span>
                  </label>
                </div>
              </div>

              {settleDestination === 'quy_to' ? (
                <div className="space-y-1.5 transition-all">
                  <label className="block text-xs font-bold text-slate-400">Hạn mức chia nộp:</label>
                  <div className="flex gap-2">
                    {[30, 50, 100].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setSettlePercentage(pct as any)}
                        className={`flex-1 py-1.5 rounded text-xs font-bold border transition ${
                          settlePercentage === pct
                            ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400'
                            : 'bg-transparent border-slate-800 text-slate-500'
                        }`}
                      >
                        {pct === 30 ? '30% (Khuyến nghị)' : `${pct}%`}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 italic leading-snug pt-1">
                    Nộp nợ: {new Intl.NumberFormat('vi-VN').format(Math.round(((selectedProject.value - selectedProject.cost) * settlePercentage) / 100))} ₫ nộp tài khoản đồng quỹ.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 transition-all">
                  <label className="block text-xs font-bold text-slate-400">Ghi chú cụ thể</label>
                  <input
                    type="text"
                    value={settleCustomNotes}
                    onChange={(e) => setSettleCustomNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs focus:outline-none"
                    placeholder="Giải ngân chi liên hoan, chia hoa hồng..."
                  />
                </div>
              )}

              {formError && (
                <div className="bg-rose-950/40 border border-rose-900 text-rose-400 p-2 rounded text-xs font-semibold text-center">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-650 text-white font-bold rounded-lg text-xs mt-2 shadow"
              >
                Xác Nhận Settle Quyết Toán
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
