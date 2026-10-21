import os
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional

class DataAnalysisTools:
    @staticmethod
    def _load_dataframe(file_path: str) -> pd.DataFrame:
        """Helper to read CSV or Excel files cleanly."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        if file_path.endswith(".csv"):
            return pd.read_csv(file_path)
        elif file_path.endswith((".xls", ".xlsx")):
            return pd.read_excel(file_path)
        else:
            raise ValueError("Unsupported format. Use CSV or Excel.")

    @staticmethod
    def inspect_dataset(file_path: str) -> Dict[str, Any]:
        """Loads CSV or Excel and retrieves schema, shape, and null counts."""
        df = DataAnalysisTools._load_dataframe(file_path)

        return {
            "columns": list(df.columns),
            "row_count": int(len(df)),
            "missing_values": {str(k): int(v) for k, v in df.isnull().sum().to_dict().items()},
            "sample_records": df.head(3).replace({np.nan: None}).to_dict(orient="records")
        }

    @staticmethod
    def _find_target_column(df: pd.DataFrame, target_col: Optional[str]) -> Optional[str]:
        """Auto-resolves the target numeric column if missing or mistyped."""
        # 1. Exact match
        if target_col and target_col in df.columns:
            return target_col

        # 2. Case-insensitive match
        if target_col:
            for col in df.columns:
                if col.strip().lower() == target_col.strip().lower():
                    return col

        # 3. Look for common metric keyword candidates
        common_candidates = ["sales", "revenue", "profit", "amount", "total", "units", "price", "income"]
        for candidate in common_candidates:
            for col in df.columns:
                if candidate in col.strip().lower():
                    # Confirm column is numeric or can be converted to numeric
                    converted = pd.to_numeric(df[col], errors="coerce").dropna()
                    if len(converted) > 0:
                        return col

        # 4. Fallback to the first numeric column
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if not numeric_cols.empty:
            return numeric_cols[0]

        # 5. Check if any object column can be parsed into numeric values
        for col in df.columns:
            converted = pd.to_numeric(df[col], errors="coerce").dropna()
            if len(converted) > (0.5 * len(df)):
                return col

        return None

    @staticmethod
    def _find_date_column(df: pd.DataFrame, date_col: Optional[str]) -> Optional[str]:
        """Auto-resolves the chronological column if missing or mistyped."""
        # 1. Exact match
        if date_col and date_col in df.columns:
            return date_col

        # 2. Case-insensitive match
        if date_col:
            for col in df.columns:
                if col.strip().lower() == date_col.strip().lower():
                    return col

        # 3. Look for common date keywords
        date_candidates = ["date", "time", "day", "month", "year", "quarter", "timestamp"]
        for candidate in date_candidates:
            for col in df.columns:
                if candidate in col.strip().lower():
                    return col

        return None

    @staticmethod
    def run_statistical_summary(file_path: str, target_col: Optional[str] = None, date_col: Optional[str] = None) -> Dict[str, Any]:
        """Calculates basic summary statistics, anomalies, and period-over-period growth with column auto-recovery."""
        try:
            df = DataAnalysisTools._load_dataframe(file_path)
        except Exception as e:
            return {"error": f"Failed to load dataset: {str(e)}"}

        resolved_target = DataAnalysisTools._find_target_column(df, target_col)
        if not resolved_target:
            return {"error": "No suitable numeric column found for analysis."}

        series = pd.to_numeric(df[resolved_target], errors="coerce").dropna()
        if series.empty:
            return {"error": f"Column '{resolved_target}' contains no valid numeric values."}

        mean_val = float(series.mean())
        std_val = float(series.std()) if len(series) > 1 else 0.0

        # Z-Score anomaly detection (|z| > 2)
        if std_val > 0:
            anomalies = series[(series - mean_val).abs() > (2 * std_val)].tolist()
        else:
            anomalies = []

        result = {
            "selected_metric_column": resolved_target,
            "mean": round(mean_val, 2),
            "median": round(float(series.median()), 2),
            "min": round(float(series.min()), 2),
            "max": round(float(series.max()), 2),
            "anomaly_count": len(anomalies),
            "anomalies": [round(float(x), 2) for x in anomalies[:5]]
        }

        # Trend analysis if chronological column exists or can be detected
        resolved_date = DataAnalysisTools._find_date_column(df, date_col)
        if resolved_date and resolved_date in df.columns:
            try:
                temp_df = df.copy()
                temp_df[resolved_date] = pd.to_datetime(temp_df[resolved_date], errors="coerce")
                temp_df = temp_df.dropna(subset=[resolved_date]).sort_values(by=resolved_date)
                pct_change = temp_df[resolved_target].pct_change().dropna()
                if not pct_change.empty:
                    result["average_growth_rate"] = f"{round(float(pct_change.mean()) * 100, 2)}%"
                    result["selected_date_column"] = resolved_date
            except Exception:
                pass

        return result