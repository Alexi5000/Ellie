"""
Legal Compliance API Endpoints
FastAPI endpoints for legal disclaimers and compliance features
"""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.logging import logger
from app.services.rate_limiter import rate_limiter

router = APIRouter()


class LegalDisclaimerResponse(BaseModel):
    """Legal disclaimer response model"""
    disclaimer: str = Field(description="Legal disclaimer text")
    version: str = Field(description="Disclaimer version")
    last_updated: str = Field(description="Last update timestamp")
    required: bool = Field(description="Whether acceptance is required")


class ComplianceInfoResponse(BaseModel):
    """Compliance information response model"""
    gdpr_compliant: bool = Field(description="GDPR compliance status")
    data_retention_days: int = Field(description="Data retention period in days")
    privacy_policy_url: Optional[str] = Field(None, description="Privacy policy URL")
    terms_of_service_url: Optional[str] = Field(None, description="Terms of service URL")
    contact_email: Optional[str] = Field(None, description="Contact email for legal matters")


async def get_current_request_id(request: Request) -> str:
    """Get current request ID"""
    return getattr(request.state, 'request_id', 'unknown')


@router.get("/disclaimer", response_model=LegalDisclaimerResponse)
async def get_legal_disclaimer(
    request: Request,
    request_id: str = Depends(get_current_request_id)
):
    """
    Get legal disclaimer
    
    Retrieve the current legal disclaimer that users must acknowledge.
    """
    # Rate limiting check
    is_allowed, rate_limit_info = await rate_limiter.check_rate_limit(request)
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=rate_limit_info
        )
    
    logger.debug(
        "Legal disclaimer requested",
        service="legal_api",
        request_id=request_id
    )
    
    disclaimer_text = """
    IMPORTANT LEGAL DISCLAIMER
    
    This AI assistant is provided for informational purposes only and does not constitute legal advice. 
    The information provided by this system should not be relied upon as a substitute for professional 
    legal counsel. Always consult with a qualified attorney for specific legal matters.
    
    By using this service, you acknowledge that:
    1. This AI assistant cannot provide legal advice
    2. Information provided may not be current or complete
    3. You should verify all information independently
    4. No attorney-client relationship is established
    5. The service provider is not liable for any decisions made based on this information
    
    If you have specific legal questions or need legal representation, please contact a licensed attorney.
    """
    
    response = LegalDisclaimerResponse(
        disclaimer=disclaimer_text.strip(),
        version="1.0",
        last_updated="2024-12-19T10:30:00Z",
        required=settings.LEGAL_DISCLAIMER_REQUIRED
    )
    
    logger.debug(
        "Legal disclaimer returned",
        service="legal_api",
        request_id=request_id,
        metadata={"required": response.required, "version": response.version}
    )
    
    return response


@router.get("/compliance", response_model=ComplianceInfoResponse)
async def get_compliance_info(
    request: Request,
    request_id: str = Depends(get_current_request_id)
):
    """
    Get compliance information
    
    Retrieve information about data protection and compliance measures.
    """
    # Rate limiting check
    is_allowed, rate_limit_info = await rate_limiter.check_rate_limit(request)
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=rate_limit_info
        )
    
    logger.debug(
        "Compliance information requested",
        service="legal_api",
        request_id=request_id
    )
    
    response = ComplianceInfoResponse(
        gdpr_compliant=settings.GDPR_COMPLIANCE,
        data_retention_days=settings.DATA_RETENTION_DAYS,
        privacy_policy_url=None,  # Would be configured in production
        terms_of_service_url=None,  # Would be configured in production
        contact_email=None  # Would be configured in production
    )
    
    logger.debug(
        "Compliance information returned",
        service="legal_api",
        request_id=request_id,
        metadata={
            "gdpr_compliant": response.gdpr_compliant,
            "data_retention_days": response.data_retention_days
        }
    )
    
    return response


@router.post("/disclaimer/acknowledge")
async def acknowledge_disclaimer(
    request: Request,
    request_id: str = Depends(get_current_request_id)
):
    """
    Acknowledge legal disclaimer
    
    Record that the user has acknowledged the legal disclaimer.
    """
    # Rate limiting check
    is_allowed, rate_limit_info = await rate_limiter.check_rate_limit(request)
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=rate_limit_info
        )
    
    logger.info(
        "Legal disclaimer acknowledged",
        service="legal_api",
        request_id=request_id,
        metadata={
            "client_ip": request.client.host if request.client else "unknown",
            "user_agent": request.headers.get("user-agent", "unknown")
        }
    )
    
    return {
        "message": "Legal disclaimer acknowledged",
        "timestamp": "2024-12-19T10:30:00Z",
        "version": "1.0"
    }