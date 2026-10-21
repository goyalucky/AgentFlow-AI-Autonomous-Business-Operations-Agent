import json
from langgraph.graph import StateGraph, END
from agents.state import AgentState
from agents.planner import PlannerAgent
from agents.analyst import AnalystAgent
from agents.researcher import ResearcherAgent
from agents.reviewer import ReviewerAgent
from agents.report_agent import ReportAgent

planner = PlannerAgent()
analyst = AnalystAgent()
researcher = ResearcherAgent()
reviewer = ReviewerAgent()
report_agent = ReportAgent()

# 1. Planner Node
def plan_node(state: AgentState) -> AgentState:
    file_name = state.get("file_path") or "None"
    plan_output = planner.create_plan(objective=state["objective"], file_name=file_name)
    state["plan"] = plan_output
    state["current_step"] = "planner"
    state.setdefault("revision_count", 0)
    state.setdefault("critique", None)
    return state

# 2. Analyst Node
def analyst_node(state: AgentState) -> AgentState:
    objective = state["objective"]
    if state.get("critique"):
        objective = f"{objective}\nRevision Focus: {state['critique']}"

    try:
        result = analyst.analyze(
            file_path=state["file_path"],
            task_desc=objective,
            target_metric=state.get("target_metric", "Sales"),
            date_col=state.get("date_col")
        )
        state["analyst_output"] = result
    except Exception as e:
        state["errors"].append(f"Analyst node error: {str(e)}")
    
    state["current_step"] = "analyst"
    return state

# 3. Researcher Node
def researcher_node(state: AgentState) -> AgentState:
    objective = state["objective"]
    if state.get("critique"):
        objective = f"{objective} (Address feedback: {state['critique'][:50]})"

    try:
        result = researcher.research(objective=objective)
        state["research_output"] = result
    except Exception as e:
        state["errors"].append(f"Researcher node error: {str(e)}")

    state["current_step"] = "researcher"
    return state

# 4. Reviewer Node
def reviewer_node(state: AgentState) -> AgentState:
    findings = ""
    if state.get("analyst_output"):
        findings += f"Data Metrics: {json.dumps(state['analyst_output'].get('metrics', {}))}\n"
        findings += f"Insights: {state['analyst_output'].get('insights', '')}\n"
    if state.get("research_output"):
        findings += f"Research Brief: {state['research_output'].get('brief', '')}\n"

    revision_count = state.get("revision_count", 0)

    try:
        result = reviewer.review(
            objective=state["objective"],
            findings=findings or "No artifacts",
            revision_count=revision_count
        )
        state["reviewer_output"] = result
        state["critique"] = result.get("critique", "")
    except Exception as e:
        state["errors"].append(f"Reviewer node error: {str(e)}")
        state["reviewer_output"] = {
            "validation_status": "verified",
            "critique": "",
            "audit_summary": f"Review bypass: {str(e)}"
        }

    state["current_step"] = "reviewer"
    return state

# 5. Report Generator Node (Phase 6)
def report_node(state: AgentState) -> AgentState:
    findings = ""
    if state.get("analyst_output"):
        findings += f"Data Metrics: {json.dumps(state['analyst_output'].get('metrics', {}))}\n"
        findings += f"Insights: {state['analyst_output'].get('insights', '')}\n"
    if state.get("research_output"):
        findings += f"Research Brief: {state['research_output'].get('brief', '')}\n"

    plan_str = json.dumps(state.get("plan", {}))
    audit_str = json.dumps(state.get("reviewer_output", {}))

    try:
        report = report_agent.generate_report(
            objective=state["objective"],
            plan=plan_str,
            findings=findings or "No artifacts gathered",
            audit=audit_str
        )
        state["report_output"] = report
    except Exception as e:
        state["errors"].append(f"Report generator node error: {str(e)}")
        state["report_output"] = {
            "title": f"Report: {state['objective'][:40]}",
            "content": f"# Executive Summary\n\nTask completed with notes: {audit_str}",
            "generated_at": ""
        }

    state["current_step"] = "completed"
    return state

# Forward & Reflection Routers
def route_step(state: AgentState) -> str:
    if state.get("file_path"):
        return "analyst"
    return "researcher"

def evaluate_review(state: AgentState) -> str:
    reviewer_output = state.get("reviewer_output") or {}
    status = reviewer_output.get("validation_status", "verified")
    revision_count = state.get("revision_count", 0)

    if status == "needs_revision" and revision_count < 1:
        state["revision_count"] = revision_count + 1
        if state.get("file_path"):
            return "revise_analyst"
        return "revise_researcher"

    return "generate_report"

# Graph Construction
builder = StateGraph(AgentState)

builder.add_node("planner", plan_node)
builder.add_node("analyst", analyst_node)
builder.add_node("researcher", researcher_node)
builder.add_node("reviewer", reviewer_node)
builder.add_node("report_generator", report_node)

builder.set_entry_point("planner")

builder.add_conditional_edges(
    "planner",
    route_step,
    {
        "analyst": "analyst",
        "researcher": "researcher"
    }
)

builder.add_edge("analyst", "reviewer")
builder.add_edge("researcher", "reviewer")

# Reviewer branches to reflection or advances to report generator
builder.add_conditional_edges(
    "reviewer",
    evaluate_review,
    {
        "revise_analyst": "analyst",
        "revise_researcher": "researcher",
        "generate_report": "report_generator"
    }
)

builder.add_edge("report_generator", END)

workflow_graph = builder.compile()