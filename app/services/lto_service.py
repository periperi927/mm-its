from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

from app.models.db_models import ViolationCitationModel
from app.models.schemas import TicketStatus, AgencyType

class LTOService:
    def __init__(self, db: Session):
        self.db = db

    def create_citation(
        self,
        license_no: str,
        plate_no: str,
        violation_code: str,
        fine_amount: float,
        agency: AgencyType,
        enforcer_id: str,
        lat: float,
        lng: float,
        demerit_points: int = 0
    ) -> ViolationCitationModel:
        ticket = ViolationCitationModel(
            driver_license_no=license_no,
            vehicle_plate_no=plate_no,
            violation_code=violation_code,
            fine_amount=fine_amount,
            issuing_agency=agency,
            enforcer_id=enforcer_id,
            location_gps={"lat": lat, "lng": lng},
            demerit_points_added=demerit_points,
            status=TicketStatus.ISSUED,
            lto_synced=False
        )
        self.db.add(ticket)
        self.db.commit()
        self.db.refresh(ticket)
        return ticket

    def sync_citation_to_lto(self, citation_id: str) -> Optional[ViolationCitationModel]:
        ticket = self.db.query(ViolationCitationModel).filter(
            ViolationCitationModel.id == citation_id
        ).first()

        if ticket:
            ticket.lto_synced = True
            self.db.commit()
            self.db.refresh(ticket)

        return ticket

    def get_driver_tickets(self, license_no: str) -> List[ViolationCitationModel]:
        return self.db.query(ViolationCitationModel).filter(
            ViolationCitationModel.driver_license_no == license_no
        ).all()

    def process_payment(self, citation_id: str, payment_ref: str) -> Optional[ViolationCitationModel]:
        ticket = self.db.query(ViolationCitationModel).filter(
            ViolationCitationModel.id == citation_id
        ).first()

        if ticket:
            ticket.status = TicketStatus.PAID
            ticket.payment_reference = payment_ref
            ticket.paid_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(ticket)

        return ticket