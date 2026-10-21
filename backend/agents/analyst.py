import os
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from tools.data_tools import DataAnalysisTools

class AnalystAgent:
    def __init__(self):
        # Look for OLLAMA_MODEL first, then DEFAULT_MODEL, then fallback to llama3.2:3b
        model_name = os.getenv("OLLAMA_MODEL") or os.getenv("DEFAULT_MODEL", "llama3.2:3b")
        
        self.llm = ChatOllama(
            model=model_name,
            base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
            temperature=0.2,
            keep_alive="30m",
            num_predict=350  # Prevents long-winded answers and speeds up inference
        )
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", 
             "You are the Data Analyst Agent in AgentFlow AI. "
             "Analyze the computed statistics and dataset summary. "
             "Highlight core KPIs, variances, dips, and root causes supported strictly by the numbers. "
             "Keep the analysis direct, actionable, and under 150 words."),
            ("human", 
             "Task: {task_desc}\nDataset Structure: {inspection}\nCalculated Metrics: {metrics}")
        ])

    def analyze(self, file_path: str, task_desc: str, target_metric: str = "Sales", date_col: str = None) -> dict:
        inspection = DataAnalysisTools.inspect_dataset(file_path)
        metrics = DataAnalysisTools.run_statistical_summary(file_path, target_col=target_metric, date_col=date_col)
        
        chain = self.prompt | self.llm
        narrative = chain.invoke({
            "task_desc": task_desc,
            "inspection": str(inspection),
            "metrics": str(metrics)
        })

        return {
            "inspection": inspection,
            "metrics": metrics,
            "insights": str(narrative.content).strip()
        }