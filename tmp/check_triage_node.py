"""Check triage_node's return shape on both paths, with the model stubbed out."""

import sys
import types
from unittest import mock

from pydantic import BaseModel

model_mod = types.ModuleType("langgraph_bot.models.generativemodel")
_structured = mock.MagicMock()
_fake_model = mock.MagicMock()
_fake_model.with_structured_output.return_value = _structured
model_mod.triagemodel = _fake_model
sys.modules["langgraph_bot.models.generativemodel"] = model_mod

from langgraph_bot.nodes import triage_node as tn  # noqa: E402


class Result(BaseModel):
    is_it_relevant: bool
    importance: int
    reason: str


print("--- happy path ---")
_structured.invoke.side_effect = None
_structured.invoke.return_value = Result(
    is_it_relevant=True, importance=4, reason="new model release"
)
out = tn.triage_node({"topic": "Llama 4 released", "data": "blurb"})
print(f"  {out}")
assert out["triage"]["available"] is True, out
assert out["should_process"] is True, out

print("--- below importance threshold ---")
_structured.invoke.return_value = Result(
    is_it_relevant=True, importance=1, reason="minor tweak"
)
out = tn.triage_node({"topic": "tiny patch", "data": "blurb"})
print(f"  {out}")
assert out["triage"]["available"] is True, out
assert out["should_process"] is False, out

print("--- invoke raises: passes through, flags the outage ---")
_structured.invoke.return_value = None
_structured.invoke.side_effect = TimeoutError("groq timed out")
out = tn.triage_node({"topic": "GPT-6 released", "data": "blurb"})
print(f"  {out}")
assert out["triage"]["available"] is False, out
assert out["should_process"] is True, out
assert "TimeoutError" in out["triage"]["reason"], out

print("--- no title: fails closed, triage itself was available ---")
out = tn.triage_node({"topic": "", "title": "", "data": "blurb"})
print(f"  {out}")
assert out["triage"]["available"] is True, out
assert out["should_process"] is False, out

print("--- no module-level mutable state left behind ---")
leaked = [
    n
    for n in vars(tn)
    if n.startswith("_") and n.count("failure") or n == "_circuit_open"
]
print(f"  leftover failure-tracking globals: {leaked}")
assert leaked == [], leaked
assert not hasattr(tn, "TRIAGE_FAILURE_THRESHOLD"), "threshold should live in main.py"

print("\nALL ASSERTIONS PASSED")
