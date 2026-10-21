import json
import os
import re
from typing import List
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

class SubTask(BaseModel):
    task_id: int
    title: str
    assigned_agent: str = Field(description="Planner, Analyst, Researcher, Reviewer, or Report")
    tool_required: str = Field(description="Name of tool or 'None'")
    description: str

class PlanOutput(BaseModel):
    objective: str
    tasks: List[SubTask]

class PlannerAgent:
    def __init__(self):
        model_name = os.getenv("OLLAMA_MODEL") or os.getenv("DEFAULT_MODEL", "llama3.2:3b")

        self.llm = ChatOllama(
            model=model_name,
            base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
            format="json",
            temperature=0.1,
            keep_alive="30m",
            num_predict=350
        )
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", 
             "You are the Lead Planning Agent for AgentFlow AI. "
             "Given an objective and attached files, create a concise sequential plan (max 3 steps). "
             "Return ONLY valid JSON matching this exact structure without markdown fences:\n"
             "{{\"objective\": \"string\", \"tasks\": [{{\"task_id\": 1, \"title\": \"string\", \"assigned_agent\": \"string\", \"tool_required\": \"string\", \"description\": \"string\"}}]}}"),
            ("human", "Objective: {objective}\nAttached Files: {file_name}")
        ])

    def _clean_json_string(self, raw_content: str) -> str:
        """Strips markdown formatting, code fences, and surrounding prose."""
        cleaned = raw_content.strip()

        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.MULTILINE)
            cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.MULTILINE)

        match = re.search(r"(\{.*\})", cleaned, re.DOTALL)
        if match:
            cleaned = match.group(1)

        return cleaned.strip()

    def create_plan(self, objective: str, file_name: str = "None") -> dict:
        chain = self.prompt | self.llm
        response = chain.invoke({"objective": objective, "file_name": file_name})
        raw_text = str(response.content)

        cleaned_text = self._clean_json_string(raw_text)

        try:
            parsed = json.loads(cleaned_text)
            validated = PlanOutput(**parsed)
            return validated.model_dump()
        except (json.JSONDecodeError, Exception):
            return {
                "objective": objective,
                "tasks": [
                    {
                        "task_id": 1,
                        "title": "Data Extraction & KPI Calculation",
                        "assigned_agent": "Analyst",
                        "tool_required": "DataAnalysisTools",
                        "description": f"Load dataset ({file_name}) and inspect primary metrics and anomalies."
                    },
                    {
                        "task_id": 2,
                        "title": "Actionable Synthesis",
                        "assigned_agent": "Report",
                        "tool_required": "None",
                        "description": "Synthesize key data findings and create actionable execution steps."
                    }
                ]
            }