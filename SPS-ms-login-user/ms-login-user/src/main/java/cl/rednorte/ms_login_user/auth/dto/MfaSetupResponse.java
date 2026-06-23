package cl.rednorte.ms_login_user.auth.dto;

/**
 * Respuesta al iniciar el alta de MFA. {@code secret} es el secreto base32
 * que el cliente puede ingresar manualmente; {@code qrDataUri} es un PNG
 * embebido (data URI) para escanear con Authenticator. El usuario aún
 * debe confirmar el alta llamando a {@code POST /auth/mfa/enable} con un
 * código válido.
 */
public record MfaSetupResponse(String secret, String qrDataUri) {}
