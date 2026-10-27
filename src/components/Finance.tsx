/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FundTransaction, FundCategory, AdvanceStatus } from '../types';
import { 
  Wallet, 
  Landmark, 
  TrendingUp, 
  TrendingDown, 
  ClipboardPen, 
  Plus, 
  Trash2, 
  Edit2,
  Coins, 
  UserCheck, 
  RotateCcw, 
  CheckCheck, 
  AlertCircle, 
  Clock, 
  Search, 
  Users,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { generateId, MANAGERS } from '../data';

interface FinanceProps {
  funds: FundTransaction[];
  onAddTransaction: (trans: FundTransaction) => void;
  onUpdateTransaction?: (trans: FundTransaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export default function Finance({
  funds,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
}: FinanceProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<FundTransaction | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  // Main Modal Form States
  const [editingTransId, setEditingTransId] = useState<string | null>(null);
  const [formCategory, setFormCategory] = useState<FundCategory>('thu_quy');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [person, setPerson] = useState(MANAGERS[0]);
  const [customPerson, setCustomPerson] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10));
  const [advanceStatusForm, setAdvanceStatusForm] = useState<AdvanceStatus>('dang_ung');

  // Refund Modal States
  const [refundAmount, setRefundAmount] = useState('');
  const [refundDesc, setRefundDesc] = useState('');
  const [refundError, setRefundError] = useState('');

  // Table & Filter States
  const [filterType, setFilterType] = useState<'all' | 'thu' | 'chi' | 'tam_ung' | 'hoan_ung'>('all');
  const [filterManager, setFilterManager] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvanceHistory, setShowAdvanceHistory] = useState(false);

  // Core Financial Computations
  const totalIn = funds
    .filter((f) => f.type === 'thu')
    .reduce((sum, f) => sum + (f.amount || 0), 0);

  const totalOut = funds
    .filter((f) => f.type === 'chi')
    .reduce((sum, f) => sum + (f.amount || 0), 0);

  const cashBalance = totalIn - totalOut;

  // Helper to calculate remaining advance debt for a transaction
  const getRemainingAdvance = (f: FundTransaction): number => {
    if (f.advanceStatus === 'da_hoan_ung' || f.advanceStatus === 'da_quyet_toan') return 0;
    const refunded = f.refundedAmount || 0;
    return Math.max(0, (f.amount || 0) - refunded);
  };

  // Auto-heal legacy data where an advance had its amount prematurely reduced by refundCash
  useEffect(() => {
    if (!onUpdateTransaction) return;

    funds.forEach((f) => {
      if (f.category === 'tam_ung') {
        const relatedRefunds = funds.filter(
          (r) => r.category === 'hoan_ung' && r.relatedTransactionId === f.id
        );
        const sumRefunds = relatedRefunds.reduce((sum, r) => sum + (r.amount || 0), 0);

        // If refunds exist but f.refundedAmount was not set, restore true advance amount
        if (sumRefunds > 0 && (!f.refundedAmount || f.refundedAmount === 0)) {
          const original = f.originalAmount || (f.amount + sumRefunds);
          onUpdateTransaction({
            ...f,
            amount: original,
            originalAmount: original,
            refundedAmount: sumRefunds,
            advanceStatus: sumRefunds >= original ? 'da_hoan_ung' : 'dang_ung',
            settledAt: sumRefunds >= original ? (f.settledAt || Date.now()) : undefined,
          });
        }
      }
    });
  }, [funds, onUpdateTransaction]);

  // Active Advances (Cán bộ đang tạm ứng chưa hoàn trả hết)
  const activeAdvances = funds.filter(
    (f) => f.category === 'tam_ung' && (!f.advanceStatus || f.advanceStatus === 'dang_ung') && getRemainingAdvance(f) > 0
  );

  const resolvedAdvances = funds.filter(
    (f) => f.category === 'tam_ung' && (f.advanceStatus === 'da_hoan_ung' || f.advanceStatus === 'da_quyet_toan' || getRemainingAdvance(f) <= 0)
  );

  const totalActiveAdvance = activeAdvances.reduce((sum, f) => sum + getRemainingAdvance(f), 0);

  // Group active advances by manager
  const managerAdvanceMap: Record<string, { total: number; count: number; items: FundTransaction[] }> = {};
  
  // Initialize with official managers
  MANAGERS.forEach((m) => {
    managerAdvanceMap[m] = { total: 0, count: 0, items: [] };
  });

  activeAdvances.forEach((f) => {
    const p = f.person || 'Khác';
    if (!managerAdvanceMap[p]) {
      managerAdvanceMap[p] = { total: 0, count: 0, items: [] };
    }
    managerAdvanceMap[p].total += getRemainingAdvance(f);
    managerAdvanceMap[p].count += 1;
    managerAdvanceMap[p].items.push(f);
  });

  const activeAdvancersCount = Object.values(managerAdvanceMap).filter((v) => v.total > 0).length;

  // Open modal to add a new transaction
  const openAddModal = (category: FundCategory = 'thu_quy', preselectedPerson?: string) => {
    setFormError('');
    setEditingTransId(null);
    setFormCategory(category);
    setAmount('');
    setDesc('');
    setTxDate(new Date().toISOString().slice(0, 10));
    setAdvanceStatusForm('dang_ung');

    if (preselectedPerson) {
      if (MANAGERS.includes(preselectedPerson)) {
        setPerson(preselectedPerson);
        setCustomPerson('');
      } else {
        setPerson('Khác');
        setCustomPerson(preselectedPerson);
      }
    } else {
      setPerson(MANAGERS[0]);
      setCustomPerson('');
    }

    setIsModalOpen(true);
  };

  // Open modal to edit an existing transaction
  const openEditModal = (trans: FundTransaction) => {
    setFormError('');
    setEditingTransId(trans.id);

    // Determine category
    const cat: FundCategory = trans.category || (trans.type === 'thu' ? 'thu_quy' : 'chi_tieu');
    setFormCategory(cat);

    setAmount(String(trans.amount || ''));
    setDesc(trans.desc || '');

    // Determine person
    if (trans.person) {
      if (MANAGERS.includes(trans.person)) {
        setPerson(trans.person);
        setCustomPerson('');
      } else {
        setPerson('Khác');
        setCustomPerson(trans.person);
      }
    } else {
      setPerson(MANAGERS[0]);
      setCustomPerson('');
    }

    // Date
    const d = new Date(trans.createdAt);
    setTxDate(d.toISOString().slice(0, 10));

    // Advance status
    setAdvanceStatusForm(trans.advanceStatus || 'dang_ung');

    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const cash = Number(amount);
    if (!cash || cash <= 0) return setFormError('Số tiền thu chi phải lớn hơn 0!');
    if (!desc.trim()) return setFormError('Vui lòng giải trình rõ lý do thu chi quỹ!');

    const targetPerson = person === 'Khác' ? customPerson.trim() : person;
    if ((formCategory === 'tam_ung' || formCategory === 'hoan_ung') && !targetPerson) {
      return setFormError('Vui lòng chọn hoặc nhập tên cán bộ liên quan!');
    }

    const isIncome = formCategory === 'thu_quy' || formCategory === 'hoan_ung';

    // Parse date timestamp
    let createdTimestamp = Date.now();
    if (txDate) {
      const parsed = new Date(txDate).getTime();
      if (!isNaN(parsed)) {
        createdTimestamp = parsed;
      }
    }

    const existing = funds.find(f => f.id === editingTransId);

    const payload: FundTransaction = {
      id: editingTransId || generateId(),
      type: isIncome ? 'thu' : 'chi',
      category: formCategory,
      amount: cash,
      originalAmount: formCategory === 'tam_ung' ? (existing?.originalAmount || cash) : undefined,
      advanceStatus: formCategory === 'tam_ung' ? advanceStatusForm : undefined,
      person: (formCategory === 'tam_ung' || formCategory === 'hoan_ung' || targetPerson) ? targetPerson : undefined,
      desc: desc.trim(),
      createdAt: editingTransId ? createdTimestamp : (txDate ? createdTimestamp : Date.now()),
      settledAt: formCategory === 'tam_ung' && advanceStatusForm !== 'dang_ung' ? (existing?.settledAt || Date.now()) : undefined,
      relatedTransactionId: existing?.relatedTransactionId
    };

    if (editingTransId && onUpdateTransaction) {
      onUpdateTransaction(payload);
    } else {
      onAddTransaction(payload);
    }
    setIsModalOpen(false);
  };

  // Open refund popup for a specific advance
  const handleOpenRefund = (advance: FundTransaction) => {
    setRefundError('');
    setSelectedAdvance(advance);
    const remainingDebt = getRemainingAdvance(advance);
    setRefundAmount(String(remainingDebt));
    setRefundDesc(`Thu hoàn ứng tiền mặt: ${advance.person || 'Cán bộ'} hoàn trả khoản ${advance.desc}`);
    setIsRefundModalOpen(true);
  };

  // Process refund (Hoàn ứng tiền mặt vào quỹ)
  const handleConfirmRefund = (e: React.FormEvent) => {
    e.preventDefault();
    setRefundError('');
    if (!selectedAdvance) return;

    const refundCash = Number(refundAmount);
    if (!refundCash || refundCash <= 0) {
      return setRefundError('Số tiền hoàn trả phải lớn hơn 0!');
    }

    const currentRefunded = selectedAdvance.refundedAmount || 0;
    const remainingDebt = Math.max(0, (selectedAdvance.amount || 0) - currentRefunded);

    if (refundCash > remainingDebt) {
      return setRefundError(`Số tiền hoàn trả không được vượt quá số tiền còn đang nợ (${new Intl.NumberFormat('vi-VN').format(remainingDebt)} ₫)!`);
    }

    // 1. Create income transaction for returning cash to fund
    const refundTrans: FundTransaction = {
      id: generateId(),
      type: 'thu',
      category: 'hoan_ung',
      amount: refundCash,
      person: selectedAdvance.person,
      desc: refundDesc.trim() || `Thu hoàn ứng tiền mặt: ${selectedAdvance.person} hoàn trả tiền mặt vào quỹ`,
      relatedTransactionId: selectedAdvance.id,
      createdAt: Date.now(),
    };
    onAddTransaction(refundTrans);

    // 2. Update advance status:
    // IMPORTANT: DO NOT change selectedAdvance.amount!
    // The advance amount represents the original cash disbursement.
    // Changing amount would reduce totalOut, creating a double-count in cashBalance (totalIn - totalOut)!
    if (onUpdateTransaction) {
      const newTotalRefunded = currentRefunded + refundCash;
      const isFullyRefunded = newTotalRefunded >= selectedAdvance.amount;

      onUpdateTransaction({
        ...selectedAdvance,
        refundedAmount: newTotalRefunded,
        advanceStatus: isFullyRefunded ? 'da_hoan_ung' : 'dang_ung',
        settledAt: isFullyRefunded ? Date.now() : undefined,
      });
    }

    setIsRefundModalOpen(false);
    setSelectedAdvance(null);
  };

  // Settle advance as official squad expenditure (Quyết toán chi tiêu bằng hóa đơn chứng từ)
  const handleSettleAdvanceAsExpense = (advance: FundTransaction) => {
    if (!onUpdateTransaction) return;
    const confirmSettle = window.confirm(
      `Đồng chí có chắc chắn muốn quyết toán khoản tạm ứng ${new Intl.NumberFormat('vi-VN').format(advance.amount)} ₫ của ${advance.person} thành chi tiêu chính thức của đội? (Cán bộ sẽ không còn nợ khoản tạm ứng này)`
    );
    if (!confirmSettle) return;

    onUpdateTransaction({
      ...advance,
      advanceStatus: 'da_quyet_toan',
      settledAt: Date.now(),
      desc: `[Đã quyết toán chứng từ] ${advance.desc}`,
    });
  };

  // Filter Transactions for Table
  const filteredFunds = funds.filter((f) => {
    if (filterType === 'thu' && f.type !== 'thu') return false;
    if (filterType === 'chi' && (f.type !== 'chi' || f.category === 'tam_ung')) return false;
    if (filterType === 'tam_ung' && f.category !== 'tam_ung') return false;
    if (filterType === 'hoan_ung' && f.category !== 'hoan_ung') return false;

    if (filterManager !== 'all' && f.person !== filterManager) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = (f.desc || '').toLowerCase().includes(q);
      const matchPerson = (f.person || '').toLowerCase().includes(q);
      if (!matchDesc && !matchPerson) return false;
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Tab Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Landmark className="h-5 w-5 text-emerald-400" />
            Sổ Sách & Quỹ Đơn Vị Bình Tuyền
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Minh bạch thu chi, cho phép chỉnh sửa nội dung/số tiền/ngày tháng, theo dõi chi tiết cán bộ tạm ứng quỹ.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => openAddModal('tam_ung')}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs md:text-sm font-bold flex items-center gap-1.5 shadow transition"
          >
            <Coins className="h-4 w-4" />
            <span>+ Chi Tạm Ứng Quỹ</span>
          </button>

          <button
            onClick={() => openAddModal('thu_quy')}
            className="px-3.5 py-2 bg-emerald-700/90 hover:bg-emerald-600 text-white rounded-lg text-xs md:text-sm font-bold flex items-center gap-1.5 shadow transition"
          >
            <Plus className="h-4 w-4" />
            <span>Ghi Thu / Chi Quỹ</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total In */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 border-t-4 border-t-emerald-500/80 space-y-1">
          <p className="text-[10px] sm:text-xs font-semibold text-slate-400 tracking-wider uppercase">TỔNG THU LUỸ KẾ</p>
          <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold text-emerald-400 font-mono flex items-center gap-1.5">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            {new Intl.NumberFormat('vi-VN').format(totalIn)} ₫
          </h3>
          <span className="text-[10px] text-slate-500 block">Tiền vào quỹ thực tế</span>
        </div>

        {/* Total Out */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 border-t-4 border-t-rose-500/80 space-y-1">
          <p className="text-[10px] sm:text-xs font-semibold text-slate-400 tracking-wider uppercase">TỔNG CHI TIÊU</p>
          <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold text-rose-400 font-mono flex items-center gap-1.5">
            <TrendingDown className="h-5 w-5 text-rose-500" />
            {new Intl.NumberFormat('vi-VN').format(totalOut)} ₫
          </h3>
          <span className="text-[10px] text-slate-500 block">Đã xuất quỹ (gồm tạm ứng)</span>
        </div>

        {/* Cash Balance */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 border-t-4 border-t-blue-500/80 space-y-1">
          <p className="text-[10px] sm:text-xs font-semibold text-slate-400 tracking-wider uppercase">TỒN QUỸ TIỀN MẶT</p>
          <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold text-blue-400 font-mono flex items-center gap-1.5">
            <Wallet className="h-5 w-5 text-blue-500" />
            {new Intl.NumberFormat('vi-VN').format(cashBalance)} ₫
          </h3>
          <span className="text-[10px] text-slate-500 block">Hiện còn trong két</span>
        </div>

        {/* Total Active Advances */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 border-t-4 border-t-amber-500/80 space-y-1">
          <p className="text-[10px] sm:text-xs font-semibold text-amber-400 tracking-wider uppercase flex items-center gap-1">
            <Coins className="h-3.5 w-3.5" />
            ĐANG TẠM ỨNG QUỸ
          </p>
          <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold text-amber-300 font-mono flex items-center gap-1.5">
            {new Intl.NumberFormat('vi-VN').format(totalActiveAdvance)} ₫
          </h3>
          <span className="text-[10px] text-slate-400 block">
            {activeAdvancersCount > 0 ? `${activeAdvancersCount} cán bộ đang cầm tiền` : 'Không có ai nợ quỹ'}
          </span>
        </div>
      </div>

      {/* DEDICATED PANEL: THEO DÕI CÁN BỘ TẠM ỨNG QUỸ */}
      <div className="bg-slate-900/80 border border-amber-900/30 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3.5">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-amber-400" />
              Bảng Theo Dõi Cán Bộ Tạm Ứng Quỹ
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Chi tiết từng đồng chí đang ứng quỹ bao nhiêu, hỗ trợ chỉnh sửa, xử lý hoàn ứng tiền mặt hoặc chuyển quyết toán hóa đơn.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvanceHistory(!showAdvanceHistory)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
            >
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>{showAdvanceHistory ? 'Ẩn Lịch Sử Đã Xong' : `Xem Đã Hoàn / Quyết Toán (${resolvedAdvances.length})`}</span>
            </button>
          </div>
        </div>

        {/* Manager Summary Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {MANAGERS.map((m) => {
            const data = managerAdvanceMap[m] || { total: 0, count: 0, items: [] };
            const isIndebted = data.total > 0;
            const isFilterActive = filterManager === m;

            return (
              <div
                key={m}
                onClick={() => setFilterManager(filterManager === m ? 'all' : m)}
                className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  isIndebted
                    ? isFilterActive
                      ? 'bg-amber-950/60 border-amber-500 shadow-md ring-1 ring-amber-500'
                      : 'bg-amber-950/25 border-amber-800/40 hover:border-amber-700'
                    : isFilterActive
                      ? 'bg-slate-800 border-indigo-500 ring-1 ring-indigo-500'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-xs text-slate-200">{m}</span>
                  {isIndebted ? (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-900/60 text-amber-300 border border-amber-700/50">
                      {data.count} khoản
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-600">✓ Đủ</span>
                  )}
                </div>

                <div className="mt-2">
                  <span className="text-[10px] text-slate-400 block font-semibold">ĐANG TẠM ỨNG:</span>
                  <span className={`text-sm font-extrabold font-mono ${isIndebted ? 'text-amber-400' : 'text-slate-500'}`}>
                    {new Intl.NumberFormat('vi-VN').format(data.total)} ₫
                  </span>
                </div>

                {isIndebted && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openAddModal('hoan_ung', m);
                    }}
                    className="mt-2 text-[10px] py-1 bg-amber-600/80 hover:bg-amber-500 text-white rounded font-bold transition text-center"
                  >
                    Thu Hoàn Ứng
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Active Advances Detailed List */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-amber-400" />
              Các Khoản Đang Tạm Ứng Tiền Mặt ({activeAdvances.length})
            </span>
            {filterManager !== 'all' && (
              <button
                onClick={() => setFilterManager('all')}
                className="text-[11px] text-amber-400 hover:underline"
              >
                Đang lọc: {filterManager} (Bấm để xem tất cả)
              </button>
            )}
          </div>

          {activeAdvances.length === 0 ? (
            <div className="text-center py-6 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl text-xs text-slate-400 flex flex-col items-center gap-1.5">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <span>Hiện không có đồng chí nào đang tạm ứng quỹ. Quỹ đơn vị an toàn 100%!</span>
            </div>
          ) : (
            <div className="space-y-2">
              {activeAdvances
                .filter((f) => filterManager === 'all' || f.person === filterManager)
                .map((f, idx) => (
                  <div
                    key={`${f.id}-${idx}`}
                    className="bg-slate-950 border border-amber-900/30 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-700/50 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
                          <UserCheck className="h-3 w-3" />
                          {f.person || 'Cán bộ'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(f.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-950/60 text-rose-300 border border-rose-900/50">
                          Chưa hoàn ứng
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 font-medium">
                        {f.desc}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-850">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">
                          {f.refundedAmount && f.refundedAmount > 0 ? 'Còn đang ứng' : 'Số tiền ứng'}
                        </span>
                        <span className="text-sm sm:text-base font-extrabold font-mono text-amber-400">
                          {new Intl.NumberFormat('vi-VN').format(getRemainingAdvance(f))} ₫
                        </span>
                        {f.refundedAmount && f.refundedAmount > 0 && (
                          <span className="text-[10px] text-emerald-400 block font-mono">
                            (Đã hoàn: {new Intl.NumberFormat('vi-VN').format(f.refundedAmount)} ₫ / {new Intl.NumberFormat('vi-VN').format(f.amount)} ₫)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenRefund(f)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center gap-1 transition shadow-sm"
                          title="Hoàn tiền mặt trả lại vào quỹ"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Hoàn Ứng</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSettleAdvanceAsExpense(f)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold flex items-center gap-1 transition"
                          title="Quyết toán chi tiêu bằng hóa đơn (không hoàn tiền mặt)"
                        >
                          <CheckCheck className="h-3.5 w-3.5 text-blue-400" />
                          <span className="hidden md:inline">Quyết Toán Chi</span>
                        </button>

                        {/* Nút Sửa Tạm Ứng */}
                        <button
                          type="button"
                          onClick={() => openEditModal(f)}
                          className="p-1.5 text-slate-400 hover:text-blue-400 rounded transition"
                          title="Chỉnh sửa khoản tạm ứng này"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        {/* Nút Xóa */}
                        <button
                          type="button"
                          onClick={() => {
                            if (deleteConfirmId === f.id) {
                              onDeleteTransaction(f.id);
                              setDeleteConfirmId(null);
                            } else {
                              setDeleteConfirmId(f.id);
                              setTimeout(() => setDeleteConfirmId(null), 3000);
                            }
                          }}
                          className={`p-1.5 rounded transition ${
                            deleteConfirmId === f.id
                              ? 'bg-rose-500 text-white'
                              : 'text-slate-500 hover:text-rose-400'
                          }`}
                          title="Xóa khoản tạm ứng này"
                        >
                          {deleteConfirmId === f.id ? (
                            <span className="text-[10px] font-bold">Xóa?</span>
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* History of Resolved Advances (Đã hoàn ứng hoặc đã quyết toán) */}
          {showAdvanceHistory && resolvedAdvances.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Lịch Sử Các Khoản Tạm Ứng Đã Xử Lý Xong ({resolvedAdvances.length})
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {resolvedAdvances.map((rf, rIdx) => (
                  <div
                    key={`${rf.id}-${rIdx}`}
                    className="bg-slate-950/50 border border-slate-850 p-2 rounded-lg flex items-center justify-between text-xs hover:border-slate-700 transition"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-300">{rf.person || 'Cán bộ'}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Ứng: {new Date(rf.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        {rf.advanceStatus === 'da_hoan_ung' ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                            ✓ Đã hoàn trả tiền mặt
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-blue-950 text-blue-400 border border-blue-800/40">
                            ✓ Đã quyết toán chứng từ
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">{rf.desc}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-400">
                        {new Intl.NumberFormat('vi-VN').format(rf.amount)} ₫
                      </span>
                      <button
                        type="button"
                        onClick={() => openEditModal(rf)}
                        className="p-1 text-slate-500 hover:text-blue-400 rounded transition"
                        title="Chỉnh sửa bản kê này"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SỔ KÝ GIAO DỊCH THU CHI (MAIN TRANSACTION TABLE) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden space-y-0">
        
        {/* Table Top Header with Filters */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 bg-slate-950/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardPen className="h-4.5 w-4.5 text-emerald-400" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wide">
              Sổ Ký Giao Dịch Thu Chi
            </h3>
            <span className="text-[10px] px-2 py-0.5 bg-slate-800 rounded-full font-mono text-slate-400">
              {filteredFunds.length} bản kê
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2 py-1 rounded font-bold transition ${
                  filterType === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setFilterType('thu')}
                className={`px-2 py-1 rounded font-bold transition ${
                  filterType === 'thu' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-slate-400 hover:text-emerald-300'
                }`}
              >
                Thu quỹ
              </button>
              <button
                onClick={() => setFilterType('chi')}
                className={`px-2 py-1 rounded font-bold transition ${
                  filterType === 'chi' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'text-slate-400 hover:text-rose-300'
                }`}
              >
                Chi tiêu
              </button>
              <button
                onClick={() => setFilterType('tam_ung')}
                className={`px-2 py-1 rounded font-bold transition ${
                  filterType === 'tam_ung' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'text-slate-400 hover:text-amber-300'
                }`}
              >
                Tạm ứng
              </button>
              <button
                onClick={() => setFilterType('hoan_ung')}
                className={`px-2 py-1 rounded font-bold transition ${
                  filterType === 'hoan_ung' ? 'bg-blue-950 text-blue-300 border border-blue-800' : 'text-slate-400 hover:text-blue-300'
                }`}
              >
                Hoàn ứng
              </button>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-48">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm nội dung, cán bộ..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 placeholder-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-xs md:text-sm">
            <thead>
              <tr className="bg-slate-950/20 text-slate-400 text-left">
                <th className="px-5 py-3 font-semibold">Ngày tháng</th>
                <th className="px-3 py-3 font-semibold">Phân loại</th>
                <th className="px-4 py-3 font-semibold">Nội dung giải trình</th>
                <th className="px-5 py-3 font-semibold text-right">Số tiền mặt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 bg-transparent">
              {filteredFunds.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic font-medium">
                    Không tìm thấy bản kê giao dịch nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredFunds
                  .sort((a, b) => b.createdAt - a.createdAt)
                  .map((f, idx) => {
                    // Type Badge calculation
                    let categoryBadge = (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/50 text-emerald-400 border border-emerald-900/40">
                        Thu quỹ
                      </span>
                    );

                    if (f.category === 'tam_ung') {
                      categoryBadge = (
                        <div className="flex flex-col gap-0.5 items-start">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/70 text-amber-300 border border-amber-800 flex items-center gap-1">
                            <Coins className="h-3 w-3" />
                            Tạm ứng
                          </span>
                          {f.advanceStatus === 'da_hoan_ung' ? (
                            <span className="text-[9px] text-emerald-400 font-bold">✓ Đã hoàn</span>
                          ) : f.advanceStatus === 'da_quyet_toan' ? (
                            <span className="text-[9px] text-blue-400 font-bold">✓ Quyết toán</span>
                          ) : (
                            <span className="text-[9px] text-rose-400 font-bold">• Đang ứng</span>
                          )}
                        </div>
                      );
                    } else if (f.category === 'hoan_ung') {
                      categoryBadge = (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800 flex items-center gap-1">
                          <RotateCcw className="h-3 w-3" />
                          Hoàn ứng
                        </span>
                      );
                    } else if (f.type === 'chi') {
                      categoryBadge = (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/50 text-rose-400 border border-rose-900/40">
                          Chi tiêu
                        </span>
                      );
                    }

                    return (
                      <tr key={`${f.id}-${idx}`} className="hover:bg-slate-850/30 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                          {new Date(f.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-3 py-3.5 whitespace-nowrap">
                          {categoryBadge}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-200">
                          <div className="flex items-center justify-between group">
                            <div className="space-y-0.5">
                              <span>{f.desc}</span>
                              {f.person && (
                                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 font-normal">
                                  <div className="flex items-center gap-1">
                                    <UserCheck className="h-3 w-3 text-indigo-400" />
                                    <span>Cán bộ: <strong className="text-slate-300">{f.person}</strong></span>
                                  </div>
                                  {f.category === 'tam_ung' && f.refundedAmount && f.refundedAmount > 0 ? (
                                    <span className="text-[10px] text-emerald-400 font-mono">
                                      (Đã hoàn: {new Intl.NumberFormat('vi-VN').format(f.refundedAmount)} ₫ • Còn nợ: {new Intl.NumberFormat('vi-VN').format(getRemainingAdvance(f))} ₫)
                                    </span>
                                  ) : null}
                                </div>
                              )}
                            </div>

                            {/* Action Buttons: Edit and Delete */}
                            <div className="flex items-center gap-1 ml-2 opacity-80 sm:opacity-0 group-hover:opacity-100 transition">
                              <button
                                onClick={() => openEditModal(f)}
                                className="p-1.5 text-slate-400 hover:text-blue-400 rounded transition"
                                title="Chỉnh sửa giao dịch này"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  if (deleteConfirmId === f.id) {
                                    onDeleteTransaction(f.id);
                                    setDeleteConfirmId(null);
                                  } else {
                                    setDeleteConfirmId(f.id);
                                    setTimeout(() => setDeleteConfirmId(null), 3000);
                                  }
                                }}
                                className={`p-1.5 rounded transition ${
                                  deleteConfirmId === f.id
                                    ? 'bg-rose-500 text-white hover:bg-rose-600 opacity-100'
                                    : 'text-slate-500 hover:text-rose-400'
                                }`}
                                title="Xóa dòng"
                              >
                                {deleteConfirmId === f.id ? (
                                  <span className="text-[10px] font-bold">Xóa?</span>
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className={`px-5 py-3.5 text-right font-bold text-sm font-mono whitespace-nowrap ${
                          f.type === 'thu' ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {f.type === 'thu' ? '+' : '-'} {new Intl.NumberFormat('vi-VN').format(f.amount)} ₫
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD OR EDIT TRANSACTION / TẠM ỨNG / THU CHI */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 sm:p-6 text-slate-300 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3.5 mb-3.5">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                {editingTransId ? (
                  <>
                    <Edit2 className="h-4.5 w-4.5 text-blue-400" />
                    Chỉnh Sửa Bản Kê Giao Dịch
                  </>
                ) : (
                  <>
                    <Landmark className="h-4.5 w-4.5 text-emerald-400" />
                    Khai Báo Giao Dịch Sổ Quỹ
                  </>
                )}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category selector chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setFormCategory('thu_quy')}
                  className={`py-2 px-2 rounded-lg border text-xs font-bold transition flex flex-col items-center gap-1 ${
                    formCategory === 'thu_quy'
                      ? 'bg-emerald-950/40 border-emerald-700 text-emerald-300 shadow'
                      : 'border-slate-800 text-slate-400 hover:bg-slate-800/40'
                  }`}
                >
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Thu Quỹ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormCategory('chi_tieu')}
                  className={`py-2 px-2 rounded-lg border text-xs font-bold transition flex flex-col items-center gap-1 ${
                    formCategory === 'chi_tieu'
                      ? 'bg-rose-950/40 border-rose-700 text-rose-300 shadow'
                      : 'border-slate-800 text-slate-400 hover:bg-slate-800/40'
                  }`}
                >
                  <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
                  <span>Chi Tiêu</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormCategory('tam_ung')}
                  className={`py-2 px-2 rounded-lg border text-xs font-bold transition flex flex-col items-center gap-1 ${
                    formCategory === 'tam_ung'
                      ? 'bg-amber-950/40 border-amber-600 text-amber-300 shadow'
                      : 'border-slate-800 text-slate-400 hover:bg-slate-800/40'
                  }`}
                >
                  <Coins className="h-3.5 w-3.5 text-amber-400" />
                  <span>Chi Tạm Ứng</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormCategory('hoan_ung')}
                  className={`py-2 px-2 rounded-lg border text-xs font-bold transition flex flex-col items-center gap-1 ${
                    formCategory === 'hoan_ung'
                      ? 'bg-blue-950/40 border-blue-600 text-blue-300 shadow'
                      : 'border-slate-800 text-slate-400 hover:bg-slate-800/40'
                  }`}
                >
                  <RotateCcw className="h-3.5 w-3.5 text-blue-400" />
                  <span>Hoàn Ứng</span>
                </button>
              </div>

              {/* Date and Advance Status (if applicable) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Ngày giao dịch
                  </label>
                  <input
                    type="date"
                    required
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                {formCategory === 'tam_ung' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Trạng thái tạm ứng
                    </label>
                    <select
                      value={advanceStatusForm}
                      onChange={(e) => setAdvanceStatusForm(e.target.value as AdvanceStatus)}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs focus:outline-none text-amber-300 font-semibold cursor-pointer"
                    >
                      <option value="dang_ung">Đang tạm ứng</option>
                      <option value="da_hoan_ung">Đã hoàn tiền mặt</option>
                      <option value="da_quyet_toan">Đã quyết toán chứng từ</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Số tiền thực tế (₫) (*)
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="Ví dụ: 1500000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 font-bold font-mono text-xs text-emerald-400 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* If Category is tam_ung, amount is placed below */}
              {formCategory === 'tam_ung' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Số tiền tạm ứng (₫) (*)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Ví dụ: 1500000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 font-bold font-mono text-sm text-amber-400 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Officer Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Cán bộ liên quan {(formCategory === 'tam_ung' || formCategory === 'hoan_ung') ? '(*)' : '(tuỳ chọn)'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={person}
                    onChange={(e) => setPerson(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs focus:outline-none text-slate-200 font-semibold cursor-pointer"
                  >
                    {MANAGERS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                    <option value="Khác">Cán bộ khác...</option>
                  </select>

                  {person === 'Khác' && (
                    <input
                      type="text"
                      placeholder="Nhập tên cán bộ..."
                      value={customPerson}
                      onChange={(e) => setCustomPerson(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs focus:outline-none"
                    />
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Giải trình nội dung chi tiết (*)
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    formCategory === 'tam_ung'
                      ? 'Ví dụ: Tạm ứng mua phụ kiện bình cứu hỏa...'
                      : formCategory === 'hoan_ung'
                        ? 'Ví dụ: Cán bộ hoàn trả tiền mặt còn thừa...'
                        : 'Ví dụ: Thu lệ phí cấp sao hồ sơ / Chi mua văn phòng phẩm...'
                  }
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs focus:border-emerald-500 focus:outline-none"
                />
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
                  Bỏ qua
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold shadow transition flex items-center gap-1.5"
                >
                  {editingTransId ? <Edit2 className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  <span>{editingTransId ? 'Lưu Cập Nhật' : 'Lưu Giao Dịch'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: THU HOÀN ỨNG TIỀN MẶT POPUP */}
      {isRefundModalOpen && selectedAdvance && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-5 text-slate-300 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <RotateCcw className="h-4.5 w-4.5 text-emerald-400" />
                Thu Hoàn Ứng Vào Quỹ
              </h3>
              <button 
                onClick={() => {
                  setIsRefundModalOpen(false);
                  setSelectedAdvance(null);
                }}
                className="text-slate-500 hover:text-slate-300 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmRefund} className="space-y-3">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Cán bộ hoàn ứng</span>
                <span className="font-bold text-sm text-slate-200 block">{selectedAdvance.person}</span>
                <p className="text-xs text-slate-400 italic">Khoản ứng: {selectedAdvance.desc}</p>
                <div className="flex justify-between items-center pt-1 text-xs border-t border-slate-850">
                  <span className="text-slate-400">Số tiền còn đang nợ:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {new Intl.NumberFormat('vi-VN').format(getRemainingAdvance(selectedAdvance))} ₫
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Số tiền hoàn trả tiền mặt (₫) (*)
                </label>
                <input
                  type="number"
                  required
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 font-bold font-mono text-sm text-emerald-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Ghi chú hoàn ứng
                </label>
                <input
                  type="text"
                  value={refundDesc}
                  onChange={(e) => setRefundDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs focus:outline-none"
                />
              </div>

              {refundError && (
                <div className="bg-rose-950/40 border border-rose-900 text-rose-400 p-2 rounded text-xs font-semibold text-center">
                  {refundError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow transition mt-2"
              >
                Xác Nhận Nhập Quỹ Tiền Hoàn Ứng
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
