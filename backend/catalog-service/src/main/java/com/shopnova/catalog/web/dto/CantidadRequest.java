package com.shopnova.catalog.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record CantidadRequest(@Min(1) @Max(1000) int cantidad) {
}
