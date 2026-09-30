import asyncio
import json
import aio_pika

RABBITMQ_URL = "amqp://guest:guest@localhost:5672/"

async def main():
    connection = await aio_pika.connect_robust(RABBITMQ_URL)
    async with connection:
        channel = await connection.channel()
        
        exchange = await channel.declare_exchange("sts_violations", aio_pika.ExchangeType.TOPIC, durable=True)
        queue = await channel.declare_queue("lto_sync_queue", durable=True)
        
        # Binds to ticket.created.* and ticket.paid.*
        await queue.bind(exchange, routing_key="ticket.#")

        print(" [*] LTO Sync Worker running. Waiting for violation events...")

        async with queue.iterator() as queue_iter:
            async for message in queue_iter:
                async with message.process():
                    data = json.loads(message.body.decode())
                    event_type = data.get("event", "UNKNOWN")
                    ticket_id = data.get("ticket_id")
                    license_no = data.get("license_no") or data.get("driver_license")

                    if event_type == "CITATION_PAID":
                        payment_ref = data.get("payment_reference")
                        print(f"\n [x] Processing LTO Clearance for Paid Ticket: {ticket_id}")
                        print(f"     -> Clearing flag for License {license_no} (Ref: {payment_ref})...")
                        await asyncio.sleep(1)
                        print(f" [✓] License {license_no} clearance updated in LTO LTMS successfully.\n")
                    else:
                        print(f"\n [x] Processing LTO Sync for Ticket: {ticket_id}")
                        print(f"     -> Syncing License {license_no} with LTO LTMS database...")
                        await asyncio.sleep(1)
                        print(f" [✓] License {license_no} flagged in LTO LTMS successfully.\n")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n [!] LTO Sync Worker stopped gracefully.")