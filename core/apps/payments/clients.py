from __future__ import annotations
from typing import Any, Dict, Optional
from django.conf import settings
import hashlib
import json
import requests


class TBankClient:
    def __init__(self, *, base_url: Optional[str] = None, terminal_key: Optional[str] = None,
                 password: Optional[str] = None, success_url: Optional[str] = None,
                 fail_url: Optional[str] = None, notification_url: Optional[str] = None,
                 session: Optional[requests.Session] = None) -> None:
        cfg = settings.T_BANK
        self.base_url = base_url or cfg["BASE_URL"]
        self.terminal_key = terminal_key or cfg["TERMINAL_KEY"]
        self.password = password or cfg["PASSWORD"]

        self.success_url = success_url or cfg.get("SUCCESS_URL")
        self.fail_url = fail_url or cfg.get("FAIL_URL")
        self.notification_url = notification_url or cfg.get("NOTIFICATION_URL")

        self.session = session or requests.Session()

    def _make_token(self, payload: Dict[str, Any]) -> str:
        flat: Dict[str, Any] = {}

        for k, v in payload.items():
            if k == "Token":
                continue
            if v in (None, ""):
                continue
            # вложенные объекты (DATA, Receipt и т.п.) в токен НЕ включаем
            if isinstance(v, (dict, list, tuple)):
                continue
            flat[k] = v

        flat["Password"] = self.password

        raw = "".join(str(v) for k, v in sorted(flat.items()))
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    def _post(self, method: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url.rstrip('/')}/{method.lstrip('/')}"
        try:
            r = self.session.post(url, json=payload, timeout=15)
            try:
                data = r.json()
            except json.JSONDecodeError:
                data = {"raw_text": r.text}
            if r.status_code != 200:
                data.setdefault("Success", False)
                data["http_status"] = r.status_code
                data["http_error"] = getattr(r, "reason", "")
                data["url"] = url
            else:
                data["url"] = url
            return data
        except Exception as e:
            return {"Success": False, "http_error": str(e), "url": url}

    def init(self, *, amount: int, order_id: str, description: str = "", data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        payload: Dict[str, Any] = {
            "TerminalKey": self.terminal_key,
            "Amount": amount,
            "OrderId": order_id,
        }
        if description:
            payload["Description"] = description
        if self.success_url:
            payload["SuccessURL"] = self.success_url
        if self.fail_url:
            payload["FailURL"] = self.fail_url
        if self.notification_url:
            payload["NotificationURL"] = self.notification_url

        data = dict(data or {})
        data.setdefault("OperationInitiatorType", "0")
        if data:
            payload["DATA"] = data

        payload["Token"] = self._make_token(payload)
        return self._post("Init", payload)

    def get_state(self, *, order_id: Optional[str] = None, payment_id: Optional[str] = None) -> Dict[str, Any]:
        payload: Dict[str, Any] = {"TerminalKey": self.terminal_key}
        if payment_id:
            payload["PaymentId"] = payment_id
        if order_id:
            payload["OrderId"] = order_id
        payload["Token"] = self._make_token(payload)
        return self._post("GetState", payload)