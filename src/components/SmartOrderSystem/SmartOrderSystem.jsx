import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { flowConfig } from './flowConfig';

const pickLang2 = (lng) => {
  const l = String(lng || '').toLowerCase();
  if (l.startsWith('ka')) return 'ka';
  if (l.startsWith('en')) return 'en';
  return 'ru';
};

export default function SmartOrderSystem({
  mode,
  onModeChange,
  onAssistantMessage,
  onOrderPrepared,
  onRestart
}) {
  const { t, i18n } = useTranslation();
  const lang2 = pickLang2(i18n?.language);
  const MotionDiv = motion.div;

  const [stepId, setStepId] = useState(flowConfig.initialStepId);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [orderSession, setOrderSession] = useState({
    startedAt: null,
    meta: {
      hasSpecificRequest: null,
      consultFormat: null,
      hasProject: null,
      needsCorrection: null
    },
    selectedServices: [],
    answers: {},
    files: []
  });

  const fileInputRef = useRef(null);
  const prevStepRef = useRef(null);

  const step = flowConfig.steps[stepId];
  const isAssistantActive = mode === 'assistant' || mode === 'locked' || mode === 'manager';

  useEffect(() => {
    if (!isAssistantActive) return;
    if (!step) return;
    if (prevStepRef.current === stepId) return;
    prevStepRef.current = stepId;
    const messages = Array.isArray(step.messageKeys) ? step.messageKeys : [];
    for (const key of messages) {
      onAssistantMessage?.(t(key));
    }
  }, [isAssistantActive, onAssistantMessage, step, stepId, t]);

  const quickActions = useMemo(() => {
    if (!isAssistantActive) return [];
    if (!step) return [];
    return Array.isArray(step.actions) ? step.actions : [];
  }, [isAssistantActive, step]);

  const chooseAction = async (action) => {
    if (!action || !isAssistantActive) return;

    if (action.id === 'start_ai' && mode === 'locked') {
      setOrderSession((prev) => (prev.startedAt ? prev : { ...prev, startedAt: new Date().toISOString() }));
      onModeChange?.('assistant');
    }

    if (action.type === 'contact_manager') {
      onModeChange?.('manager');
      onAssistantMessage?.(t('smart_manager_enabled'));
      return;
    }

    if (action.type === 'end') {
      setStepId(flowConfig.initialStepId);
      setQuestionIndex(0);
      setOrderSession({
        startedAt: null,
        meta: { hasSpecificRequest: null, consultFormat: null, hasProject: null, needsCorrection: null },
        selectedServices: [],
        answers: {},
        files: []
      });
      onModeChange?.('locked');
      return;
    }

    if (action.set && typeof action.set === 'object') {
      setOrderSession((prev) => ({ ...prev, meta: { ...(prev.meta || {}), ...action.set } }));
    }

    if (action.type === 'services_continue') {
      if ((orderSession.selectedServices || []).length === 0) {
        onAssistantMessage?.(t('smart_pick_at_least_one'));
        return;
      }
      setQuestionIndex(0);
      setStepId((orderSession.selectedServices || []).length === 1 ? 'form_single' : 'form_multi');
      return;
    }

    if (action.type === 'generate_order') {
      const payload = {
        version: 1,
        flow: 'SmartOrderSystem',
        startedAt: orderSession.startedAt,
        language: lang2,
        orderSession: {
          ...orderSession,
          files: (orderSession.files || []).map((f) => ({ name: f.name, type: f.type, size: f.size }))
        }
      };

      // SERVER_ACTION: Send payload to ManagerPanelPro via API (Node.js/Supabase) as "New formed order"
      // SERVER_ACTION: Generate agreement + invoice documents and attach them to the order
      // SERVER_ACTION: Start e-signature flow for acceptance act
      console.log('SMART_ORDER_NEW_ORDER', payload);

      onOrderPrepared?.(payload);
      onAssistantMessage?.(t('smart_order_prepared'));
      return;
    }

    if (action.type === 'sign_act') {
      // SERVER_ACTION: Create acceptance act and launch e-signature
      onAssistantMessage?.(t('smart_sign_act_info'));
      return;
    }

    if (action.type === 'next' && action.nextStepId) {
      setQuestionIndex(0);
      setStepId(action.nextStepId);
    }
  };

  const currentQuestion = useMemo(() => {
    if (!step) return null;
    if (step.type === 'questionnaire_single') return flowConfig.questionnaires.single[questionIndex] || null;
    if (step.type === 'questionnaire_multi') return flowConfig.questionnaires.multi[questionIndex] || null;
    return null;
  }, [questionIndex, step]);

  useEffect(() => {
    if (!isAssistantActive) return;
    if (!currentQuestion) return;
    onAssistantMessage?.(t(currentQuestion.messageKey));
  }, [currentQuestion, isAssistantActive, onAssistantMessage, t]);

  const chooseOption = (questionId, optionId) => {
    setOrderSession((prev) => ({ ...prev, answers: { ...(prev.answers || {}), [questionId]: optionId } }));
    const total =
      step.type === 'questionnaire_single'
        ? flowConfig.questionnaires.single.length
        : flowConfig.questionnaires.multi.length;

    if (questionIndex + 1 >= total) {
      setStepId('finalize');
      setQuestionIndex(0);
      return;
    }
    setQuestionIndex((i) => i + 1);
  };

  const toggleService = (serviceId) => {
    setOrderSession((prev) => {
      const set0 = new Set(prev.selectedServices || []);
      if (set0.has(serviceId)) set0.delete(serviceId);
      else set0.add(serviceId);
      return { ...prev, selectedServices: Array.from(set0) };
    });
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const onFilesPicked = (e) => {
    const list = Array.from(e.target.files || []);
    if (list.length === 0) return;
    setOrderSession((prev) => ({
      ...prev,
      files: [...(prev.files || []), ...list.map((f) => ({ name: f.name, type: f.type, size: f.size, file: f }))]
    }));
    onAssistantMessage?.(t('smart_files_added', { count: list.length }));
    try { e.target.value = ''; } catch { void 0; }
  };

  const removeFile = (idx) => {
    setOrderSession((prev) => ({ ...prev, files: (prev.files || []).filter((_, i) => i !== idx) }));
  };

  if (!isAssistantActive) return null;

  return (
    <div className="border-b border-white/10 bg-[#050a18]/95">
      <div className="px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[10px] tracking-[0.2em] uppercase text-white/60 truncate">
            {t('smart_panel_title')}
          </div>
          <div className="flex items-center gap-2">
            {mode === 'manager' ? (
              <button
                type="button"
                onClick={() => {
                  onModeChange?.('assistant');
                  onRestart?.();
                }}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-[12px] hover:bg-white/10 min-h-[44px]"
              >
                {t('smart_start_ai')}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => chooseAction({ type: 'contact_manager' })}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-[12px] hover:bg-white/10 min-h-[44px]"
              >
                {t('smart_contact_manager')}
              </button>
            )}
          </div>
        </div>

        <div className="mt-3">
          <AnimatePresence mode="popLayout" initial={false}>
            <MotionDiv
              key={`${stepId}-${(orderSession.selectedServices || []).join(',')}-${questionIndex}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="space-y-3"
            >
              {step?.type === 'service_grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {flowConfig.services.map((svc) => {
                    const active = (orderSession.selectedServices || []).includes(svc.id);
                    const disabled = !svc.enabled;
                    return (
                      <button
                        key={svc.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => toggleService(svc.id)}
                        className={[
                          'min-h-[44px] px-3 py-3 rounded-xl border text-left transition',
                          disabled ? 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed' : 'bg-white/5 border-white/10 text-white hover:bg-white/10',
                          active ? 'ring-1 ring-blue-500/60 border-blue-500/40' : ''
                        ].join(' ')}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-[13px] leading-snug">{t(svc.labelKey)}</div>
                          {svc.badgeKey && (
                            <span className="shrink-0 px-2 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] text-white/60">
                              {t(svc.badgeKey)}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {step?.type === 'questionnaire_single' || step?.type === 'questionnaire_multi' ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {(currentQuestion?.options || []).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => chooseOption(currentQuestion.id, opt.id)}
                        className="min-h-[44px] px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-[12px] hover:bg-white/10"
                      >
                        {t(opt.labelKey)}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={openFilePicker}
                      className="min-h-[44px] px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-[12px] hover:bg-white/10"
                    >
                      {t('smart_upload_files')}
                    </button>
                  </div>

                  {(orderSession.files || []).length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] text-white/60">{t('smart_files')}</div>
                      <div className="flex flex-col gap-2">
                        {(orderSession.files || []).slice(0, 5).map((f, idx) => (
                          <div key={`${f.name}-${idx}`} className="flex items-center justify-between gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                            <div className="min-w-0">
                              <div className="text-[12px] text-white truncate">{f.name}</div>
                              <div className="text-[10px] text-white/50 truncate">{f.type || 'file'}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(idx)}
                              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
                              aria-label={t('smart_remove')}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {step?.type !== 'service_grid' && step?.type !== 'questionnaire_single' && step?.type !== 'questionnaire_multi' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {quickActions.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => chooseAction(a)}
                      className="min-h-[44px] px-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-[12px] hover:bg-white/10"
                    >
                      {t(a.labelKey)}
                    </button>
                  ))}
                </div>
              ) : null}

              {step?.type === 'service_grid' ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => chooseAction({ type: 'services_continue' })}
                    className="min-h-[44px] px-4 py-3 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-200 text-[12px] hover:bg-blue-600/30"
                  >
                    {t('smart_continue')}
                  </button>
                </div>
              ) : null}
            </MotionDiv>
          </AnimatePresence>
        </div>
      </div>

      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={onFilesPicked} />
    </div>
  );
}
