"""
AI Service — Google Gemini integration with retry handling.
All AI calls are routed through this module. API keys never leave the backend.
"""
import json
import logging
from typing import Any, Type
from tenacity import retry, stop_after_attempt, wait_fixed, retry_if_exception_type
from google import genai
from google.genai import types as genai_types
from pydantic import BaseModel, ValidationError
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_client = genai.Client(api_key=settings.gemini_api_key)


class AIServiceError(Exception):
    pass


@retry(
    # A long exponential retry cycle leaves the UI spinning for minutes.
    # Retry once for transient failures, then return a useful error promptly.
    stop=stop_after_attempt(2),
    wait=wait_fixed(1),
    retry=retry_if_exception_type(Exception),
    reraise=True,
)
async def _call_gemini(prompt: str) -> str:
    """Call Gemini with retry logic. Returns raw text response."""
    try:
        response = await _client.aio.models.generate_content(
            # 3.6 Flash is available to this project and is optimized for
            # short, structured responses. 3.8 Flash was spending minutes in
            # the provider queue for the configured API key.
            model="gemini-3.6-flash",
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                response_mime_type="application/json",
                # These planning screens need responsive structured output,
                # not long-form chain-of-thought reasoning.
                thinking_config=genai_types.ThinkingConfig(thinking_level="minimal"),
                max_output_tokens=8192,
            ),
        )
        return response.text
    except Exception as e:
        logger.warning(f"Gemini API call failed (will retry): {e}")
        raise


async def generate_structured(
    prompt: str,
    schema: Type[BaseModel],
    context: str = "",
) -> BaseModel:
    """
    Call Gemini and validate response against a Pydantic schema.
    Raises AIServiceError if validation fails after retries.
    """
    full_prompt = f"""
{context}

{prompt}

IMPORTANT: Respond ONLY with valid JSON that matches this exact schema.
Do not add explanation text. Do not wrap in markdown code blocks.
Schema: {schema.model_json_schema()}
"""
    try:
        raw = await _call_gemini(full_prompt)
        # Strip markdown code fences if present
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
            if raw.endswith("```"):
                raw = raw[:-3]
        data = json.loads(raw)
        return schema.model_validate(data)
    except ValidationError as e:
        logger.error(f"AI response schema validation failed: {e}")
        raise AIServiceError(f"AI response did not match expected schema: {e}")
    except json.JSONDecodeError as e:
        logger.error(f"AI response is not valid JSON: {e}")
        raise AIServiceError(f"AI returned invalid JSON: {e}")
    except Exception as e:
        logger.error(f"AI generation failed: {e}")
        raise AIServiceError(f"AI generation failed: {e}")


def build_student_context(profile: dict) -> str:
    """Build a structured context string from a student profile dict."""
    education = profile.get("education", {})
    tech_skills = [s["name"] for s in profile.get("technical_skills", [])]
    soft_skills = [s["name"] for s in profile.get("soft_skills", [])]
    projects = profile.get("projects", [])
    certs = profile.get("certifications", [])
    achievements = profile.get("achievements", [])
    goals = profile.get("career_goals", [])

    project_lines = "\n".join(
        f"  - {p.get('title', '')}: {p.get('description', '')[:200]}"
        for p in projects
    )
    cert_lines = ", ".join(c.get("name", "") for c in certs) or "None"
    achievement_lines = ", ".join(a.get("title", "") for a in achievements) or "None"
    goal_lines = ", ".join(
        f"{g.get('target_role', '')} ({g.get('experience_level', 'entry')})"
        for g in goals
    ) or "Not specified"

    return f"""
=== STUDENT PROFILE (VERIFIED FACTS — DO NOT FABRICATE) ===
Education:
  Institution: {education.get('institution', 'N/A')}
  Degree: {education.get('degree', 'N/A')} in {education.get('branch', 'N/A')}
  Semester/Year: {education.get('semester', 'N/A')} | CGPA: {education.get('cgpa', 'N/A')}
  Graduation Year: {education.get('graduation_year', 'N/A')}

Technical Skills: {', '.join(tech_skills) or 'None listed'}
Soft Skills: {', '.join(soft_skills) or 'None listed'}
Certifications: {cert_lines}
Achievements: {achievement_lines}
Career Goals: {goal_lines}
Bio: {profile.get('summary_bio', '')}

Projects:
{project_lines or '  None listed'}
=== END PROFILE ===

RULES FOR AI GENERATION:
1. Only reference skills, projects, and experiences explicitly listed above.
2. Do NOT invent qualifications, work experience, or achievements not present in the profile.
3. Clearly frame suggestions as improvements or goals, not existing facts.
4. Be specific and professional. No vague or generic filler content.
"""
