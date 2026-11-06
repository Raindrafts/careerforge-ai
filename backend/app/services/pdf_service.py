"""Server-side PDF generation using ReportLab."""
import io
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY


BRAND_BLUE = colors.HexColor("#4F46E5")
BRAND_INDIGO = colors.HexColor("#6366F1")
DARK = colors.HexColor("#1E293B")
MUTED = colors.HexColor("#64748B")
LIGHT_BG = colors.HexColor("#F8FAFC")


def _make_styles():
    styles = getSampleStyleSheet()
    custom = {
        "Title": ParagraphStyle("Title", fontSize=22, textColor=BRAND_BLUE,
                                fontName="Helvetica-Bold", spaceAfter=6, alignment=TA_CENTER),
        "Subtitle": ParagraphStyle("Subtitle", fontSize=12, textColor=MUTED,
                                   fontName="Helvetica", spaceAfter=12, alignment=TA_CENTER),
        "SectionHeader": ParagraphStyle("SectionHeader", fontSize=13, textColor=BRAND_BLUE,
                                        fontName="Helvetica-Bold", spaceBefore=14, spaceAfter=4),
        "Body": ParagraphStyle("Body", fontSize=10, textColor=DARK,
                               fontName="Helvetica", spaceAfter=6, leading=14, alignment=TA_JUSTIFY),
        "BulletItem": ParagraphStyle("BulletItem", fontSize=10, textColor=DARK,
                                     fontName="Helvetica", spaceAfter=3, leftIndent=12, leading=13),
        "Label": ParagraphStyle("Label", fontSize=9, textColor=MUTED,
                                fontName="Helvetica-Bold", spaceAfter=2),
        "Score": ParagraphStyle("Score", fontSize=28, textColor=BRAND_BLUE,
                                fontName="Helvetica-Bold", alignment=TA_CENTER),
    }
    return custom


def generate_career_profile_pdf(profile: dict, career_content: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            leftMargin=20*mm, rightMargin=20*mm,
                            topMargin=20*mm, bottomMargin=20*mm)
    s = _make_styles()
    story = []

    edu = profile.get("education", {})
    name_line = f"{edu.get('branch', '')} Student — {edu.get('institution', '')}"
    story += [
        Paragraph("CareerForge AI", s["Title"]),
        Paragraph("Career Profile Report", s["Subtitle"]),
        Paragraph(name_line, s["Subtitle"]),
        HRFlowable(width="100%", thickness=1, color=BRAND_BLUE),
        Spacer(1, 8),
    ]

    # Professional Summary
    story += [
        Paragraph("Professional Summary", s["SectionHeader"]),
        Paragraph(career_content.get("professional_summary", ""), s["Body"]),
    ]

    # LinkedIn Section
    li = career_content.get("linkedin", {})
    story += [
        Paragraph("LinkedIn Content", s["SectionHeader"]),
        Paragraph(f"<b>Headline:</b> {li.get('headline', '')}", s["Body"]),
        Spacer(1, 4),
        Paragraph("<b>About Section:</b>", s["Label"]),
        Paragraph(li.get("about", ""), s["Body"]),
    ]

    # Key Strengths
    strengths = career_content.get("key_strengths", [])
    if strengths:
        story.append(Paragraph("Key Strengths", s["SectionHeader"]))
        for strength in strengths:
            story.append(Paragraph(f"• {strength}", s["BulletItem"]))

    # Career Narrative
    narrative = career_content.get("career_narrative", "")
    if narrative:
        story += [
            Paragraph("Career Narrative", s["SectionHeader"]),
            Paragraph(narrative, s["Body"]),
        ]

    # Projects
    resume = career_content.get("resume", {})
    proj_descs = resume.get("project_descriptions", [])
    if proj_descs:
        story.append(Paragraph("Project Highlights", s["SectionHeader"]))
        for proj in proj_descs:
            story.append(Paragraph(f"<b>{proj.get('title', '')}</b>", s["Body"]))
            story.append(Paragraph(proj.get("description", ""), s["Body"]))

    doc.build(story)
    return buffer.getvalue()


def generate_skill_gap_pdf(profile: dict, analysis: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            leftMargin=20*mm, rightMargin=20*mm,
                            topMargin=20*mm, bottomMargin=20*mm)
    s = _make_styles()
    story = []

    story += [
        Paragraph("CareerForge AI", s["Title"]),
        Paragraph(f"Skill Gap Analysis — {analysis.get('target_role', '')}", s["Subtitle"]),
        HRFlowable(width="100%", thickness=1, color=BRAND_BLUE),
        Spacer(1, 8),
    ]

    readiness = analysis.get("readiness", {})
    total = readiness.get("total_score", 0)
    story += [
        Paragraph("Readiness Score", s["SectionHeader"]),
        Paragraph(f"{total:.1f}/100", s["Score"]),
        Paragraph(readiness.get("interpretation", ""), s["Body"]),
    ]

    # Score breakdown table
    breakdown_data = [
        ["Component", "Score", "Max"],
        ["Technical Skills", f"{readiness.get('technical_skills_score', 0):.1f}", "50"],
        ["Soft Skills", f"{readiness.get('soft_skills_score', 0):.1f}", "20"],
        ["Project Relevance", f"{readiness.get('project_relevance_score', 0):.1f}", "20"],
        ["Education Fit", f"{readiness.get('education_fit_score', 0):.1f}", "10"],
    ]
    t = Table(breakdown_data, colWidths=[90*mm, 30*mm, 30*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BRAND_BLUE),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [LIGHT_BG, colors.white]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story += [t, Spacer(1, 10)]

    # Priority Gaps
    gaps = analysis.get("priority_gaps", [])
    if gaps:
        story.append(Paragraph("Priority Skill Gaps", s["SectionHeader"]))
        for g in gaps:
            story.append(Paragraph(f"• {g}", s["BulletItem"]))

    # Strengths
    strengths = analysis.get("strengths", [])
    if strengths:
        story.append(Paragraph("Your Strengths", s["SectionHeader"]))
        for st in strengths:
            story.append(Paragraph(f"✓ {st}", s["BulletItem"]))

    # Recommendations
    recs = analysis.get("recommendations", [])
    if recs:
        story.append(Paragraph("Recommendations", s["SectionHeader"]))
        for r in recs:
            story.append(Paragraph(f"→ {r}", s["BulletItem"]))

    doc.build(story)
    return buffer.getvalue()


def generate_roadmap_pdf(profile: dict, roadmap: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            leftMargin=20*mm, rightMargin=20*mm,
                            topMargin=20*mm, bottomMargin=20*mm)
    s = _make_styles()
    story = []

    story += [
        Paragraph("CareerForge AI", s["Title"]),
        Paragraph(f"Learning Roadmap — {roadmap.get('target_role', '')}", s["Subtitle"]),
        Paragraph(f"{roadmap.get('total_weeks', 0)}-Week Plan", s["Subtitle"]),
        HRFlowable(width="100%", thickness=1, color=BRAND_BLUE),
        Spacer(1, 8),
        Paragraph(roadmap.get("roadmap_summary", ""), s["Body"]),
    ]

    for week in roadmap.get("weekly_plans", []):
        week_block = [
            Paragraph(f"Week {week.get('week', '')} — {week.get('theme', '')}", s["SectionHeader"]),
            Paragraph(f"<b>Goal:</b> {week.get('goal', '')}", s["Body"]),
        ]
        for task in week.get("tasks", []):
            week_block.append(Paragraph(
                f"• {task.get('task', '')} ({task.get('duration_hours', 1)}h)",
                s["BulletItem"]
            ))
        week_block.append(Paragraph(f"<b>Milestone:</b> {week.get('milestone', '')}", s["Label"]))
        story.append(KeepTogether(week_block))
        story.append(Spacer(1, 6))

    doc.build(story)
    return buffer.getvalue()
