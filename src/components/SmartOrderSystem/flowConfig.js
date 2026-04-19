export const flowConfig = {
  initialStepId: 'start',
  services: [
    { id: 'svc_bending', labelKey: 'smart_svc_bending', enabled: true },
    { id: 'svc_laser_engraving', labelKey: 'smart_svc_laser_engraving', enabled: true },
    { id: 'svc_laser_cut_metal', labelKey: 'smart_svc_laser_cut_metal', enabled: true },
    { id: 'svc_laser_cut_nonmetal', labelKey: 'smart_svc_laser_cut_nonmetal', enabled: true },
    { id: 'svc_powder_paint', labelKey: 'smart_svc_powder_paint', enabled: true },
    { id: 'svc_welding', labelKey: 'smart_svc_welding', enabled: true },
    { id: 'svc_mech', labelKey: 'smart_svc_mech', enabled: true },
    { id: 'svc_cnc', labelKey: 'smart_svc_cnc', enabled: true },
    { id: 'svc_liquid_paint', labelKey: 'smart_svc_liquid_paint', enabled: false, badgeKey: 'smart_coming_soon' },
    { id: 'svc_materials', labelKey: 'smart_svc_materials', enabled: false, badgeKey: 'smart_coming_soon' }
  ],
  steps: {
    start: {
      messageKeys: ['smart_greeting'],
      actions: [
        { id: 'start_ai', labelKey: 'smart_start_ai', type: 'next', nextStepId: 'q_specific' }
      ],
      inputLocked: true
    },
    q_specific: {
      messageKeys: ['smart_q_specific'],
      actions: [
        { id: 'specific_yes', labelKey: 'smart_specific_request', type: 'next', nextStepId: 'q_consult_or_tech', set: { hasSpecificRequest: true } },
        { id: 'specific_no', labelKey: 'smart_capabilities', type: 'next', nextStepId: 'gallery', set: { hasSpecificRequest: false } }
      ],
      inputLocked: true
    },
    gallery: {
      messageKeys: ['smart_gallery_title', 'smart_gallery_body'],
      actions: [
        { id: 'back', labelKey: 'smart_back', type: 'next', nextStepId: 'q_specific' }
      ],
      inputLocked: true
    },
    q_consult_or_tech: {
      messageKeys: ['smart_q_consult_or_tech'],
      actions: [
        { id: 'consult', labelKey: 'smart_consultation', type: 'next', nextStepId: 'consult_sale' },
        { id: 'tech', labelKey: 'smart_production', type: 'next', nextStepId: 'project_entry' }
      ],
      inputLocked: true
    },
    consult_sale: {
      messageKeys: ['smart_consult_sale'],
      actions: [
        { id: 'continue', labelKey: 'smart_continue', type: 'next', nextStepId: 'consult_format' }
      ],
      inputLocked: true
    },
    consult_format: {
      messageKeys: ['smart_consult_format'],
      actions: [
        { id: 'online', labelKey: 'smart_online', type: 'transfer_manager', set: { consultFormat: 'online' }, reasonKey: 'smart_reason_consult_online' },
        { id: 'offline', labelKey: 'smart_offline', type: 'next', nextStepId: 'consult_ready', set: { consultFormat: 'offline' } }
      ],
      inputLocked: true
    },
    consult_ready: {
      messageKeys: ['smart_consult_ready'],
      actions: [
        { id: 'ready_yes', labelKey: 'smart_yes', type: 'next', nextStepId: 'project_entry' },
        { id: 'ready_no', labelKey: 'smart_no', type: 'next', nextStepId: 'consult_end' }
      ],
      inputLocked: true
    },
    consult_end: {
      messageKeys: ['smart_consult_end'],
      actions: [
        { id: 'finish', labelKey: 'smart_finish', type: 'end' }
      ],
      inputLocked: true
    },
    project_have_project: {
      messageKeys: ['smart_project_have'],
      actions: [
        { id: 'have_project', labelKey: 'smart_have_project', type: 'next', nextStepId: 'project_need_correction', set: { hasProject: true } },
        { id: 'no_project', labelKey: 'smart_no_project', type: 'next', nextStepId: 'project_have_reference', set: { hasProject: false } }
      ],
      inputLocked: true
    },
    project_entry: {
      messageKeys: ['smart_project_entry'],
      actions: [
        { id: 'have_project', labelKey: 'smart_have_project', type: 'next', nextStepId: 'project_need_correction', set: { hasProject: true } },
        { id: 'have_reference', labelKey: 'smart_have_reference', type: 'next', nextStepId: 'design_offer', set: { hasProject: false } },
        { id: 'need_design', labelKey: 'smart_no_project_need_design', type: 'next', nextStepId: 'project_have_reference', set: { hasProject: false } }
      ],
      inputLocked: true
    },
    project_need_correction: {
      messageKeys: ['smart_project_need_correction'],
      actions: [
        { id: 'corr_no', labelKey: 'smart_no', type: 'next', nextStepId: 'services_select', set: { needsCorrection: false } },
        { id: 'corr_yes', labelKey: 'smart_yes', type: 'next', nextStepId: 'project_have_reference', set: { needsCorrection: true } }
      ],
      inputLocked: true
    },
    project_have_reference: {
      messageKeys: ['smart_project_reference'],
      actions: [
        { id: 'ref_no', labelKey: 'smart_no', type: 'next', nextStepId: 'project_prepare_reference' },
        { id: 'ref_yes', labelKey: 'smart_yes', type: 'next', nextStepId: 'design_offer' }
      ],
      inputLocked: true
    },
    project_prepare_reference: {
      messageKeys: ['smart_prepare_reference'],
      actions: [
        { id: 'need_help', labelKey: 'smart_help_collect_reference', type: 'transfer_manager', reasonKey: 'smart_reason_no_reference' },
        { id: 'back', labelKey: 'smart_back', type: 'next', nextStepId: 'project_have_reference' }
      ],
      inputLocked: true
    },
    design_offer: {
      messageKeys: ['smart_design_offer'],
      actions: [
        { id: 'continue_to_services', labelKey: 'smart_continue', type: 'next', nextStepId: 'services_select' }
      ],
      inputLocked: true
    },
    brief_form: {
      messageKeys: ['smart_brief_intro'],
      type: 'brief_form',
      inputLocked: true
    },
    design_work: {
      messageKeys: ['smart_design_work'],
      actions: [
        { id: 'continue_to_services', labelKey: 'smart_continue_to_services', type: 'next', nextStepId: 'services_select' }
      ],
      inputLocked: true
    },
    services_select: {
      messageKeys: ['smart_select_services'],
      type: 'service_grid',
      actions: [
        { id: 'continue', labelKey: 'smart_continue', type: 'services_continue' }
      ],
      inputLocked: true
    },
    form_single: {
      messageKeys: ['smart_form_single'],
      type: 'questionnaire_single',
      inputLocked: true
    },
    form_multi: {
      messageKeys: ['smart_form_multi'],
      type: 'questionnaire_multi',
      inputLocked: true
    },
    finalize: {
      messageKeys: ['smart_finalize'],
      actions: [
        { id: 'generate_order', labelKey: 'smart_generate_order', type: 'generate_order' }
      ],
      inputLocked: true
    }
  },
  questionnaires: {
    single: [
      { id: 'deadline', messageKey: 'smart_q_deadline', options: [{ id: 'asap', labelKey: 'smart_deadline_asap' }, { id: 'week', labelKey: 'smart_deadline_week' }, { id: 'month', labelKey: 'smart_deadline_month' }, { id: 'custom', labelKey: 'smart_option_custom' }] },
      { id: 'material', messageKey: 'smart_q_material', options: [{ id: 'metal', labelKey: 'smart_material_metal' }, { id: 'plastic', labelKey: 'smart_material_plastic' }, { id: 'wood', labelKey: 'smart_material_wood' }] },
      { id: 'quantity', messageKey: 'smart_q_quantity', options: [{ id: '1', labelKey: 'smart_qty_1' }, { id: '2_10', labelKey: 'smart_qty_2_10' }, { id: '10_plus', labelKey: 'smart_qty_10_plus' }, { id: 'custom', labelKey: 'smart_option_custom' }] }
    ],
    multi: [
      { id: 'deadline', messageKey: 'smart_q_deadline', options: [{ id: 'asap', labelKey: 'smart_deadline_asap' }, { id: 'week', labelKey: 'smart_deadline_week' }, { id: 'month', labelKey: 'smart_deadline_month' }, { id: 'custom', labelKey: 'smart_option_custom' }] },
      { id: 'material', messageKey: 'smart_q_material', options: [{ id: 'metal', labelKey: 'smart_material_metal' }, { id: 'plastic', labelKey: 'smart_material_plastic' }, { id: 'wood', labelKey: 'smart_material_wood' }] },
      { id: 'quantity', messageKey: 'smart_q_quantity', options: [{ id: '1', labelKey: 'smart_qty_1' }, { id: '2_10', labelKey: 'smart_qty_2_10' }, { id: '10_plus', labelKey: 'smart_qty_10_plus' }, { id: 'custom', labelKey: 'smart_option_custom' }] }
    ]
  }
};
