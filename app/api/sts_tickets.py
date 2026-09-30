from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.schemas import CitationCreate, CitationResponse, PaymentRequest
from app.services.lto_service import LTOService

router = APIRouter(prefix="/api/v1/tickets", tags=["Single Ticketing System (STS)"])


async def publish_sts_event(request: Request, routing_key: str, payload: dict):
    rabbitmq = getattr(request.app.state, "rabbitmq", None)
    if rabbitmq and hasattr(rabbitmq, "channel") and rabbitmq.channel:
        try:
            exchange = await rabbitmq.channel.get_exchange("sts_violations")
            import json
            import aio_pika

            message = aio_pika.Message(
                body=json.dumps(payload).encode(),
                content_type="application/json",
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
            )
            await exchange.publish(message, routing_key=routing_key)
        except Exception as e:
            print(f" [!] Failed to publish RabbitMQ event: {e}")


@router.post("/", response_model=CitationResponse, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    ticket: CitationCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    service = LTOService(db)
    citation = service.create_citation(
        license_no=ticket.driver_license_no,
        plate_no=ticket.vehicle_plate_no,
        violation_code=ticket.violation_code,
        fine_amount=ticket.fine_amount,
        agency=ticket.issuing_agency,
        enforcer_id=ticket.enforcer_id,
        lat=ticket.location_gps.lat,
        lng=ticket.location_gps.lng,
        demerit_points=ticket.demerit_points_added,
    )
    payload = {
        "event": "CITATION_ISSUED",
        "ticket_id": citation.id,
        "license_no": citation.driver_license_no,
        "violation_code": citation.violation_code,
        "fine_amount": citation.fine_amount,
        "timestamp": datetime.utcnow().isoformat(),
    }

    await publish_sts_event(request, "ticket.created.lto_sync", payload)
    return citation


@router.get("/driver/{license_no}", response_model=list[CitationResponse])
async def get_driver_tickets(
    license_no: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return LTOService(db).get_driver_tickets(license_no.strip().upper())


@router.post("/{ticket_id}/pay", status_code=status.HTTP_200_OK)
async def pay_ticket(
    ticket_id: str,
    payment: PaymentRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    citation = LTOService(db).process_payment(ticket_id, payment.payment_reference)
    if citation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket '{ticket_id}' not found.",
        )
    payload = {
        "event": "CITATION_PAID",
        "ticket_id": citation.id,
        "license_no": citation.driver_license_no,
        "payment_reference": citation.payment_reference,
        "timestamp": datetime.utcnow().isoformat(),
    }

    await publish_sts_event(request, "ticket.paid.lto_clearance", payload)
    return {
        "status": "SUCCESS",
        "message": f"Payment recorded for ticket {citation.id}. Clearance event sent to LTO.",
        "data": payload,
    }