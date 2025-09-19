from __future__ import annotations
from typing import Any, Dict, Optional
from django.conf import settings
from requests import HTTPError
import json
import hashlib
import requests


class TBankClient:
    """
    Мини-клиент для T-Банк /v2.
    Берёт базовые значения из settings.T_BANK, но позволяет их переопределить.
    """

    def __init__(
        self,
        *,
        base_url: Optional[str] = None,
        terminal_key: Optional[str] = None,
        password: Optional[str] = None,
        success_url: Optional[str] = None,
        fail_url: Optional[str] = None,
        notification_url: Optional[str] = None,
        session: Optional[requests.Session] = None,
    ) -> None:
        cfg = settings.T_BANK
        self.base_url = base_url or cfg["BASE_URL"]
        self.terminal_key = terminal_key or cfg["TERMINAL_KEY"]
        self.password = password or cfg["PASSWORD"]

        # Вот этих полей раньше не было — из-за них и падало
        self.success_url = success_url or cfg.get("SUCCESS_URL")
        self.fail_url = fail_url or cfg.get("FAIL_URL")
        self.notification_url = notification_url or cfg.get("NOTIFICATION_URL")

        self.session = session or requests.Session()

    # ——— внутренние утилы ———

    def _make_token(self, payload: Dict[str, Any]) -> str:
        """
        Формирование токена по правилам T-Банк:
        - исключаем None/пустые и Token
        - добавляем Password
        - сортируем ключи, конкатенируем значения, sha256
        """
        data = {k: v for k, v in payload.items() if v not in (None, "") and k != "Token"}
        data["Password"] = self.password
        raw = "".join(str(v) for k, v in sorted(data.items()))
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
                data["url"] = url  # чтобы в логах видеть конечную точку
            return data
        except Exception as e:
            return {"Success": False, "http_error": str(e), "url": url}

    # ——— публичные методы ———

    def init(
        self,
        *,
        amount: int,
        order_id: str,
        description: str = "",
        data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        /v2/Init — создаём платёж и получаем PaymentURL/PaymentId.
        """
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
        # Если хочешь переопределить URL коллбэка из настроек мерчанта:
        if self.notification_url:
            payload["NotificationURL"] = self.notification_url
        if data:
            payload["DATA"] = data

        payload["Token"] = self._make_token(payload)
        return self._post("Init", payload)

    def get_state(self, *, order_id: Optional[str] = None, payment_id: Optional[str] = None) -> Dict[str, Any]:
        """
        /v2/GetState — получить статус платежа по OrderId или PaymentId.
        """
        payload: Dict[str, Any] = {"TerminalKey": self.terminal_key}
        if payment_id:
            payload["PaymentId"] = payment_id
        if order_id:
            payload["OrderId"] = order_id
        payload["Token"] = self._make_token(payload)
        return self._post("GetState", payload)