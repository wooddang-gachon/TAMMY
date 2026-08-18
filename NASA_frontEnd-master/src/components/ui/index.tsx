import { motion } from 'framer-motion';
import type { HTMLAttributes, ReactNode } from 'react';

/** 기본 둥근 카드 — TAMMY 디자인 시스템 공통 서피스 */
export function Card({ children, className = '', delay = 0, ...rest }: { children: ReactNode; className?: string; delay?: number } & HTMLAttributes<HTMLDivElement>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={'rounded-card bg-white p-5 shadow-card ' + className}
      {...(rest as object)}
    >
      {children}
    </motion.div>
  );
}

/** 그라데이션 CTA 버튼 */
export function PrimaryButton({ children, onClick, className = '' }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={'w-full rounded-[22px] bg-gradient-to-br from-lavender to-pink py-[15px] text-sm font-black text-white shadow-[0_10px_26px_rgba(160,130,190,.4)] ' + className}
    >
      {children}
    </motion.button>
  );
}

/** 애니메이션 프로그레스 바 */
export function ProgressBar({ pct, className = '', barClassName = '' }: { pct: number; className?: string; barClassName?: string }) {
  return (
    <div className={'h-[10px] overflow-hidden rounded-full bg-[#F2EBF7] ' + className}>
      <motion.div
        className={'h-full rounded-full bg-gradient-to-r from-lavender to-pink ' + barClassName}
        initial={{ width: 0 }}
        animate={{ width: pct + '%' }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

/** 섹션 타이틀 */
export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[15px] font-black text-ink">{children}</span>
      {right}
    </div>
  );
}
