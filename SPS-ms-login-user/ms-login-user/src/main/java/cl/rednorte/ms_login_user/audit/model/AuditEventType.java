package cl.rednorte.ms_login_user.audit.model;

public enum AuditEventType {
    LOGIN_OK,
    LOGIN_FAILED,
    MFA_OK,
    MFA_FAILED,
    PATIENT_ACCESSED,
    PRACTITIONER_ACCESSED,
    BREAK_GLASS
}
