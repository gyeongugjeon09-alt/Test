import { useState } from 'react';
import { AlertCircle, FileSignature, Loader2, X } from 'lucide-react';
import { parseJsonResponse } from '../shared/http.ts';
import type {
  LearnedProfile,
  NameChangeRequestRecord,
  UserOnboardingProfile,
} from '../shared/types.ts';

interface NameChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onboarding: UserOnboardingProfile;
  onCompleted: (payload: {
    onboarding: UserOnboardingProfile;
    profile: LearnedProfile;
    nameChangeRequests: NameChangeRequestRecord[];
    requestRecord: NameChangeRequestRecord;
  }) => void;
}

export function NameChangeModal({
  isOpen,
  onClose,
  onboarding,
  onCompleted,
}: NameChangeModalProps) {
  const [newName, setNewName] = useState('');
  const [changeDate, setChangeDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('법원 개명 허가 및 가족관계등록부 정정 완료');
  const [phoneConfirm, setPhoneConfirm] = useState('');
  const [declarationConfirmed, setDeclarationConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/profile/name-change-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newName: newName.trim(),
          changeDate,
          reason: reason.trim(),
          phoneConfirm: phoneConfirm.trim(),
          declarationConfirmed,
        }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) {
        throw new Error(data.error || '개명 신청 처리 중 오류가 발생했습니다.');
      }

      onCompleted({
        onboarding: data.onboarding as UserOnboardingProfile,
        profile: data.profile as LearnedProfile,
        nameChangeRequests: data.nameChangeRequests as NameChangeRequestRecord[],
        requestRecord: data.requestRecord as NameChangeRequestRecord,
      });
      setNewName('');
      setPhoneConfirm('');
      setDeclarationConfirmed(false);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '개명 신청에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="개명 신청 및 실제 이름 변경 요청"
    >
      <div className="fixed inset-0 bg-black/45" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white rounded-xl border border-[#E4E4E7] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-[#E4E4E7] flex items-center justify-between bg-[#FAFAFA]">
          <div className="flex items-center gap-2">
            <FileSignature className="w-4 h-4 text-[#1D4ED8]" />
            <h2 className="text-base font-semibold text-[#18181B]">
              개명 신고 · 실제 성명 변경 요청서
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="개명 신청 창 닫기"
            className="p-2 text-[#52525B] hover:text-[#18181B] rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <p className="text-xs text-[#52525B] leading-relaxed">
            등록된 실제 성명은 일반 설정에서 임의로 수정할 수 없으며, 법적으로 개명했음을 알리는 공식 요청 양식을 통해서만 변경할 수 있습니다. 주민등록번호({onboarding.residentRegistrationNumberMasked}) 및 통관부호는 변경되지 않습니다.
          </p>

          {errorMsg && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg flex items-start gap-2.5 text-xs text-[#B91C1C]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-3.5 bg-[#F4F4F5] border border-[#E4E4E7] rounded-lg text-xs space-y-1">
            <p className="text-[#71717A]">현재 등록된 법적 성명 (개명 전)</p>
            <p className="text-sm font-semibold text-[#18181B]">{onboarding.recipientName}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="nc-new-name" className="block text-xs font-medium text-[#52525B] mb-1">
                개명 후 새로운 성명 <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="nc-new-name"
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="예: 홍길동"
                className="w-full px-3 py-2 text-sm bg-white border border-[#D4D4D8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              />
            </div>
            <div>
              <label htmlFor="nc-date" className="block text-xs font-medium text-[#52525B] mb-1">
                개명 허가 · 신고 일자 <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="nc-date"
                type="date"
                required
                value={changeDate}
                onChange={(e) => setChangeDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-[#D4D4D8] rounded-lg"
              />
            </div>
          </div>

          <div>
            <label htmlFor="nc-reason" className="block text-xs font-medium text-[#52525B] mb-1">
              개명 알림 및 변경 사유 <span className="text-[#DC2626]">*</span>
            </label>
            <textarea
              id="nc-reason"
              rows={2}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="예: 가정법원 개명 허가 결정 및 주민센터 개명 신고 완료에 따라 실명을 변경합니다."
              className="w-full px-3 py-2 text-sm bg-white border border-[#D4D4D8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            />
          </div>

          <div>
            <label htmlFor="nc-phone" className="block text-xs font-medium text-[#52525B] mb-1">
              등록된 휴대폰 번호 본인 확인 ({onboarding.phone}) <span className="text-[#DC2626]">*</span>
            </label>
            <input
              id="nc-phone"
              type="tel"
              required
              value={phoneConfirm}
              onChange={(e) => setPhoneConfirm(e.target.value)}
              placeholder="예: 010-9999-9999"
              className="w-full px-3 py-2 text-sm font-mono bg-white border border-[#D4D4D8] rounded-lg"
            />
          </div>

          <label className="p-3.5 bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg flex items-start gap-2.5 text-xs text-[#18181B] cursor-pointer">
            <input
              type="checkbox"
              checked={declarationConfirmed}
              onChange={(e) => setDeclarationConfirmed(e.target.checked)}
              className="w-4 h-4 mt-0.5 accent-[#1D4ED8] shrink-0"
            />
            <span className="leading-relaxed">
              본인은 법적으로 개명 절차를 완료하였음을 알리며, 기존 주민등록번호({onboarding.residentRegistrationNumberMasked}) 및 개인통관고유부호({onboarding.customsClearanceNumber})와 동일인임을 확인합니다.
            </span>
          </label>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#52525B] bg-[#F4F4F5] hover:bg-[#E4E4E7] rounded-lg cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 inline-flex items-center gap-2 text-xs font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:bg-[#93C5FD] rounded-lg cursor-pointer"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>개명 신청 제출 및 이름 변경</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
