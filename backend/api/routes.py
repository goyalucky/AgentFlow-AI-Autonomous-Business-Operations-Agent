import os
import json
import asyncio
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from services.file_service import FileService
from services.storage_service import load_tasks, save_tasks
from agents.planner import PlannerAgent
from agents.analyst import AnalystAgent
from agents.workflow import workflow_graph

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])

planner = PlannerAgent()
analyst = AnalystAgent()

# Persistent task ledger loaded from disk
tasks_db: List[dict] = load_tasks()

@router.get("")
def list_tasks():
    """Returns all recorded task executions (newest first)."""
    return tasks_db

@router.get("/stats")
def get_dashboard_stats():
    """Computes real-time execution statistics for the dashboard."""
    total = len(tasks_db)
    completed = sum(1 for t in tasks_db if t.get("status") == "completed")
    failed = sum(1 for t in tasks_db if t.get("status") == "failed")
    running = sum(1 for t in tasks_db if t.get("status") == "running")
    return {
        "totalTasks": total,
        "completedTasks": completed,
        "failedTasks": failed,
        "runningTasks": running
    }

@router.post("/upload")
def upload_document(file: UploadFile = File(...)):
    try:
        saved_path = FileService.save_file(file)
        return {
            "filename": file.filename,
            "file_path": saved_path,
            "status": "uploaded"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/run-phase2")
async def run_phase2_flow(
    objective: str = Form(...),
    filename: Optional[str] = Form(None),
    target_metric: Optional[str] = Form("Sales"),
    date_col: Optional[str] = Form(None)
):
    clean_filename = None
    if filename and filename.strip() and filename.strip() != "string":
        clean_filename = filename.strip()

    task_id = f"task-{len(tasks_db) + 1}"

    try:
        plan = planner.create_plan(objective=objective, file_name=clean_filename or "None")

        analyst_result = None
        if clean_filename:
            file_path = FileService.get_file_path(clean_filename)

            if not os.path.exists(file_path):
                raise HTTPException(
                    status_code=404, 
                    detail=f"File '{clean_filename}' was not found in uploads/. Please upload it first via /api/tasks/upload."
                )

            if os.path.getsize(file_path) == 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"File '{clean_filename}' is 0 bytes (empty). Please upload a valid CSV/Excel file with rows."
                )

            try:
                analyst_result = analyst.analyze(
                    file_path=file_path,
                    task_desc=objective,
                    target_metric=target_metric if target_metric != "string" else "Sales",
                    date_col=date_col if (date_col and date_col != "string") else None
                )
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Analyst processing error: {str(e)}")

        task_entry = {
            "id": task_id,
            "title": objective[:48] + ("..." if len(objective) > 48 else ""),
            "description": objective,
            "type": "data-analysis",
            "status": "completed",
            "createdAt": datetime.utcnow().isoformat(),
            "fileName": clean_filename,
            "phase2Data": {
                "status": "success",
                "plan": plan,
                "analyst_execution": analyst_result
            }
        }
        tasks_db.insert(0, task_entry)
        save_tasks(tasks_db)

        return {
            "status": "success",
            "task_id": task_id,
            "plan": plan,
            "analyst_execution": analyst_result
        }

    except HTTPException:
        raise
    except Exception as e:
        failed_entry = {
            "id": task_id,
            "title": objective[:48] + ("..." if len(objective) > 48 else ""),
            "description": objective,
            "type": "data-analysis",
            "status": "failed",
            "createdAt": datetime.utcnow().isoformat(),
            "fileName": clean_filename,
            "error": str(e)
        }
        tasks_db.insert(0, failed_entry)
        save_tasks(tasks_db)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/run-phase3")
async def run_phase3_workflow(
    objective: str = Form(...),
    filename: Optional[str] = Form(None),
    target_metric: Optional[str] = Form("Sales"),
    date_col: Optional[str] = Form(None)
):
    clean_filename = None
    if filename and filename.strip() and filename.strip() != "string":
        clean_filename = filename.strip()

    file_path = None
    if clean_filename:
        file_path = FileService.get_file_path(clean_filename)
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=404,
                detail=f"File '{clean_filename}' was not found in uploads/. Please upload it first via /api/tasks/upload."
            )

    task_id = f"task-{len(tasks_db) + 1}"

    initial_state = {
        "task_id": task_id,
        "objective": objective,
        "file_path": file_path,
        "target_metric": target_metric if target_metric != "string" else "Sales",
        "date_col": date_col if (date_col and date_col != "string") else None,
        "plan": None,
        "analyst_output": None,
        "research_output": None,
        "reviewer_output": None,
        "report_output": None,
        "current_step": "initialized",
        "errors": [],
        "revision_count": 0,
        "critique": None
    }

    try:
        final_state = workflow_graph.invoke(initial_state)

        task_entry = {
            "id": task_id,
            "title": objective[:48] + ("..." if len(objective) > 48 else ""),
            "description": objective,
            "type": "data-analysis" if clean_filename else "market-research",
            "status": "completed" if not final_state.get("errors") else "failed",
            "createdAt": datetime.utcnow().isoformat(),
            "fileName": clean_filename,
            "workflowState": final_state
        }
        tasks_db.insert(0, task_entry)
        save_tasks(tasks_db)

        return {
            "status": "success",
            "state": final_state
        }

    except Exception as e:
        failed_entry = {
            "id": task_id,
            "title": objective[:48] + ("..." if len(objective) > 48 else ""),
            "description": objective,
            "type": "data-analysis" if clean_filename else "market-research",
            "status": "failed",
            "createdAt": datetime.utcnow().isoformat(),
            "fileName": clean_filename,
            "error": str(e)
        }
        tasks_db.insert(0, failed_entry)
        save_tasks(tasks_db)
        raise HTTPException(status_code=500, detail=f"Workflow execution failed: {str(e)}")

@router.post("/run-phase3-stream")
async def run_phase3_stream(
    objective: str = Form(...),
    filename: Optional[str] = Form(None),
    target_metric: Optional[str] = Form("Sales"),
    date_col: Optional[str] = Form(None)
):
    """Streams node-by-node execution events using Server-Sent Events (SSE)."""
    clean_filename = None
    if filename and filename.strip() and filename.strip() != "string":
        clean_filename = filename.strip()

    file_path = None
    if clean_filename:
        file_path = FileService.get_file_path(clean_filename)
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=404,
                detail=f"File '{clean_filename}' was not found in uploads/. Please upload it first."
            )

    task_id = f"task-{len(tasks_db) + 1}"

    initial_state = {
        "task_id": task_id,
        "objective": objective,
        "file_path": file_path,
        "target_metric": target_metric if target_metric != "string" else "Sales",
        "date_col": date_col if (date_col and date_col != "string") else None,
        "plan": None,
        "analyst_output": None,
        "research_output": None,
        "reviewer_output": None,
        "report_output": None,
        "current_step": "initialized",
        "errors": [],
        "revision_count": 0,
        "critique": None
    }

    async def event_generator():
        yield f"data: {json.dumps({'event': 'start', 'task_id': task_id, 'step': 'planner'})}\n\n"

        accumulated_state = dict(initial_state)

        try:
            for output in workflow_graph.stream(initial_state):
                for node_name, node_state in output.items():
                    accumulated_state.update(node_state)
                    event_payload = {
                        "event": "node_complete",
                        "node": node_name,
                        "data": node_state
                    }
                    yield f"data: {json.dumps(event_payload, default=str)}\n\n"
                    await asyncio.sleep(0.05)

            task_entry = {
                "id": task_id,
                "title": objective[:48] + ("..." if len(objective) > 48 else ""),
                "description": objective,
                "type": "data-analysis" if clean_filename else "market-research",
                "status": "completed" if not accumulated_state.get("errors") else "failed",
                "createdAt": datetime.utcnow().isoformat(),
                "fileName": clean_filename,
                "workflowState": accumulated_state
            }
            tasks_db.insert(0, task_entry)
            save_tasks(tasks_db)

            yield f"data: {json.dumps({'event': 'done', 'final_state': accumulated_state}, default=str)}\n\n"

        except Exception as err:
            failed_entry = {
                "id": task_id,
                "title": objective[:48] + ("..." if len(objective) > 48 else ""),
                "description": objective,
                "type": "data-analysis" if clean_filename else "market-research",
                "status": "failed",
                "createdAt": datetime.utcnow().isoformat(),
                "fileName": clean_filename,
                "error": str(err)
            }
            tasks_db.insert(0, failed_entry)
            save_tasks(tasks_db)
            yield f"data: {json.dumps({'event': 'error', 'message': str(err)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.get("/logs")
def get_execution_logs():
    """Extracts node execution logs from recorded task workflows."""
    logs = []
    log_counter = 1

    for task in tasks_db:
        task_id = task.get("id", "task-unknown")
        created_at = task.get("createdAt", datetime.utcnow().isoformat())
        state = task.get("workflowState") or {}

        # 1. Planner Log
        if state.get("plan"):
            tasks_count = len(state["plan"].get("tasks", []))
            logs.append({
                "id": f"log-{log_counter}",
                "taskId": task_id,
                "agent": "Planner",
                "status": "success",
                "message": f"Generated decomposition plan with {tasks_count} subtasks.",
                "output": json.dumps(state["plan"], indent=2),
                "timestamp": created_at
            })
            log_counter += 1

        # 2. Analyst Log
        if state.get("analyst_output"):
            logs.append({
                "id": f"log-{log_counter}",
                "taskId": task_id,
                "agent": "Data Analyst",
                "status": "success",
                "message": f"Executed data summary and statistical KPI calculation on {task.get('fileName')}.",
                "output": json.dumps(state["analyst_output"], indent=2),
                "timestamp": created_at
            })
            log_counter += 1

        # 3. Researcher Log
        if state.get("research_output"):
            sources_count = len(state["research_output"].get("sources", []))
            logs.append({
                "id": f"log-{log_counter}",
                "taskId": task_id,
                "agent": "Researcher",
                "status": "success",
                "message": f"Retrieved web context via DuckDuckGo ({sources_count} sources cited) and compiled brief.",
                "output": state["research_output"].get("brief", ""),
                "timestamp": created_at
            })
            log_counter += 1

        # 4. Reviewer Log
        if state.get("reviewer_output"):
            verdict = state["reviewer_output"].get("validation_status", "verified")
            logs.append({
                "id": f"log-{log_counter}",
                "taskId": task_id,
                "agent": "Reviewer",
                "status": "success" if verdict == "verified" else "warning",
                "message": f"Quality audit complete: {verdict.upper()}.",
                "output": state["reviewer_output"].get("audit_summary", ""),
                "timestamp": created_at
            })
            log_counter += 1

        # 5. Report Generator Log
        if state.get("report_output"):
            logs.append({
                "id": f"log-{log_counter}",
                "taskId": task_id,
                "agent": "Report Generator",
                "status": "success",
                "message": "Synthesized executive briefing report.",
                "output": state["report_output"].get("content", ""),
                "timestamp": created_at
            })
            log_counter += 1

        # 6. Error Logs
        if state.get("errors"):
            for err in state["errors"]:
                logs.append({
                    "id": f"log-{log_counter}",
                    "taskId": task_id,
                    "agent": "Reviewer",
                    "status": "error",
                    "message": f"Workflow execution error: {err}",
                    "output": err,
                    "timestamp": created_at
                })
                log_counter += 1

    return logs

@router.get("/agents")
def get_agent_status():
    """Computes the live runtime state of each agent based on recent graph execution."""
    latest_task = tasks_db[0] if tasks_db else None
    state = (latest_task.get("workflowState") or {}) if latest_task else {}
    has_error = bool(state.get("errors"))
    task_status = latest_task.get("status") if latest_task else "idle"

    is_analyst_routed = bool(state.get("analyst_output"))
    is_research_routed = bool(state.get("research_output"))

    def resolve_status(agent_key: str):
        if not latest_task:
            return "idle"
        if task_status == "running":
            current_step = state.get("current_step", "")
            return "active" if current_step == agent_key else "idle"
        if agent_key == "planner":
            return "completed" if state.get("plan") else "idle"
        if agent_key == "analyst":
            return "completed" if is_analyst_routed else "idle"
        if agent_key == "researcher":
            return "completed" if is_research_routed else "idle"
        if agent_key == "reviewer":
            if state.get("reviewer_output"):
                return "error" if has_error else "completed"
            return "idle"
        if agent_key == "report":
            return "completed" if state.get("report_output") else "idle"
        return "idle"

    return [
        {
            "id": "agent-planner",
            "name": "Planner",
            "role": "Lead Task Decomposition & Routing",
            "order": 1,
            "status": resolve_status("planner"),
            "description": "Decomposes high-level objectives into sequential execution steps and evaluates input file attachments."
        },
        {
            "id": "agent-analyst",
            "name": "Data Analyst",
            "role": "KPI Calculation & Pandas Analytics",
            "order": 2,
            "status": resolve_status("analyst"),
            "description": "Parses structured CSV/Excel files, calculates KPIs, variances, growth rates, and flags anomalies."
        },
        {
            "id": "agent-researcher",
            "name": "Researcher",
            "role": "DuckDuckGo Market Intelligence",
            "order": 3,
            "status": resolve_status("researcher"),
            "description": "Executes live web searches via DuckDuckGo and synthesizes concise market intelligence briefs."
        },
        {
            "id": "agent-reviewer",
            "name": "Reviewer",
            "role": "Operations QA & Audit Engine",
            "order": 4,
            "status": resolve_status("reviewer"),
            "description": "Performs quality assurance audits over generated findings to verify factual grounding."
        },
        {
            "id": "agent-report",
            "name": "Report Generator",
            "role": "Executive Document Synthesis",
            "order": 5,
            "status": resolve_status("report"),
            "description": "Assembles multi-agent outputs, statistics, and audit findings into client-ready executive reports."
        }
    ]

@router.get("/reports")
def get_reports_list():
    """Returns synthesized intelligence reports from completed workflows."""
    reports = []
    for task in tasks_db:
        state = task.get("workflowState") or {}
        report_data = state.get("report_output")
        if not report_data:
            continue

        raw_content = report_data.get("content", "")
        raw_sections = raw_content.split("\n## ")
        sections = []

        if len(raw_sections) > 1:
            summary = raw_sections[0].replace("#", "").strip()[:180] + "..."
            for idx, sec in enumerate(raw_sections[1:], start=1):
                lines = sec.strip().split("\n", 1)
                heading = lines[0].strip()
                body = lines[1].strip() if len(lines) > 1 else ""
                sections.append({
                    "id": f"sec-{task.get('id')}-{idx}",
                    "heading": heading,
                    "content": body
                })
        else:
            summary = raw_content[:180] + "..." if len(raw_content) > 180 else raw_content
            sections.append({
                "id": f"sec-{task.get('id')}-1",
                "heading": "Executive Summary",
                "content": raw_content
            })

        reports.append({
            "id": f"report-{task.get('id')}",
            "taskId": task.get("id"),
            "title": report_data.get("title", f"Report: {task.get('title')}"),
            "summary": summary,
            "type": task.get("type", "data-analysis"),
            "status": "final",
            "createdAt": task.get("createdAt", datetime.utcnow().isoformat()),
            "sections": sections,
            "rawMarkdown": raw_content
        })

    return reports

@router.get("/reports/{report_id}")
def get_single_report(report_id: str):
    """Retrieves a single report by its ID."""
    all_reports = get_reports_list()
    for rep in all_reports:
        if rep["id"] == report_id:
            return rep
    raise HTTPException(status_code=404, detail="Report not found")