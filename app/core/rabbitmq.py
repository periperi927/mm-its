import json
import aio_pika
from typing import Any, Dict
from app.config import settings

class RabbitMQManager:
    def __init__(self):
        self.connection: aio_pika.RobustConnection | None = None
        self.channel: aio_pika.RobustChannel | None = None

    async def connect(self):
        """Establish connection and channel to RabbitMQ."""
        self.connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
        self.channel = await self.connection.channel()
        # Declare durable exchange for ticket violations
        await self.channel.declare_exchange("sts_violations", aio_pika.ExchangeType.TOPIC, durable=True)

    async def close(self):
        """Close connection cleanly."""
        if self.connection:
            await self.connection.close()

    async def publish_event(self, routing_key: str, message: Dict[str, Any]):
        """Publish message to the topic exchange."""
        if not self.channel:
            raise RuntimeError("RabbitMQ channel is not initialized.")
        
        exchange = await self.channel.get_exchange("sts_violations")
        await exchange.publish(
            aio_pika.Message(
                body=json.dumps(message).encode(),
                content_type="application/json",
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT
            ),
            routing_key=routing_key
        )

rabbitmq = RabbitMQManager()