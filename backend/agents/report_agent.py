import os
from datetime import datetime
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate

class ReportAgent:
    def __init__(self):
        model_name = os.getenv("OLLAMA_MODEL") or os.getenv("DEFAULT_MODEL", "llama3.2:3b")

        self.llm = ChatOllama(
            model=model_name,
            base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
            temperature=0.2,
            keep_alive="30m",
            num_predict=400
        )
        self.prompt = ChatPromptTemplate.from_messages([
            ("system",
             "You are the Executive Report Synthesis Agent for AgentFlow AI.\n"
             "Role: Principal Business Intelligence Writer\n"
             "Synthesize the provided plan, analytics/research findings, and QA audit into a structured executive report.\n"
             "Structure your response with clear Markdown headers: ## Executive Summary, ## Key Findings, ## Operational Audit, and ## Recommendations. Keep it concise, formal, and under 300 words."),
            ("human", "Objective: {objective}\nPlan: {plan}\nFindings: {findings}\nAudit: {audit}")
        ])

    def generate_report(self, objective: str, plan: str, findings: str, audit: str) -> dict:
        chain = self.prompt | self.llm
        response = chain.invoke({
            "objective": objective,
            "plan": plan,
            "findings": findings,
            "audit": audit
        })

        return {
            "title": f"Executive Intelligence Report: {objective[:40]}",
            "content": str(response.content).strip(),
            "generated_at": datetime.utcnow().isoformat()
        }