package cl.rednorte.ms_login_user.auth.service;

import cl.rednorte.ms_login_user.auth.config.SecurityProperties;
import dev.samstevens.totp.code.*;
import dev.samstevens.totp.exceptions.QrGenerationException;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Base64;

@Service
@RequiredArgsConstructor
public class TotpService {

    private final SecurityProperties props;
    private final SecretGenerator secretGenerator = new DefaultSecretGenerator();
    private final QrGenerator qrGenerator = new ZxingPngQrGenerator();
    private final TimeProvider timeProvider = new SystemTimeProvider();

    public String generateSecret() {
        return secretGenerator.generate();
    }

    /**
     * Genera un PNG (base64) con el QR para escanear en Google/Microsoft Authenticator.
     */
    public String generateQrDataUri(String secret, String username) {
        QrData data = new QrData.Builder()
                .label(username)
                .secret(secret)
                .issuer(props.getOtp().getIssuer())
                .algorithm(HashingAlgorithm.SHA1)
                .digits(props.getOtp().getDigits())
                .period(props.getOtp().getPeriodSeconds())
                .build();
        try {
            byte[] png = qrGenerator.generate(data);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(png);
        } catch (QrGenerationException e) {
            throw new IllegalStateException("No se pudo generar el QR TOTP", e);
        }
    }

    public boolean verify(String secret, String code) {
        if (secret == null || code == null) return false;
        CodeGenerator generator = new DefaultCodeGenerator(HashingAlgorithm.SHA1, props.getOtp().getDigits());
        DefaultCodeVerifier verifier = new DefaultCodeVerifier(generator, timeProvider);
        verifier.setAllowedTimePeriodDiscrepancy(props.getOtp().getAllowedDiscrepancy());
        return verifier.isValidCode(secret, code);
    }
}
