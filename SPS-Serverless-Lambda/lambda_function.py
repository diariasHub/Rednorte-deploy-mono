import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Función AWS Lambda (FaaS) que se activa mediante un evento de SQS.
    Procesa las notificaciones enviadas por el microservicio ms-notificaciones.
    """
    logger.info("Lambda activada. Procesando lotes de SQS...")
    
    try:
        # Recorremos los mensajes (records) recibidos de SQS
        for record in event['Records']:
            message_id = record['messageId']
            body = record['body']
            
            # Simulamos el procesamiento de la notificación (ej: enviar SMS, Email, etc.)
            logger.info(f"Procesando Mensaje SQS ID: {message_id}")
            logger.info(f"Cuerpo del mensaje (Notificación): {body}")
            
            # Aquí iría la lógica pesada (AWS SNS para SMS, AWS SES para Email, etc.)
            logger.info("Notificación procesada y 'enviada' al paciente/médico exitosamente.")
            
        return {
            'statusCode': 200,
            'body': json.dumps('Procesamiento Serverless completado con éxito.')
        }
    except Exception as e:
        logger.error(f"Error procesando la notificación: {str(e)}")
        raise e
