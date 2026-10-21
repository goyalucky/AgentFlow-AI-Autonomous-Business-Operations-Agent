from typing import TypedDict, Optional, List, Dict, Any

class AgentState(TypedDict):
    task_id: str
    objective: str
    file_path: Optional[str]
    target_metric: Optional[str]
    date_col: Optional[str]
    plan: Optional[Dict[str, Any]]
    analyst_output: Optional[Dict[str, Any]]
    research_output: Optional[Dict[str, Any]]
    reviewer_output: Optional[Dict[str, Any]]
    report_output: Optional[Dict[str, Any]]
    current_step: str
    errors: List[str]
    revision_count: int
    critique: Optional[str]