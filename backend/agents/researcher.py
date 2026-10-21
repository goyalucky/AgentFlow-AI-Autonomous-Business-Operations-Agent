import os
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from tools.search_tools import WebSearchTools

class ResearcherAgent:
    def __init__(self):
        model_name = os.getenv("OLLAMA_MODEL") or os.getenv("DEFAULT_MODEL", "llama3.2:3b")

        self.llm = ChatOllama(
            model=model_name,
            base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
            temperature=0.2,
            keep_alive="30m",
            num_predict=256
        )
        self.prompt = ChatPromptTemplate.from_messages([
            ("system",
             "You are the Lead Market Researcher for AgentFlow AI. "
             "Analyze the provided search findings and objective. "
             "Deliver a concise, direct market brief (under 120 words) with key market trends, competitors, and strategic takeaways."),
            ("human", "Objective: {objective}\nSearch Results:\n{search_context}")
        ])

    def research(self, objective: str) -> dict:
        search_query = objective.strip()[:60]
        search_hits = WebSearchTools.search_market_context(search_query)

        formatted_context = "\n".join([
            f"- {hit.get('title', '')}: {hit.get('snippet', '')}"
            for hit in search_hits if "error" not in hit
        ])

        if not formatted_context.strip():
            formatted_context = "No direct web matches retrieved. Synthesizing domain assumptions."

        chain = self.prompt | self.llm
        response = chain.invoke({"objective": objective, "search_context": formatted_context})

        return {
            "search_query": search_query,
            "sources": search_hits,
            "brief": str(response.content).strip()
        }