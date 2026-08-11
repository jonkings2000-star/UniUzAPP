import os, json, base64
from openai import OpenAI

def client():
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        return None
    return OpenAI(api_key=key)

def ask(user, question, schedule, homework):
    c = client()
    if not c:
        raise RuntimeError("OPENAI_API_KEY is not configured")

    context = {
        "student": {
            "name": f"{user['first_name']} {user['last_name']}".strip(),
            "university": user["university"],
            "department": user["department"],
            "group": user["group_name"]
        },
        "schedule": schedule,
        "homework": homework
    }
    prompt = f"""You are UniUZ, a concise student assistant.
Answer in the user's language. Use the student's schedule and homework when relevant.
Do not invent classes or deadlines.
Student data:
{json.dumps(context, ensure_ascii=False)}
Question:
{question}
"""
    r = c.responses.create(
        model=os.environ.get("OPENAI_MODEL", "gpt-4.1-mini"),
        input=prompt
    )
    return r.output_text.strip()

def extract_schedule_from_image(path, mime):
    c = client()
    if not c:
        raise RuntimeError("OPENAI_API_KEY is not configured")
    data = base64.b64encode(open(path, "rb").read()).decode()
    url = f"data:{mime};base64,{data}"
    prompt = """Extract a weekly university timetable from this image.
Return ONLY JSON array. Each item:
{"day_of_week":0-6,"subject":"...","start_time":"HH:MM","end_time":"HH:MM","room":"...","teacher":"..."}
Monday=0, Sunday=6. If unknown use empty string. No markdown."""
    r = c.responses.create(
        model=os.environ.get("OPENAI_MODEL", "gpt-4.1-mini"),
        input=[{
            "role":"user",
            "content":[
                {"type":"input_text","text":prompt},
                {"type":"input_image","image_url":url}
            ]
        }]
    )
    text = r.output_text.strip()
    return json.loads(text)

def extract_schedule_from_pdf(path):
    import fitz
    c = client()
    if not c:
        raise RuntimeError("OPENAI_API_KEY is not configured")
    doc = fitz.open(path)
    text = "\n".join(page.get_text() for page in doc)
    prompt = """Convert this university timetable into ONLY a JSON array.
Each item: {"day_of_week":0-6,"subject":"...","start_time":"HH:MM","end_time":"HH:MM","room":"...","teacher":"..."}
Monday=0, Sunday=6. Do not invent missing data.
TEXT:
""" + text[:30000]
    r = c.responses.create(
        model=os.environ.get("OPENAI_MODEL", "gpt-4.1-mini"),
        input=prompt
    )
    return json.loads(r.output_text.strip())
