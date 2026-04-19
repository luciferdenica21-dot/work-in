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
  onManagerLog,
  onOrderPrepared,
  onRestart,
  initialBrief,
  onTransferToManager,
  onContractCompleted,
  onCloseAssistant,
  resetNonce
}) {
  const { t, i18n } = useTranslation();
  const lang2 = pickLang2(i18n?.language);
  const MotionDiv = motion.div;

  const onAssistantMessageRef = useRef(onAssistantMessage);
  const onManagerLogRef = useRef(onManagerLog);
  const onModeChangeRef = useRef(onModeChange);
  const onOrderPreparedRef = useRef(onOrderPrepared);
  const onRestartRef = useRef(onRestart);
  const onTransferToManagerRef = useRef(onTransferToManager);
  const onContractCompletedRef = useRef(onContractCompleted);
  useEffect(() => { onAssistantMessageRef.current = onAssistantMessage; }, [onAssistantMessage]);
  useEffect(() => { onManagerLogRef.current = onManagerLog; }, [onManagerLog]);
  useEffect(() => { onModeChangeRef.current = onModeChange; }, [onModeChange]);
  useEffect(() => { onOrderPreparedRef.current = onOrderPrepared; }, [onOrderPrepared]);
  useEffect(() => { onRestartRef.current = onRestart; }, [onRestart]);
  useEffect(() => { onTransferToManagerRef.current = onTransferToManager; }, [onTransferToManager]);
  useEffect(() => { onContractCompletedRef.current = onContractCompleted; }, [onContractCompleted]);

  const [stepId, setStepId] = useState(flowConfig.initialStepId);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [customAnswerText, setCustomAnswerText] = useState({});
  const [historyLen, setHistoryLen] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    stepData: {},
    brief: {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    },
    specialWishes: ''
  });

  const fileInputRef = useRef(null);
  const fileTargetStepRef = useRef(null);
  const historyRef = useRef([]);
  const prevStepRef = useRef(null);
  const lastPromptRef = useRef('');

  const step = flowConfig.steps[stepId];
  const isPanelActive = mode === 'assistant' || mode === 'locked' || mode === 'manager';
  const isScripted = mode === 'assistant';
  const startNewSession = () => {
    prevStepRef.current = null;
    lastPromptRef.current = '';
    historyRef.current = [];
    setStepId(flowConfig.initialStepId);
    setQuestionIndex(0);
    const b = initialBrief && typeof initialBrief === 'object' ? initialBrief : {};
    setOrderSession({
      startedAt: new Date().toISOString(),
      meta: { hasSpecificRequest: null, consultFormat: null, hasProject: null, needsCorrection: null },
      selectedServices: [],
      answers: {},
      stepData: {},
      brief: { firstName: String(b.firstName || ''), lastName: String(b.lastName || ''), email: String(b.email || ''), phone: String(b.phone || '') },
      specialWishes: ''
    });
    setCustomAnswerText({});
    setIsSubmitting(false);
    setHistoryLen(0);
  };

  useEffect(() => {
    if (resetNonce == null) return;
    const id = setTimeout(() => {
      prevStepRef.current = null;
      lastPromptRef.current = '';
      historyRef.current = [];
      setStepId(flowConfig.initialStepId);
      setQuestionIndex(0);
      const b = initialBrief && typeof initialBrief === 'object' ? initialBrief : {};
      setOrderSession({
        startedAt: null,
        meta: { hasSpecificRequest: null, consultFormat: null, hasProject: null, needsCorrection: null },
        selectedServices: [],
        answers: {},
        stepData: {},
        brief: { firstName: String(b.firstName || ''), lastName: String(b.lastName || ''), email: String(b.email || ''), phone: String(b.phone || '') },
        specialWishes: ''
      });
      onModeChangeRef.current?.('locked');
      setIsSubmitting(false);
      setCustomAnswerText({});
      setHistoryLen(0);
    }, 0);
    return () => clearTimeout(id);
  }, [resetNonce]);

  const cloneOrderSession = (s) => {
    const src = s && typeof s === 'object' ? s : {};
    const stepData = src.stepData && typeof src.stepData === 'object' ? src.stepData : {};
    const stepDataCopy = {};
    Object.entries(stepData).forEach(([k, v]) => {
      const vv = v && typeof v === 'object' ? v : {};
      stepDataCopy[k] = {
        wishes: vv.wishes || '',
        files: Array.isArray(vv.files) ? vv.files.map((f) => ({ ...f })) : []
      };
    });
    return {
      startedAt: src.startedAt || null,
      meta: { ...(src.meta || {}) },
      selectedServices: Array.isArray(src.selectedServices) ? [...src.selectedServices] : [],
      answers: { ...(src.answers || {}) },
      stepData: stepDataCopy,
      brief: { ...(src.brief || {}) },
      specialWishes: src.specialWishes || ''
    };
  };

  const pushHistory = () => {
    historyRef.current = [
      ...(historyRef.current || []),
      {
        stepId,
        questionIndex,
        orderSession: cloneOrderSession(orderSession),
        customAnswerText: { ...(customAnswerText || {}) }
      }
    ].slice(-100);
    setHistoryLen((historyRef.current || []).length);
  };

  const canGoBack = mode === 'assistant' && !isSubmitting && historyLen > 0;

  const goBack = () => {
    const list = historyRef.current || [];
    if (!list.length) return;
    const last = list[list.length - 1];
    historyRef.current = list.slice(0, -1);
    setStepId(last.stepId);
    setQuestionIndex(last.questionIndex);
    setOrderSession(last.orderSession);
    setCustomAnswerText(last.customAnswerText || {});
    setHistoryLen((historyRef.current || []).length);
  };

  useEffect(() => {
    if (!isScripted) return;
    if (!step) return;
    if (prevStepRef.current === stepId) return;
    prevStepRef.current = stepId;
    const messages = Array.isArray(step.messageKeys) ? step.messageKeys : [];
    for (const key of messages) {
      try { onAssistantMessageRef.current?.(t(key)); } catch { void 0; }
    }
  }, [isScripted, step, stepId, t]);

  const quickActions = useMemo(() => {
    if (!isPanelActive) return [];
    if (!step) return [];
    return Array.isArray(step.actions) ? step.actions : [];
  }, [isPanelActive, step]);

  const chooseAction = async (action) => {
    if (!action || !isPanelActive) return;

    if (action.id === 'start_ai' && mode === 'locked') {
      try { onRestartRef.current?.(); } catch { void 0; }
      startNewSession();
      onModeChangeRef.current?.('assistant');
    }

    if (action.type === 'contact_manager') {
      onModeChangeRef.current?.('manager');
      try { onAssistantMessageRef.current?.(t('smart_manager_enabled')); } catch { void 0; }
      try { onTransferToManagerRef.current?.({ reasonKey: action.reasonKey || 'smart_reason_contact_manager', stepId }); } catch { void 0; }
      return;
    }

    if (action.type === 'transfer_manager') {
      onModeChangeRef.current?.('manager');
      try { onAssistantMessageRef.current?.(t('smart_manager_enabled')); } catch { void 0; }
      try { onTransferToManagerRef.current?.({ reasonKey: action.reasonKey || 'smart_reason_contact_manager', stepId }); } catch { void 0; }
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
        stepData: {},
        brief: { firstName: '', lastName: '', email: '', phone: '' },
        specialWishes: ''
      });
      onModeChangeRef.current?.('locked');
      return;
    }

    if (action.set && typeof action.set === 'object') {
      setOrderSession((prev) => ({ ...prev, meta: { ...(prev.meta || {}), ...action.set } }));
    }

    if (action.type === 'services_continue') {
      if ((orderSession.selectedServices || []).length === 0) {
        try { onAssistantMessageRef.current?.(t('smart_pick_at_least_one')); } catch { void 0; }
        return;
      }
      pushHistory();
      setQuestionIndex(0);
      setStepId((orderSession.selectedServices || []).length === 1 ? 'form_single' : 'form_multi');
      return;
    }

    if (action.type === 'generate_order') {
      setIsSubmitting(true);
      try {
        const sd = orderSession.stepData && typeof orderSession.stepData === 'object' ? orderSession.stepData : {};
        Object.entries(sd).forEach(([k, v]) => {
          const w = String(v?.wishes || '').trim();
          if (w) onManagerLogRef.current?.(`Клиент оставил пожелания (${k}): ${w}`);
        });
      } catch { void 0; }
      try {
        const sd = orderSession.stepData && typeof orderSession.stepData === 'object' ? orderSession.stepData : {};
        Object.entries(sd).forEach(([k, v]) => {
          const files = Array.isArray(v?.files) ? v.files : [];
          if (!files.length) return;
          const names = files.map((f) => f?.name).filter(Boolean).slice(0, 10).join(', ');
          onManagerLogRef.current?.(`Клиент приложил файлы (${k}): ${names || `${files.length} шт.`}`);
        });
      } catch { void 0; }

      const flattenedFiles = [];
      try {
        const sd = orderSession.stepData && typeof orderSession.stepData === 'object' ? orderSession.stepData : {};
        Object.entries(sd).forEach(([k, v]) => {
          const files = Array.isArray(v?.files) ? v.files : [];
          files.forEach((f) => flattenedFiles.push({ ...f, __stepKey: k }));
        });
      } catch { void 0; }

      const payload = {
        version: 1,
        flow: 'SmartOrderSystem',
        startedAt: orderSession.startedAt,
        language: lang2,
        orderSession: {
          ...orderSession,
          files: flattenedFiles.map((f) => ({
            name: f.name,
            type: f.type,
            size: f.size,
            file: f.file,
            stepKey: f.__stepKey
          }))
        }
      };

      // SERVER_ACTION: Send payload to ManagerPanelPro via API (Node.js/Supabase) as "New formed order"
      // SERVER_ACTION: Generate agreement + invoice documents and attach them to the order
      // SERVER_ACTION: Start e-signature flow for acceptance act
      console.log('SMART_ORDER_NEW_ORDER', payload);

      try { await onOrderPreparedRef.current?.(payload); } catch { void 0; }
      try { onAssistantMessageRef.current?.(t('smart_order_prepared')); } catch { void 0; }
      return;
    }

    if (action.type === 'sign_act') {
      // SERVER_ACTION: Create acceptance act and launch e-signature
      try { onAssistantMessageRef.current?.(t('smart_sign_act_info')); } catch { void 0; }
      return;
    }

    if (action.type === 'next' && action.nextStepId) {
      pushHistory();
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
    if (!isScripted) return;
    if (!currentQuestion) return;
    const key = `${stepId}:${questionIndex}:${currentQuestion.id}`;
    if (lastPromptRef.current === key) return;
    lastPromptRef.current = key;
    try { onAssistantMessageRef.current?.(t(currentQuestion.messageKey)); } catch { void 0; }
  }, [currentQuestion, isScripted, questionIndex, stepId, t]);

  const chooseOption = (questionId, optionId) => {
    const question = currentQuestion;
    const option = (question?.options || []).find(o => o.id === optionId);
    if (question && option) {
      try {
        onManagerLogRef.current?.(`Клиент выбрал ответ: ${t(question.messageKey)} — ${t(option.labelKey)}`);
      } catch { void 0; }
    }

    if (optionId === 'custom' && (questionId === 'deadline' || questionId === 'quantity')) {
      pushHistory();
      const txt = String(customAnswerText?.[questionId] || '');
      setOrderSession((prev) => ({
        ...prev,
        answers: { ...(prev.answers || {}), [questionId]: { type: 'custom', text: txt } },
        stepData: { ...(prev.stepData || {}), [`q_${questionId}`]: { ...((prev.stepData || {})[`q_${questionId}`] || {}), wishes: txt } }
      }));
      return;
    }

    pushHistory();
    setOrderSession((prev) => {
      const sd = prev.stepData && typeof prev.stepData === 'object' ? prev.stepData : {};
      const key = `q_${questionId}`;
      const nextSd = (questionId === 'deadline' || questionId === 'quantity') ? { ...sd, [key]: { ...(sd[key] || {}), wishes: '' } } : sd;
      return { ...prev, answers: { ...(prev.answers || {}), [questionId]: optionId }, stepData: nextSd };
    });
    const total =
      step.type === 'questionnaire_single'
        ? flowConfig.questionnaires.single.length
        : flowConfig.questionnaires.multi.length;

    if (questionIndex + 1 >= total) {
      setStepId('brief_form');
      setQuestionIndex(0);
      return;
    }
    setQuestionIndex((i) => i + 1);
  };

  const toggleService = (serviceId) => {
    const svc = flowConfig.services.find(s => s.id === serviceId);
    pushHistory();
    setOrderSession((prev) => {
      const set0 = new Set(prev.selectedServices || []);
      const active = set0.has(serviceId);
      if (active) {
        set0.delete(serviceId);
        if (svc) try { onManagerLogRef.current?.(`Клиент убрал услугу: ${t(svc.labelKey)}`); } catch { void 0; }
      } else {
        set0.add(serviceId);
        if (svc) try { onManagerLogRef.current?.(`Клиент добавил услугу: ${t(svc.labelKey)}`); } catch { void 0; }
      }
      return { ...prev, selectedServices: Array.from(set0) };
    });
  };

  const openFilePicker = (stepKey) => {
    fileTargetStepRef.current = stepKey || stepId;
    fileInputRef.current?.click();
  };

  const onFilesPicked = (e) => {
    const list = Array.from(e.target.files || []);
    if (list.length === 0) return;
    const stepKey = String(fileTargetStepRef.current || stepId || 'step');
    setOrderSession((prev) => {
      const sd = prev.stepData && typeof prev.stepData === 'object' ? prev.stepData : {};
      const cur = sd[stepKey] || {};
      const files0 = Array.isArray(cur.files) ? cur.files : [];
      const nextFiles = [...files0, ...list.map((f) => ({ name: f.name, type: f.type, size: f.size, file: f }))];
      return { ...prev, stepData: { ...sd, [stepKey]: { ...cur, files: nextFiles } } };
    });
    try { onAssistantMessageRef.current?.(t('smart_files_added', { count: list.length })); } catch { void 0; }
    try {
      const names = list.map((f) => f?.name).filter(Boolean).slice(0, 10).join(', ');
      onManagerLogRef.current?.(`Клиент прикрепил файлы (${stepKey}): ${names || `${list.length} шт.`}`);
    } catch { void 0; }
    try { e.target.value = ''; } catch { void 0; }
  };

  const removeFile = (stepKey, idx) => {
    setOrderSession((prev) => {
      const sd = prev.stepData && typeof prev.stepData === 'object' ? prev.stepData : {};
      const cur = sd[stepKey] || {};
      const files0 = Array.isArray(cur.files) ? cur.files : [];
      return { ...prev, stepData: { ...sd, [stepKey]: { ...cur, files: files0.filter((_, i) => i !== idx) } } };
    });
  };

  if (!isPanelActive) return null;

  return (
    <div className="border-b border-white/10 bg-[#050a18]/95">
      <div className="px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[10px] tracking-[0.2em] uppercase text-white/60 truncate">
            {t('smart_panel_title')}
          </div>
          <div className="flex items-center gap-2">
            {canGoBack && (
              <button
                type="button"
                onClick={goBack}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 text-[12px] hover:bg-white/10 min-h-[44px]"
              >
                {t('smart_back')}
              </button>
            )}
            {mode === 'assistant' && (
              <button
                type="button"
                onClick={() => {
                  try { onRestartRef.current?.(); } catch { void 0; }
                  startNewSession();
                  onModeChangeRef.current?.('assistant');
                }}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 text-[12px] hover:bg-white/10 min-h-[44px]"
              >
                {t('smart_refresh_ai')}
              </button>
            )}

            {mode === 'assistant' && (
              <button
                type="button"
                onClick={() => onCloseAssistant?.()}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 text-[12px] hover:bg-white/10 min-h-[44px]"
              >
                {t('smart_close')}
              </button>
            )}

            {mode === 'manager' ? (
              <button
                type="button"
                onClick={() => {
                  startNewSession();
                  onModeChangeRef.current?.('assistant');
                  onRestartRef.current?.();
                }}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-[12px] hover:bg-white/10 min-h-[44px]"
              >
                {t('smart_start_ai')}
              </button>
            ) : mode === 'locked' ? (
              <button
                type="button"
                onClick={() => chooseAction({ id: 'start_ai' })}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-[12px] hover:bg-white/10 min-h-[44px]"
              >
                {t('smart_start_ai')}
              </button>
            ) : null}

            {mode !== 'manager' && (
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

        {mode === 'manager' && (
          <div className="mt-2 text-[11px] text-white/60">
            {t('smart_manager_enabled')}
          </div>
        )}

        {mode === 'assistant' ? (
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
                <div className="space-y-2">
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
                  <textarea
                    value={orderSession.stepData?.[stepId]?.wishes || ''}
                    onChange={(e) => setOrderSession((p) => ({
                      ...p,
                      stepData: { ...(p.stepData || {}), [stepId]: { ...((p.stepData || {})[stepId] || {}), wishes: e.target.value } }
                    }))}
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-[12px] outline-none focus:border-blue-500/40 resize-none"
                    placeholder={t('smart_special_wishes')}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openFilePicker(stepId)}
                      className="min-h-[44px] px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-[12px] hover:bg-white/10"
                    >
                      {t('smart_upload_files')}
                    </button>
                  </div>
                  {(orderSession.stepData?.[stepId]?.files || []).length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] text-white/60">{t('smart_files')}</div>
                      <div className="flex flex-col gap-2">
                        {(orderSession.stepData?.[stepId]?.files || []).slice(0, 5).map((f, idx) => (
                          <div key={`${f.name}-${idx}`} className="flex items-center justify-between gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                            <div className="min-w-0">
                              <div className="text-[12px] text-white truncate">{f.name}</div>
                              <div className="text-[10px] text-white/50 truncate">{f.type || 'file'}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(stepId, idx)}
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

              {step?.type === 'brief_form' ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      value={orderSession.brief?.firstName || ''}
                      onChange={(e) => setOrderSession((p) => ({ ...p, brief: { ...(p.brief || {}), firstName: e.target.value } }))}
                      placeholder={t('smart_brief_first_name')}
                      className="min-h-[44px] px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-[12px] outline-none focus:border-blue-500/40"
                    />
                    <input
                      value={orderSession.brief?.lastName || ''}
                      onChange={(e) => setOrderSession((p) => ({ ...p, brief: { ...(p.brief || {}), lastName: e.target.value } }))}
                      placeholder={t('smart_brief_last_name')}
                      className="min-h-[44px] px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-[12px] outline-none focus:border-blue-500/40"
                    />
                    <input
                      value={orderSession.brief?.email || ''}
                      onChange={(e) => setOrderSession((p) => ({ ...p, brief: { ...(p.brief || {}), email: e.target.value } }))}
                      placeholder={t('smart_brief_email')}
                      className="min-h-[44px] px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-[12px] outline-none focus:border-blue-500/40"
                    />
                    <input
                      value={orderSession.brief?.phone || ''}
                      onChange={(e) => setOrderSession((p) => ({ ...p, brief: { ...(p.brief || {}), phone: e.target.value } }))}
                      placeholder={t('smart_brief_phone')}
                      className="min-h-[44px] px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-[12px] outline-none focus:border-blue-500/40"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const b = orderSession.brief || {};
                        const ok = String(b.firstName || '').trim() && String(b.lastName || '').trim() && String(b.email || '').trim() && String(b.phone || '').trim();
                        if (!ok) {
                          try { onAssistantMessageRef.current?.(t('smart_brief_required')); } catch { void 0; }
                          return;
                        }
                        try {
                          onManagerLogRef.current?.(`Клиент заполнил данные заказчика: ${String(b.firstName || '').trim()} ${String(b.lastName || '').trim()}, ${String(b.email || '').trim()}, ${String(b.phone || '').trim()}`);
                        } catch { void 0; }
                        setStepId('finalize');
                      }}
                      className="min-h-[44px] px-4 py-3 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-200 text-[12px] hover:bg-blue-600/30"
                    >
                      {t('smart_continue')}
                    </button>
                  </div>
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
                  {currentQuestion && (currentQuestion.id === 'deadline' || currentQuestion.id === 'quantity') && (
                    <>
                      {orderSession.answers?.[currentQuestion.id]?.type === 'custom' && (
                        <textarea
                          value={customAnswerText?.[currentQuestion.id] || ''}
                          onChange={(e) => {
                            const txt = e.target.value;
                            setCustomAnswerText((p) => ({ ...(p || {}), [currentQuestion.id]: txt }));
                            setOrderSession((prev) => ({
                              ...prev,
                              answers: { ...(prev.answers || {}), [currentQuestion.id]: { type: 'custom', text: String(txt || '') } },
                              stepData: { ...(prev.stepData || {}), [`q_${currentQuestion.id}`]: { ...((prev.stepData || {})[`q_${currentQuestion.id}`] || {}), wishes: String(txt || '') } }
                            }));
                          }}
                          rows={3}
                          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-[12px] outline-none focus:border-blue-500/40 resize-none"
                          placeholder={t('smart_custom_placeholder')}
                        />
                      )}

                      {orderSession.answers?.[currentQuestion.id]?.type === 'custom' && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const total =
                                step.type === 'questionnaire_single'
                                  ? flowConfig.questionnaires.single.length
                                  : flowConfig.questionnaires.multi.length;

                              if (questionIndex + 1 >= total) {
                                setStepId('brief_form');
                                setQuestionIndex(0);
                                return;
                              }
                              setQuestionIndex((i) => i + 1);
                            }}
                            className="min-h-[44px] px-4 py-3 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-200 text-[12px] hover:bg-blue-600/30"
                          >
                            {t('smart_continue')}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : null}

              {step?.type !== 'service_grid' && step?.type !== 'questionnaire_single' && step?.type !== 'questionnaire_multi' && step?.type !== 'brief_form' ? (
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
        ) : null}
      </div>

      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={onFilesPicked} />
    </div>
  );
}
