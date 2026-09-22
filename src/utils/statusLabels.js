// Traducción de despliegue para los valores de estado del CRM (CRM_STATES en
// constants.js). Las claves quedan SIEMPRE en español porque son los valores
// reales que vienen de NocoDB — esto solo traduce lo que se MUESTRA en pantalla.
export const STATUS_LABELS = {
  es: {
    'Nuevo Lead': 'Nuevo Lead',
    'En Conversación': 'En Conversación',
    'Precalificado': 'Precalificado',
    'Descalificado': 'Descalificado',
    'Link Enviado': 'Link Enviado',
    'Agendado': 'Agendado',
    'Asistió': 'Asistió',
    'No Asistió': 'No Asistió',
    'Compró': 'Compró',
    'No Compró': 'No Compró',
    'Cliente Activo': 'Cliente Activo',
    'Plan Terminado': 'Plan Terminado',
    'Recompró': 'Recompró',
    'Canceló Cita': 'Canceló Cita',
    'Requiere Humano': 'Requiere Humano',
  },
  en: {
    'Nuevo Lead': 'New Lead',
    'En Conversación': 'In Conversation',
    'Precalificado': 'Prequalified',
    'Descalificado': 'Disqualified',
    'Link Enviado': 'Link Sent',
    'Agendado': 'Scheduled',
    'Asistió': 'Attended',
    'No Asistió': 'No-show',
    'Compró': 'Purchased',
    'No Compró': 'Did Not Purchase',
    'Cliente Activo': 'Active Client',
    'Plan Terminado': 'Plan Completed',
    'Recompró': 'Repurchased',
    'Canceló Cita': 'Cancelled Appointment',
    'Requiere Humano': 'Needs Human',
  },
};

// Explicaciones del funnel/distribución (Charts.jsx), mismo criterio: clave en
// español (matchea CRM_STATES), texto de display traducido.
export const FUNNEL_TOOLTIPS = {
  es: {
    'Precalificado': 'De los leads que iniciaron conversación, este % superó la calificación inicial. Acumulativo: incluye todos los que avanzaron más (Link Enviado, Agendado, Compró...).',
    'Link Enviado': 'De los Precalificados, este % recibió el link de agendamiento. Acumulativo: incluye los que ya agendaron o compraron.',
    'Agendado': 'De los que recibieron link, este % efectivamente agendó su cita. Acumulativo: incluye los que asistieron y compraron.',
    'Asistió': 'De los Agendados, este % asistió a la consulta. Acumulativo: incluye quienes compraron en esa visita.',
    'Compró': 'De los que asistieron, este % adquirió un plan. Esta es tu tasa de cierre real.',
  },
  en: {
    'Precalificado': 'Of the leads who started a conversation, this % passed the initial qualification. Cumulative: includes everyone who advanced further (Link Sent, Scheduled, Purchased...).',
    'Link Enviado': 'Of the Prequalified, this % received the scheduling link. Cumulative: includes those who already scheduled or purchased.',
    'Agendado': 'Of those who received the link, this % actually scheduled their appointment. Cumulative: includes those who attended and purchased.',
    'Asistió': 'Of those Scheduled, this % attended the consultation. Cumulative: includes those who purchased at that visit.',
    'Compró': 'Of those who attended, this % bought a plan. This is your real closing rate.',
  },
};

export const DISTRIBUTION_TOOLTIPS = {
  es: {
    'En Conversación': 'Leads AHORA en conversación activa (estado "En Conversación" o "Requiere Humano"). Los que avanzaron a otras etapas no se cuentan aquí.',
    'Precalificado': 'Leads AHORA precalificados, esperando recibir el link de agendamiento.',
    'Link Enviado': 'Leads que tienen el link enviado y están AHORA pendientes de agendar su cita.',
    'Agendado': 'Leads con cita programada próxima. Acción: confirmar asistencia.',
    'Asistió': 'Leads que asistieron y están pendientes de decisión. Generalmente transitorio — pasan rápido a Compró o No Compró.',
    'Compró': 'Conversiones exitosas: Compró + Cliente Activo + Plan Terminado + Recompró.',
  },
  en: {
    'En Conversación': 'Leads currently in active conversation (status "In Conversation" or "Needs Human"). Those who advanced to other stages aren\'t counted here.',
    'Precalificado': 'Leads currently prequalified, waiting to receive the scheduling link.',
    'Link Enviado': 'Leads who received the link and are now pending scheduling their appointment.',
    'Agendado': 'Leads with an upcoming scheduled appointment. Action: confirm attendance.',
    'Asistió': 'Leads who attended and are pending a decision. Usually transitory — they move quickly to Purchased or Did Not Purchase.',
    'Compró': 'Successful conversions: Purchased + Active Client + Plan Completed + Repurchased.',
  },
};
