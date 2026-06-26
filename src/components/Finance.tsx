/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FundTransaction } from '../types';
import { Wallet, Landmark, TrendingUp, TrendingDown, ClipboardPen, Plus, Trash2, ShieldCheck } from 'lucide-react';
import { generateId } from '../data';

interface FinanceProps {
  funds: FundTransaction[];
  onAddTransaction: (trans: FundTransaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export default function Finance({
  funds,
  onAddTransaction,
  onDeleteTransaction,
}: FinanceProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [type, setType] = useState<'thu' | 'chi'>('thu');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');

  // Total computation
  const totalIn = funds
    .filter((f) => f.type === 'thu')
    .reduce((sum, f) => sum + f.amount, 0);
  const totalOut = funds
    .filter((f) => f.type === 'chi')
    .reduce((sum, f) => sum + f.amount, 0);
  const balance = totalIn - totalOut;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const cash = Number(amount);
    if (!cash || cash <= 0) return setFormError('Số tiền thu chi phải lớn hơn 0!');
    if (!desc.trim()) return setFormError('Vui lòng giải trình rõ lý do thu chi quỹ!');

    const payload: FundTransaction = {
      id: generateId(),
      type,
      amount: cash,
      desc: desc.trim(),
      createdAt: Date.now(),
    };

    onAddTransaction(payload);
    setIsModalOpen(false);
    setAmount('');
    setDesc('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Tab Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Landmark className="h-5 w-5 text-emerald-400" />
            Sổ Sách & Quỹ Đơn Vị Bình Tuyền
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ghi chép công khai minh bạch mọi luồng tài chính, bồi dưỡng hội thao, mua sắm vật liệu.
          </p>
        </div>

        <button
          onClick={() => {
            setType('thu');
            setIsModalOpen(true);
          }}
          className="self-start sm:self-auto px-4 py-2 bg-emerald-700/90 hover:bg-emerald-650 text-white rounded-lg text-xs md:text-sm font-bold flex items-center gap-1.5 shadow"
        >
          <Plus className="h-4 w-4" />
          <span>Ghi Khai Báo Quỹ</span>
        </button>
      </div>

      {/* Sum Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total In */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 border-t-4 border-t-emerald-500/80">
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">TỔNG THU LUỸ KẾ</p>
          <h3 className="text-xl md:text-2xl font-extrabold text-emerald-400 mt-1 flex items-center gap-1.5">
            <TrendingUp className="h-5.5 w-5.5 text-emerald-500" />
            {new Intl.NumberFormat('vi-VN').format(totalIn)} ₫
          </h3>
        </div>

        {/* Total Out */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 border-t-4 border-t-rose-500/80">
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">TỔNG CHI TIÊU</p>
          <h3 className="text-xl md:text-2xl font-extrabold text-rose-400 mt-1 flex items-center gap-1.5">
            <TrendingDown className="h-5.5 w-5.5 text-rose-500" />
            {new Intl.NumberFormat('vi-VN').format(totalOut)} ₫
          </h3>
        </div>

        {/* Cash Balance */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 border-t-4 border-t-blue-500/80">
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">TỒN QUỸ HIỆN CÓ</p>
          <h3 className="text-xl md:text-2xl font-extrabold text-blue-400 mt-1 flex items-center gap-1.5">
            <Wallet className="h-5.5 w-5.5 text-blue-500" />
            {new Intl.NumberFormat('vi-VN').format(balance)} ₫
          </h3>
        </div>
      </div>

      {/* Transaction Records */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-805 bg-slate-950/30 flex justify-between items-center text-xs font-bold text-slate-350">
          <div className="flex items-center gap-1.5 uppercase">
            <ClipboardPen className="h-4 w-4 text-emerald-400" />
            Sổ Ký Giao Dịch Thu Chi
          </div>
          <span className="text-slate-400 font-mono">
            {funds.length} bản kê
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-xs md:text-sm">
            <thead>
              <tr className="bg-slate-950/20 text-slate-400 text-left">
                <th className="px-5 py-3 font-semibold">Ngày tháng</th>
                <th className="px-4 py-3 font-semibold">Nội dung giải trình</th>
                <th className="px-5 py-3 font-semibold text-right">Số tiền mặt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/50 bg-transparent">
              {funds.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500 italic font-medium">
                    Chưa phát sinh giao dịch nào.
                  </td>
                </tr>
              ) : (
                funds
                  .sort((a, b) => b.createdAt - a.createdAt)
                  .map((f, idx) => (
                    <tr key={`${f.id}-${idx}`} className="hover:bg-slate-850/30 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-slate-400 text-[11px]">
                        {new Date(f.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-200">
                        <div className="flex items-center justify-between group">
                          <span>{f.desc}</span>
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
                            className={`p-1 ml-2 rounded transition ${
                              deleteConfirmId === f.id
                                ? 'bg-rose-500 text-white hover:bg-rose-600 opacity-100'
                                : 'text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100'
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
                      </td>
                      <td className={`px-5 py-3.5 text-right font-bold text-sm ${
                        f.type === 'thu' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {f.type === 'thu' ? '+' : '-'} {new Intl.NumberFormat('vi-VN').format(f.amount)} ₫
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DIALOG POPUP FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-5 text-slate-300 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3.5 mb-3.5">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <Landmark className="h-4.5 w-4.5 text-emerald-400" />
                Lập Bản Báo Cáo Tài Chính
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-350 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setType('thu')}
                  className={`flex-1 py-2.5 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    type === 'thu'
                      ? 'bg-emerald-950/25 border-emerald-900/40 text-emerald-400'
                      : 'border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  Khoản Thu Quỹ
                </button>
                <button
                  type="button"
                  onClick={() => setType('chi')}
                  className={`flex-1 py-2.5 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    type === 'chi'
                      ? 'bg-rose-950/25 border-rose-900/40 text-rose-400'
                      : 'border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <TrendingDown className="h-3.5 w-3.5" />
                  Khoản Chi Tiêu
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-405 mb-1">Mức kinh phí thực thu/chi (₫) (*)</label>
                <input
                  type="number"
                  required
                  placeholder="Ví dụ: 1500000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 font-bold font-mono text-sm text-blue-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-405 mb-1">Giải trình nội dung chi tiết (*)</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: thu lệ phí cấp sao hồ sơ..."
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

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2 px-4 border border-slate-850 text-xs text-slate-500 hover:text-slate-300"
                >
                  Bỏ qua
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-blue-650 hover:bg-blue-600 text-white text-xs font-bold shadow"
                >
                  Lưu Giao Dịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
