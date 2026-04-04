'use client';

import React from 'react';

interface OrderStatusStepperProps {
  currentStatus: 'received' | 'in_preparation' | 'ready' | 'delivered' | 'cancelled';
}

const STEPS = [
  { key: 'received', label: 'Recebido' },
  { key: 'in_preparation', label: 'Em Manipulacao' },
  { key: 'ready', label: 'Pronto' },
  { key: 'delivered', label: 'Entregue' },
] as const;

type StepKey = (typeof STEPS)[number]['key'];

function getStepIndex(status: string): number {
  return STEPS.findIndex((s) => s.key === status);
}

export function OrderStatusStepper({ currentStatus }: OrderStatusStepperProps) {
  const isCancelled = currentStatus === 'cancelled';
  const currentIndex = isCancelled ? -1 : getStepIndex(currentStatus);

  return (
    <div
      className="w-full"
      role="group"
      aria-label={`Status do pedido: ${isCancelled ? 'Cancelado' : STEPS[currentIndex]?.label ?? currentStatus}`}
    >
      {isCancelled ? (
        // Cancelled state
        <div className="flex items-center justify-center gap-2 rounded-[12px] bg-[#FF3B30]/10 border border-[#FF3B30]/30 px-4 py-3">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
            className="text-[#FF3B30] shrink-0"
          >
            <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
            <path
              d="M7 7l6 6M13 7l-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-[15px] font-semibold text-[#FF3B30]">
            Pedido Cancelado
          </span>
        </div>
      ) : (
        // Normal stepper
        <div className="flex items-start justify-between">
          {STEPS.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isFuture = index > currentIndex;

            return (
              <div
                key={step.key}
                className="flex flex-1 flex-col items-center relative"
              >
                {/* Connector line */}
                {index > 0 && (
                  <div
                    className="absolute top-3 -left-1/2 right-1/2 h-0.5"
                    aria-hidden="true"
                  >
                    <div
                      className={`h-full w-full transition-colors duration-300 ${
                        isCompleted || isCurrent ? 'bg-[#34C759]' : 'bg-[#E5E5EA]'
                      }`}
                    />
                  </div>
                )}

                {/* Step circle */}
                <div
                  className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300 ${
                    isCompleted
                      ? 'bg-[#34C759]'
                      : isCurrent
                        ? 'bg-[#0A84FF] ring-4 ring-[#0A84FF]/20'
                        : 'bg-[#E5E5EA]'
                  }`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M2.5 6l2.5 2.5 4.5-5"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : isCurrent ? (
                    <div className="h-2 w-2 rounded-full bg-white" aria-hidden="true" />
                  ) : (
                    <div
                      className="h-2 w-2 rounded-full bg-[#F2F2F7]"
                      aria-hidden="true"
                    />
                  )}
                </div>

                {/* Label */}
                <span
                  className={`mt-2 text-[11px] font-medium text-center leading-tight sm:text-[12px] ${
                    isCurrent
                      ? 'text-[#0A84FF] font-semibold'
                      : isCompleted
                        ? 'text-[#34C759]'
                        : 'text-[#6E6E73]'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
