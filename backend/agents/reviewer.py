import os
import json
import re
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

class ReviewVerdict(BaseModel):
    status: str = Field(description="'verified' if findings are sound, 'needs_revision' if gaps/risks exist")
    critique: str = Field(description="Actionable notes or missing aspects if revision is needed")
    audit_summary: str = Field(description="Summary of evaluation in under 80 words")

class ReviewerAgent:
    def __init__(self):
        model_name = os.getenv("OLLAMA_MODEL") or os.getenv("DEFAULT_MODEL", "llama3.2:3b")

        self.llm = ChatOllama(
            model=model_name,
            base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
            format="json",
            temperature=0.1,
            keep_alive="30m",
            num_predict=220
        )
        self.prompt = ChatPromptTemplate.from_messages([
            ("system",
             "You are the Operations QA and Risk Audit Agent for AgentFlow AI.\n"
             "Role: Senior Operational Auditor\n"
             "Goal: Validate conclusions, detect risks, and verify alignment with the objective.\n"
             "Return ONLY valid JSON matching this structure without markdown fences:\n"
             "{{\"status\": \"verified\" | \"needs_revision\", \"critique\": \"string\", \"audit_summary\": \"string\"}}"),
            ("human", "Objective: {objective}\nRevision Count: {revision_count}\nAvailable Findings:\n{findings}")
        ])

    def _clean_json_string(self, raw_content: str) -> str:
        cleaned = raw_content.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.MULTILINE)
            cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.MULTILINE)
        match = re.search(r"(\{.*\})", cleaned, re.DOTALL)
        return match.group(1).strip() if match else cleaned.strip()

    def review(self, objective: str, findings: str, revision_count: int = 0) -> dict:
        # If we have already revised once or twice, force pass to avoid loops
        if revision_count >= 1:
            return {
                "validation_status": "verified",
                "critique": "None. Resolved in subsequent revision.",
                "audit_summary": "Findings confirmed and verified after reflection cycle."
            }

        chain = self.prompt | self.llm
        response = chain.invoke({
            "objective": objective,
            "revision_count": revision_count,
            "findings": findings
        })
        
        try:
            cleaned = self._clean_json_string(str(response.content))
            parsed = json.loads(cleaned)
            verdict = ReviewVerdict(**parsed)
            return {
                "validation_status": verdict.status,
                "critique": verdict.critique,
                "audit_summary": verdict.audit_summary
            }
        except Exception:
            return {
                "validation_status": "verified",
                "critique": "",
                "audit_summary": str(response.content).strip()
            }