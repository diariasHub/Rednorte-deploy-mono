package cl.rednorte.ms_notificaciones.service;

import io.awspring.cloud.sqs.operations.SqsTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class SqsNotificationPublisher {

    private final SqsTemplate sqsTemplate;

    @Value("${aws.sqs.queue.url}")
    private String queueUrl;

    public void publishNotification(String message) {
        log.info("Publicando mensaje a SQS queue {}: {}", queueUrl, message);
        sqsTemplate.send(to -> to
            .queue(queueUrl)
            .payload(message)
        );
        log.info("Mensaje enviado exitosamente a SQS.");
    }
}
