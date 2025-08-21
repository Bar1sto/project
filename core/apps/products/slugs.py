from __future__ import annotations
import re
from typing import Type
from django.db import models
from django.utils.text import slugify


def build_base_slug(product, *, allow_unicode: bool = False, max_base_len: int = 80) -> str:
    parts = []
    brand_name = getattr(getattr(product, "brand", None), "name", "") or ""
    if brand_name:
        parts.append(str(brand_name).strip())
    
    name = (getattr(product, "name", "") or "").strip()
    if name:
        parts.append(name)
    
    seed = " ".join(parts) or "product"
    base = slugify(seed, allow_unicode=allow_unicode)
    base = re.sub(r"-{2,}", "-", base).strip("-")
    if not base:
        base = "product"
        
    if len(base) > max_base_len:
        base = base[:max_base_len].rstrip("-")
    return base

def make_unicode_slug(base_slug: str, *, model: Type[models.Model], slug_field: str = "slug") -> str:
    field = model._meta.get_field(slug_field)
    max_length = getattr(field, "max_length", 255) or 255
    base = (base_slug or "product").strip("-")
    if len(base) > max_length:
        base = base[:max_length].rstrip("-")
    
    manager = model._default_manager
    
    if not manager.filter(**{slug_field: base}).exists():
        return base
    
    existing = list(
        manager.filter(**{f"{slug_field}__startswith": base}).values_list(slug_field, flat=True)
    )
    
    pattern = re.compile(rf"^{re.escape(base)}-(\d+)$")
    taken_numbers = {1} if base in existing else set()
    for i in existing:
        m = pattern.match(i)
        if m:
            try:
                taken_numbers.add(int(m.group(1)))
            except ValueError:
                pass
    
    n = (max(taken_numbers) + 1) if taken_numbers else 2
    
    while True:
        suffix = f"-{n}"
        if len(base) + len(suffix) > max_length:
            trimmed_base = base[: max_length - len(suffix)].rstrip("-")
        else:
            trimmed_base = base
        candidate = f"{trimmed_base}{suffix}"
        if not manager.filter(**{slug_field: candidate}).exists():
            return candidate
        n += 1
        
def assign_product_slug(instance) -> None:
    if getattr(instance, "slug", None): 
        return
    base = build_base_slug(instance, allow_unicode=False, max_base_len=80)
    unique = make_unicode_slug(base, model=type(instance), slug_field="slug")
    instance.slug = unique