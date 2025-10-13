"""
Voice Processing API Endpoints
FastAPI implementation of voice-to-text and text-to-speech functionality
"""

import asyncio
import time
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.logging import logger
from app.core.security import security
from app.core.exceptions import VoiceProcessingError, AIServiceError, ValidationError
from app.services.rate_limiter import rate_limiter
from app.services.circuit_breaker import circuit_breaker_manager
from app.services.cache_service import cache_service

router = APIRouter()


class VoiceProcessRequest(BaseModel):
    """Voice processing request model"""
    text: Optional[str] = Field(None, description="Text input for processing")
    language: str = Field(default="en", description="Language code")
    voice_settings: Dict[str, Any] = Field(default_factory=dict, description="Voice synthesis settings")
    session_id: Optional[str] = Field(None, description="Session identifier")
    user_id: Optional[str] = Field(None, description="User identifier")


class VoiceProcessResponse(BaseModel):
    """Voice processing response model"""
    text: str = Field(description="Processed text")
    audio_url: Optional[str] = Field(None, description="URL to generated audio")
    processing_time_ms: float = Field(description="Processing time in milliseconds")
    confidence: Optional[float] = Field(None, description="Transcription confidence score")
    language_detected: Optional[str] = Field(None, description="Detected language")
    session_id: Optional[str] = Field(None, description="Session identifier")
    ai_response: Optional[str] = Field(None, description="AI-generated response")


class TextToSpeechRequest(BaseModel):
    """Text-to-speech request model"""
    text: str = Field(description="Text to convert to speech")
    voice: str = Field(default=settings.TTS_VOICE, description="Voice to use")
    model: str = Field(default=settings.TTS_MODEL, description="TTS model to use")
    speed: float = Field(default=1.0, ge=0.25, le=4.0, description="Speech speed")
    session_id: Optional[str] = Field(None, description="Session identifier")


class SpeechToTextResponse(BaseModel):
    """Speech-to-text response model"""
    text: str = Field(description="Transcribed text")
    confidence: float = Field(description="Transcription confidence")
    language: str = Field(description="Detected language")
    processing_time_ms: float = Field(description="Processing time in milliseconds")
    session_id: Optional[str] = Field(None, description="Session identifier")


async def get_current_request_id(request: Request) -> str:
    """Get current request ID"""
    return getattr(request.state, 'request_id', 'unknown')


@router.post("/process", response_model=VoiceProcessResponse)
async def process_voice_input(
    request: Request,
    audio_file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    language: str = Form("en"),
    session_id: Optional[str] = Form(None),
    user_id: Optional[str] = Form(None),
    request_id: str = Depends(get_current_request_id)
):
    """
    Process voice input or text input and return AI response
    
    This endpoint handles both voice-to-text conversion and text processing,
    returning an AI-generated response with optional text-to-speech conversion.
    """
    start_time = time.time()
    
    # Rate limiting check
    is_allowed, rate_limit_info = await rate_limiter.check_rate_limit(request)
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=rate_limit_info
        )
    
    # Validate input
    if not audio_file and not text:
        raise ValidationError("Either audio file or text input is required")
    
    if audio_file and text:
        raise ValidationError("Provide either audio file or text input, not both")
    
    logger.info(
        "Voice processing request received",
        service="voice_api",
        request_id=request_id,
        metadata={
            "has_audio": bool(audio_file),
            "has_text": bool(text),
            "language": language,
            "session_id": session_id,
            "user_id": user_id
        }
    )
    
    try:
        processed_text = ""
        confidence = None
        language_detected = language
        
        # Process audio input
        if audio_file:
            # Validate audio file
            if not security.validate_audio_file(audio_file.filename or "", audio_file.size or 0):
                raise ValidationError("Invalid audio file format or size")
            
            # Check cache for audio processing
            audio_content = await audio_file.read()
            cache_key = f"audio_transcription:{hash(audio_content)}"
            cached_result = await cache_service.get(cache_key)
            
            if cached_result:
                processed_text = cached_result["text"]
                confidence = cached_result.get("confidence")
                language_detected = cached_result.get("language", language)
                
                logger.debug(
                    "Using cached audio transcription",
                    service="voice_api",
                    request_id=request_id,
                    metadata={"cache_key": cache_key}
                )
            else:
                # Transcribe audio using circuit breaker
                transcription_result = await circuit_breaker_manager.call_with_circuit_breaker(
                    "openai_whisper",
                    _transcribe_audio,
                    audio_content,
                    language
                )
                
                processed_text = transcription_result["text"]
                confidence = transcription_result.get("confidence")
                language_detected = transcription_result.get("language", language)
                
                # Cache the result
                await cache_service.set(cache_key, {
                    "text": processed_text,
                    "confidence": confidence,
                    "language": language_detected
                }, ttl=3600)  # Cache for 1 hour
        
        # Use text input directly
        elif text:
            processed_text = security.sanitize_input(text)
            confidence = 1.0  # Perfect confidence for text input
        
        if not processed_text.strip():
            raise ValidationError("No text could be extracted from input")
        
        # Generate AI response
        ai_response = await _generate_ai_response(
            processed_text,
            session_id,
            user_id,
            request_id
        )
        
        # Generate audio response (optional)
        audio_url = None
        if ai_response:
            try:
                audio_url = await _generate_audio_response(
                    ai_response,
                    session_id,
                    request_id
                )
            except Exception as e:
                logger.warning(
                    f"Failed to generate audio response: {str(e)}",
                    service="voice_api",
                    request_id=request_id,
                    error={"message": str(e), "type": type(e).__name__}
                )
        
        processing_time_ms = (time.time() - start_time) * 1000
        
        response = VoiceProcessResponse(
            text=processed_text,
            audio_url=audio_url,
            processing_time_ms=processing_time_ms,
            confidence=confidence,
            language_detected=language_detected,
            session_id=session_id,
            ai_response=ai_response
        )
        
        logger.info(
            "Voice processing completed successfully",
            service="voice_api",
            request_id=request_id,
            metadata={
                "processing_time_ms": processing_time_ms,
                "text_length": len(processed_text),
                "has_ai_response": bool(ai_response),
                "has_audio_url": bool(audio_url)
            }
        )
        
        return response
        
    except Exception as e:
        processing_time_ms = (time.time() - start_time) * 1000
        
        logger.error(
            f"Voice processing failed: {str(e)}",
            service="voice_api",
            request_id=request_id,
            error={"message": str(e), "type": type(e).__name__},
            metadata={"processing_time_ms": processing_time_ms}
        )
        
        if isinstance(e, (ValidationError, VoiceProcessingError, AIServiceError)):
            raise
        else:
            raise VoiceProcessingError(f"Voice processing failed: {str(e)}")


@router.post("/speech-to-text", response_model=SpeechToTextResponse)
async def speech_to_text(
    request: Request,
    audio_file: UploadFile = File(...),
    language: str = Form("en"),
    session_id: Optional[str] = Form(None),
    request_id: str = Depends(get_current_request_id)
):
    """
    Convert speech to text
    
    Upload an audio file and get the transcribed text with confidence score.
    """
    start_time = time.time()
    
    # Rate limiting check
    is_allowed, rate_limit_info = await rate_limiter.check_rate_limit(request)
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=rate_limit_info
        )
    
    # Validate audio file
    if not security.validate_audio_file(audio_file.filename or "", audio_file.size or 0):
        raise ValidationError("Invalid audio file format or size")
    
    logger.info(
        "Speech-to-text request received",
        service="voice_api",
        request_id=request_id,
        metadata={
            "filename": audio_file.filename,
            "content_type": audio_file.content_type,
            "language": language,
            "session_id": session_id
        }
    )
    
    try:
        audio_content = await audio_file.read()
        
        # Check cache
        cache_key = f"stt:{hash(audio_content)}:{language}"
        cached_result = await cache_service.get(cache_key)
        
        if cached_result:
            logger.debug(
                "Using cached speech-to-text result",
                service="voice_api",
                request_id=request_id
            )
            
            return SpeechToTextResponse(
                **cached_result,
                processing_time_ms=(time.time() - start_time) * 1000,
                session_id=session_id
            )
        
        # Transcribe audio
        result = await circuit_breaker_manager.call_with_circuit_breaker(
            "openai_whisper",
            _transcribe_audio,
            audio_content,
            language
        )
        
        processing_time_ms = (time.time() - start_time) * 1000
        
        response = SpeechToTextResponse(
            text=result["text"],
            confidence=result.get("confidence", 0.0),
            language=result.get("language", language),
            processing_time_ms=processing_time_ms,
            session_id=session_id
        )
        
        # Cache the result
        await cache_service.set(cache_key, response.dict(exclude={"processing_time_ms", "session_id"}), ttl=3600)
        
        logger.info(
            "Speech-to-text completed successfully",
            service="voice_api",
            request_id=request_id,
            metadata={
                "processing_time_ms": processing_time_ms,
                "text_length": len(response.text),
                "confidence": response.confidence
            }
        )
        
        return response
        
    except Exception as e:
        processing_time_ms = (time.time() - start_time) * 1000
        
        logger.error(
            f"Speech-to-text failed: {str(e)}",
            service="voice_api",
            request_id=request_id,
            error={"message": str(e), "type": type(e).__name__},
            metadata={"processing_time_ms": processing_time_ms}
        )
        
        raise VoiceProcessingError(f"Speech-to-text conversion failed: {str(e)}")


@router.post("/text-to-speech")
async def text_to_speech(
    request: Request,
    tts_request: TextToSpeechRequest,
    request_id: str = Depends(get_current_request_id)
):
    """
    Convert text to speech
    
    Provide text and get back an audio stream of the synthesized speech.
    """
    start_time = time.time()
    
    # Rate limiting check
    is_allowed, rate_limit_info = await rate_limiter.check_rate_limit(request)
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=rate_limit_info
        )
    
    # Validate input
    if not tts_request.text.strip():
        raise ValidationError("Text is required for speech synthesis")
    
    if len(tts_request.text) > 4000:  # OpenAI TTS limit
        raise ValidationError("Text is too long (maximum 4000 characters)")
    
    logger.info(
        "Text-to-speech request received",
        service="voice_api",
        request_id=request_id,
        metadata={
            "text_length": len(tts_request.text),
            "voice": tts_request.voice,
            "model": tts_request.model,
            "speed": tts_request.speed,
            "session_id": tts_request.session_id
        }
    )
    
    try:
        # Check cache
        cache_key = f"tts:{hash(tts_request.text)}:{tts_request.voice}:{tts_request.model}:{tts_request.speed}"
        cached_audio = await cache_service.get(cache_key)
        
        if cached_audio:
            logger.debug(
                "Using cached text-to-speech result",
                service="voice_api",
                request_id=request_id
            )
            
            # Return cached audio as streaming response
            return StreamingResponse(
                iter([cached_audio]),
                media_type="audio/mpeg",
                headers={
                    "Content-Disposition": "attachment; filename=speech.mp3",
                    "X-Processing-Time-Ms": str((time.time() - start_time) * 1000),
                    "X-Cache-Hit": "true"
                }
            )
        
        # Generate speech
        audio_content = await circuit_breaker_manager.call_with_circuit_breaker(
            "openai_tts",
            _synthesize_speech,
            tts_request.text,
            tts_request.voice,
            tts_request.model,
            tts_request.speed
        )
        
        # Cache the result
        await cache_service.set(cache_key, audio_content, ttl=86400)  # Cache for 24 hours
        
        processing_time_ms = (time.time() - start_time) * 1000
        
        logger.info(
            "Text-to-speech completed successfully",
            service="voice_api",
            request_id=request_id,
            metadata={
                "processing_time_ms": processing_time_ms,
                "audio_size_bytes": len(audio_content)
            }
        )
        
        # Return audio as streaming response
        return StreamingResponse(
            iter([audio_content]),
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "attachment; filename=speech.mp3",
                "X-Processing-Time-Ms": str(processing_time_ms),
                "X-Cache-Hit": "false"
            }
        )
        
    except Exception as e:
        processing_time_ms = (time.time() - start_time) * 1000
        
        logger.error(
            f"Text-to-speech failed: {str(e)}",
            service="voice_api",
            request_id=request_id,
            error={"message": str(e), "type": type(e).__name__},
            metadata={"processing_time_ms": processing_time_ms}
        )
        
        raise VoiceProcessingError(f"Text-to-speech conversion failed: {str(e)}")


# Helper functions

async def _transcribe_audio(audio_content: bytes, language: str = "en") -> Dict[str, Any]:
    """Transcribe audio using OpenAI Whisper API"""
    try:
        import openai
        
        client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        
        # Create a temporary file-like object
        import io
        audio_file = io.BytesIO(audio_content)
        audio_file.name = "audio.wav"  # OpenAI requires a filename
        
        response = await client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            language=language,
            response_format="verbose_json"
        )
        
        return {
            "text": response.text,
            "language": response.language,
            "confidence": getattr(response, 'confidence', None)
        }
        
    except Exception as e:
        logger.error(
            f"Audio transcription failed: {str(e)}",
            service="voice_processing",
            error={"message": str(e), "type": type(e).__name__}
        )
        raise VoiceProcessingError(f"Audio transcription failed: {str(e)}")


async def _synthesize_speech(
    text: str,
    voice: str = "alloy",
    model: str = "tts-1",
    speed: float = 1.0
) -> bytes:
    """Synthesize speech using OpenAI TTS API"""
    try:
        import openai
        
        client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        
        response = await client.audio.speech.create(
            model=model,
            voice=voice,
            input=text,
            speed=speed,
            response_format="mp3"
        )
        
        return response.content
        
    except Exception as e:
        logger.error(
            f"Speech synthesis failed: {str(e)}",
            service="voice_processing",
            error={"message": str(e), "type": type(e).__name__}
        )
        raise VoiceProcessingError(f"Speech synthesis failed: {str(e)}")


async def _generate_ai_response(
    text: str,
    session_id: Optional[str],
    user_id: Optional[str],
    request_id: str
) -> str:
    """Generate AI response to user input"""
    try:
        # This would integrate with the AI service
        # For now, return a simple response
        
        # Check cache for similar queries
        cache_key = f"ai_response:{hash(text.lower().strip())}"
        cached_response = await cache_service.get(cache_key)
        
        if cached_response:
            logger.debug(
                "Using cached AI response",
                service="ai_service",
                request_id=request_id
            )
            return cached_response
        
        # Generate new response (mock implementation)
        response = await _call_ai_service(text, session_id, user_id)
        
        # Cache the response
        await cache_service.set(cache_key, response, ttl=1800)  # Cache for 30 minutes
        
        return response
        
    except Exception as e:
        logger.error(
            f"AI response generation failed: {str(e)}",
            service="ai_service",
            request_id=request_id,
            error={"message": str(e), "type": type(e).__name__}
        )
        return "I apologize, but I'm having trouble processing your request right now. Please try again."


async def _call_ai_service(text: str, session_id: Optional[str], user_id: Optional[str]) -> str:
    """Call AI service for response generation"""
    # Mock implementation - would integrate with actual AI service
    await asyncio.sleep(0.5)  # Simulate processing time
    
    return f"Thank you for your message: '{text}'. This is a mock AI response from the FastAPI backend."


async def _generate_audio_response(
    text: str,
    session_id: Optional[str],
    request_id: str
) -> Optional[str]:
    """Generate audio URL for AI response"""
    try:
        # This would generate TTS audio and return a URL
        # For now, return None to indicate no audio generated
        return None
        
    except Exception as e:
        logger.warning(
            f"Audio response generation failed: {str(e)}",
            service="voice_processing",
            request_id=request_id,
            error={"message": str(e), "type": type(e).__name__}
        )
        return None