package cl.rednorte.ms_login_user.auth.controller;

import cl.rednorte.ms_login_user.auth.dto.*;
import cl.rednorte.ms_login_user.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import cl.rednorte.ms_login_user.security.CustomUserDetails;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticación")
@ConditionalOnProperty(name = "app.security.jwt.dev-keypair-enabled", havingValue = "true")
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Login con usuario y contraseña",
               description = "Si el usuario tiene MFA habilitado retorna un challenge; en caso contrario retorna los tokens.")
    @PostMapping("/login")
    public ResponseEntity<LoginResult> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @Operation(summary = "Verificar código OTP",
               description = "Recibe el challenge de MFA y el código de Authenticator. Retorna los tokens si valida.")
    @PostMapping("/otp")
    public ResponseEntity<TokenResponse> verifyOtp(@Valid @RequestBody OtpVerifyRequest req) {
        return ResponseEntity.ok(authService.verifyOtp(req));
    }

    @Operation(summary = "Refrescar tokens",
               description = "Recibe el refresh token y emite un nuevo par access+refresh.")
    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(@Valid @RequestBody RefreshRequest req) {
        return ResponseEntity.ok(authService.refresh(req));
    }

    @Operation(summary = "Inicia alta de MFA",
               description = "Genera un secret TOTP y un QR para escanear con Authenticator. Aún no habilita MFA.")
    @PostMapping("/mfa/setup")
    public ResponseEntity<MfaSetupResponse> setupMfa(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(authService.setupMfa(principal.getUsername()));
    }

    @Operation(summary = "Confirma y activa MFA",
               description = "Valida el primer código generado por Authenticator y deja MFA activo.")
    @PostMapping("/mfa/enable")
    public ResponseEntity<Void> enableMfa(@AuthenticationPrincipal CustomUserDetails principal,
                                          @Valid @RequestBody MfaEnableRequest req) {
        authService.enableMfa(principal.getUsername(), req.code());
        return ResponseEntity.noContent().build();
    }
}
