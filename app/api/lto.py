from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.security import get_current_user

router = APIRouter(prefix="/api/v1/lto", tags=["LTO Driver Verification"])

class DriverRecord(BaseModel):
    license_number: str
    full_name: str
    license_type: str
    expiration_date: str
    demerit_points: int
    status: str
    registered_plate: str
    registered_vehicle: str

# Mock LTO LTMS Database Store
LTO_DATABASE = {
    "N01-12-345678": {
        "license_number": "N01-12-345678",
        "full_name": "JUAN DELA CRUZ JR.",
        "license_type": "Professional (1, 2, 3)",
        "expiration_date": "2028-09-27",
        "demerit_points": 2,
        "status": "ACTIVE",
        "registered_plate": "ABC-1234",
        "registered_vehicle": "Toyota Vios (White)"
    },
    "D02-18-987654": {
        "license_number": "D02-18-987654",
        "full_name": "MARIA SANTOS CORTEZ",
        "license_type": "Non-Professional (1, 2)",
        "expiration_date": "2024-01-15",
        "demerit_points": 12,
        "status": "SUSPENDED",
        "registered_plate": "NXX-8899",
        "registered_vehicle": "Mitsubishi Montero Sport (Black)"
    }
}

@router.get("/driver/{license_no}", response_model=DriverRecord)
async def get_driver_details(
    license_no: str,
    current_user: dict = Depends(get_current_user),
):
    clean_no = license_no.strip().upper()
    if clean_no in LTO_DATABASE:
        return LTO_DATABASE[clean_no]
    
    raise HTTPException(
        status_code=404, 
        detail=f"Driver license record '{license_no}' not found in LTO LTMS database."
    )