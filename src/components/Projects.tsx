/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Project, FundTransaction, SettlementStatus, SettlementStage } from '../types';
import { 
  Wrench, 
  Plus, 
  Trash2, 
  Edit2, 
  TrendingUp, 
  Coins, 
  MapPin, 
  CalendarClock, 
  CircleDollarSign,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Building2,
  Layers,
  ArrowRight,
  Receipt,
  List,
  LayoutGrid
} from 'lucide-react';
import { MANAGERS, generateId } from '../data';

// Helper to determine settlement status with backward compatibility
export function getSettlementStatus(p: Project): SettlementStatus {
  if (p.settlementStatus) return p.settlementStatus;
  if (p.status === 'Đã kết toán') return 'da_ket_toan';
  if (p.settlementHistory && p.settlementHistory.length > 0) return 'dang_ket_toan';
  return 'chua_ket_toan';
}

// Helper to get total settled amount from history
export function getTotalSettled(p: Project): number {
  if (!p.settlementHistory || p.settlementHistory.length === 0) return 0;
  return p.settlementHistory.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
}

interface ProjectsProps {
  projects: Project[];
  onAddProject: (project: Project) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onSettleProfitToQuỹ: (amount: number, desc: string, customId?: string) => string;
  onDeleteTransaction?: (id: string) => void;
}

export default function Projects({
  projects,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onSettleProfitToQuỹ,
  onDeleteTransaction,
}: ProjectsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteStageConfirmId, setDeleteStageConfirmId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Filter, View & Search states
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filterSettlement, setFilterSettlement] = useState<'all' | SettlementStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form project builder states
  const [editingProjId, setEditingProjId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [assignee, setAssignee] = useState(MANAGERS[0]);
  const [value, setValue] = useState('');
  const [cost, setCost] = useState('');
  const [status, setStatus] = useState<Project['status']>('Khảo sát');
  const [settlementStatusForm, setSettlementStatusForm] = useState<SettlementStatus>('chua_ket_toan');
  const [deadline, setDeadline] = useState('');

  // Stage Form States for Settlement Modal
  const [stageName, setStageName] = useState('');
  const [stageAmount, setStageAmount] = useState('');
  const [stageDate, setStageDate] = useState(new Date().toISOString().slice(0, 10));
  const [stageDestination, setStageDestination] = useState<'quy_to' | 'khac'>('quy_to');
  const [stageNotes, setStageNotes] = useState('');
  const [markAsFullySettled, setMarkAsFullySettled] = useState(false);
  const [stageFormError, setStageFormError] = useState('');

  // Selected project reference (always synced with latest projects array)
  const currentProject = projects.find(p => p.id === selectedProjectId) || null;

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
      setSettlementStatusForm(getSettlementStatus(p));
      setDeadline(p.deadline || '');
    } else {
      setEditingProjId(null);
      setName('');
      setClient('');
      setAssignee(MANAGERS[0]);
      setValue('');
      setCost('');
      setStatus('Khảo sát');
      setSettlementStatusForm('chua_ket_toan');
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

    const existing = projects.find(x => x.id === editingProjId);

    const payload: Project = {
      id: editingProjId || generateId(),
      name: name.trim(),
      client: client.trim(),
      assignee,
      value: price,
      cost: spent,
      status,
      settlementStatus: settlementStatusForm,
      settlementHistory: existing?.settlementHistory || [],
      deadline,
      createdAt: editingProjId 
        ? (existing?.createdAt || Date.now()) 
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
    setStageFormError('');
    setSelectedProjectId(p.id);
    const existingHistory = p.settlementHistory || [];
    const nextStageNum = existingHistory.length + 1;
    setStageName(`Đợt ${nextStageNum} - `);
    setStageAmount('');
    setStageDate(new Date().toISOString().slice(0, 10));
    setStageDestination('quy_to');
    setStageNotes('');
    setMarkAsFullySettled(false);
    setIsSettleModalOpen(true);
  };

  const handleAddSettlementStage = (e: React.FormEvent) => {
    e.preventDefault();
    setStageFormError('');
    if (!currentProject) return;

    const amountNum = Number(stageAmount);
    if (!amountNum || amountNum <= 0) {
      return setStageFormError('Vui lòng nhập số tiền chi kết toán hợp lệ (> 0đ)!');
    }

    if (!stageName.trim()) {
      return setStageFormError('Vui lòng nhập tên giai đoạn / đợt chi kết toán!');
    }

    let fundTransId: string | undefined = undefined;
    if (stageDestination === 'quy_to') {
      const logMessage = `Trích nộp ${stageName.trim()} dự án: ${currentProject.name}`;
      fundTransId = onSettleProfitToQuỹ(amountNum, logMessage);
    }

    const newStage: SettlementStage = {
      id: generateId(),
      stageName: stageName.trim(),
      amount: amountNum,
      destination: stageDestination,
      date: stageDate || new Date().toISOString().slice(0, 10),
      notes: stageNotes.trim(),
      fundTransactionId: fundTransId,
      createdAt: Date.now()
    };

    const updatedHistory = [...(currentProject.settlementHistory || []), newStage];
    const newSettlementStatus: SettlementStatus = markAsFullySettled ? 'da_ket_toan' : 'dang_ket_toan';

    onUpdateProject({
      ...currentProject,
      settlementStatus: newSettlementStatus,
      status: markAsFullySettled ? 'Đã kết toán' : currentProject.status,
      settlementHistory: updatedHistory
    });

    // Reset stage form for next entry
    const nextNum = updatedHistory.length + 1;
    setStageName(`Đợt ${nextNum} - `);
    setStageAmount('');
    setStageNotes('');
    setMarkAsFullySettled(false);
  };

  const handleDeleteStage = (stage: SettlementStage) => {
    if (!currentProject) return;

    // Remove fund transaction if it was submitted to quỹ tổ
    if (stage.fundTransactionId && onDeleteTransaction) {
      onDeleteTransaction(stage.fundTransactionId);
    }

    const updatedHistory = (currentProject.settlementHistory || []).filter(s => s.id !== stage.id);
    let newSettlementStatus = currentProject.settlementStatus;
    if (updatedHistory.length === 0) {
      newSettlementStatus = 'chua_ket_toan';
    } else if (newSettlementStatus === 'da_ket_toan') {
      newSettlementStatus = 'dang_ket_toan';
    }

    onUpdateProject({
      ...currentProject,
      settlementStatus: newSettlementStatus,
      settlementHistory: updatedHistory
    });
    setDeleteStageConfirmId(null);
  };

  const handleUpdateSettlementStatus = (newStatus: SettlementStatus) => {
    if (!currentProject) return;
    onUpdateProject({
      ...currentProject,
      settlementStatus: newStatus,
      status: newStatus === 'da_ket_toan' ? 'Đã kết toán' : (currentProject.status === 'Đã kết toán' ? 'Nghiệm thu' : currentProject.status)
    });
  };

  // Filter & Search Logic
  const filteredProjects = projects.filter(p => {
    const sStatus = getSettlementStatus(p);
    if (filterSettlement !== 'all' && sStatus !== filterSettlement) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (p.name || '').toLowerCase().includes(q);
      const matchClient = (p.client || '').toLowerCase().includes(q);
      const matchAssignee = (p.assignee || '').toLowerCase().includes(q);
      if (!matchName && !matchClient && !matchAssignee) return false;
    }
    return true;
  });

  // Aggregate Metrics
  const countChua = projects.filter(p => getSettlementStatus(p) === 'chua_ket_toan').length;
  const countDang = projects.filter(p => getSettlementStatus(p) === 'dang_ket_toan').length;
  const countDa = projects.filter(p => getSettlementStatus(p) === 'da_ket_toan').length;

  const totalContractValue = projects.reduce((sum, p) => sum + (p.value || 0), 0);
  const totalCost = projects.reduce((sum, p) => sum + (p.cost || 0), 0);
  const totalProfit = totalContractValue - totalCost;
  const totalSettledAll = projects.reduce((sum, p) => sum + getTotalSettled(p), 0);

  return (
    <div className="space-y-5">
      {/* Tab Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Wrench className="h-5 w-5 text-indigo-400" />
            Quản Lý Dự Án Lắp Đặt & Thi Công Ngoài
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ghi chép dự án kinh tế ngoài, theo dõi tiến độ thi công và trích chi kết toán quỹ theo từng giai đoạn.
          </p>
        </div>

        <button
          onClick={() => openFormModal()}
          className="self-start sm:self-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs md:text-sm font-bold flex items-center gap-1.5 shadow transition"
        >
          <Plus className="h-4 w-4" />
          <span>Khai Báo Công Trình Mới</span>
        </button>
      </div>

      {/* Top Ledger Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tổng Giá Thu CĐT</span>
          <div className="text-base sm:text-lg font-bold text-slate-100 font-mono">
            {new Intl.NumberFormat('vi-VN').format(totalContractValue)} ₫
          </div>
          <span className="text-[10px] text-slate-500">{projects.length} công trình đã khai báo</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tổng Chi Phí Vật Tư</span>
          <div className="text-base sm:text-lg font-bold text-rose-400 font-mono">
            {new Intl.NumberFormat('vi-VN').format(totalCost)} ₫
          </div>
          <span className="text-[10px] text-slate-500">Giá vốn thiết bị & nhân công</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tổng Lợi Nhuận Dự Kiến</span>
          <div className="text-base sm:text-lg font-bold text-emerald-400 font-mono">
            {new Intl.NumberFormat('vi-VN').format(totalProfit)} ₫
          </div>
          <span className="text-[10px] text-slate-500">Chênh lệch sau vật tư</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider flex items-center gap-1">
            <Coins className="h-3 w-3" />
            Đã Chi Kết Toán Quỹ
          </span>
          <div className="text-base sm:text-lg font-bold text-indigo-300 font-mono">
            {new Intl.NumberFormat('vi-VN').format(totalSettledAll)} ₫
          </div>
          <span className="text-[10px] text-slate-400">
            {countDa} đã xong • {countDang} đang chi
          </span>
        </div>
      </div>

      {/* Filter and Search Navigation Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
        {/* Settlement Status Filter Tabs */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterSettlement('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              filterSettlement === 'all'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span>Tất cả</span>
            <span className="px-1.5 py-0.2 bg-slate-950/60 rounded text-[10px] text-slate-300">{projects.length}</span>
          </button>

          <button
            onClick={() => setFilterSettlement('chua_ket_toan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              filterSettlement === 'chua_ket_toan'
                ? 'bg-rose-950/50 text-rose-300 border border-rose-800/60 shadow-sm'
                : 'text-slate-400 hover:text-rose-300 hover:bg-rose-950/20'
            }`}
          >
            <Clock className="h-3 w-3 text-rose-400" />
            <span>Chưa kết toán</span>
            <span className="px-1.5 py-0.2 bg-rose-950/70 rounded text-[10px] text-rose-300">{countChua}</span>
          </button>

          <button
            onClick={() => setFilterSettlement('dang_ket_toan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              filterSettlement === 'dang_ket_toan'
                ? 'bg-amber-950/50 text-amber-300 border border-amber-800/60 shadow-sm'
                : 'text-slate-400 hover:text-amber-300 hover:bg-amber-950/20'
            }`}
          >
            <TrendingUp className="h-3 w-3 text-amber-400" />
            <span>Đang kết toán</span>
            <span className="px-1.5 py-0.2 bg-amber-950/70 rounded text-[10px] text-amber-300">{countDang}</span>
          </button>

          <button
            onClick={() => setFilterSettlement('da_ket_toan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              filterSettlement === 'da_ket_toan'
                ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/60 shadow-sm'
                : 'text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/20'
            }`}
          >
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            <span>Đã kết toán</span>
            <span className="px-1.5 py-0.2 bg-emerald-950/70 rounded text-[10px] text-emerald-300">{countDa}</span>
          </button>
        </div>

        {/* Search input & View Mode Switcher */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên công trình, CĐT..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-500"
            />
          </div>

          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-2 py-1 rounded transition flex items-center gap-1 text-xs font-bold ${
                viewMode === 'list'
                  ? 'bg-slate-800 text-indigo-300 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Xem dạng danh sách gọn gàng"
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Danh sách</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-2 py-1 rounded transition flex items-center gap-1 text-xs font-bold ${
                viewMode === 'grid'
                  ? 'bg-slate-800 text-indigo-300 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Xem dạng thẻ"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Thẻ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Projects Display: List View vs Grid Cards */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-16 text-slate-500 bg-slate-900/20 border border-dashed border-slate-800 rounded-xl italic">
          Không tìm thấy công trình thi công nào phù hợp với bộ lọc.
        </div>
      ) : viewMode === 'list' ? (
        /* GIAO DIỆN DẠNG DANH SÁCH GỌN GÀNG */
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-xs md:text-sm">
              <thead>
                <tr className="bg-slate-950/40 text-slate-400 text-left">
                  <th className="px-4 py-3 font-semibold">Tên công trình & Chủ đầu tư</th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap">Cán bộ PT</th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap">Tiến trình</th>
                  <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Giá HĐ / Lợi nhuận</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Kết toán quỹ</th>
                  <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-transparent">
                {filteredProjects.map((p, idx) => {
                  const profit = p.value - p.cost;
                  const totalSettled = getTotalSettled(p);
                  const stageCount = p.settlementHistory?.length || 0;
                  const sStatus = getSettlementStatus(p);

                  // Work Progress state color
                  let progressColor = 'bg-slate-950 text-slate-400 border-slate-800';
                  if (p.status === 'Khảo sát') progressColor = 'bg-blue-950/40 text-blue-400 border-blue-900/40';
                  else if (p.status === 'Thi công') progressColor = 'bg-orange-950/40 text-orange-400 border-orange-900/40';
                  else if (p.status === 'Nghiệm thu') progressColor = 'bg-yellow-950/40 text-yellow-500 border-yellow-900/30';
                  else if (p.status === 'Đã kết toán') progressColor = 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30';

                  // Settlement Badge
                  let settleBadge = (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-slate-950 text-slate-400 border-slate-800 flex items-center gap-1 w-fit">
                      <Clock className="h-3 w-3 text-slate-500" />
                      Chưa kết toán
                    </span>
                  );

                  if (sStatus === 'dang_ket_toan') {
                    settleBadge = (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-amber-950/40 text-amber-400 border-amber-800/40 flex items-center gap-1 w-fit">
                        <TrendingUp className="h-3 w-3 text-amber-400" />
                        Đang kết toán ({stageCount} đợt)
                      </span>
                    );
                  } else if (sStatus === 'da_ket_toan') {
                    settleBadge = (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-emerald-950/40 text-emerald-400 border-emerald-800/40 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        Đã kết toán {stageCount > 0 ? `(${stageCount} đợt)` : ''}
                      </span>
                    );
                  }

                  const pctSettled = profit > 0 ? Math.min(100, Math.round((totalSettled / profit) * 100)) : 0;

                  return (
                    <tr key={`${p.id}-${idx}`} className="hover:bg-slate-800/30 transition-colors">
                      {/* Name & Client */}
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-100 block text-xs md:text-sm leading-snug">
                            {p.name}
                          </span>
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-slate-500" />
                              CĐT: <strong className="text-slate-300 font-normal">{p.client || 'Chưa định danh'}</strong>
                            </span>
                            {p.deadline && (
                              <span className="flex items-center gap-1 font-mono text-slate-500 text-[10px]">
                                <CalendarClock className="h-3 w-3 text-slate-500" />
                                Hẹn: {new Date(p.deadline).toLocaleDateString('vi-VN')}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Assignee */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-md text-[11px] font-semibold bg-blue-950/40 text-blue-300 border border-blue-900/30 flex items-center gap-1 w-fit">
                          <UserCheck className="h-3 w-3 text-blue-400" />
                          {p.assignee}
                        </span>
                      </td>

                      {/* Work Status */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${progressColor}`}>
                          {p.status}
                        </span>
                      </td>

                      {/* Financial Figures */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="font-mono text-xs">
                          <div className="text-slate-200 font-bold">
                            {new Intl.NumberFormat('vi-VN').format(p.value)} ₫
                          </div>
                          <div className={`text-[11px] font-semibold ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            Lãi: {new Intl.NumberFormat('vi-VN').format(profit)} ₫
                          </div>
                        </div>
                      </td>

                      {/* Settlement Status & Progress */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="space-y-1 min-w-[140px]">
                          {settleBadge}
                          {totalSettled > 0 ? (
                            <div className="space-y-0.5">
                              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                                <span>Chi: {new Intl.NumberFormat('vi-VN').format(totalSettled)} ₫</span>
                                <span>{pctSettled}%</span>
                              </div>
                              <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${sStatus === 'da_ket_toan' ? 'bg-emerald-500' : 'bg-amber-400'}`}
                                  style={{ width: `${Math.min(100, pctSettled)}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 block">Chưa trích quỹ</span>
                          )}
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenSettle(p)}
                            className={`px-2.5 py-1 font-bold rounded text-[11px] flex items-center gap-1 transition shadow-sm ${
                              sStatus === 'da_ket_toan'
                                ? 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60'
                                : sStatus === 'dang_ket_toan'
                                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                            }`}
                            title="Mở sổ kết toán quỹ"
                          >
                            <Coins className="h-3 w-3" />
                            <span>{sStatus === 'da_ket_toan' ? 'Sổ KT' : sStatus === 'dang_ket_toan' ? `Đợt ${stageCount + 1}` : 'Kết toán'}</span>
                          </button>

                          <button
                            onClick={() => openFormModal(p)}
                            title="Chỉnh sửa công trình"
                            className="p-1.5 text-slate-400 hover:text-blue-400 rounded hover:bg-slate-800 transition"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
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
                            title="Xóa công trình"
                            className={`p-1.5 rounded transition ${
                              deleteConfirmId === p.id
                                ? 'bg-rose-500 text-white hover:bg-rose-600'
                                : 'text-slate-500 hover:text-rose-400 hover:bg-slate-800'
                            }`}
                          >
                            {deleteConfirmId === p.id ? (
                              <span className="text-[10px] font-bold">Xóa?</span>
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GIAO DIỆN DẠNG THẺ (GRID CARDS) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((p, idx) => {
            const profit = p.value - p.cost;
            const totalSettled = getTotalSettled(p);
            const stageCount = p.settlementHistory?.length || 0;
            const sStatus = getSettlementStatus(p);

            // Work Progress state color
            let progressColor = 'bg-slate-950 text-slate-400 border-slate-800';
            if (p.status === 'Khảo sát') progressColor = 'bg-blue-950/40 text-blue-400 border-blue-900/40';
            else if (p.status === 'Thi công') progressColor = 'bg-orange-950/40 text-orange-400 border-orange-900/40';
            else if (p.status === 'Nghiệm thu') progressColor = 'bg-yellow-950/40 text-yellow-500 border-yellow-900/30';
            else if (p.status === 'Đã kết toán') progressColor = 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30';

            // Settlement Status Badge styling
            let settleBadge = (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-slate-950 text-slate-400 border-slate-800 flex items-center gap-1">
                <Clock className="h-3 w-3 text-slate-500" />
                Chưa kết toán
              </span>
            );

            if (sStatus === 'dang_ket_toan') {
              settleBadge = (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-amber-950/40 text-amber-400 border-amber-800/40 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-amber-400" />
                  Đang kết toán ({stageCount} đợt)
                </span>
              );
            } else if (sStatus === 'da_ket_toan') {
              settleBadge = (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-emerald-950/40 text-emerald-400 border-emerald-800/40 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  Đã kết toán {stageCount > 0 ? `(${stageCount} đợt)` : ''}
                </span>
              );
            }

            // Progress percentage
            const pctSettled = profit > 0 ? Math.min(100, Math.round((totalSettled / profit) * 100)) : 0;

            return (
              <div 
                key={`${p.id}-${idx}`} 
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between hover:border-slate-700 transition-colors shadow-sm"
              >
                {/* Card Upper */}
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-sm text-slate-100 leading-snug">
                      {p.name}
                    </h3>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${progressColor}`}>
                        {p.status}
                      </span>
                      {settleBadge}
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1 font-semibold">
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
                  <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-850 text-xs select-none">
                    <div>
                      <span className="text-[10px] text-slate-500 block">GIÁ THU CĐT</span>
                      <span className="font-bold text-slate-300">{new Intl.NumberFormat('vi-VN').format(p.value)} ₫</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">GIÁ CỐT CHI</span>
                      <span className="font-bold text-slate-300">{new Intl.NumberFormat('vi-VN').format(p.cost)} ₫</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">LỢI NHUẬN</span>
                      <span className={`font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {new Intl.NumberFormat('vi-VN').format(profit)} ₫
                      </span>
                    </div>
                  </div>

                  {/* Settlement Stage Visual Ledger Progress */}
                  <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-850/80 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1 font-semibold">
                        <Coins className="h-3.5 w-3.5 text-indigo-400" />
                        Chi kết toán quỹ:
                      </span>
                      <span className="font-mono font-bold text-indigo-300">
                        {new Intl.NumberFormat('vi-VN').format(totalSettled)} ₫ 
                        {profit > 0 && <span className="text-slate-500 font-normal ml-1">({pctSettled}%)</span>}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          sStatus === 'da_ket_toan' 
                            ? 'bg-emerald-500' 
                            : sStatus === 'dang_ket_toan' 
                              ? 'bg-amber-400' 
                              : 'bg-slate-600'
                        }`}
                        style={{ width: `${Math.min(100, pctSettled)}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-500 pt-0.5">
                      <span>{stageCount} giai đoạn đã chi</span>
                      <span>
                        {profit - totalSettled > 0 ? (
                          <>Còn lại: <strong className="text-slate-400 font-mono">{new Intl.NumberFormat('vi-VN').format(profit - totalSettled)} ₫</strong></>
                        ) : (
                          <span className="text-emerald-400 font-semibold">Đã kết toán đủ</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Drawer Footer */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-800/80 text-xs">
                  <span className="text-slate-400 font-mono text-[10px] flex items-center gap-1">
                    <CalendarClock className="h-3.5 w-3.5 text-slate-500" />
                    Hẹn: {p.deadline ? new Date(p.deadline).toLocaleDateString('vi-VN') : 'Không hạn'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Settlement Stage Action Button */}
                    <button
                      onClick={() => handleOpenSettle(p)}
                      className={`px-3 py-1.5 font-bold rounded text-[11px] flex items-center gap-1.5 transition shadow-sm ${
                        sStatus === 'da_ket_toan'
                          ? 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60'
                          : sStatus === 'dang_ket_toan'
                            ? 'bg-amber-600 hover:bg-amber-500 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      }`}
                    >
                      <Coins className="h-3.5 w-3.5" />
                      <span>
                        {sStatus === 'da_ket_toan'
                          ? 'Sổ Kết Toán'
                          : sStatus === 'dang_ket_toan'
                            ? `Tiếp Tục Kết Toán (Đợt ${stageCount + 1})`
                            : 'Chi Kết Toán Quỹ'}
                      </span>
                    </button>
                    
                    <button
                      onClick={() => openFormModal(p)}
                      title="Chỉnh sửa thông tin dự án"
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
                      title="Xóa dự án"
                      className={`p-1.5 rounded transition ${
                        deleteConfirmId === p.id
                          ? 'bg-rose-500 text-white hover:bg-rose-600'
                          : 'text-slate-500 hover:text-rose-400'
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
      )}

      {/* DETAILED PROJECT FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 text-slate-300 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3.5 mb-3.5">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <Wrench className="h-4.5 w-4.5 text-indigo-400" />
                {editingProjId ? 'Cập Nhật Dự Án' : 'Khai Báo Công Trình Thi Công Mới'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Tên công trình thi công (*)</label>
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
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Chủ đầu tư / Địa chỉ</label>
                  <input
                    type="text"
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs focus:outline-none"
                    placeholder="Chị Hoa Chợ Bình Tuyền..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Cán bộ phụ trách chính</label>
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

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Tiến trình thi công</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="Khảo sát">Đang Khảo Sát</option>
                    <option value="Thi công">Đang Thi Công</option>
                    <option value="Nghiệm thu">Đã Nghiệm Thu</option>
                    <option value="Đã kết toán">Đã Hoàn Tất</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Trạng thái kết toán</label>
                  <select
                    value={settlementStatusForm}
                    onChange={(e) => setSettlementStatusForm(e.target.value as SettlementStatus)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs focus:outline-none cursor-pointer font-semibold text-amber-300"
                  >
                    <option value="chua_ket_toan">Chưa kết toán</option>
                    <option value="dang_ket_toan">Đang kết toán (theo giai đoạn)</option>
                    <option value="da_ket_toan">Đã kết toán xong</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Hạn xong</label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs focus:outline-none text-slate-300"
                  />
                </div>
              </div>

              {formError && (
                <div className="bg-rose-950/40 border border-rose-900 text-rose-400 p-2 rounded text-xs font-semibold text-center">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2 px-4 border border-slate-800 rounded text-xs text-slate-400 hover:text-slate-200"
                >
                  Huỷ bỏ
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-indigo-600 hover:bg-indigo-500 rounded text-white text-xs font-bold shadow"
                >
                  Lưu Ghi Nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE MULTI-STAGE SETTLEMENT MODAL (SỔ KẾT TOÁN THEO GIAI ĐOẠN) */}
      {isSettleModalOpen && currentProject && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-5 sm:p-6 text-slate-300 shadow-2xl flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-3.5 mb-3.5">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Coins className="h-5 w-5 text-indigo-400" />
                  Sổ Kết Toán Quỹ Theo Từng Giai Đoạn
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Công trình: <strong className="text-slate-200">{currentProject.name}</strong> • CĐT: {currentProject.client}
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsSettleModalOpen(false);
                  setSelectedProjectId(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 text-lg transition"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="overflow-y-auto space-y-4 pr-1">
              
              {/* Financial Metrics Summary Banner */}
              {(() => {
                const profit = currentProject.value - currentProject.cost;
                const totalSettled = getTotalSettled(currentProject);
                const remaining = profit - totalSettled;
                const currentStatus = getSettlementStatus(currentProject);

                return (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2.5 bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Tổng Lợi Nhuận</span>
                        <span className={`text-sm sm:text-base font-extrabold font-mono ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {new Intl.NumberFormat('vi-VN').format(profit)} ₫
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-indigo-400 uppercase font-bold block">Đã Chi Kết Toán</span>
                        <span className="text-sm sm:text-base font-extrabold font-mono text-indigo-300">
                          {new Intl.NumberFormat('vi-VN').format(totalSettled)} ₫
                        </span>
                        <span className="text-[10px] text-slate-500 block">({currentProject.settlementHistory?.length || 0} đợt)</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Lợi Nhuận Còn Lại</span>
                        <span className={`text-sm sm:text-base font-extrabold font-mono ${remaining > 0 ? 'text-amber-300' : 'text-slate-400'}`}>
                          {new Intl.NumberFormat('vi-VN').format(Math.max(0, remaining))} ₫
                        </span>
                      </div>
                    </div>

                    {/* Settlement Status Switcher Bar */}
                    <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Layers className="h-4 w-4 text-indigo-400" />
                        Trạng thái kết toán hiện tại:
                      </span>

                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateSettlementStatus('chua_ket_toan')}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition flex items-center gap-1 ${
                            currentStatus === 'chua_ket_toan'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                          }`}
                        >
                          <Clock className="h-3 w-3" />
                          Chưa kết toán
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUpdateSettlementStatus('dang_ket_toan')}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition flex items-center gap-1 ${
                            currentStatus === 'dang_ket_toan'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                          }`}
                        >
                          <TrendingUp className="h-3 w-3" />
                          Đang kết toán
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUpdateSettlementStatus('da_ket_toan')}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition flex items-center gap-1 ${
                            currentStatus === 'da_ket_toan'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                          }`}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Đã kết toán
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* List of Previous Settlement Stages */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Receipt className="h-4 w-4 text-emerald-400" />
                    Lịch Sử Các Đợt Chi Kết Toán ({currentProject.settlementHistory?.length || 0})
                  </span>
                </h4>

                {(!currentProject.settlementHistory || currentProject.settlementHistory.length === 0) ? (
                  <div className="text-center py-6 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl text-xs text-slate-500 italic">
                    Chưa có đợt chi kết toán nào được ghi nhận. Hãy điền thông tin bên dưới để thêm đợt chi đầu tiên.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {currentProject.settlementHistory.map((stage, sIdx) => (
                      <div 
                        key={stage.id || sIdx}
                        className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-lg flex items-center justify-between gap-2 hover:border-slate-700 transition"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-200">{stage.stageName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(stage.date).toLocaleDateString('vi-VN')}
                            </span>
                            {stage.destination === 'quy_to' ? (
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
                                Quỹ Tổ
                              </span>
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-slate-800 text-slate-300">
                                Chia ngoài
                              </span>
                            )}
                          </div>
                          {stage.notes && (
                            <p className="text-[11px] text-slate-400 italic">
                              {stage.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono font-bold text-xs text-emerald-400">
                            +{new Intl.NumberFormat('vi-VN').format(stage.amount)} ₫
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              if (deleteStageConfirmId === stage.id) {
                                handleDeleteStage(stage);
                              } else {
                                setDeleteStageConfirmId(stage.id);
                                setTimeout(() => setDeleteStageConfirmId(null), 3000);
                              }
                            }}
                            className={`p-1 rounded text-xs transition ${
                              deleteStageConfirmId === stage.id
                                ? 'bg-rose-600 text-white font-bold px-2'
                                : 'text-slate-500 hover:text-rose-400'
                            }`}
                            title="Xóa đợt này"
                          >
                            {deleteStageConfirmId === stage.id ? 'Xóa?' : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form: Add New Settlement Stage */}
              <div className="bg-slate-950/90 border border-indigo-900/30 p-3.5 sm:p-4 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Plus className="h-4 w-4" />
                  Thêm Đợt Chi Kết Toán Mới
                </h4>

                <form onSubmit={handleAddSettlementStage} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Tên giai đoạn / Đợt chi (*)
                      </label>
                      <input
                        type="text"
                        required
                        value={stageName}
                        onChange={(e) => setStageName(e.target.value)}
                        placeholder="Ví dụ: Đợt 1 - Tạm ứng 30%..."
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                      {/* Quick Chips for stage name */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {['Đợt 1', 'Đợt 2', 'Đợt 3', 'Nghiệm thu', 'Quyết toán cuối'].map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => setStageName(`${chip} - `)}
                            className="text-[9px] px-1.5 py-0.5 bg-slate-800/80 hover:bg-slate-800 text-slate-400 rounded"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Ngày chi kết toán
                      </label>
                      <input
                        type="date"
                        required
                        value={stageDate}
                        onChange={(e) => setStageDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[11px] font-semibold text-slate-400">
                        Số tiền chi kết toán đợt này (₫) (*)
                      </label>
                      {/* Quick preset buttons based on profit */}
                      {(() => {
                        const profit = currentProject.value - currentProject.cost;
                        const remaining = Math.max(0, profit - getTotalSettled(currentProject));
                        if (profit <= 0) return null;

                        return (
                          <div className="flex gap-1 text-[10px]">
                            <button
                              type="button"
                              onClick={() => setStageAmount(String(Math.round(profit * 0.3)))}
                              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                            >
                              30% Lợi nhuận
                            </button>
                            <button
                              type="button"
                              onClick={() => setStageAmount(String(Math.round(profit * 0.5)))}
                              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                            >
                              50% Lợi nhuận
                            </button>
                            {remaining > 0 && (
                              <button
                                type="button"
                                onClick={() => setStageAmount(String(remaining))}
                                className="px-1.5 py-0.5 bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/40 rounded font-semibold"
                              >
                                Tất cả còn lại ({new Intl.NumberFormat('vi-VN').format(remaining)} ₫)
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    <input
                      type="number"
                      required
                      value={stageAmount}
                      onChange={(e) => setStageAmount(e.target.value)}
                      placeholder="Nhập số tiền chi đợt này..."
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Destination selection */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-slate-400">Điều phối nguồn chi:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className={`flex items-center p-2 rounded-lg border cursor-pointer transition ${
                        stageDestination === 'quy_to'
                          ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}>
                        <input
                          type="radio"
                          name="stage_dest"
                          checked={stageDestination === 'quy_to'}
                          onChange={() => setStageDestination('quy_to')}
                          className="mr-2 h-3.5 w-3.5 text-emerald-500"
                        />
                        <div className="text-xs">
                          <span className="font-bold block">Trích nộp vào Quỹ Tổ</span>
                          <span className="text-[10px] text-slate-500 block">Tự động ghi tăng vào Sổ Quỹ Tổ</span>
                        </div>
                      </label>

                      <label className={`flex items-center p-2 rounded-lg border cursor-pointer transition ${
                        stageDestination === 'khac'
                          ? 'bg-slate-800 border-slate-700 text-slate-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}>
                        <input
                          type="radio"
                          name="stage_dest"
                          checked={stageDestination === 'khac'}
                          onChange={() => setStageDestination('khac')}
                          className="mr-2 h-3.5 w-3.5 text-slate-400"
                        />
                        <div className="text-xs">
                          <span className="font-bold block">Chia ngoài / Khác</span>
                          <span className="text-[10px] text-slate-500 block">Giải ngân ngoài, không ghi Quỹ Tổ</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Stage Notes */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Ghi chú cụ thể</label>
                    <input
                      type="text"
                      value={stageNotes}
                      onChange={(e) => setStageNotes(e.target.value)}
                      placeholder="Ví dụ: Chuyển khoản đ/c thủ quỹ sau nghiệm thu..."
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Mark as fully settled checkbox */}
                  <label className="flex items-center gap-2 p-2 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={markAsFullySettled}
                      onChange={(e) => setMarkAsFullySettled(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-200">
                        Đánh dấu dự án này <span className="text-emerald-400 font-extrabold">ĐÃ KẾT TOÁN XONG</span> sau đợt này
                      </span>
                      <p className="text-[10px] text-slate-500">
                        Dự án sẽ chuyển trạng thái sang "Đã kết toán", hoàn tất quy trình kết toán quỹ.
                      </p>
                    </div>
                  </label>

                  {stageFormError && (
                    <div className="bg-rose-950/40 border border-rose-900 text-rose-400 p-2 rounded text-xs font-semibold text-center">
                      {stageFormError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs shadow flex items-center justify-center gap-1.5 transition"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Xác Nhận Ghi Nhận Đợt Chi Kết Toán Này</span>
                  </button>
                </form>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-800 mt-2 flex justify-between items-center">
              <span className="text-[11px] text-slate-500">
                Mỗi đợt kết toán sẽ lưu trữ độc lập và có thể xóa hoặc bổ sung bất cứ lúc nào.
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsSettleModalOpen(false);
                  setSelectedProjectId(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs transition"
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
