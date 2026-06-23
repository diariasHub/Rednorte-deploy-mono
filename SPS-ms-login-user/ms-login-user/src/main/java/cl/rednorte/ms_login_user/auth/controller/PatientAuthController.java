package cl.rednorte.ms_login_user.auth.controller;

import cl.rednorte.ms_login_user.auth.dto.PatientOtpRequest;
import cl.rednorte.ms_login_user.auth.dto.PatientOtpRequestResponse;
import cl.rednorte.ms_login_user.auth.dto.PatientOtpVerifyRequest;
import cl.rednorte.ms_login_user.auth.dto.TokenResponse;
import cl.rednorte.ms_login_user.auth.service.PatientAuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth/patient")
@RequiredArgsConstructor
@Tag(name = "Autenticación - Paciente")
@ConditionalOnProperty(name = "app.security.jwt.dev-keypair-enabled", havingValue = "true")
public class PatientAuthController {

    private final PatientAuthService patientAuthService;

    @Operation(summary = "Solicita un OTP para el paciente",
               description = "Genera un OTP de 6 dígitos y lo entrega por el canal del paciente " +
                       "(SMS preferente, email fallback). Siempre 200 para no leakear existencia del RUT.")
    @PostMapping("/request-otp")
    public ResponseEntity<PatientOtpRequestResponse> requestOtp(@Valid @RequestBody PatientOtpRequest req) {
        return ResponseEntity.ok(patientAuthService.requestOtp(req.rut()));
    }

    @Operation(summary = "Verifica el OTP del paciente",
               description = "Si el OTP es válido y no ha expirado, emite un token corto con " +
                       "rol PATIENT y claim patient_id. No hay refresh: al expirar, pedir otro OTP.")
    @PostMapping("/verify-otp")
    public ResponseEntity<TokenResponse> verifyOtp(@Valid @RequestBody PatientOtpVerifyRequest req) {
        return ResponseEntity.ok(patientAuthService.verifyOtp(req.rut(), req.code()));
    }
}
